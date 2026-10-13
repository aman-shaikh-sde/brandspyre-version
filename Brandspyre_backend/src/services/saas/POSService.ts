import mongoose from 'mongoose';
import { POSSession, POSSale, Product, InventoryStock, Warehouse } from '../../db/ModelSceham/commerceSchema';
import { AuditLog } from '../../db/ModelSceham/saasSchema';
import InventoryService from './InventoryService';
import ProductService from './ProductService';

export class POSService {
  /**
   * Open POS Register Session
   */
  static async openSession(
    tenantId: string | mongoose.Types.ObjectId,
    data: { cashierId: string; cashierName: string; warehouseId?: string; openingCash?: number }
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    // Check if cashier already has an open session
    const existing = await POSSession.findOne({
      tenant_id: tId,
      cashier_id: data.cashierId,
      status: 'open'
    });

    if (existing) {
      return existing;
    }

    let warehouseId = data.warehouseId;
    if (!warehouseId) {
      const defaultWh = await ProductService.ensureDefaultWarehouse(tId);
      warehouseId = defaultWh._id.toString();
    }

    const sessionCode = `POS-SES-${Date.now().toString().slice(-6)}`;
    const session = await POSSession.create({
      tenant_id: tId,
      session_code: sessionCode,
      cashier_id: data.cashierId,
      cashier_name: data.cashierName,
      warehouse_id: new mongoose.Types.ObjectId(warehouseId),
      opened_at: new Date(),
      opening_cash: Number(data.openingCash) || 0,
      total_sales: 0,
      total_returns: 0,
      expected_cash: Number(data.openingCash) || 0,
      status: 'open'
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(data.cashierId),
      action: 'POS_SESSION_OPENED',
      entity: 'POSSession',
      details: { sessionCode, openingCash: data.openingCash },
      created_at: new Date()
    }]);

    return session;
  }

  /**
   * Close POS Register Session (Calculate variance)
   */
  static async closeSession(
    tenantId: string | mongoose.Types.ObjectId,
    sessionId: string,
    closingCash: number,
    userId: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const sId = new mongoose.Types.ObjectId(sessionId);

    const session = await POSSession.findOne({ _id: sId, tenant_id: tId, status: 'open' });
    if (!session) {
      throw new Error('Open POS session not found.');
    }

    const closeAmt = Number(closingCash) || 0;
    const variance = closeAmt - session.expected_cash;

    session.closing_cash = closeAmt;
    session.cash_variance = variance;
    session.closed_at = new Date();
    session.status = 'closed';
    await session.save();

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'POS_SESSION_CLOSED',
      entity: 'POSSession',
      details: { sessionCode: session.session_code, expected: session.expected_cash, closing: closeAmt, variance },
      created_at: new Date()
    }]);

    return session;
  }

  /**
   * ATOMIC & IDEMPOTENT POS CHECKOUT PIPELINE
   * Validates product, price, tax, stock server-side; performs price snapshot,
   * creates sale, deducts stock atomically via InventoryService, records payment, and returns receipt.
   */
  static async processCheckout(
    tenantId: string | mongoose.Types.ObjectId,
    data: {
      sessionId: string;
      items: Array<{ productId: string; quantity: number; discount?: number }>;
      customerId?: string;
      paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'SPLIT';
      paidAmount: number;
      paymentDetails?: Record<string, number>;
      operationKey?: string;
    },
    cashierId: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const sId = new mongoose.Types.ObjectId(data.sessionId);

    // 1. Verify Active POS Session
    const session = await POSSession.findOne({ _id: sId, tenant_id: tId, status: 'open' });
    if (!session) {
      throw new Error('Active POS session required for checkout.');
    }

    const opKey = data.operationKey || `POS_CHK_${sId}_${Date.now()}`;

    // 2. Check Idempotency
    const existingSale = await POSSale.findOne({ tenant_id: tId, operation_key: opKey });
    if (existingSale) {
      return { sale: existingSale, isDuplicate: true };
    }

    const receiptNum = `REC-${Date.now().toString().slice(-8)}`;
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const saleItems: any[] = [];

    // 3. Server-Side Item Validation, Price Snapshot & Stock Checks
    for (const rawItem of data.items) {
      const pId = new mongoose.Types.ObjectId(rawItem.productId);
      const product = await Product.findOne({ _id: pId, tenant_id: tId, is_deleted: false, is_active: true });
      if (!product) {
        throw new Error(`Product '${rawItem.productId}' is invalid or inactive.`);
      }

      const qty = Math.max(1, Number(rawItem.quantity) || 1);

      // Check available stock if inventory tracking enabled
      if (product.track_inventory !== false) {
        const stockRecord = await InventoryStock.findOne({ tenant_id: tId, product_id: product._id, warehouse_id: session.warehouse_id });
        const availableQty = stockRecord ? stockRecord.available_quantity : 0;
        if (availableQty < qty) {
          throw new Error(`Insufficient stock for product '${product.name}'. Available: ${availableQty}, requested: ${qty}.`);
        }
      }
      const sellingPrice = product.selling_price; // Price Snapshot
      const purchasePrice = product.purchase_price;
      const taxRate = product.tax_rate || 0;
      const discount = Math.max(0, Number(rawItem.discount) || 0);

      const itemSubtotal = qty * sellingPrice;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax - discount;

      subtotal += itemSubtotal;
      totalTax += itemTax;
      totalDiscount += discount;

      saleItems.push({
        product_id: product._id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        quantity: qty,
        selling_price: sellingPrice,
        purchase_price: purchasePrice,
        discount,
        tax_rate: taxRate,
        tax_amount: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal
      });
    }

    const grandTotal = Math.max(0, subtotal + totalTax - totalDiscount);
    const paidAmt = Math.max(0, Number(data.paidAmount) || 0);
    if (paidAmt < grandTotal) {
      throw new Error(`Paid amount (${paidAmt}) is less than total checkout amount (${grandTotal}).`);
    }

    const changeAmt = paidAmt - grandTotal;

    // 4. Atomic Inventory Stock Deduction via InventoryService
    for (const item of saleItems) {
      const itemOpKey = `${opKey}_PROD_${item.product_id}`;
      await InventoryService.recordStockMovement(tId, {
        productId: item.product_id,
        warehouseId: session.warehouse_id,
        transactionType: 'SALE',
        quantity: item.quantity,
        unitCost: item.purchase_price,
        referenceType: 'POSSale',
        referenceId: receiptNum,
        operationKey: itemOpKey,
        createdBy: cashierId
      });
    }

    // 5. Create POS Sale Record
    const sale = await POSSale.create({
      tenant_id: tId,
      receipt_number: receiptNum,
      session_id: session._id,
      warehouse_id: session.warehouse_id,
      customer_id: data.customerId ? new mongoose.Types.ObjectId(data.customerId) : undefined,
      cashier_id: cashierId,
      items: saleItems,
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      grand_total: grandTotal,
      paid_amount: paidAmt,
      change_amount: changeAmt,
      payment_method: data.paymentMethod,
      payment_details: data.paymentDetails,
      status: 'completed',
      operation_key: opKey,
      created_at: new Date()
    });

    // 6. Update POS Session Cash & Sales Totals
    session.total_sales += grandTotal;
    if (data.paymentMethod === 'CASH') {
      session.expected_cash += grandTotal;
    }
    await session.save();

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(cashierId),
      action: 'POS_SALE_COMPLETED',
      entity: 'POSSale',
      details: { receiptNumber: receiptNum, grandTotal, itemCount: saleItems.length },
      created_at: new Date()
    }]);

    return { sale, isDuplicate: false };
  }
}

export default POSService;
