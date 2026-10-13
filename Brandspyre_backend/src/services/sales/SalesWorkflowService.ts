import mongoose from 'mongoose';
import { SalesQuotation } from '../../db/ModelSchema/commerce/SalesQuotation';
import { SalesOrder as SalesOrderDomain } from '../../db/ModelSchema/commerce/SalesOrder';
import { POSSale, SalesReturn } from '../../db/ModelSceham/commerceSchema';
import { DeliveryNote } from '../../db/ModelSchema/commerce/DeliveryNote';
import DocumentNumberService from '../saas/DocumentNumberService';
import StockReservationService from '../saas/StockReservationService';
import AccountingPostingService from '../saas/AccountingPostingService';
import ApprovalEngineService from '../saas/ApprovalEngineService';
import CustomerLedgerService from './CustomerLedgerService';

export class SalesWorkflowService {
  /**
   * 1. Create Sales Quotation with threshold-based approval check
   */
  static async createQuotation(params: any): Promise<any> {
    const { tenantId, branchcode = 'DEFAULT', quotationDate, validUntil, customerId, customerName, warehouseId, items, discount = 0, notes, salespersonId, createdBy } = params;

    let subtotal = 0;
    let totalTax = 0;
    const calcItems = items.map((i: any) => {
      const lineSub = i.quantity * i.unitPrice;
      const lineTax = (lineSub * (i.taxRate || 0)) / 100;
      subtotal += lineSub;
      totalTax += lineTax;
      return {
        ...i,
        subtotal: lineSub,
        tax_amount: lineTax,
        total: lineSub + lineTax
      };
    });

    const grandTotal = subtotal + totalTax - discount;
    const approval = ApprovalEngineService.evaluateApproval({ tenantId, documentType: 'QUOTATION', grandTotal });
    const status = approval.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    const quotationNumber = await DocumentNumberService.generateNumber(tenantId, 'QT', branchcode);

    const quotation = await SalesQuotation.create({
      tenant_id: tenantId,
      quotation_number: quotationNumber,
      quotation_date: quotationDate || new Date(),
      valid_until: validUntil,
      customer_id: customerId,
      customer_name: customerName,
      warehouse_id: warehouseId,
      status,
      items: calcItems,
      subtotal,
      discount,
      tax: totalTax,
      grand_total: grandTotal,
      notes,
      salesperson_id: salespersonId,
      branchcode,
      created_by: createdBy
    });

    return quotation;
  }

