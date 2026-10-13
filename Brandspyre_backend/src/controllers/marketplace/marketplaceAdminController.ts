import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  MarketplaceListing,
  MarketplaceSellerProfile,
  EcommerceOrder
} from '../../db/ModelSceham/marketplaceSchema';
import { Tenant } from '../../db/ModelSceham/saasSchema';

export class MarketplaceAdminController {
  /**
   * GET /api/marketplace/admin/listings
   * Platform admin overview of all listings across all seller organizations
   */
  static async getAllListings(req: any, res: Response): Promise<void> {
    try {
      const { status, search, page = 1, limit = 25 } = req.query;
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
      const skip = (pageNum - 1) * limitNum;

      const queryFilter: any = {};
      if (status && status !== 'ALL') {
        queryFilter.status = status;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        queryFilter.$or = [{ title: regex }, { slug: regex }];
      }

      const [listings, total] = await Promise.all([
        MarketplaceListing.find(queryFilter)
          .populate('tenant_id', 'company_name name billing_email')
          .populate('category_id', 'name code')
          .populate('brand_id', 'name')
          .populate('product_id', 'sku name selling_price')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        MarketplaceListing.countDocuments(queryFilter)
      ]);

      res.status(200).json({
        success: true,
        data: listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: any) {
      console.error('Admin get listings error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/admin/listings/:id/moderate
   * Approve, reject, or suspend a marketplace listing
   */
  static async moderateListing(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, rejection_reason } = req.body; // 'APPROVE' | 'REJECT' | 'SUSPEND'

      const listing = await MarketplaceListing.findById(id);
      if (!listing) {
        res.status(404).json({ success: false, error: 'Listing not found.' });
        return;
      }

      if (action === 'APPROVE') {
        listing.status = 'PUBLISHED';
        listing.is_published = true;
        listing.rejection_reason = '';
      } else if (action === 'REJECT') {
        listing.status = 'REJECTED';
        listing.is_published = false;
        listing.rejection_reason = rejection_reason || 'Listing rejected by platform administration.';
      } else if (action === 'SUSPEND') {
        listing.status = 'SUSPENDED';
        listing.is_published = false;
        listing.rejection_reason = rejection_reason || 'Listing suspended.';
      } else {
        res.status(400).json({ success: false, error: 'Invalid moderation action.' });
        return;
      }

      listing.updated_at = new Date();
      await listing.save();

      res.status(200).json({
        success: true,
        message: `Listing status updated to ${listing.status}.`,
        data: listing
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/admin/orders
   * Platform admin overview of all marketplace ecommerce orders
   */
  static async getAllOrders(req: any, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 25 } = req.query;
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      if (status && status !== 'ALL') {
        filter.status = status;
      }

      const [orders, total] = await Promise.all([
        EcommerceOrder.find(filter)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        EcommerceOrder.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/admin/sellers
   * Platform admin overview of all registered seller organizations
   */
  static async getAllSellers(req: any, res: Response): Promise<void> {
    try {
      const profiles = await MarketplaceSellerProfile.find()
        .populate('tenant_id', 'company_name name billing_email industry status')
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: profiles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/admin/stats
   * Overall platform marketplace dashboard statistics
   */
  static async getStats(req: any, res: Response): Promise<void> {
    try {
      const [
        totalOrders,
        totalListings,
        activeSellers,
        revenueData
      ] = await Promise.all([
        EcommerceOrder.countDocuments(),
        MarketplaceListing.countDocuments({ is_published: true, status: 'PUBLISHED' }),
        MarketplaceSellerProfile.countDocuments({ is_active: true }),
        EcommerceOrder.aggregate([
          { $match: { status: { $ne: 'CANCELLED' } } },
          { $group: { _id: null, totalGMV: { $sum: '$grand_total' } } }
        ])
      ]);

      const gmv = revenueData[0]?.totalGMV || 0;

      res.status(200).json({
        success: true,
        data: {
          totalOrders,
          totalListings,
          activeSellers,
          grossMerchandiseVolume: gmv
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplaceAdminController;
