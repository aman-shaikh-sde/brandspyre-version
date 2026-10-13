import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MarketplaceAuthRequest } from './marketplaceAuthController';
import { QuotationEnquiry, MarketplaceListing } from '../../db/ModelSceham/marketplaceSchema';
import { Product } from '../../db/ModelSceham/commerceSchema';
import { SalesQuotation } from '../../db/ModelSchema/commerce/SalesQuotation';
import { MarketplaceOrderBridgeService } from '../../services/marketplace/MarketplaceOrderBridgeService';

export class MarketplaceQuotationController {
  /**
   * POST /api/marketplace/quotations/request or /api/quotations/request
   * Submit an online purchase quotation enquiry / RFQ directly to the seller's workspace
   */
  static async requestQuotation(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const {
        product_id,
        requested_quantity,
        target_unit_price,
        notes,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_company,
        delivery_location,
        needed_by_date
      } = req.body;

      if (!product_id || !requested_quantity) {
        res.status(400).json({ success: false, error: 'Product and requested quantity are required.' });
        return;
      }

      const customerName = buyer_name || req.buyer?.name;
      const customerEmail = buyer_email || req.buyer?.email;
      const customerPhone = buyer_phone;

      if (!customerName || !customerEmail || !customerPhone) {
        res.status(400).json({
          success: false,
          error: 'Buyer name, email address, and phone number are required to request a quotation.'
        });
        return;
      }

      // Check MarketplaceListing or Product
      let product: any = null;
      let sellerTenantId: any = null;
      let actualProductId: any = null;
      let productName = '';
      let productSku = '';
      let productImage = '';
      let catalogPrice = 0;
      let taxRate = 0;

      const listing: any = await MarketplaceListing.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(product_id) },
          { product_id: new mongoose.Types.ObjectId(product_id) }
        ]
      }).populate('product_id').lean();

      if (listing) {
        product = listing.product_id;
        actualProductId = product?._id || listing.product_id;
        sellerTenantId = listing.tenant_id;
        productName = listing.title;
        productSku = product?.sku || 'SKU-MKT';
        productImage = listing.images?.[0] || product?.image_url || '';
        catalogPrice = listing.listing_price;
        taxRate = listing.tax_rate || 0;
      } else {
        product = await Product.findById(product_id).lean();
        if (!product) {
          res.status(404).json({ success: false, error: 'Product not found.' });
          return;
        }
        actualProductId = product._id;
        sellerTenantId = product.tenant_id;
        productName = product.name;
        productSku = product.sku;
        productImage = product.image_url || '';
        catalogPrice = product.selling_price;
        taxRate = product.tax_rate || 0;
      }

      const qty = Math.max(1, Number(requested_quantity));
      const targetPrice = target_unit_price ? Number(target_unit_price) : catalogPrice;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const rfqNumber = `RFQ-${Date.now().toString().slice(-4)}${randomSuffix}`;

      // Route RFQ to seller's CRM SalesQuotation
      const buyerProfile = {
        name: customerName.trim(),
        email: customerEmail.trim().toLowerCase(),
        phone: customerPhone.trim(),
        company: buyer_company?.trim() || req.buyer?.companyName,
        shippingAddress: {
          line1: delivery_location || 'Not provided',
          city: '',
          state: '',
          postal_code: '',
          country: 'India'
        }
      };

      const routed = await MarketplaceOrderBridgeService.routeQuotationToSeller(
        rfqNumber,
        sellerTenantId,
        buyerProfile,
        {
          _id: actualProductId,
          name: productName,
          sku: productSku,
          tax_rate: taxRate
        },
        qty,
        targetPrice,
        notes,
        needed_by_date ? new Date(needed_by_date) : undefined
      );

      // Create QuotationEnquiry record for tracking
      const quotationEnquiry = await QuotationEnquiry.create({
        enquiry_number: rfqNumber,
        tenant_id: sellerTenantId,
        product_id: actualProductId,
        product_name: productName,
        product_sku: productSku,
        product_image: productImage,
        catalog_price: catalogPrice,
        requested_quantity: qty,
        target_unit_price: targetPrice,
        buyer_id: req.buyer?.id ? new mongoose.Types.ObjectId(req.buyer.id) : undefined,
        buyer_tenant_id: req.buyer?.orgId ? new mongoose.Types.ObjectId(req.buyer.orgId) : undefined,
        buyer_name: customerName.trim(),
        buyer_email: customerEmail.trim().toLowerCase(),
        buyer_phone: customerPhone.trim(),
        buyer_company: buyer_company?.trim() || req.buyer?.companyName || '',
        delivery_location: delivery_location || '',
        needed_by_date: needed_by_date ? new Date(needed_by_date) : undefined,
        notes: notes || '',
        status: 'SUBMITTED',
        sales_quotation_id: routed.salesQuotationId,
        sales_quotation_number: routed.quotationNumber
      });

      res.status(201).json({
        success: true,
        message: 'Your purchase quotation enquiry has been sent to the seller successfully!',
        data: quotationEnquiry
      });
    } catch (err: any) {
      console.error('Error submitting quotation enquiry:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to submit quotation enquiry.' });
    }
  }

  /**
   * GET /api/marketplace/quotations/my or /api/quotations/my
   */
  static async getMyQuotations(req: MarketplaceAuthRequest, res: Response): Promise<void> {
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

      const enquiries = await QuotationEnquiry.find(query)
        .sort({ created_at: -1 })
        .lean();

      // Check underlying CRM SalesQuotation updates
      const synced = await Promise.all(
        enquiries.map(async enquiry => {
          if (enquiry.sales_quotation_id) {
            try {
              const crmQuote: any = await SalesQuotation.findById(enquiry.sales_quotation_id).lean();
              if (crmQuote) {
                let mappedStatus = enquiry.status;
                if (crmQuote.status === 'APPROVED') mappedStatus = 'QUOTED';
                else if (crmQuote.status === 'CONVERTED') mappedStatus = 'CONVERTED';
                else if (crmQuote.status === 'REJECTED') mappedStatus = 'REJECTED';

                return {
                  ...enquiry,
                  status: mappedStatus,
                  seller_quote: {
                    quoted_unit_price: crmQuote.items?.[0]?.unit_price,
                    quoted_total: crmQuote.grand_total,
                    valid_until: crmQuote.valid_until,
                    seller_notes: crmQuote.notes
                  }
                };
              }
            } catch (e) {}
          }
          return enquiry;
        })
      );

      res.status(200).json({ success: true, data: synced });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/quotations/:id or /api/quotations/:id
   */
  static async getQuotationById(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiry = await QuotationEnquiry.findById(id).lean();
      if (!enquiry) {
        res.status(404).json({ success: false, error: 'Quotation enquiry not found.' });
        return;
      }

      res.status(200).json({ success: true, data: enquiry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplaceQuotationController;
