import mongoose from 'mongoose';
import {
  SalesOrder,
  SalesReturn,
  Product,
  InventoryStock,
  InventoryTransaction,
  Warehouse
} from '../../db/ModelSceham/commerceSchema';
import { Client, ProjectInvoice } from '../../db/ModelSceham/project/client';

export class SalesCommerceService {
  /**
   * Helper method to calculate item & order totals server-side
   */
  static calculateTotals(items: Array<{ quantity: number; unit_price: number; discount?: number; tax_rate?: number; name?: string }>) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = items.map((item) => {
      const qty = Math.max(0, item.quantity || 0);
      const price = Math.max(0, item.unit_price || 0);
      const disc = Math.max(0, item.discount || 0);
      const taxRate = Math.max(0, item.tax_rate || 0);

      const rawSubtotal = qty * price;
      const itemSubtotal = Math.max(0, rawSubtotal - disc);
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += rawSubtotal;
      totalDiscount += disc;
      totalTax += itemTax;

      return {
        ...item,
        name: item.name || 'Product Item',
        quantity: qty,
        unit_price: price,
        discount: disc,
        tax_rate: taxRate,
        tax_amount: Math.round(itemTax * 100) / 100,
        subtotal: Math.round(itemSubtotal * 100) / 100,
        total: Math.round(itemTotal * 100) / 100
      };
    });

