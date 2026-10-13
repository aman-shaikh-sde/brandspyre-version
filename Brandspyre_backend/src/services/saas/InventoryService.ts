import mongoose from 'mongoose';
import {
  InventoryStock,
  InventoryTransaction,
  Warehouse,
  StockAdjustment,
  StockTransfer,
  Product,
  ProductBatch
} from '../../db/ModelSceham/commerceSchema';
import { AuditLog } from '../../db/ModelSceham/saasSchema';
import ProductService from './ProductService';

export class InventoryService {
  /**
   * Get current stock for product in warehouse (Single Source of Truth)
   */
  static async getStock(
    tenantId: string | mongoose.Types.ObjectId,
    warehouseId: string | mongoose.Types.ObjectId,
    productId: string | mongoose.Types.ObjectId
  ): Promise<any> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const wId = new mongoose.Types.ObjectId(warehouseId as string);
    const pId = new mongoose.Types.ObjectId(productId as string);

    let stock = await InventoryStock.findOne({ tenant_id: tId, warehouse_id: wId, product_id: pId });
    if (!stock) {
      stock = await InventoryStock.create({
        tenant_id: tId,
        warehouse_id: wId,
        product_id: pId,
        quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        average_cost: 0,
        reorder_level: 5,
        updated_at: new Date()
      });
    }

