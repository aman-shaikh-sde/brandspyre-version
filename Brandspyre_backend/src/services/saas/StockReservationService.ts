import mongoose from 'mongoose';
import { StockReservation } from '../../db/ModelSchema/inventory/StockReservation';
import { InventoryStock } from '../../db/ModelSceham/commerceSchema';
import DocumentNumberService from './DocumentNumberService';

export interface ReserveStockParams {
  tenantId: string | mongoose.Types.ObjectId;
  branchcode?: string;
  sourceType: 'SALES_ORDER' | 'PRODUCTION_ORDER' | 'STOCK_TRANSFER' | 'MANUAL';
  sourceId: string;
  productId: string | mongoose.Types.ObjectId;
  variantId?: string | mongoose.Types.ObjectId;
  batchId?: string | mongoose.Types.ObjectId;
  warehouseId: string | mongoose.Types.ObjectId;
  locationId?: string | mongoose.Types.ObjectId;
  quantity: number;
  session?: mongoose.ClientSession;
}

export class StockReservationService {
  /**
   * Reserve stock for a Sales Order or Production Order
   */
  static async reserveStock(params: ReserveStockParams): Promise<any> {
    const {
      tenantId,
      branchcode = 'DEFAULT',
      sourceType,
      sourceId,
      productId,
      variantId,
      batchId,
      warehouseId,
      locationId,
      quantity,
      session
    } = params;

    if (quantity <= 0) return null;

    // Check available inventory
    const stock = await InventoryStock.findOne({
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      product_id: productId
    }).session(session || null);

    const available = stock?.available_quantity ?? (stock?.quantity ?? 0);
    if (available < quantity) {
      throw new Error(`Insufficient available inventory to reserve. Available: ${available}, Requested: ${quantity}`);
    }

    const reservationId = await DocumentNumberService.generateNumber(tenantId, 'SO' as any, branchcode, session);

    const [reservation] = await StockReservation.create(
      [{
        tenant_id: tenantId,
        reservation_id: `RES-${Date.now()}`,
        source_type: sourceType,
        source_id: sourceId,
        product_id: productId,
        variant_id: variantId,
        batch_id: batchId,
        warehouse_id: warehouseId,
        location_id: locationId,
        quantity,
        status: 'RESERVED',
        branchcode
      }],
      { session }
    );

    // Increment reserved_quantity and recalculate available_quantity
    if (stock) {
      stock.reserved_quantity = (stock.reserved_quantity || 0) + quantity;
      stock.available_quantity = Math.max(0, stock.quantity - stock.reserved_quantity);
      stock.updated_at = new Date();
      await stock.save({ session });
    }

    return reservation;
  }

  /**
   * Release reserved stock on order cancellation
   */
  static async releaseReservation(
    tenantId: string | mongoose.Types.ObjectId,
    sourceId: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const reservations = await StockReservation.find({
      tenant_id: tenantId,
      source_id: sourceId,
      status: 'RESERVED'
    }).session(session || null);

    for (const res of reservations) {
      res.status = 'RELEASED';
      res.released_at = new Date();
      await res.save({ session });

      const stock = await InventoryStock.findOne({
        tenant_id: tenantId,
        warehouse_id: res.warehouse_id,
        product_id: res.product_id
      }).session(session || null);

      if (stock) {
        stock.reserved_quantity = Math.max(0, (stock.reserved_quantity || 0) - res.quantity);
        stock.available_quantity = Math.max(0, stock.quantity - stock.reserved_quantity);
        stock.updated_at = new Date();
        await stock.save({ session });
      }
    }
  }

  /**
   * Fulfill reservation when stock is physically delivered / dispatched
   */
  static async fulfillReservation(
    tenantId: string | mongoose.Types.ObjectId,
    sourceId: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const reservations = await StockReservation.find({
      tenant_id: tenantId,
      source_id: sourceId,
      status: 'RESERVED'
    }).session(session || null);

    for (const res of reservations) {
      res.status = 'FULFILLED';
      res.fulfilled_at = new Date();
      await res.save({ session });

      const stock = await InventoryStock.findOne({
        tenant_id: tenantId,
        warehouse_id: res.warehouse_id,
        product_id: res.product_id
      }).session(session || null);

      if (stock) {
        stock.reserved_quantity = Math.max(0, (stock.reserved_quantity || 0) - res.quantity);
        stock.quantity = Math.max(0, stock.quantity - res.quantity);
        stock.available_quantity = Math.max(0, stock.quantity - stock.reserved_quantity);
        stock.updated_at = new Date();
        await stock.save({ session });
      }
    }
  }
}

export default StockReservationService;