    const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(totalDiscount * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      grand_total: grandTotal,
      items: processedItems
    };
  }

  /**
   * Validate stock availability across warehouse
   */
  static async validateStock(
    tenantId: string | mongoose.Types.ObjectId,
    warehouseId: string | mongoose.Types.ObjectId,
    items: Array<{ product_id: string | mongoose.Types.ObjectId; quantity: number }>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const wId = new mongoose.Types.ObjectId(warehouseId as string);
    const errors: string[] = [];

    for (const item of items) {
      const pId = new mongoose.Types.ObjectId(item.product_id as string);
      const product = await Product.findOne({ _id: pId, tenant_id: tId });
      if (!product) {
        errors.push(`Product ID ${item.product_id} not found.`);
        continue;
      }

      if (!product.track_inventory) continue;

      const stock = await InventoryStock.findOne({ tenant_id: tId, warehouse_id: wId, product_id: pId });
      const available = stock ? Math.max(0, stock.quantity - (stock.reserved_quantity || 0)) : 0;

      if (available < item.quantity) {
        errors.push(
          `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Requested: ${item.quantity}, Available: ${available}.`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a Sales Order
   */
  static async createSalesOrder(
    tenantId: string | mongoose.Types.ObjectId,
    createdBy: string,
    data: {
      order_number?: string;
      customer_id?: string;
      warehouse_id: string;
      items: any[];
      notes?: string;
    }
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const wId = new mongoose.Types.ObjectId(data.warehouse_id);

    const warehouse = await Warehouse.findOne({ _id: wId, tenant_id: tId });
    if (!warehouse) throw new Error('Invalid warehouse ID.');

    const orderNumber = data.order_number || `SO-${Date.now().toString().slice(-6)}`;
    const calc = this.calculateTotals(data.items);

    const newOrder = await SalesOrder.create({
      tenant_id: tId,
      order_number: orderNumber,
      customer_id: data.customer_id ? new mongoose.Types.ObjectId(data.customer_id) : undefined,
      warehouse_id: wId,
      status: 'DRAFT',
      items: calc.items,
      subtotal: calc.subtotal,
      discount: calc.discount,
      tax: calc.tax,
      grand_total: calc.grand_total,
      notes: data.notes || '',
      created_by: createdBy
    });

    return newOrder;
  }

  /**
   * Confirm a Sales Order & reserve stock
   */
  static async confirmSalesOrder(tenantId: string | mongoose.Types.ObjectId, orderId: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const order = await SalesOrder.findOne({ _id: orderId, tenant_id: tId });
    if (!order) throw new Error('Sales Order not found.');
    if (order.status !== 'DRAFT') throw new Error(`Order cannot be confirmed from status '${order.status}'.`);

    // Reserve quantities in InventoryStock
    for (const item of order.items) {
      await InventoryStock.updateOne(
        { tenant_id: tId, warehouse_id: order.warehouse_id, product_id: item.product_id },
        { $inc: { reserved_quantity: item.quantity }, $set: { updated_at: new Date() } }
      );
    }

    order.status = 'CONFIRMED';
    order.updated_at = new Date();
    await order.save();

    return order;
  }

  /**
   * Fulfill Sales Order (deduct inventory & log ledger transaction)
   */
  static async fulfillSalesOrder(tenantId: string | mongoose.Types.ObjectId, orderId: string, createdBy: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const order = await SalesOrder.findOne({ _id: orderId, tenant_id: tId });
    if (!order) throw new Error('Sales Order not found.');
    if (order.status !== 'CONFIRMED' && order.status !== 'PARTIALLY_FULFILLED') {
      throw new Error(`Order cannot be fulfilled from status '${order.status}'.`);
    }

    for (const item of order.items) {
      const unfulfilled = item.quantity - (item.fulfilled_quantity || 0);
      if (unfulfilled <= 0) continue;

      const stock = await InventoryStock.findOne({
        tenant_id: tId,
        warehouse_id: order.warehouse_id,
        product_id: item.product_id
      });

      const currentQty = stock ? stock.quantity : 0;
      const newQty = Math.max(0, currentQty - unfulfilled);
      const newReserved = Math.max(0, (stock?.reserved_quantity || 0) - unfulfilled);

      await InventoryStock.updateOne(
        { tenant_id: tId, warehouse_id: order.warehouse_id, product_id: item.product_id },
        {
          $set: {
            quantity: newQty,
            reserved_quantity: newReserved,
            available_quantity: Math.max(0, newQty - newReserved),
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      const opKey = `SO_FULFILL_${order.order_number}_PROD_${item.product_id}`;

      await InventoryTransaction.create({
        tenant_id: tId,
        product_id: item.product_id,
        warehouse_id: order.warehouse_id,
        transaction_type: 'SALE',
        quantity: -unfulfilled,
        unit_cost: item.unit_price,
        balance_after: newQty,
        reference_type: 'SalesOrder',
        reference_id: order.order_number,
        operation_key: opKey,
        created_by: createdBy
      });

      item.fulfilled_quantity = item.quantity;
    }

    order.status = 'FULFILLED';
    order.updated_at = new Date();
    await order.save();

    return order;
  }

  /**
   * Create a Sales Invoice linked to Client and Accounting
   */
  static async createSalesInvoice(
    tenantId: string | mongoose.Types.ObjectId,
    createdBy: string,
    data: {
      customer_id: string;
      sales_order_id?: string;
      items: any[];
      notes?: string;
    }
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const client = await Client.findOne({ _id: data.customer_id, tenant_id: tId });
    if (!client) throw new Error('Customer / Client not found.');

    const calc = this.calculateTotals(data.items);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = await ProjectInvoice.create({
      invoice_id: invoiceNumber,
      client_code: client.code || client._id.toString(),
      invoice_no: invoiceNumber,
      invoice_date: new Date(),
      status: 'unpaid',
      total_amount: calc.subtotal,
      discount: calc.discount,
      final_amount: calc.grand_total,
      balance_amount: calc.grand_total,
      notes: data.notes || '',
      created_by: createdBy,
      created_on: new Date()
    });

    return newInvoice;
  }

  /**
   * Process a Sales Return
   */
  static async processSalesReturn(
    tenantId: string | mongoose.Types.ObjectId,
    createdBy: string,
    data: {
      original_sale_type: 'POS' | 'SalesOrder' | 'SalesInvoice';
      original_sale_id?: string;
      warehouse_id: string;
      customer_id?: string;
      items: Array<{ product_id: string; sku: string; name: string; quantity: number; unit_price: number }>;
      reason: string;
      refund_payment_method?: string;
    }
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const wId = new mongoose.Types.ObjectId(data.warehouse_id);

    const calc = this.calculateTotals(data.items);
    const returnNumber = `SR-${Date.now().toString().slice(-6)}`;
    const opKey = `SR_OP_${returnNumber}`;

    const existingOp = await SalesReturn.findOne({ tenant_id: tId, operation_key: opKey });
    if (existingOp) return existingOp;

    const returnDoc = await SalesReturn.create({
      tenant_id: tId,
      return_number: returnNumber,
      original_sale_type: data.original_sale_type,
      original_sale_id: data.original_sale_id,
      customer_id: data.customer_id ? new mongoose.Types.ObjectId(data.customer_id) : undefined,
      warehouse_id: wId,
      items: data.items.map((i) => ({
        product_id: new mongoose.Types.ObjectId(i.product_id),
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        refund_amount: i.quantity * i.unit_price
      })),
      subtotal: calc.subtotal,
      tax: calc.tax,
      grand_total: calc.grand_total,
      reason: data.reason,
      refund_payment_method: data.refund_payment_method || 'CASH',
      operation_key: opKey,
      created_by: createdBy
    });

    // Increase Inventory & Create Stock Ledger Record
    for (const item of data.items) {
      const pId = new mongoose.Types.ObjectId(item.product_id);
      const stock = await InventoryStock.findOne({ tenant_id: tId, warehouse_id: wId, product_id: pId });
      const currentQty = stock ? stock.quantity : 0;
      const newQty = currentQty + item.quantity;

      await InventoryStock.updateOne(
        { tenant_id: tId, warehouse_id: wId, product_id: pId },
        {
          $set: {
            quantity: newQty,
            available_quantity: Math.max(0, newQty - (stock?.reserved_quantity || 0)),
            updated_at: new Date()
          }
        },
        { upsert: true }
      );

      await InventoryTransaction.create({
        tenant_id: tId,
        product_id: pId,
        warehouse_id: wId,
        transaction_type: 'SALE_RETURN',
        quantity: item.quantity,
        unit_cost: item.unit_price,
        balance_after: newQty,
        reference_type: 'SalesReturn',
        reference_id: returnNumber,
        operation_key: `SR_STOCK_${returnNumber}_PROD_${pId}`,
        created_by: createdBy
      });
    }

    return returnDoc;
  }

  /**
   * Calculate customer outstanding balance
   */
  static async calculateCustomerBalance(tenantId: string | mongoose.Types.ObjectId, customerId: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const invoices = await ProjectInvoice.find({ client_code: customerId, status: { $ne: 'paid' } });
    const totalDue = invoices.reduce((acc: number, inv: any) => acc + (inv.balance_amount || inv.final_amount || 0), 0);

    return { customer_id: customerId, outstanding_balance: totalDue, unpaid_invoices_count: invoices.length };
  }
}

export default SalesCommerceService;
