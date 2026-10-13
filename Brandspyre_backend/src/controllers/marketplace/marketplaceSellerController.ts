import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  MarketplaceListing,
  MarketplaceSellerProfile,
  EcommerceOrder,
  QuotationEnquiry
} from '../../db/ModelSceham/marketplaceSchema';
import {
  MarketplaceCategory,
  CategoryFormSchema,
  ListingCategoryData
} from '../../db/ModelSceham/marketplaceCategorySchema';
import { Product } from '../../db/ModelSceham/commerceSchema';
import { SalesOrder } from '../../db/ModelSchema/commerce/SalesOrder';
import { SalesQuotation } from '../../db/ModelSchema/commerce/SalesQuotation';
import { MarketplaceInventoryService } from '../../services/marketplace/MarketplaceInventoryService';
import { CategoryValidationService } from '../../services/marketplace/CategoryValidationService';

export class MarketplaceSellerController {
  /**
   * GET /api/marketplace/seller/profile
   * Fetch seller storefront profile for the active organization
   */
  static async getProfile(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      let profile = await MarketplaceSellerProfile.findOne({ tenant_id: tenantId }).lean();
      if (!profile) {
        // Auto-provision initial profile from Tenant record
        const { Tenant } = require('../../db/ModelSceham/saasSchema');
        const tenant = await Tenant.findById(tenantId).lean();
        const storeName = tenant?.company_name || tenant?.name || 'Seller Store';
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        profile = await MarketplaceSellerProfile.create({
          tenant_id: new mongoose.Types.ObjectId(tenantId),
          store_name: storeName,
          slug: `${slug}-${tenantId.toString().slice(-4)}`,
          contact_email: tenant?.billing_email || req.user?.email || 'contact@brandspyre.in',
          contact_phone: tenant?.phone || '9999999999',
          is_verified: true,
          is_active: true
        });
      }

      res.status(200).json({ success: true, data: profile });
    } catch (err: any) {
      console.error('Error fetching seller profile:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/marketplace/seller/profile
   * Update seller storefront profile
   */
  static async updateProfile(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const {
        store_name,
        description,
        logo_url,
        banner_url,
        contact_email,
        contact_phone,
        shipping_policy,
        return_policy
      } = req.body;

      const profile = await MarketplaceSellerProfile.findOne({ tenant_id: tenantId });
      if (!profile) {
        res.status(404).json({ success: false, error: 'Seller profile not found.' });
        return;
      }

      if (store_name) profile.store_name = store_name.trim();
      if (description !== undefined) profile.description = description.trim();
      if (logo_url !== undefined) profile.logo_url = logo_url;
      if (banner_url !== undefined) profile.banner_url = banner_url;
      if (contact_email) profile.contact_email = contact_email.toLowerCase().trim();
      if (contact_phone) profile.contact_phone = contact_phone.trim();
      if (shipping_policy !== undefined) profile.shipping_policy = shipping_policy;
      if (return_policy !== undefined) profile.return_policy = return_policy;
      profile.updated_at = new Date();

      await profile.save();

      res.status(200).json({
        success: true,
        message: 'Storefront profile updated successfully.',
        data: profile
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/seller/listings
   * Get all listings owned by the active organization
   */
  static async getMyListings(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const listings = await MarketplaceListing.find({ tenant_id: tenantId })
        .populate('product_id', 'sku name selling_price purchase_price image_url')
        .populate('marketplace_category_id', 'name code icon transaction_flow')
        .populate('category_data')
        .populate('category_id', 'name code')
        .populate('brand_id', 'name')
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: listings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/seller/listings
   * Create a new marketplace listing — supports both ERP Products and Universal Multi-Vertical Listings
   */
  static async createListing(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const {
        product_id,
        marketplace_category_id,
        category_code,
        listing_type,
        title,
        description,
        listing_price,
        compare_price,
        pricing,
        location,
        availability,
        category_data,
        images,
        tags,
        attributes,
        min_order_quantity
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Listing title is required.' });
        return;
      }

      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

      // ==========================================================
      // FLOW 1: ERP Physical Product Listing (Backward Compatible)
      // ==========================================================
      if (product_id) {
        const product = await Product.findOne({
          _id: new mongoose.Types.ObjectId(product_id),
          tenant_id: new mongoose.Types.ObjectId(tenantId)
        });

        if (!product) {
          res.status(404).json({ success: false, error: 'Product not found in your organization catalog.' });
          return;
        }

        const existingListing = await MarketplaceListing.findOne({
          tenant_id: new mongoose.Types.ObjectId(tenantId),
          product_id: product._id
        });

        if (existingListing) {
          res.status(400).json({ success: false, error: 'A listing already exists for this product.' });
          return;
        }

        // Default or find category for retail products
        let catId = marketplace_category_id;
        if (!catId) {
          const retailCat: any = await MarketplaceCategory.findOne({ code: 'RETAIL_COMMERCE' }).lean();
          if (retailCat) catId = retailCat._id;
        }

        const numPrice = listing_price !== undefined ? Number(listing_price) : product.selling_price || 0;
        const numCompare = compare_price !== undefined ? Number(compare_price) : undefined;

        const listing = await MarketplaceListing.create({
          tenant_id: new mongoose.Types.ObjectId(tenantId),
          product_id: product._id,
          marketplace_category_id: catId ? new mongoose.Types.ObjectId(catId) : undefined,
          listing_type: listing_type || 'PRODUCT_SALE',
          title: title.trim(),
          slug,
          description: description || product.description || '',
          category_id: product.category_id,
          brand_id: product.brand_id,
          unit_id: product.unit_id,
          listing_price: numPrice,
          compare_price: numCompare,
          pricing: {
            mode: 'FIXED',
            amount: numPrice,
            currency: 'INR',
            unit: 'PER_UNIT',
            compare_amount: numCompare,
            negotiation_allowed: false
          },
          tax_rate: product.tax_rate || 0,
          images: Array.isArray(images) && images.length > 0 ? images : (product.image_url ? [product.image_url] : []),
          status: 'PENDING_APPROVAL',
          is_published: false,
          tags: Array.isArray(tags) ? tags : [],
          attributes: attributes || {},
          min_order_quantity: Number(min_order_quantity) || 1
        });

        res.status(201).json({
          success: true,
          message: 'Product listing submitted for platform moderation.',
          data: listing
        });
        return;
      }

      // ==========================================================
      // FLOW 2: Universal Multi-Vertical Listing (Real Estate, Auto, Services, etc.)
      // ==========================================================
      let targetCategory: any = null;
      if (marketplace_category_id) {
        targetCategory = await MarketplaceCategory.findById(marketplace_category_id).lean();
      } else if (category_code) {
        targetCategory = await MarketplaceCategory.findOne({ code: category_code.toUpperCase() }).lean();
      }

      if (!targetCategory) {
        res.status(400).json({
          success: false,
          error: 'Please select a valid marketplace industry category for your listing.'
        });
        return;
      }

      if (targetCategory.requires_product_link) {
        res.status(400).json({
          success: false,
          error: `Category "${targetCategory.name}" requires selecting a product from your inventory catalog.`
        });
        return;
      }

      // Resolve Pricing Structure
      const priceAmount = pricing?.amount !== undefined ? Number(pricing.amount) : (listing_price !== undefined ? Number(listing_price) : 0);
      const pricingObj = {
        mode: pricing?.mode || targetCategory.default_pricing_mode || 'FIXED',
        amount: priceAmount,
        currency: pricing?.currency || 'INR',
        unit: pricing?.unit || targetCategory.default_pricing_unit || 'PER_UNIT',
        compare_amount: pricing?.compare_amount !== undefined ? Number(pricing.compare_amount) : (compare_price !== undefined ? Number(compare_price) : undefined),
        min_amount: pricing?.min_amount !== undefined ? Number(pricing.min_amount) : undefined,
        max_amount: pricing?.max_amount !== undefined ? Number(pricing.max_amount) : undefined,
        negotiation_allowed: Boolean(pricing?.negotiation_allowed)
      };

      // Validate Category-Specific Form Data against Schema
      let savedCategoryDataId: mongoose.Types.ObjectId | undefined = undefined;
      const targetListingType = listing_type || targetCategory.default_listing_type || '*';

      const schema: any = await CategoryFormSchema.findOne({
        category_id: targetCategory._id,
        $or: [{ listing_type: targetListingType }, { listing_type: '*' }],
        is_active: true
      }).lean();

      if (schema && category_data) {
        const valResult = CategoryValidationService.validate(schema as any, category_data);
        if (!valResult.isValid) {
          res.status(400).json({
            success: false,
            error: 'Form validation failed for category fields.',
            validationErrors: valResult.errors
          });
          return;
        }

        // Store validated data
        const catDataDoc = await ListingCategoryData.create({
          listing_id: new mongoose.Types.ObjectId(), // placeholder, updated below
          category_id: targetCategory._id,
          schema_version: schema.version || 1,
          data: valResult.sanitizedData,
          validated_at: new Date()
        });
        savedCategoryDataId = catDataDoc._id as mongoose.Types.ObjectId;
      }

      const listing = await MarketplaceListing.create({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        marketplace_category_id: targetCategory._id,
        listing_type: targetListingType,
        title: title.trim(),
        slug,
        description: description || '',
        listing_price: priceAmount,
        compare_price: pricingObj.compare_amount,
        pricing: pricingObj,
        location: location || {},
        availability: availability || { type: 'ALWAYS' },
        category_data: savedCategoryDataId,
        tax_rate: 0,
        images: Array.isArray(images) ? images : [],
        status: 'PENDING_APPROVAL',
        is_published: false,
        tags: Array.isArray(tags) ? tags : [],
        attributes: attributes || {},
        min_order_quantity: Number(min_order_quantity) || 1
      });

      // Update listing_id in category data record if created
      if (savedCategoryDataId) {
        await ListingCategoryData.findByIdAndUpdate(savedCategoryDataId, { listing_id: listing._id });
      }

      res.status(201).json({
        success: true,
        message: 'Listing submitted for platform moderation. It will be published once approved.',
        data: listing
      });
    } catch (err: any) {
      console.error('Error creating listing:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/marketplace/seller/listings/:id
   * Update listing details, pricing, location, and vertical data
   */
  static async updateListing(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const { id } = req.params;

      const listing = await MarketplaceListing.findOne({
        _id: new mongoose.Types.ObjectId(id),
        tenant_id: new mongoose.Types.ObjectId(tenantId)
      });

      if (!listing) {
        res.status(404).json({ success: false, error: 'Listing not found or access denied.' });
        return;
      }

      const {
        title,
        description,
        listing_price,
        compare_price,
        pricing,
        location,
        availability,
        category_data,
        images,
        tags,
        attributes,
        is_published,
        min_order_quantity
      } = req.body;

      if (title) listing.title = title.trim();
      if (description !== undefined) listing.description = description.trim();
      if (Array.isArray(images)) listing.images = images;
      if (Array.isArray(tags)) listing.tags = tags;
      if (attributes) listing.attributes = attributes;
      if (location) listing.location = location;
      if (availability) listing.availability = availability;

      // Handle pricing update
      if (pricing) {
        listing.pricing = {
          mode: pricing.mode || listing.pricing?.mode || 'FIXED',
          amount: pricing.amount !== undefined ? Number(pricing.amount) : listing.listing_price,
          currency: pricing.currency || listing.pricing?.currency || 'INR',
          unit: pricing.unit || listing.pricing?.unit || 'PER_UNIT',
          compare_amount: pricing.compare_amount !== undefined ? Number(pricing.compare_amount) : listing.compare_price,
          min_amount: pricing.min_amount !== undefined ? Number(pricing.min_amount) : undefined,
          max_amount: pricing.max_amount !== undefined ? Number(pricing.max_amount) : undefined,
          negotiation_allowed: Boolean(pricing.negotiation_allowed)
        };
        listing.listing_price = listing.pricing.amount || 0;
        listing.compare_price = listing.pricing.compare_amount;
      } else if (listing_price !== undefined) {
        listing.listing_price = Number(listing_price);
        if (compare_price !== undefined) listing.compare_price = Number(compare_price);
        if (listing.pricing) {
          listing.pricing.amount = listing.listing_price;
          listing.pricing.compare_amount = listing.compare_price;
        }
      }

      // Handle category data update
      if (category_data && listing.marketplace_category_id) {
        const schema: any = await CategoryFormSchema.findOne({
          category_id: listing.marketplace_category_id,
          $or: [{ listing_type: listing.listing_type }, { listing_type: '*' }],
          is_active: true
        }).lean();

        if (schema) {
          const valResult = CategoryValidationService.validate(schema as any, category_data);
          if (valResult.isValid) {
            await ListingCategoryData.findOneAndUpdate(
              { listing_id: listing._id, category_id: listing.marketplace_category_id },
              {
                listing_id: listing._id,
                category_id: listing.marketplace_category_id,
                schema_version: schema.version || 1,
                data: valResult.sanitizedData,
                validated_at: new Date()
              },
              { upsert: true, new: true }
            );
          }
        }
      }

      if (is_published !== undefined) {
        const wantsPublished = Boolean(is_published);
        if (wantsPublished && listing.status !== 'PUBLISHED') {
          res.status(400).json({
            success: false,
            error: 'Listing must be approved by platform moderation before it can be published.'
          });
          return;
        }
        listing.is_published = wantsPublished;
      }
      if (min_order_quantity !== undefined) listing.min_order_quantity = Number(min_order_quantity);
      listing.updated_at = new Date();

      await listing.save();

      res.status(200).json({
        success: true,
        message: 'Listing updated successfully.',
        data: listing
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/marketplace/seller/listings/:id
   */
  static async deleteListing(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const { id } = req.params;

      const result = await MarketplaceListing.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
        tenant_id: new mongoose.Types.ObjectId(tenantId)
      });

      if (result.deletedCount === 0) {
        res.status(404).json({ success: false, error: 'Listing not found or access denied.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Listing removed from marketplace.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/seller/orders
   * View all ecommerce orders containing items from this seller organization
   */
  static async getSellerOrders(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

      const orders = await EcommerceOrder.find({
        'seller_orders.tenant_id': tenantObjectId
      })
        .sort({ created_at: -1 })
        .lean();

      // Filter items to show only this seller's products for privacy
      const sellerFilteredOrders = orders.map((order: any) => {
        const myItems = (order.items || []).filter(
          (it: any) => it.tenant_id && it.tenant_id.toString() === tenantObjectId.toString()
        );
        const mySellerRef = (order.seller_orders || []).find(
          (s: any) => s.tenant_id && s.tenant_id.toString() === tenantObjectId.toString()
        );

        return {
          ...order,
          items: myItems,
          seller_order_summary: mySellerRef
        };
      });

      res.status(200).json({ success: true, data: sellerFilteredOrders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/seller/orders/:orderNumber/fulfill
   * Update fulfillment status for this seller's items
   */
  static async fulfillOrder(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const { orderNumber } = req.params;
      const { status } = req.body; // 'SHIPPED' | 'DELIVERED'

      const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
      const order = await EcommerceOrder.findOne({
        order_number: orderNumber,
        'seller_orders.tenant_id': tenantObjectId
      });

      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found for this seller organization.' });
        return;
      }

      // Update seller ref status
      const sellerRef = (order.seller_orders || []).find(
        (s: any) => s.tenant_id && s.tenant_id.toString() === tenantObjectId.toString()
      );

      if (sellerRef) {
        sellerRef.status = status;
        // Also update linked ERP SalesOrder
        await SalesOrder.updateOne(
          { _id: sellerRef.sales_order_id },
          { $set: { status: status === 'DELIVERED' ? 'FULLY_DELIVERED' : 'CONFIRMED' } }
        );
      }

      if (status === 'DELIVERED') {
        // Fulfill stock reservation permanently
        await MarketplaceInventoryService.fulfillStockReservation(orderNumber);
      }

      order.timeline.push({
        status,
        title: `Seller marked order ${status}`,
        description: `Items processed by seller.`,
        timestamp: new Date()
      });

      await order.save();

      res.status(200).json({
        success: true,
        message: `Order marked as ${status}.`,
        data: order
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/seller/quotations
   * Fetch RFQs received by this seller organization
   */
  static async getSellerQuotations(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const enquiries = await QuotationEnquiry.find({
        tenant_id: new mongoose.Types.ObjectId(tenantId)
      })
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: enquiries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/seller/quotations/:id/respond
   * Respond to an RFQ with quote price and notes
   */
  static async respondToQuotation(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const { id } = req.params;
      const { quoted_unit_price, seller_notes, valid_days = 14 } = req.body;

      if (!quoted_unit_price) {
        res.status(400).json({ success: false, error: 'Quoted unit price is required.' });
        return;
      }

      const enquiry = await QuotationEnquiry.findOne({
        _id: new mongoose.Types.ObjectId(id),
        tenant_id: new mongoose.Types.ObjectId(tenantId)
      });

      if (!enquiry) {
        res.status(404).json({ success: false, error: 'Quotation enquiry not found.' });
        return;
      }

      const unitPrice = Number(quoted_unit_price);
      const total = unitPrice * enquiry.requested_quantity;
      const validUntil = new Date(Date.now() + valid_days * 24 * 60 * 60 * 1000);

      enquiry.seller_quote = {
        quoted_unit_price: unitPrice,
        quoted_total: total,
        valid_until: validUntil,
        seller_notes: seller_notes || '',
        quoted_at: new Date()
      };
      enquiry.status = 'QUOTED';
      enquiry.updated_at = new Date();

      await enquiry.save();

      // Also update linked ERP SalesQuotation
      if (enquiry.sales_quotation_id) {
        await SalesQuotation.updateOne(
          { _id: enquiry.sales_quotation_id },
          {
            $set: {
              status: 'APPROVED',
              'items.0.unit_price': unitPrice,
              'items.0.subtotal': total,
              'items.0.total': total,
              subtotal: total,
              grand_total: total,
              valid_until: validUntil,
              notes: seller_notes || ''
            }
          }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Quotation response sent to buyer successfully.',
        data: enquiry
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplaceSellerController;