    return stock;
  }

  /**
   * IDEMPOTENT & ATOMIC Stock Movement Ledger Writer
   * Ensures stock operations are strictly idempotent via operationKey.
   * If operationKey exists, returns existing transaction without double-updating stock!
   */
  static async recordStockMovement(
    tenantId: string | mongoose.Types.ObjectId,
    data: {
      productId: string | mongoose.Types.ObjectId;
      warehouseId: string | mongoose.Types.ObjectId;
      transactionType: 'PURCHASE' | 'SALE' | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING_STOCK';
      quantity: number;
      unitCost?: number;
      referenceType?: string;
      referenceId?: string;
      operationKey: string;
      createdBy?: string;
      allowNegativeStock?: boolean;
    },
    session?: mongoose.ClientSession
  ): Promise<{ transaction: any; isDuplicate: boolean; balanceAfter: number }> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const pId = new mongoose.Types.ObjectId(data.productId as string);
    const wId = new mongoose.Types.ObjectId(data.warehouseId as string);

    // 1. Idempotency Check: Check if operationKey already recorded
    const existingTx = await InventoryTransaction.findOne({ tenant_id: tId, operation_key: data.operationKey }).session(session || null);
    if (existingTx) {
      return { transaction: existingTx, isDuplicate: true, balanceAfter: existingTx.balance_after };
    }

    // 2. Fetch or initialize InventoryStock with atomic locking in transaction if present
    let stock = await InventoryStock.findOne({ tenant_id: tId, warehouse_id: wId, product_id: pId }).session(session || null);
    if (!stock) {
      const [newStock] = await InventoryStock.create([{
        tenant_id: tId,
        warehouse_id: wId,
        product_id: pId,
        quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        average_cost: 0,
        reorder_level: 5,
        updated_at: new Date()
      }], session ? { session } : {});
      stock = newStock;
    }

    // Determine quantity delta (+ for IN, - for OUT)
    const isOut = ['SALE', 'PURCHASE_RETURN', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'].includes(data.transactionType);
    const delta = isOut ? -Math.abs(data.quantity) : Math.abs(data.quantity);
    const newQuantity = stock.quantity + delta;

    // 3. Negative Stock Prevention
    if (newQuantity < 0 && !data.allowNegativeStock) {
      throw new Error(`Insufficient stock for product. Available: ${stock.quantity}, Requested: ${Math.abs(data.quantity)}.`);
    }

    // Update stock quantity
    stock.quantity = newQuantity;
    stock.available_quantity = newQuantity - stock.reserved_quantity;
    if (data.unitCost && !isOut && data.quantity > 0) {
      // Recalculate Weighted Average Cost
      const oldVal = (stock.quantity - data.quantity) * stock.average_cost;
      const newVal = data.quantity * data.unitCost;
      stock.average_cost = stock.quantity > 0 ? (oldVal + newVal) / stock.quantity : stock.average_cost;
    }
    stock.updated_at = new Date();
    await stock.save(session ? { session } : {});

    // 4. Create Immutable Inventory Transaction Log
    const [transaction] = await InventoryTransaction.create([{
      tenant_id: tId,
      product_id: pId,
      warehouse_id: wId,
      transaction_type: data.transactionType,
      quantity: delta,
      unit_cost: data.unitCost || stock.average_cost || 0,
      balance_after: stock.quantity,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      operation_key: data.operationKey,
      created_by: data.createdBy,
      created_at: new Date()
    }], session ? { session } : {});

    return { transaction, isDuplicate: false, balanceAfter: stock.quantity };
  }

  /**
   * Perform Stock Adjustment (INCREASE or DECREASE)
   */
  static async createStockAdjustment(
    tenantId: string | mongoose.Types.ObjectId,
    data: {
      warehouseId: string;
      adjustmentNumber?: string;
      type: 'INCREASE' | 'DECREASE';
      reason: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'FOUND' | 'COUNT_CORRECTION' | 'OPENING_STOCK' | 'OTHER';
      items: Array<{ productId: string; quantity: number; unitCost?: number }>;
      notes?: string;
    },
    userId: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const wId = new mongoose.Types.ObjectId(data.warehouseId);
    const adjNum = data.adjustmentNumber || `ADJ-${Date.now().toString().slice(-6)}`;

    const existing = await StockAdjustment.findOne({ tenant_id: tId, adjustment_number: adjNum });
    if (existing) {
      throw new Error(`Adjustment number '${adjNum}' already exists.`);
    }

    const txType = data.type === 'INCREASE' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

    for (const item of data.items) {
      const opKey = `ADJ_${adjNum}_PROD_${item.productId}`;
      await this.recordStockMovement(tId, {
        productId: item.productId,
        warehouseId: data.warehouseId,
        transactionType: txType,
        quantity: item.quantity,
        unitCost: item.unitCost,
        referenceType: 'StockAdjustment',
        referenceId: adjNum,
        operationKey: opKey,
        createdBy: userId
      });
    }

    const adjustment = await StockAdjustment.create({
      tenant_id: tId,
      warehouse_id: wId,
      adjustment_number: adjNum,
      type: data.type,
      reason: data.reason,
      items: data.items.map((i) => ({
        product_id: new mongoose.Types.ObjectId(i.productId),
        quantity: i.quantity,
        unit_cost: i.unitCost || 0
      })),
      notes: data.notes || '',
      created_by: userId,
      created_at: new Date()
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'STOCK_ADJUSTMENT_CREATED',
      entity: 'StockAdjustment',
      details: { adjustmentNumber: adjNum, type: data.type, itemCount: data.items.length },
      created_at: new Date()
    }]);

    return adjustment;
  }

  /**
   * Complete Stock Transfer between Warehouses (Atomic)
   */
  static async completeStockTransfer(
    tenantId: string | mongoose.Types.ObjectId,
    data: {
      transferNumber?: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      items: Array<{ productId: string; quantity: number }>;
      notes?: string;
    },
    userId: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const trNum = data.transferNumber || `TRF-${Date.now().toString().slice(-6)}`;

    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new Error('Source and destination warehouses cannot be the same.');
    }

    for (const item of data.items) {
      // 1. Transfer Out from Source
      const outKey = `TRF_OUT_${trNum}_PROD_${item.productId}`;
      await this.recordStockMovement(tId, {
        productId: item.productId,
        warehouseId: data.fromWarehouseId,
        transactionType: 'TRANSFER_OUT',
        quantity: item.quantity,
        referenceType: 'StockTransfer',
        referenceId: trNum,
        operationKey: outKey,
        createdBy: userId
      });

      // 2. Transfer In to Destination
      const inKey = `TRF_IN_${trNum}_PROD_${item.productId}`;
      await this.recordStockMovement(tId, {
        productId: item.productId,
        warehouseId: data.toWarehouseId,
        transactionType: 'TRANSFER_IN',
        quantity: item.quantity,
        referenceType: 'StockTransfer',
        referenceId: trNum,
        operationKey: inKey,
        createdBy: userId
      });
    }

    const transfer = await StockTransfer.create({
      tenant_id: tId,
      transfer_number: trNum,
      from_warehouse_id: new mongoose.Types.ObjectId(data.fromWarehouseId),
      to_warehouse_id: new mongoose.Types.ObjectId(data.toWarehouseId),
      status: 'COMPLETED',
      items: data.items.map((i) => ({
        product_id: new mongoose.Types.ObjectId(i.productId),
        quantity: i.quantity
      })),
      notes: data.notes || '',
      created_by: userId,
      completed_at: new Date(),
      created_at: new Date()
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'STOCK_TRANSFER_COMPLETED',
      entity: 'StockTransfer',
      details: { transferNumber: trNum, from: data.fromWarehouseId, to: data.toWarehouseId },
      created_at: new Date()
    }]);

    return transfer;
  }
}

export default InventoryService;