  /**
   * 2. Create Production-Grade Sales Order
   */
  static async createSalesOrder(params: any): Promise<any> {
    const {
      tenantId,
      quotationId,
      branchcode = 'DEFAULT',
      orderDate,
      expectedDeliveryDate,
      customerId,
      customerName,
      customerCode,
      customerContact,
      customerTaxNumber,
      billingAddress,
      shippingAddress,
      warehouseId,
      salespersonId,
      salespersonName,
      currency = 'INR',
      paymentTerms = 'Net 30',
      customerPoNumber,
      referenceNumber,
      shippingMethod,
      carrier,
      deliveryInstructions,
      internalNotes,
      termsAndConditions,
      items,
      additionalDiscount = 0,
      shippingCharges = 0,
      handlingCharges = 0,
      otherCharges = 0,
      creditLimit = 100000,
      currentOutstanding = 0,
      operationKey,
      createdBy
    } = params;

    if (!warehouseId || !Array.isArray(items) || items.length === 0) {
      throw new Error('Warehouse and at least one item line are required.');
    }

    let subtotal = 0;
    let totalLineDiscounts = 0;
    let totalTaxable = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const calcItems = items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const rate = Number(i.unit_price || i.unitPrice) || 0;
      const rawLine = qty * rate;

      const discPct = Number(i.discount_percent || i.discountPercent) || 0;
      const lineDisc = (rawLine * discPct) / 100;
      const taxableLine = rawLine - lineDisc;

      const taxRate = Number(i.tax_rate || i.taxRate) || 0;
      const taxAmount = (taxableLine * taxRate) / 100;

      // Intrastate CGST/SGST vs Interstate IGST split assumption
      const isInterstate = false;
      const cgst = isInterstate ? 0 : taxAmount / 2;
      const sgst = isInterstate ? 0 : taxAmount / 2;
      const igst = isInterstate ? taxAmount : 0;

      subtotal += rawLine;
      totalLineDiscounts += lineDisc;
      totalTaxable += taxableLine;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        product_id: i.product_id || i.productId,
        variant_id: i.variant_id || i.variantId,
        sku: i.sku || 'SKU-001',
        name: i.name || 'Sales Item',
        description: i.description || '',
        quantity: qty,
        uom: i.uom || 'PCS',
        unit_price: rate,
        discount_percent: discPct,
        discount_amount: lineDisc,
        tax_rate: taxRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        tax_amount: taxAmount,
        total: taxableLine + taxAmount,
        fulfilled_quantity: 0,
        delivered_quantity: 0,
        invoiced_quantity: 0,
        batch_number: i.batch_number || i.batchNumber || '',
        serial_number: i.serial_number || i.serialNumber || ''
      };
    });

    const netTaxable = totalTaxable - Number(additionalDiscount);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const rawGrandTotal = netTaxable + totalTax + Number(shippingCharges) + Number(handlingCharges) + Number(otherCharges);
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = roundedGrandTotal - rawGrandTotal;

    // Check Credit Limit & Approval Engine
    const isCreditExceeded = (Number(currentOutstanding) + roundedGrandTotal) > Number(creditLimit);
    const approval = ApprovalEngineService.evaluateApproval({
      tenantId,
      documentType: 'SALES_ORDER',
      grandTotal: roundedGrandTotal
    });

    const requiresApproval = approval.requiresApproval || isCreditExceeded;
    const status = requiresApproval ? 'PENDING_APPROVAL' : 'CONFIRMED';

    const orderNumber = await DocumentNumberService.generateNumber(tenantId, 'SO', branchcode);
    const opKey = operationKey || `SO_OP_${orderNumber}_${Date.now()}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [salesOrder] = await SalesOrderDomain.create(
        [{
          tenant_id: tenantId,
          order_number: orderNumber,
          quotation_id: quotationId,
          customer_id: customerId,
          customer_name: customerName || 'Walk-in Customer',
          customer_code: customerCode || 'CUS-001',
          customer_contact: customerContact || '',
          customer_tax_number: customerTaxNumber || '',
          billing_address: billingAddress || '',
          shipping_address: shippingAddress || '',
          branchcode,
          warehouse_id: warehouseId,
          salesperson_id: salespersonId || '',
          salesperson_name: salespersonName || '',
          order_date: orderDate || new Date(),
          expected_delivery_date: expectedDeliveryDate,
          currency,
          payment_terms: paymentTerms,
          customer_po_number: customerPoNumber || '',
          reference_number: referenceNumber || '',
          shipping_method: shippingMethod || '',
          carrier: carrier || '',
          delivery_instructions: deliveryInstructions || '',
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
          tax: totalTax,
          shipping_charges: Number(shippingCharges),
          handling_charges: Number(handlingCharges),
          other_charges: Number(otherCharges),
          round_off: roundOff,
          grand_total: roundedGrandTotal,
          paid_amount: 0,
          outstanding_balance: roundedGrandTotal,
          credit_limit: Number(creditLimit),
          current_outstanding: Number(currentOutstanding),
          operation_key: opKey,
          created_by: createdBy
        }],
        { session }
      );

      // If status is CONFIRMED, reserve stock immediately
      if (status === 'CONFIRMED') {
        for (const item of calcItems) {
          if (item.product_id) {
            await StockReservationService.reserveStock({
              tenantId,
              branchcode,
              sourceType: 'SALES_ORDER',
              sourceId: orderNumber,
              productId: item.product_id,
              variantId: item.variant_id,
              warehouseId,
              quantity: item.quantity,
              session
            });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
      return salesOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 3. Update Sales Order Status Lifecycle
   */
  static async updateOrderStatus(tenantId: string, orderId: string, newStatus: string, updatedBy: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await SalesOrderDomain.findOne({ _id: orderId, tenant_id: tenantId }).session(session);
      if (!order) throw new Error('Sales Order not found.');

      const previousStatus = order.status;
      order.status = newStatus as any;
      order.updated_at = new Date();

      if (newStatus === 'CONFIRMED' || newStatus === 'APPROVED') {
        order.approved_by = updatedBy;
        order.approved_at = new Date();

        // Reserve stock if not already reserved
        if (previousStatus === 'PENDING_APPROVAL' || previousStatus === 'DRAFT') {
          for (const item of order.items) {
            if (item.product_id) {
              await StockReservationService.reserveStock({
                tenantId,
                branchcode: order.branchcode,
                sourceType: 'SALES_ORDER',
                sourceId: order.order_number,
                productId: item.product_id,
                variantId: item.variant_id,
                warehouseId: order.warehouse_id,
                quantity: item.quantity,
                session
              });
            }
          }
          order.status = 'STOCK_RESERVED';
        }
      }

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 4. Convert Sales Quotation → Sales Order & Reserve Stock
   */
  static async convertQuotationToSalesOrder(tenantId: string, quotationId: string, createdBy: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const quote = await SalesQuotation.findOne({ _id: quotationId, tenant_id: tenantId }).session(session);
      if (!quote) throw new Error('Quotation not found.');
      if (quote.status !== 'APPROVED') throw new Error(`Quotation cannot be converted. Status is ${quote.status}`);

      const orderNumber = await DocumentNumberService.generateNumber(tenantId, 'SO', quote.branchcode, session);

      const [salesOrder] = await SalesOrderDomain.create(
        [{
          tenant_id: tenantId,
          order_number: orderNumber,
          quotation_id: quote._id,
          quotation_number: quote.quotation_number,
          order_date: new Date(),
          customer_id: quote.customer_id,
          customer_name: quote.customer_name,
          warehouse_id: quote.warehouse_id,
          status: 'STOCK_RESERVED',
          items: quote.items.map((i: any) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            sku: i.sku,
            name: i.name,
            quantity: i.quantity,
            uom: 'PCS',
            unit_price: i.unit_price,
            discount_percent: i.discount || 0,
            discount_amount: (i.quantity * i.unit_price * (i.discount || 0)) / 100,
            tax_rate: i.tax_rate || 0,
            tax_amount: i.tax_amount || 0,
            total: i.total || 0,
            fulfilled_quantity: 0,
            delivered_quantity: 0,
            invoiced_quantity: 0
          })),
          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          grand_total: quote.grand_total,
          notes: quote.notes,
          branchcode: quote.branchcode,
          operation_key: `SO_CONV_${orderNumber}_${Date.now()}`,
          created_by: createdBy
        }],
        { session }
      );

      // Reserve stock for every order item
      for (const item of quote.items) {
        await StockReservationService.reserveStock({
          tenantId,
          branchcode: quote.branchcode,
          sourceType: 'SALES_ORDER',
          sourceId: salesOrder.order_number,
          productId: item.product_id,
          variantId: item.variant_id,
          warehouseId: quote.warehouse_id,
          quantity: item.quantity,
          session
        });
      }

      quote.status = 'CONVERTED';
      await quote.save({ session });

      await session.commitTransaction();
      session.endSession();
      return salesOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 5. Create Delivery Note (Dispatch Goods & Fulfill Reservations)
   */
  static async createDeliveryNote(params: any): Promise<any> {
    const { tenantId, salesOrderId, trackingNumber, carrier, items, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const so = await SalesOrderDomain.findOne({ _id: salesOrderId, tenant_id: tenantId }).session(session);
      if (!so) throw new Error('Sales Order not found.');

      const deliveryNumber = await DocumentNumberService.generateNumber(tenantId, 'DN', so.branchcode, session);
      let allItemsDelivered = true;

      const calcItems = (items || so.items).map((reqItem: any) => {
        const pId = (reqItem.product_id || reqItem.productId).toString();
        const soItem = so.items.find((i: any) => i.product_id.toString() === pId);
        if (!soItem) throw new Error(`Product ${pId} is not part of Sales Order.`);

        const delQty = Number(reqItem.quantity) || (soItem.quantity - soItem.delivered_quantity);
        const remaining = soItem.quantity - soItem.delivered_quantity;

        if (delQty > remaining) {
          throw new Error(`Over-delivery violation: Requested delivery (${delQty}) exceeds remaining quantity (${remaining}) for ${soItem.name}.`);
        }

        soItem.delivered_quantity += delQty;
        soItem.fulfilled_quantity = soItem.delivered_quantity;

        if (soItem.delivered_quantity < soItem.quantity) {
          allItemsDelivered = false;
        }

        return {
          product_id: soItem.product_id,
          variant_id: soItem.variant_id,
          sku: soItem.sku,
          name: soItem.name,
          ordered_quantity: soItem.quantity,
          delivered_quantity: delQty,
          unit_price: soItem.unit_price
        };
      });

      const [deliveryNote] = await DeliveryNote.create(
        [{
          tenant_id: tenantId,
          delivery_number: deliveryNumber,
          sales_order_id: so._id,
          sales_order_number: so.order_number,
          customer_id: so.customer_id,
          warehouse_id: so.warehouse_id,
          delivery_date: new Date(),
          status: 'DISPATCHED',
          tracking_number: trackingNumber || '',
          carrier: carrier || '',
          items: calcItems,
          operation_key: operationKey || `DN_${so.order_number}_${Date.now()}`,
          branchcode: so.branchcode,
          created_by: createdBy
        }],
        { session }
      );

      // Fulfill stock reservation and deduct physical inventory
      await StockReservationService.fulfillReservation(tenantId, so.order_number, session);

      so.status = allItemsDelivered ? 'FULLY_DELIVERED' : 'PARTIALLY_DELIVERED';
      await so.save({ session });

      await session.commitTransaction();
      session.endSession();
      return deliveryNote;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 6. Post Sales Invoice & Execute Double-Entry Accounting
   */
  static async createSalesInvoiceAndPostAccounting(params: any): Promise<any> {
    const { tenantId, salesOrderId, customerId, warehouseId, items, subtotal, tax, grandTotal, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoiceNumber = await DocumentNumberService.generateNumber(tenantId, 'INV', 'DEFAULT', session);

      // Post double-entry journal: DR Accounts Receivable (1120), CR Sales Revenue (4100), CR Output Tax (2120)
      const accountingEntry = await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'SALES_INVOICE',
        sourceId: invoiceNumber,
        operationKey,
        description: `Sales Invoice ${invoiceNumber}`,
        lines: [
          { accountCode: '1120', debitAmount: grandTotal, creditAmount: 0, description: 'Accounts Receivable' },
          { accountCode: '4100', debitAmount: 0, creditAmount: subtotal, description: 'Sales Revenue' },
          { accountCode: '2120', debitAmount: 0, creditAmount: tax, description: 'Output Tax Payable' }
        ],
        createdBy,
        session
      });

      // Post to Customer Subledger
      if (customerId) {
        await CustomerLedgerService.recordEntry({
          tenantId,
          customerId,
          voucherType: 'SALES_INVOICE',
          voucherNumber: invoiceNumber,
          debitAmount: grandTotal,
          creditAmount: 0,
          description: `Sales Invoice ${invoiceNumber}`,
          operationKey: `LEDGER_${operationKey}`,
          session
        });
      }

      if (salesOrderId) {
        const so = await SalesOrderDomain.findOne({ _id: salesOrderId, tenant_id: tenantId }).session(session);
        if (so) {
          so.status = 'INVOICED';
          await so.save({ session });
        }
      }

      await session.commitTransaction();
      session.endSession();
      return { invoiceNumber, accountingEntry };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 7. Record Customer Payment Receipt
   */
  static async recordCustomerPayment(params: any): Promise<any> {
    const { tenantId, customerId, amount, paymentMethod = 'CASH', referenceId, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const receiptNumber = await DocumentNumberService.generateNumber(tenantId, 'REC', 'DEFAULT', session);

      // Post double-entry journal: DR Cash/Bank (1110), CR Accounts Receivable (1120)
      const accountingEntry = await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'CUSTOMER_PAYMENT',
        sourceId: receiptNumber,
        operationKey,
        description: `Customer Receipt ${receiptNumber} (${paymentMethod})`,
        lines: [
          { accountCode: '1110', debitAmount: amount, creditAmount: 0, description: `Cash/Bank (${paymentMethod})` },
          { accountCode: '1120', debitAmount: 0, creditAmount: amount, description: 'Accounts Receivable' }
        ],
        createdBy,
        session
      });

      // Post to Customer Subledger
      if (customerId) {
        await CustomerLedgerService.recordEntry({
          tenantId,
          customerId,
          voucherType: 'CUSTOMER_PAYMENT',
          voucherNumber: receiptNumber,
          referenceId,
          debitAmount: 0,
          creditAmount: amount,
          description: `Customer Payment Received (${receiptNumber})`,
          operationKey: `LEDGER_${operationKey}`,
          session
        });
      }

      await session.commitTransaction();
      session.endSession();
      return { receiptNumber, accountingEntry };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * 8. Create Sales Return with Strict Return Limit Validation & Accounting Reversal
   */
  static async createSalesReturn(params: any): Promise<any> {
    const { tenantId, originalSaleType, originalSaleId, customerId, warehouseId, items, reason, operationKey, createdBy } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let originalSale: any = null;
      if (originalSaleType === 'POS') {
        originalSale = await POSSale.findOne({ _id: originalSaleId, tenant_id: tenantId }).session(session);
      }

      if (originalSale) {
        const previousReturns = await SalesReturn.find({ tenant_id: tenantId, original_sale_id: originalSaleId }).session(session);
        const returnedMap = new Map<string, number>();
        previousReturns.forEach(r => {
          r.items.forEach((i: any) => {
            const pId = i.product_id.toString();
            returnedMap.set(pId, (returnedMap.get(pId) || 0) + i.quantity);
          });
        });

        for (const returnItem of items) {
          const pId = returnItem.product_id.toString();
          const origItem = originalSale.items.find((i: any) => i.product_id.toString() === pId);
          if (!origItem) throw new Error(`Product ${returnItem.product_id} was not part of original sale.`);

          const prevReturned = returnedMap.get(pId) || 0;
          const returnable = origItem.quantity - prevReturned;
          if (returnItem.quantity > returnable) {
            throw new Error(`Cannot return ${returnItem.quantity} units for product ${origItem.name}. Maximum returnable: ${returnable}`);
          }
        }
      }

      const returnNumber = await DocumentNumberService.generateNumber(tenantId, 'SR', 'DEFAULT', session);
      const creditNoteNumber = await DocumentNumberService.generateNumber(tenantId, 'CN', 'DEFAULT', session);

      let subtotal = 0;
      let totalTax = 0;
      const calcItems = items.map((i: any) => {
        const itemSub = i.quantity * i.unit_price;
        const itemTax = (itemSub * (i.tax_rate || 0)) / 100;
        subtotal += itemSub;
        totalTax += itemTax;
        return { ...i, tax_amount: itemTax, refund_amount: itemSub + itemTax };
      });
      const grandTotal = subtotal + totalTax;

      const [salesReturn] = await SalesReturn.create(
        [{
          tenant_id: tenantId,
          return_number: returnNumber,
          original_sale_type: originalSaleType,
          original_sale_id: originalSaleId,
          customer_id: customerId,
          warehouse_id: warehouseId,
          items: calcItems,
          subtotal,
          tax: totalTax,
          grand_total: grandTotal,
          reason,
          operation_key: operationKey,
          created_by: createdBy
        }],
        { session }
      );

      // Accounting Reversal: DR Sales Return (5100), DR Output Tax Reversal (2120), CR Accounts Receivable (1120)
      await AccountingPostingService.postJournalEntry({
        tenantId,
        sourceType: 'SALES_RETURN',
        sourceId: creditNoteNumber,
        operationKey,
        description: `Sales Return & Credit Note ${creditNoteNumber}`,
        lines: [
          { accountCode: '5100', debitAmount: subtotal, creditAmount: 0, description: 'Sales Return Expense' },
          { accountCode: '2120', debitAmount: totalTax, creditAmount: 0, description: 'Output Tax Reversal' },
          { accountCode: '1120', debitAmount: 0, creditAmount: grandTotal, description: 'Accounts Receivable Adjustment' }
        ],
        createdBy,
        session
      });

      // Post to Customer Subledger
      if (customerId) {
        await CustomerLedgerService.recordEntry({
          tenantId,
          customerId,
          voucherType: 'CREDIT_NOTE',
          voucherNumber: creditNoteNumber,
          referenceId: returnNumber,
          debitAmount: 0,
          creditAmount: grandTotal,
          description: `Credit Note issued for Sales Return ${returnNumber}`,
          operationKey: `LEDGER_${operationKey}`,
          session
        });
      }

      await session.commitTransaction();
      session.endSession();
      return { salesReturn, creditNoteNumber };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

export default SalesWorkflowService;
