import mongoose from 'mongoose';
import { SalesOrder } from '../../db/ModelSchema/commerce/SalesOrder';
import { SalesQuotation } from '../../db/ModelSchema/commerce/SalesQuotation';
import { Client } from '../../db/ModelSceham/project/client';
import { Notification } from '../../db/ModelSceham/Notification/notification';
import { Tenant } from '../../db/ModelSceham/saasSchema';
import { IEcommerceOrderItem, ISellerOrderRef } from '../../db/ModelSceham/marketplaceSchema';
import { ProductService } from '../saas/ProductService';

export interface BuyerProfileData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export class MarketplaceOrderBridgeService {
  /**
   * Split a multi-seller cart into individual ERP Sales Orders for each seller organization.
   * Auto-links or creates a Client in the seller's CRM partition and sends in-app notifications.
   */
  static async createSellerOrdersForMasterOrder(
    masterOrderNumber: string,
    buyer: BuyerProfileData,
    items: IEcommerceOrderItem[],
    paymentMethod: string = 'COD'
  ): Promise<ISellerOrderRef[]> {
    const sellerOrderRefs: ISellerOrderRef[] = [];

    // 1. Group items by Seller Tenant
    const itemsByTenant = new Map<string, IEcommerceOrderItem[]>();
    for (const item of items) {
      const tIdStr = item.tenant_id.toString();
      if (!itemsByTenant.has(tIdStr)) {
        itemsByTenant.set(tIdStr, []);
      }
      itemsByTenant.get(tIdStr)!.push(item);
    }

    // 2. Process each seller tenant
    for (const [tenantIdStr, tenantItems] of itemsByTenant.entries()) {
      const tenantId = new mongoose.Types.ObjectId(tenantIdStr);

      // Lookup seller organization name
      let sellerName = tenantItems[0].tenant_name || 'Seller';
      try {
        const tenant = await Tenant.findById(tenantId).lean();
        if (tenant) {
          sellerName = (tenant as any).company_name || (tenant as any).name || sellerName;
        }
      } catch (e) {}

      // Find or auto-register Client in seller's CRM partition
      let client = await Client.findOne({
        tenant_id: tenantId,
        email: buyer.email.trim().toLowerCase()
      });

      if (!client) {
        const clientCode = `CL-MKT-${Date.now().toString().slice(-5)}`;
        client = await Client.create({
          tenant_id: tenantId,
          client_code: clientCode,
          branchcode: 'DEFAULT',
          client_name: buyer.name.trim(),
          company_name: buyer.company?.trim() || `${buyer.name} (Marketplace Buyer)`,
          primary_phone: buyer.phone.trim(),
          email: buyer.email.trim().toLowerCase(),
          office_address: `${buyer.shippingAddress.line1}, ${buyer.shippingAddress.city} - ${buyer.shippingAddress.postal_code}`,
          industry_type: 'ONLINE_COMMERCE',
          status: 'active'
        });
      }

      const sellerSubtotal = tenantItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
      const sellerTax = tenantItems.reduce((acc, it) => acc + (it.tax_amount || 0), 0);
      const sellerGrandTotal = sellerSubtotal + sellerTax;
      const sellerOrderNumber = `SO-${masterOrderNumber}-${tenantIdStr.slice(-4)}`;

      // Ensure seller has an operational default warehouse
      let sellerWarehouseId: mongoose.Types.ObjectId;
      try {
        const defaultWh = await ProductService.ensureDefaultWarehouse(tenantId);
        sellerWarehouseId = defaultWh._id;
      } catch (wErr) {
        sellerWarehouseId = new mongoose.Types.ObjectId('000000000000000000000001');
      }

      const opKey = `SO_MKT_${masterOrderNumber}_${tenantIdStr}_${Date.now()}`;

      // Create enterprise SalesOrder in seller's ERP workspace
      const salesOrder = await SalesOrder.create({
        tenant_id: tenantId,
        order_number: sellerOrderNumber,
        order_date: new Date(),
        customer_id: client._id,
        customer_name: buyer.name.trim(),
        customer_contact: buyer.phone.trim(),
        billing_address: `${buyer.shippingAddress.line1}, ${buyer.shippingAddress.city} - ${buyer.shippingAddress.postal_code}`,
        shipping_address: `${buyer.shippingAddress.line1}, ${buyer.shippingAddress.city} - ${buyer.shippingAddress.postal_code}`,
        branchcode: 'DEFAULT',
        warehouse_id: sellerWarehouseId,
        currency: 'INR',
        payment_terms: paymentMethod,
        status: 'CONFIRMED',
        operation_key: opKey,
        created_by: 'MARKETPLACE_STOREFRONT',
        items: tenantItems.map(it => ({
          product_id: it.product_id,
          sku: it.sku,
          name: it.name,
          quantity: it.quantity,
          uom: 'PCS',
          unit_price: it.unit_price,
          discount_percent: 0,
          discount_amount: 0,
          tax_rate: it.tax_rate,
          cgst_amount: (it.tax_amount || 0) / 2,
          sgst_amount: (it.tax_amount || 0) / 2,
          igst_amount: 0,
          tax_amount: it.tax_amount || 0,
          total: it.total,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          invoiced_quantity: 0
        })),
        subtotal: sellerSubtotal,
        line_discounts: 0,
        additional_discount: 0,
        taxable_amount: sellerSubtotal,
        cgst_total: sellerTax / 2,
        sgst_total: sellerTax / 2,
        igst_total: 0,
        tax: sellerTax,
        shipping_charges: 0,
        handling_charges: 0,
        other_charges: 0,
        round_off: 0,
        grand_total: sellerGrandTotal,
        paid_amount: 0,
        outstanding_balance: sellerGrandTotal,
        internal_notes: `[Marketplace Order: ${masterOrderNumber}] Buyer: ${buyer.name} (${buyer.email}) | Payment: ${paymentMethod}`
      });

      // Dispatch in-app notification to seller organization
      const itemsSummary = tenantItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
      await Notification.create({
        tenant_id: tenantId,
        from: 'Marketplace Storefront',
        type: 'SALES_ORDER',
        action: 'NEW_ORDER_RECEIVED',
        content: `New Marketplace Order (${masterOrderNumber}) received for: ${itemsSummary}. Total: ₹${sellerGrandTotal.toLocaleString()}. Customer: ${buyer.name}.`,
        isnotify: true,
        created_on: new Date()
      });

      sellerOrderRefs.push({
        tenant_id: tenantId,
        tenant_name: sellerName,
        sales_order_id: salesOrder._id,
        order_number: sellerOrderNumber,
        subtotal: sellerGrandTotal,
        status: 'CONFIRMED'
      });
    }

    return sellerOrderRefs;
  }

