import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MarketplaceBookingService } from '../../services/marketplace/MarketplaceBookingService';
import { MarketplaceBooking } from '../../db/ModelSceham/marketplaceEnquirySchema';

export class MarketplaceBookingController {
  /**
   * GET /api/marketplace/listings/:id/availability
   * Public: Check if date/time slot is available for booking
   */
  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { start_date, end_date, time_slot } = req.query;

      if (!start_date) {
        res.status(400).json({ success: false, error: 'start_date query parameter is required.' });
        return;
      }

      const result = await MarketplaceBookingService.checkAvailability(
        id,
        new Date(start_date as string),
        end_date ? new Date(end_date as string) : undefined,
        time_slot as string
      );

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/bookings
   * Public/Buyer: Create a booking
   */
  static async createBooking(req: any, res: Response): Promise<void> {
    try {
      const buyerId = req.buyer?._id || req.user?._id;
      const {
        listing_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        start_date,
        end_date,
        time_slot,
        participants,
        deposit_amount
      } = req.body;

      const booking = await MarketplaceBookingService.createBooking({
        listing_id,
        buyer_id: buyerId ? String(buyerId) : undefined,
        buyer_name,
        buyer_email,
        buyer_phone,
        start_date,
        end_date,
        time_slot,
        participants,
        deposit_amount
      });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully.',
        data: booking
      });
    } catch (err: any) {
      console.error('[MarketplaceBookingController] createBooking error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/bookings/my
   * Buyer: Get list of buyer's bookings
   */
  static async getMyBookings(req: any, res: Response): Promise<void> {
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

      const bookings = await MarketplaceBooking.find(query)
        .populate('listing_id', 'title slug images pricing location')
        .populate('marketplace_category_id', 'name code icon')
        .sort({ start_date: 1, created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: bookings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/seller/bookings
   * Seller: Get bookings received by seller organization
   */
  static async getSellerBookings(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const { status, listing_id, page, limit } = req.query;

      const result = await MarketplaceBookingService.getSellerBookings(tenantId, {
        status: status as string,
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
   * PUT /api/marketplace/seller/bookings/:id
   * Seller: Update booking status (Confirm, Complete, Cancel)
   */
  static async updateBookingStatus(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: 'Tenant context required.' });
        return;
      }

      const { id } = req.params;
      const { status, payment_status, cancelled_reason, refund_amount } = req.body;

      const booking = await MarketplaceBookingService.updateBookingStatus(id, tenantId, {
        status,
        payment_status,
        cancelled_reason,
        refund_amount
      });

      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully.',
        data: booking
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
