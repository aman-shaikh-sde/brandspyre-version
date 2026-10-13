import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MarketplaceEnquiryService } from '../../services/marketplace/MarketplaceEnquiryService';
import { MarketplaceEnquiry } from '../../db/ModelSceham/marketplaceEnquirySchema';

export class MarketplaceEnquiryController {
  /**
   * POST /api/marketplace/enquiries
   * Public/Buyer: Submit an enquiry for a listing (auto-links CRM lead in seller's organization)
   */
  static async submitEnquiry(req: any, res: Response): Promise<void> {
    try {
      const buyerId = req.buyer?._id || req.user?._id;
      const {
        listing_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_company,
        buyer_message,
        type,
        requirements,
        consent
      } = req.body;

      if (!listing_id || !buyer_name || !buyer_email || !buyer_phone || !buyer_message) {
        res.status(400).json({
          success: false,
          error: 'Listing ID, full name, email, phone number, and message are required.'
        });
        return;
      }

      const result = await MarketplaceEnquiryService.createEnquiryWithCRMLead({
        listing_id,
        buyer_id: buyerId ? String(buyerId) : undefined,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_company,
        buyer_message,
        type,
        requirements,
        consent
      });

      res.status(201).json({
        success: true,
        message: 'Your enquiry has been submitted successfully to the seller.',
        data: {
          enquiry_number: result.enquiry.enquiry_number,
          status: result.enquiry.status,
          created_at: result.enquiry.created_at
        }
      });
    } catch (err: any) {
      console.error('[MarketplaceEnquiryController] submitEnquiry error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/enquiries/my
   * Buyer: Get list of buyer's enquiries
   */
  static async getMyEnquiries(req: any, res: Response): Promise<void> {
    try {
      const buyerId = req.buyer?._id;
      const buyerEmail = req.buyer?.email;

      if (!buyerId && !buyerEmail) {
        res.status(401).json({ success: false, error: 'Buyer authentication required.' });
        return;
      }

      const query: any = {};
      if (buyerId) {
        query.buyer_id = new mongoose.Types.ObjectId(buyerId);
      } else if (buyerEmail) {
        query.buyer_email = buyerEmail.toLowerCase();
      }

      const enquiries = await MarketplaceEnquiry.find(query)
        .populate('listing_id', 'title slug images listing_price pricing')
        .populate('marketplace_category_id', 'name code icon')
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: enquiries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/seller/enquiries
   * Seller: Get enquiries received by seller organization
   */
  static async getSellerEnquiries(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const { status, type, search, listing_id, page, limit } = req.query;

      const result = await MarketplaceEnquiryService.getSellerEnquiries(tenantId, {
        status: status as string,
        type: type as string,
        search: search as string,
        listing_id: listing_id as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/marketplace/seller/enquiries/:id
   * Seller: Update enquiry status, add follow up notes, or assign lead
   */
  static async updateEnquiryStatus(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const { id } = req.params;
      const { status, notes, follow_up_date, assigned_to } = req.body;

      const updated = await MarketplaceEnquiryService.updateEnquiryStatus(id, tenantId, {
        status,
        notes,
        follow_up_date,
        assigned_to
      });

      res.status(200).json({
        success: true,
        message: 'Enquiry status updated successfully.',
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