  /**
   * Routes an RFQ / purchase quotation enquiry into seller's SalesQuotation workspace
   */
  static async routeQuotationToSeller(
    rfqNumber: string,
    sellerTenantId: mongoose.Types.ObjectId,
    buyer: BuyerProfileData,
    product: {
      _id: mongoose.Types.ObjectId;
      name: string;
      sku: string;
      tax_rate: number;
    },
    requestedQty: number,
    targetUnitPrice: number,
    notes?: string,
    neededByDate?: Date
  ): Promise<{ salesQuotationId: mongoose.Types.ObjectId; quotationNumber: string }> {
    // 1. Ensure Client exists
    let client = await Client.findOne({
      tenant_id: sellerTenantId,
      email: buyer.email.trim().toLowerCase()
    });

    if (!client) {
      client = await Client.create({
        tenant_id: sellerTenantId,
        client_code: `CL-RFQ-${Date.now().toString().slice(-5)}`,
        branchcode: 'DEFAULT',
        client_name: buyer.name.trim(),
        company_name: buyer.company?.trim() || `${buyer.name} (RFQ Buyer)`,
        primary_phone: buyer.phone.trim(),
        email: buyer.email.trim().toLowerCase(),
        office_address: buyer.shippingAddress.line1 || '',
        industry_type: 'ONLINE_COMMERCE',
        status: 'active'
      });
    }

    const subtotal = requestedQty * targetUnitPrice;
    const taxRate = product.tax_rate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;
    const quotationNumber = `QT-${rfqNumber}`;

    // Ensure seller has an operational default warehouse
    let sellerWarehouseId: mongoose.Types.ObjectId;
    try {
      const defaultWh = await ProductService.ensureDefaultWarehouse(sellerTenantId);
      sellerWarehouseId = defaultWh._id;
    } catch (wErr) {
      sellerWarehouseId = new mongoose.Types.ObjectId('000000000000000000000001');
    }

    // 2. Create SalesQuotation
    const salesQuotation = await SalesQuotation.create({
      tenant_id: sellerTenantId,
      quotation_number: quotationNumber,
      quotation_date: new Date(),
      valid_until: neededByDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      customer_id: client._id,
      customer_name: buyer.name.trim(),
      customer_contact: buyer.phone.trim(),
      branchcode: 'DEFAULT',
      warehouse_id: sellerWarehouseId,
      currency: 'INR',
      status: 'PENDING_APPROVAL',
      created_by: 'MARKETPLACE_BUYER',
      items: [{
        product_id: product._id,
        sku: product.sku,
        name: product.name,
        quantity: requestedQty,
        uom: 'PCS',
        unit_price: targetUnitPrice,
        discount_percent: 0,
        discount_amount: 0,
        tax_rate: taxRate,
        cgst_amount: taxAmount / 2,
        sgst_amount: taxAmount / 2,
        igst_amount: 0,
        tax_amount: taxAmount,
        total: grandTotal
      }],
      subtotal,
      line_discounts: 0,
      additional_discount: 0,
      taxable_amount: subtotal,
      cgst_total: taxAmount / 2,
      sgst_total: taxAmount / 2,
      igst_total: 0,
      tax: taxAmount,
      shipping_charges: 0,
      handling_charges: 0,
      other_charges: 0,
      round_off: 0,
      grand_total: grandTotal,
      notes: `[Online Storefront RFQ #${rfqNumber}]\nBuyer Company: ${buyer.company || 'N/A'}\nNotes: ${notes || 'None'}`
    });

    // 3. Dispatch notification
    await Notification.create({
      tenant_id: sellerTenantId,
      from: 'Marketplace Storefront',
      type: 'QUOTATION_ENQUIRY',
      action: 'NEW_PURCHASE_QUOTATION',
      content: `New Purchase Quotation Enquiry (${rfqNumber}) received for "${product.name}" (Qty: ${requestedQty}) from ${buyer.name}. Check your Quotations workspace to respond.`,
      isnotify: true,
      created_on: new Date()
    });

    return {
      salesQuotationId: salesQuotation._id,
      quotationNumber
    };
  }
}

export default MarketplaceOrderBridgeService;
