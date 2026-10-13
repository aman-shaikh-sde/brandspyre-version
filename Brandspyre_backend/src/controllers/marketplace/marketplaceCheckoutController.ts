import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { MarketplaceAuthRequest } from './marketplaceAuthController';
import {
  EcommerceOrder,
  MarketplaceListing,
  IEcommerceOrderItem
} from '../../db/ModelSceham/marketplaceSchema';
import { Product } from '../../db/ModelSceham/commerceSchema';
import { Tenant } from '../../db/ModelSceham/saasSchema';
import { MarketplaceInventoryService } from '../../services/marketplace/MarketplaceInventoryService';
import { MarketplaceOrderBridgeService } from '../../services/marketplace/MarketplaceOrderBridgeService';
import { SalesOrder } from '../../db/ModelSchema/commerce/SalesOrder';

export class MarketplaceCheckoutController {
  /**
   * POST /api/marketplace/orders/checkout or /api/orders/checkout
   * Concurrency-safe server-validated checkout with multi-seller splitting
   */
  static async checkout(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const {
        items,
        shipping_address,
        billing_address,
        payment_method = 'COD',
        notes,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_company,
        idempotency_key: bodyIdempotencyKey
      } = req.body;

      const idempotencyKey = (req.headers['idempotency-key'] as string) || bodyIdempotencyKey || null;

      // 1. Idempotency Check
      if (idempotencyKey) {
        const existingOrder = await EcommerceOrder.findOne({ idempotency_key: idempotencyKey });
        if (existingOrder) {
          res.status(200).json({
            success: true,
            message: 'Order already processed (idempotent replay).',
            data: existingOrder
          });
          return;
        }
      }

      // 2. Validate Cart Items & Buyer Information
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Shopping cart is empty. Please add items.' });
        return;
      }

      if (!shipping_address?.line1 || !shipping_address?.city || !shipping_address?.postal_code) {
        res.status(400).json({ success: false, error: 'Complete delivery address is required.' });
        return;
      }

      const customerName = buyer_name || req.buyer?.name;
      const customerEmail = buyer_email || req.buyer?.email;
      const customerPhone = buyer_phone || shipping_address.phone;

      if (!customerName || !customerEmail || !customerPhone) {
        res.status(400).json({ success: false, error: 'Buyer name, email, and phone number are required.' });
        return;
      }

      // 3. Server-side product validation & price recalculation
      // NEVER trust client prices, tax rates, or totals!
      const hydratedItems: IEcommerceOrderItem[] = [];
      let calculatedSubtotal = 0;
      let calculatedTax = 0;

      const itemsToReserve: { productId: string; quantity: number; sellerTenantId: string }[] = [];

      for (const item of items) {
        const prodId = item.product_id || item.id || item._id;
        if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) {
          res.status(400).json({ success: false, error: `Invalid product ID: ${prodId}` });
          return;
        }

        // Check MarketplaceListing first
        let listing: any = await MarketplaceListing.findOne({
          $or: [
            { _id: new mongoose.Types.ObjectId(prodId) },
            { product_id: new mongoose.Types.ObjectId(prodId) }
          ],
          is_published: true,
          status: 'PUBLISHED'
        }).populate('product_id').lean();

        let product: any = null;
        let unitPrice = 0;
        let taxRate = 0;
        let sellerTenantId: any = null;
        let actualProductId: any = null;
        let listingId: any = null;
        let productName = '';
        let sku = '';
        let imageUrl = '';

        if (listing) {
          listingId = listing._id;
          product = listing.product_id;
          actualProductId = product?._id || listing.product_id;
          sellerTenantId = listing.tenant_id;
          unitPrice = listing.listing_price;
          taxRate = listing.tax_rate || product?.tax_rate || 0;
          productName = listing.title;
          sku = product?.sku || 'SKU-MKT';
          imageUrl = listing.images?.[0] || product?.image_url || '';
        } else {
          // Fallback to Product master
          product = await Product.findOne({
            _id: new mongoose.Types.ObjectId(prodId),
            is_active: true,
            is_deleted: { $ne: true }
          }).lean();

          if (!product) {
            res.status(400).json({ success: false, error: `Product "${item.name || prodId}" is currently unavailable.` });
            return;
          }

          actualProductId = product._id;
          sellerTenantId = product.tenant_id;
          unitPrice = product.selling_price;
          taxRate = product.tax_rate || 0;
          productName = product.name;
          sku = product.sku;
          imageUrl = product.image_url || '';
        }

