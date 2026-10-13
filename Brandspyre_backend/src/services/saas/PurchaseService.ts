import mongoose from 'mongoose';
import { PurchaseOrder, Purchase, Supplier, Product } from '../../db/ModelSceham/commerceSchema';
import { AuditLog } from '../../db/ModelSceham/saasSchema';
import InventoryService from './InventoryService';
import SupplierService from './SupplierService';

export class PurchaseService {
  /**
   * Calculate totals server-side (Requirement #12: Never trust frontend totals!)
   * Calculate totals server-side (Requirement #12: Never trust frontend totals!)
   */
  static calculateTotals(items: Array<any>, discount: number = 0) {
    let subtotal = 0;
    let tax = 0;

    const processedItems = items.map((i) => {
      const qty = Math.max(0, Number(i.quantity) || 0);
      const cost = Math.max(0, Number(i.unit_cost) || 0);
      const taxRate = Math.max(0, Number(i.tax_rate) || 0);

      const itemSubtotal = qty * cost;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax += itemTax;

      return {
        ...i,
        quantity: qty,
        unit_cost: cost,
        tax_rate: taxRate,
        subtotal: itemSubtotal,
        tax_amount: itemTax,
        total: itemTotal
      };
    });

    const disc = Math.max(0, Number(discount) || 0);
    const grand_total = Math.max(0, subtotal + tax - disc);

    return { items: processedItems, subtotal, tax, discount: disc, grand_total };
  }

  /**
   * Create Purchase Order
   */
  static async createPurchaseOrder(tenantId: string | mongoose.Types.ObjectId, data: any, userId: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const poNum = data.order_number || `PO-${Date.now().toString().slice(-6)}`;

    const supplier = await Supplier.findOne({ _id: data.supplier_id, tenant_id: tId });
    if (!supplier) throw new Error('Supplier not found.');

    const { items, subtotal, tax, discount, grand_total } = this.calculateTotals(data.items, data.discount);

    const po = await PurchaseOrder.create({
      tenant_id: tId,
      supplier_id: supplier._id,
      order_number: poNum,
      order_date: data.order_date || new Date(),
      expected_date: data.expected_date,
      status: 'DRAFT',
      items,
      subtotal,
      tax,
      discount,
      grand_total,
      notes: data.notes || '',
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'PURCHASE_ORDER_CREATED',
      entity: 'PurchaseOrder',
      details: { orderNumber: poNum, grandTotal: grand_total },
      created_at: new Date()
    }]);

    return po;
  }

  /**
   * Receive Goods / Process Purchase Invoice (IDEMPOTENT & ATOMIC STOCK INCREASE)
   */
  static async processPurchaseReceipt(
    tenantId: string | mongoose.Types.ObjectId,
    data: {
      supplierId: string;
      warehouseId: string;
      purchaseOrderId?: string;
      purchaseNumber?: string;
      invoiceNumber?: string;
      items: Array<{ productId: string; quantity: number; unitCost: number; taxRate?: number }>;
      discount?: number;
      paidAmount?: number;
    },
    userId: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const purNum = data.purchaseNumber || `PUR-${Date.now().toString().slice(-6)}`;
    const opKey = `PUR_REC_${purNum}`;

    // 1. Check idempotency
    const existing = await Purchase.findOne({ tenant_id: tId, operation_key: opKey });
    if (existing) {
      return { purchase: existing, isDuplicate: true };
    }

    const supplier = await Supplier.findOne({ _id: data.supplierId, tenant_id: tId });
    if (!supplier) throw new Error('Supplier not found.');

    const formattedItems = data.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      unit_cost: i.unitCost,
      tax_rate: i.taxRate || 0
    }));

    const { items, subtotal, tax, discount, grand_total } = this.calculateTotals(formattedItems as any, data.discount);

    const paidAmt = Math.max(0, Number(data.paidAmount) || 0);
    const balanceAmt = Math.max(0, grand_total - paidAmt);
    const payStatus = paidAmt >= grand_total ? 'paid' : paidAmt > 0 ? 'partial' : 'unpaid';

    // 2. Increase stock atomically for each product using InventoryService
    for (const item of items) {
      const itemOpKey = `${opKey}_PROD_${item.product_id}`;
      await InventoryService.recordStockMovement(tId, {
        productId: item.product_id,
        warehouseId: data.warehouseId,
        transactionType: 'PURCHASE',
        quantity: item.quantity,
        unitCost: item.unit_cost,
        referenceType: 'Purchase',
        referenceId: purNum,
        operationKey: itemOpKey,
        createdBy: userId
      });
    }

    // 3. Create Purchase Record
    const purchase = await Purchase.create({
      tenant_id: tId,
      purchase_number: purNum,
      supplier_id: supplier._id,
      purchase_order_id: data.purchaseOrderId ? new mongoose.Types.ObjectId(data.purchaseOrderId) : undefined,
      warehouse_id: new mongoose.Types.ObjectId(data.warehouseId),
      invoice_number: data.invoiceNumber || purNum,
      invoice_date: new Date(),
      items: items.map((i: any) => ({
        product_id: new mongoose.Types.ObjectId(i.product_id),
        sku: i.sku || 'SKU',
        name: i.name || 'Product',
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        tax_rate: i.tax_rate,
        subtotal: i.subtotal,
        tax_amount: i.tax_amount,
        total: i.total
      })),
      subtotal,
      discount,
      tax,
      grand_total,
      paid_amount: paidAmt,
      balance_amount: balanceAmt,
      payment_status: payStatus,
      status: 'received',
      operation_key: opKey,
      created_by: userId,
      created_at: new Date()
    });

    // 4. Update PO status if reference provided
    if (data.purchaseOrderId) {
      await PurchaseOrder.updateOne({ _id: data.purchaseOrderId, tenant_id: tId }, { status: 'RECEIVED', updated_at: new Date() });
    }

    // 5. Recalculate Supplier Balance
    await SupplierService.recalculateSupplierBalance(tId, supplier._id);

    await AuditLog.create([{
      tenant_id: tId,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'PURCHASE_RECEIVED',
      entity: 'Purchase',
      details: { purchaseNumber: purNum, grandTotal: grand_total, supplier: supplier.name },
      created_at: new Date()
    }]);

    return { purchase, isDuplicate: false };
  }
}

export default PurchaseService;
