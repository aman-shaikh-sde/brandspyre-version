import mongoose from 'mongoose';
import { PurchaseOrder } from '../../db/ModelSchema/procurement/PurchaseOrder';
import { Purchase, InventoryStock, InventoryTransaction, Supplier } from '../../db/ModelSceham/commerceSchema';
import DocumentNumberService from '../saas/DocumentNumberService';
import AccountingPostingService from '../saas/AccountingPostingService';
import ThreeWayMatchPolicy from '../saas/ThreeWayMatchPolicy';
import ApprovalEngineService from '../saas/ApprovalEngineService';
import SupplierLedgerService from './SupplierLedgerService';

export class PurchaseWorkflowService {
  /**
   * 1. Create Production-Grade Purchase Order
   */
  static async createPurchaseOrder(params: any): Promise<any> {
    const {
      tenantId,
      supplierId,
      branchcode = 'DEFAULT',
      warehouseId,
      orderDate,
      expectedDeliveryDate,
      currency = 'INR',
      paymentTerms = 'Net 30',
      shippingTerms,
      buyerName,
      referenceNumber,
      supplierReference,
      internalNotes,
      termsAndConditions,
      items,
      additionalDiscount = 0,
      shippingCharges = 0,
      handlingCharges = 0,
      advancePercent = 0,
      shippingMethod,
      carrier,
      deliveryInstructions,
      requisitionId,
      rfqId,
      vendorQuotationId,
      operationKey,
      createdBy
    } = params;

    if (!supplierId || !warehouseId || !Array.isArray(items) || items.length === 0) {
      throw new Error('Supplier, Warehouse, and at least one item line are required.');
    }

    // Fetch Supplier Details
    const supplier = await Supplier.findOne({ _id: supplierId, tenant_id: tenantId });
    if (!supplier) throw new Error('Selected supplier record does not exist.');

    let subtotal = 0;
    let totalLineDiscounts = 0;
    let totalTaxable = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const calcItems = items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const unitCost = Number(i.unit_cost || i.unitCost) || 0;
      const rawTotal = qty * unitCost;
      
      const discPct = Number(i.discount_percent || i.discountPercent) || 0;
      const lineDiscount = (rawTotal * discPct) / 100;
      const taxableLine = rawTotal - lineDiscount;

      const taxRate = Number(i.tax_rate || i.taxRate) || 0;
      const taxAmount = (taxableLine * taxRate) / 100;

      const isInterstate = false; 
      const cgst = isInterstate ? 0 : taxAmount / 2;
      const sgst = isInterstate ? 0 : taxAmount / 2;
      const igst = isInterstate ? taxAmount : 0;

      subtotal += rawTotal;
      totalLineDiscounts += lineDiscount;
      totalTaxable += taxableLine;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        product_id: i.product_id || i.productId,
        variant_id: i.variant_id || i.variantId,
        sku: i.sku || 'SKU-001',
        name: i.name || 'Product Item',
        description: i.description || '',
        quantity: qty,
        uom: i.uom || 'PCS',
        unit_cost: unitCost,
        discount_percent: discPct,
        discount_amount: lineDiscount,
        tax_rate: taxRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        tax_amount: taxAmount,
        total: taxableLine + taxAmount,
        received_quantity: 0,
        billed_quantity: 0,
        batch_number: i.batch_number || i.batchNumber,
        expiry_date: i.expiry_date || i.expiryDate
      };
    });

    const netTaxable = totalTaxable - Number(additionalDiscount);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const rawGrandTotal = netTaxable + totalTax + Number(shippingCharges) + Number(handlingCharges);
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = roundedGrandTotal - rawGrandTotal;

    const advanceAmount = (roundedGrandTotal * Number(advancePercent)) / 100;

    // Evaluate Approval Engine
    const approval = ApprovalEngineService.evaluateApproval({
      tenantId,
      documentType: 'PURCHASE_ORDER',
      grandTotal: roundedGrandTotal
    });
    const status = approval.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    const orderNumber = await DocumentNumberService.generateNumber(tenantId, 'PO', branchcode);
    const opKey = operationKey || `PO_OP_${orderNumber}_${Date.now()}`;

    const po = await PurchaseOrder.create({
      tenant_id: tenantId,
      order_number: orderNumber,
      supplier_id: supplier._id,
      supplier_name: supplier.name,
      supplier_code: supplier.supplier_code,
      supplier_contact: supplier.phone || supplier.email || '',
      supplier_tax_number: supplier.tax_number || '',
      billing_address: supplier.address || '',
      shipping_address: supplier.address || '',
      branchcode,
      warehouse_id: warehouseId,
      order_date: orderDate || new Date(),
      expected_delivery_date: expectedDeliveryDate,
      currency,
      payment_terms: paymentTerms,
      shipping_terms: shippingTerms || '',
      buyer_name: buyerName || createdBy,
      reference_number: referenceNumber || '',
      supplier_reference: supplierReference || '',
      internal_notes: internalNotes || '',
      terms_and_conditions: termsAndConditions || '',
      status,
      items: calcItems,

      subtotal,
      line_discounts: totalLineDiscounts,
      additional_discount: Number(additionalDiscount),
      taxable_amount: netTaxable,
      cgst_total: cgstTotal,
      sgst_total: sgstTotal,
      igst_total: igstTotal,
      shipping_charges: Number(shippingCharges),
      handling_charges: Number(handlingCharges),
      round_off: roundOff,
      grand_total: roundedGrandTotal,

      advance_percent: Number(advancePercent),
      advance_amount: advanceAmount,

      shipping_method: shippingMethod || '',
      carrier: carrier || '',
      delivery_instructions: deliveryInstructions || '',

      requisition_id: requisitionId,
      rfq_id: rfqId,
      vendor_quotation_id: vendorQuotationId,

      operation_key: opKey,
      created_by: createdBy
    });

    return po;
  }

  /**
   * 2. Update Purchase Order Status Lifecycle
   */
  static async updatePOStatus(tenantId: string, poId: string, newStatus: string, updatedBy: string): Promise<any> {
    const po = await PurchaseOrder.findOne({ _id: poId, tenant_id: tenantId });
    if (!po) throw new Error('Purchase Order not found.');

    const validStatuses = [
      'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER',
      'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'BILLED', 'CLOSED',
      'REJECTED', 'CANCELLED', 'EXPIRED'
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status transition to ${newStatus}`);
    }

    po.status = newStatus as any;
    po.updated_at = new Date();
    if (newStatus === 'APPROVED') {
      po.approved_by = updatedBy;
      po.approved_at = new Date();
    }

    await po.save();
    return po;
  }

  /**
   * 3. Convert PO → GRN (Receive Goods & Update Inventory)
   */
  static async createGRNFromPO(params: any): Promise<any> {
    const { tenantId, purchaseOrderId, warehouseId, items, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenant_id: tenantId }).session(session);
      if (!po) throw new Error('Purchase Order not found.');

      const grnNumber = await DocumentNumberService.generateNumber(tenantId, 'GRN', po.branchcode, session);
      const billNumber = await DocumentNumberService.generateNumber(tenantId, 'BILL', po.branchcode, session);

      let totalReceivedValue = 0;
      let allItemsFullyReceived = true;

      for (const receiveItem of items) {
        const pId = receiveItem.product_id.toString();
        const poItem = po.items.find((i: any) => i.product_id.toString() === pId);
        if (!poItem) throw new Error(`Product ${pId} is not in Purchase Order.`);

        const recvQty = Number(receiveItem.quantity) || 0;
        const pendingQty = poItem.quantity - poItem.received_quantity;

        if (recvQty > pendingQty) {
          throw new Error(`Over-receiving violation: Received quantity (${recvQty}) exceeds remaining pending quantity (${pendingQty}) for ${poItem.name}.`);
        }

        poItem.received_quantity += recvQty;
        totalReceivedValue += recvQty * poItem.unit_cost;

        if (poItem.received_quantity < poItem.quantity) {
          allItemsFullyReceived = false;
        }

        // Increase physical inventory stock
        let stock = await InventoryStock.findOne({ tenant_id: tenantId, warehouse_id: warehouseId, product_id: poItem.product_id }).session(session);
        if (!stock) {
          [stock] = await InventoryStock.create(
            [{ tenant_id: tenantId, warehouse_id: warehouseId, product_id: poItem.product_id, quantity: 0, reserved_quantity: 0, available_quantity: 0, average_cost: poItem.unit_cost }],
            { session }
          );
        }

        const newQty = stock.quantity + recvQty;
        stock.quantity = newQty;
        stock.available_quantity = Math.max(0, newQty - (stock.reserved_quantity || 0));
        stock.average_cost = poItem.unit_cost;
        stock.updated_at = new Date();
        await stock.save({ session });

        // Record immutable stock movement transaction
        await InventoryTransaction.create(
          [{
            tenant_id: tenantId,
            product_id: poItem.product_id,
            warehouse_id: warehouseId,
            transaction_type: 'PURCHASE',
            quantity: recvQty,
            unit_cost: poItem.unit_cost,
            balance_after: newQty,
            reference_type: 'GRN',
            reference_id: grnNumber,
            operation_key: `GRN_TX_${operationKey}_${poItem.product_id}`,
            created_by: createdBy
          }],
          { session }
        );
      }

      po.status = allItemsFullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
      await po.save({ session });

      await session.commitTransaction();
      session.endSession();
      return { po, grnNumber };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 4. Convert PO → Vendor Bill (with 3-Way Match)
   */
  static async postVendorBillFromPO(params: any): Promise<any> {
    const { tenantId, purchaseOrderId, invoiceNumber, items, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const po = await PurchaseOrder.findOne({ _id: purchaseOrderId, tenant_id: tenantId }).session(session);
      if (!po) throw new Error('Purchase Order not found.');

      // 3-Way Match validation
      const matchResult = ThreeWayMatchPolicy.evaluateMatch(
        po.items.map((i: any) => ({ productId: i.product_id.toString(), unitCost: i.unit_cost, orderedQuantity: i.quantity })),
        po.items.map((i: any) => ({ productId: i.product_id.toString(), receivedQuantity: i.received_quantity })),
        items.map((i: any) => ({ productId: i.product_id.toString(), billedUnitCost: i.unit_cost, billedQuantity: i.quantity }))
      );

      if (!matchResult.isPassed) {
        throw new Error(`3-Way Match Policy Failed: ${matchResult.details.join(' | ')}`);
      }

      const billNumber = await DocumentNumberService.generateNumber(tenantId, 'BILL', po.branchcode, session);
      const grandTotal = items.reduce((acc: number, i: any) => acc + (i.quantity * i.unit_cost), 0);

      // Post Double-Entry Journal: DR Inventory (1130), DR Input Tax (1100), CR Accounts Payable (2110)
      const accountingEntry = await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'VENDOR_BILL',
        sourceId: billNumber,
        operationKey,
        description: `Vendor Bill ${billNumber} for PO ${po.order_number}`,
        lines: [
          { accountCode: '1130', debitAmount: grandTotal, creditAmount: 0, description: 'Inventory Received' },
          { accountCode: '2110', debitAmount: 0, creditAmount: grandTotal, description: 'Accounts Payable' }
        ],
        createdBy,
        session
      });

      // Post to Supplier Subledger
      await SupplierLedgerService.recordEntry({
        tenantId,
        supplierId: po.supplier_id,
        voucherType: 'VENDOR_BILL',
        voucherNumber: billNumber,
        referenceId: po.order_number,
        debitAmount: 0,
        creditAmount: grandTotal,
        description: `Vendor Bill ${billNumber} for PO ${po.order_number}`,
        operationKey: `LEDGER_${operationKey}`,
        session
      });

      po.status = 'BILLED';
      await po.save({ session });

      await session.commitTransaction();
      session.endSession();
      return { billNumber, accountingEntry };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 5. Record Supplier Payment
   */
  static async recordSupplierPayment(params: any): Promise<any> {
    const { tenantId, supplierId, amount, paymentMethod = 'CASH', referenceId, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentNumber = await DocumentNumberService.generateNumber(tenantId, 'PAY', 'DEFAULT', session);

      // Post double-entry journal: DR Accounts Payable (2110), CR Cash/Bank (1110)
      const accountingEntry = await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'SUPPLIER_PAYMENT',
        sourceId: paymentNumber,
        operationKey,
        description: `Supplier Payment ${paymentNumber} (${paymentMethod})`,
        lines: [
          { accountCode: '2110', debitAmount: amount, creditAmount: 0, description: 'Accounts Payable' },
          { accountCode: '1110', debitAmount: 0, creditAmount: amount, description: `Cash/Bank (${paymentMethod})` }
        ],
        createdBy,
        session
      });

      // Post to Supplier Subledger
      await SupplierLedgerService.recordEntry({
        tenantId,
        supplierId,
        voucherType: 'SUPPLIER_PAYMENT',
        voucherNumber: paymentNumber,
        referenceId,
        debitAmount: amount,
        creditAmount: 0,
        description: `Supplier Payment Paid (${paymentNumber})`,
        operationKey: `LEDGER_${operationKey}`,
        session
      });

      await session.commitTransaction();
      session.endSession();
      return { paymentNumber, accountingEntry };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 6. Create Purchase Return & Debit Note with Accounting Reversal
   */
  static async createPurchaseReturn(params: any): Promise<any> {
    const { tenantId, purchaseId, supplierId, warehouseId, items, reason, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnNumber = await DocumentNumberService.generateNumber(tenantId, 'PRT', 'DEFAULT', session);
      const debitNoteNumber = await DocumentNumberService.generateNumber(tenantId, 'DBN', 'DEFAULT', session);

      let subtotal = 0;
      let totalTax = 0;
      const calcItems = items.map((i: any) => {
        const itemSub = i.quantity * i.unit_cost;
        const itemTax = (itemSub * (i.tax_rate || 0)) / 100;
        subtotal += itemSub;
        totalTax += itemTax;
        return { ...i, credit_amount: itemSub + itemTax };
      });
      const grandTotal = subtotal + totalTax;

      // Deduct stock from inventory
      for (const item of calcItems) {
        const stock = await InventoryStock.findOne({ tenant_id: tenantId, warehouse_id: warehouseId, product_id: item.product_id }).session(session);
        if (stock) {
          stock.quantity = Math.max(0, stock.quantity - item.quantity);
          stock.available_quantity = Math.max(0, stock.quantity - (stock.reserved_quantity || 0));
          stock.updated_at = new Date();
          await stock.save({ session });
        }
      }

      // Double-entry reversal: DR Accounts Payable (2110), CR Inventory (1130), CR Input Tax Reversal (1100)
      await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'PURCHASE_RETURN',
        sourceId: debitNoteNumber,
        operationKey,
        description: `Purchase Return & Debit Note ${debitNoteNumber}`,
        lines: [
          { accountCode: '2110', debitAmount: grandTotal, creditAmount: 0, description: 'Accounts Payable Adjustment' },
          { accountCode: '1130', debitAmount: 0, creditAmount: subtotal, description: 'Inventory Returned' },
          { accountCode: '1100', debitAmount: 0, creditAmount: totalTax, description: 'Input Tax Reversal' }
        ],
        createdBy,
        session
      });

      // Post to Supplier Subledger
      await SupplierLedgerService.recordEntry({
        tenantId,
        supplierId,
        voucherType: 'DEBIT_NOTE',
        voucherNumber: debitNoteNumber,
        referenceId: returnNumber,
        debitAmount: grandTotal,
        creditAmount: 0,
        description: `Debit Note issued for Purchase Return ${returnNumber}`,
        operationKey: `LEDGER_${operationKey}`,
        session
      });

      await session.commitTransaction();
      session.endSession();
      return { returnNumber, debitNoteNumber };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

export default PurchaseWorkflowService;