        const qty = Math.max(1, Number(item.quantity) || 1);
        const lineSubtotal = qty * unitPrice;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += lineTax;

        // Resolve seller name
        let sellerName = 'Verified Seller';
        try {
          const tenant = await Tenant.findById(sellerTenantId).lean();
          if (tenant) sellerName = (tenant as any).company_name || (tenant as any).name || sellerName;
        } catch (e) {}

        hydratedItems.push({
          product_id: actualProductId,
          listing_id: listingId,
          tenant_id: sellerTenantId,
          tenant_name: sellerName,
          sku,
          name: productName,
          image_url: imageUrl,
          quantity: qty,
          unit_price: unitPrice,
          tax_rate: taxRate,
          tax_amount: lineTax,
          subtotal: lineSubtotal,
          total: lineTotal
        });

        itemsToReserve.push({
          productId: actualProductId.toString(),
          quantity: qty,
          sellerTenantId: sellerTenantId.toString()
        });
      }

      const shippingFee = calculatedSubtotal >= 1000 ? 0 : 50;
      const grandTotal = calculatedSubtotal + calculatedTax + shippingFee;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const masterOrderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix}`;

      // 4. Concurrency-Safe Inventory Stock Reservation
      const stockRes = await MarketplaceInventoryService.reserveStock(masterOrderNumber, itemsToReserve);
      if (!stockRes.success) {
        res.status(400).json({
          success: false,
          error: stockRes.error || 'One or more items in your cart are currently out of stock.'
        });
        return;
      }

      // 5. Multi-Seller Splitting & ERP SalesOrder Generation
      const buyerProfile = {
        name: customerName.trim(),
        email: customerEmail.trim().toLowerCase(),
        phone: customerPhone.trim(),
        company: buyer_company?.trim() || req.buyer?.companyName,
        shippingAddress: shipping_address
      };

      let sellerOrderRefs: any[] = [];
      try {
        sellerOrderRefs = await MarketplaceOrderBridgeService.createSellerOrdersForMasterOrder(
          masterOrderNumber,
          buyerProfile,
          hydratedItems,
          payment_method
        );
      } catch (bridgeErr: any) {
        console.error('Failed to create seller ERP sales orders:', bridgeErr);
        // Rollback stock reservation on bridge error
        await MarketplaceInventoryService.rollbackReservations(masterOrderNumber);
        res.status(500).json({
          success: false,
          error: 'Failed to route orders to seller workspaces. Order aborted.',
          details: bridgeErr?.message || String(bridgeErr)
        });
        return;
      }

      // 6. Create Master EcommerceOrder
      const buyerType = req.buyer?.isOrgUser
        ? 'ORGANIZATION_USER'
        : req.buyer?.id
        ? 'REGISTERED_BUYER'
        : 'GUEST';

      const orderAccessToken = crypto.randomBytes(32).toString('hex');

      const masterOrder = await EcommerceOrder.create({
        order_number: masterOrderNumber,
        order_access_token: orderAccessToken,
        idempotency_key: idempotencyKey || undefined,
        buyer_id: req.buyer?.id ? new mongoose.Types.ObjectId(req.buyer.id) : undefined,
        buyer_tenant_id: req.buyer?.orgId ? new mongoose.Types.ObjectId(req.buyer.orgId) : undefined,
        buyer_type: buyerType,
        buyer_name: customerName.trim(),
        buyer_email: customerEmail.trim().toLowerCase(),
        buyer_phone: customerPhone.trim(),
        buyer_company: buyer_company?.trim() || req.buyer?.companyName || '',
        shipping_address,
        billing_address: billing_address || shipping_address,
        items: hydratedItems,
        subtotal: calculatedSubtotal,
        tax_total: calculatedTax,
        shipping_fee: shippingFee,
        discount: 0,
        grand_total: grandTotal,
        payment_method,
        payment_status: payment_method === 'COD' || payment_method === 'B2B_PO' ? 'PENDING' : 'PENDING',
        status: 'PLACED',
        seller_orders: sellerOrderRefs,
        notes: notes || '',
        timeline: [
          {
            status: 'PLACED',
            title: 'Order Placed',
            description: `Order successfully placed across ${sellerOrderRefs.length} seller organization(s).`,
            timestamp: new Date()
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully! Sellers have been notified in their Brandspyre workspaces.',
        data: masterOrder,
        order_access_token: orderAccessToken
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ success: false, error: err.message || 'Checkout failed.' });
    }
  }

  /**
   * GET /api/marketplace/orders/my or /api/orders/my
   */
  static async getMyOrders(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const email = req.buyer?.email || (req.query.email as string);
      if (!email && !req.buyer?.id) {
        res.status(400).json({ success: false, error: 'Buyer email or login required.' });
        return;
      }

      const query: any = {
        $or: [
          ...(req.buyer?.id ? [{ buyer_id: new mongoose.Types.ObjectId(req.buyer.id) }] : []),
          ...(req.buyer?.orgId ? [{ buyer_tenant_id: new mongoose.Types.ObjectId(req.buyer.orgId) }] : []),
          ...(email ? [{ buyer_email: email.toLowerCase() }] : [])
        ]
      };

      const orders = await EcommerceOrder.find(query)
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/orders/:orderNumber or /api/orders/:orderNumber
   * Enforces buyer ownership, seller tenant partitioning, or unguessable token validation
   */
  static async getOrderByNumber(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const token = (req.query.token as string) || (req.headers['x-order-token'] as string) || (req.headers['x-access-token'] as string);
      const order: any = await EcommerceOrder.findOne({ order_number: orderNumber }).lean();

      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      // 1. Authenticated Buyer Check
      let isAuthorized = false;
      if (req.buyer) {
        const isBuyerOwner =
          (order.buyer_id && order.buyer_id.toString() === req.buyer.id?.toString()) ||
          (order.buyer_email && order.buyer_email.toLowerCase() === req.buyer.email?.toLowerCase());
        if (isBuyerOwner) isAuthorized = true;
      }

      // 2. Unauthenticated Guest Access Token Check
      if (!isAuthorized && token && order.order_access_token && order.order_access_token === token) {
        isAuthorized = true;
      }

      // 3. Authenticated Tenant Seller Check
      if (!isAuthorized && (req.user?.tenantId || (req as any).tenant?.id)) {
        const tenantId = ((req.user?.tenantId || (req as any).tenant?.id) as any)?.toString();
        const isSellerInOrder =
          order.seller_orders?.some((s: any) => s.tenant_id?.toString() === tenantId) ||
          order.items?.some((i: any) => i.tenant_id?.toString() === tenantId);
        if (isSellerInOrder) isAuthorized = true;
      }

      // 4. Platform Super Admin Check
      if (!isAuthorized && (req.user?.role === 'SUPER_ADMIN' || (req.user as any)?.is_platform_admin)) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to view this order.'
        });
        return;
      }

      res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/orders/:orderNumber/cancel
   * Enforces buyer ownership before allowing cancellation
   */
  static async cancelOrder(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const { reason } = req.body;
      const token = (req.query.token as string) || (req.headers['x-order-token'] as string);

      const order = await EcommerceOrder.findOne({ order_number: orderNumber });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      // Authorization check
      let isAuthorized = false;
      if (req.buyer) {
        const isBuyerOwner =
          (order.buyer_id && order.buyer_id.toString() === req.buyer.id?.toString()) ||
          (order.buyer_email && order.buyer_email.toLowerCase() === req.buyer.email?.toLowerCase());
        if (isBuyerOwner) isAuthorized = true;
      }

      if (!isAuthorized && token && order.order_access_token && order.order_access_token === token) {
        isAuthorized = true;
      }

      if (!isAuthorized && (req.user?.role === 'SUPER_ADMIN' || (req.user as any)?.is_platform_admin)) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to cancel this order.'
        });
        return;
      }

      if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
        res.status(400).json({
          success: false,
          error: `Order cannot be cancelled in current status: ${order.status}`
        });
        return;
      }

      // Rollback stock reservations
      await MarketplaceInventoryService.rollbackReservations(orderNumber);

      // Cancel seller sales orders
      for (const sRef of order.seller_orders) {
        await SalesOrder.updateOne(
          { _id: sRef.sales_order_id },
          { $set: { status: 'CANCELLED' } }
        );
      }

      order.status = 'CANCELLED';
      order.timeline.push({
        status: 'CANCELLED',
        title: 'Order Cancelled',
        description: reason || 'Cancelled by buyer.',
        timestamp: new Date()
      });
      order.updated_at = new Date();
      await order.save();

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully and inventory released.',
        data: order
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplaceCheckoutController;
