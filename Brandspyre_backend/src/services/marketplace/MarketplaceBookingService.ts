import mongoose from 'mongoose';
import { MarketplaceBooking, IMarketplaceBooking } from '../../db/ModelSceham/marketplaceEnquirySchema';
import { MarketplaceListing } from '../../db/ModelSceham/marketplaceSchema';
import { MarketplaceCategory } from '../../db/ModelSceham/marketplaceCategorySchema';
import { Lead } from '../../db/ModelSceham/project/campagin';
import { Branch } from '../../db/ModelSceham/branchSchema';
import { Notification } from '../../db/ModelSceham/Notification/notification';

export interface CreateBookingInput {
  listing_id: string;
  buyer_id?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  start_date: string | Date;
  end_date?: string | Date;
  time_slot?: string;
  participants?: number;
  deposit_amount?: number;
}

export class MarketplaceBookingService {
  private static generateBookingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BKG-${timestamp}-${random}`;
  }

  /**
   * Check if listing has conflicting bookings for given date range or time slot
   */
  static async checkAvailability(
    listingId: string,
    startDate: Date,
    endDate?: Date,
    timeSlot?: string
  ): Promise<{ available: boolean; conflictReason?: string }> {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);

    // Query active bookings that overlap
    const query: any = {
      listing_id: new mongoose.Types.ObjectId(listingId),
      status: { $in: ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID', 'PAID'] },
      $or: [
        {
          start_date: { $lte: end },
          end_date: { $gte: start }
        },
        {
          start_date: { $gte: start, $lte: end }
        }
      ]
    };

    if (timeSlot) {
      query.time_slot = timeSlot;
    }

    const existingBooking = await MarketplaceBooking.findOne(query).lean();
    if (existingBooking) {
      return {
        available: false,
        conflictReason: 'The requested time slot or date range is already reserved.'
      };
    }

    return { available: true };
  }

  /**
   * Create booking, calculate charges, link CRM lead, and notify seller
   */
  static async createBooking(input: CreateBookingInput): Promise<IMarketplaceBooking> {
    if (!input.listing_id || !input.buyer_name || !input.buyer_email || !input.buyer_phone || !input.start_date) {
      throw new Error('Listing ID, buyer details, and start date are required.');
    }

    const listing: any = await MarketplaceListing.findById(input.listing_id).lean();
    if (!listing) {
      throw new Error('Target listing not found.');
    }

    const startDate = new Date(input.start_date);
    const endDate = input.end_date ? new Date(input.end_date) : undefined;

    // Check availability
    const availCheck = await this.checkAvailability(input.listing_id, startDate, endDate, input.time_slot);
    if (!availCheck.available) {
      throw new Error(availCheck.conflictReason || 'Dates are not available for booking.');
    }

    // Determine unit price
    const unitPrice = listing.pricing?.amount !== undefined ? listing.pricing.amount : listing.listing_price;
    const participants = Math.max(1, input.participants || 1);
    
    // Calculate days if end_date exists
    let durationUnits = 1;
    if (endDate && endDate > startDate) {
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      durationUnits = Math.max(1, diffDays);
    }

    const quantity = listing.pricing?.unit === 'PER_PERSON' ? participants : durationUnits;
    const subtotal = unitPrice * quantity;
    const taxRate = listing.tax_rate || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    const depositAmount = input.deposit_amount ? Math.min(total, input.deposit_amount) : 0;

    const bookingNumber = this.generateBookingNumber();

    // Auto-create CRM lead
    let leadDoc: any = null;
    try {
      const branch: any = await Branch.findOne({ tenant_id: listing.tenant_id }).lean();
      const branchcode = branch?.branchcode || 'MAIN';
      const category: any = await MarketplaceCategory.findById(listing.marketplace_category_id).lean();

      leadDoc = await Lead.create({
        tenant_id: listing.tenant_id,
        branchcode,
        lead_name: input.buyer_name.trim(),
        phone: input.buyer_phone.trim(),
        email: input.buyer_email.toLowerCase().trim(),
        comm_type: 'Marketplace Booking',
        proj_type: category?.name || 'Booking',
        status: 'New Lead',
        summary: `Marketplace Booking (#${bookingNumber}) for "${listing.title}". Dates: ${startDate.toDateString()}${endDate ? ' to ' + endDate.toDateString() : ''}. Slot: ${input.time_slot || 'N/A'}. Total: ₹${total}`,
        custom_fields: {
          booking_number: bookingNumber,
          listing_id: listing._id.toString(),
          listing_title: listing.title,
          total_amount: total,
          start_date: startDate,
          end_date: endDate,
          time_slot: input.time_slot,
          source: 'MARKETPLACE'
        }
      });
    } catch (crmErr) {
      console.error('[MarketplaceBookingService] Warning: Failed to create CRM lead:', crmErr);
    }

    // Create booking document
    const booking = await MarketplaceBooking.create({
      booking_number: bookingNumber,
      listing_id: listing._id,
      marketplace_category_id: listing.marketplace_category_id,
      seller_tenant_id: listing.tenant_id,
      buyer_id: input.buyer_id ? new mongoose.Types.ObjectId(input.buyer_id) : undefined,
      buyer_name: input.buyer_name.trim(),
      buyer_email: input.buyer_email.toLowerCase().trim(),
      buyer_phone: input.buyer_phone.trim(),
      start_date: startDate,
      end_date: endDate,
      time_slot: input.time_slot,
      participants,
      unit_price: unitPrice,
      quantity,
      subtotal,
      tax_amount: taxAmount,
      deposit_amount: depositAmount,
      total,
      currency: listing.pricing?.currency || 'INR',
      status: depositAmount > 0 ? 'DEPOSIT_PAID' : 'REQUESTED',
      payment_status: depositAmount > 0 ? (depositAmount >= total ? 'PAID' : 'PARTIAL') : 'PENDING',
      crm_lead_id: leadDoc?._id
    });

    // Notify seller
    try {
      await Notification.create({
        tenant_id: listing.tenant_id,
        from: 'Marketplace Buyer',
        type: 'MARKETPLACE_BOOKING',
        action: 'NEW_BOOKING',
        content: `New booking request (#${bookingNumber}) from ${input.buyer_name} for "${listing.title}" on ${startDate.toDateString()}.`,
        isnotify: true,
        created_on: new Date()
      });
    } catch (nErr) {
      console.warn('[MarketplaceBookingService] Notification write error:', nErr);
    }

    return booking;
  }

  /**
   * Retrieve seller's bookings with filters
   */
  static async getSellerBookings(
    tenantId: string | mongoose.Types.ObjectId,
    options: {
      status?: string;
      listing_id?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {
      seller_tenant_id: new mongoose.Types.ObjectId(tenantId)
    };

    if (options.status && options.status !== 'ALL') {
      filter.status = options.status;
    }

    if (options.listing_id) {
      filter.listing_id = new mongoose.Types.ObjectId(options.listing_id);
    }

    const [bookings, total] = await Promise.all([
      MarketplaceBooking.find(filter)
        .populate('listing_id', 'title slug images pricing')
        .populate('marketplace_category_id', 'name code icon')
        .sort({ start_date: 1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceBooking.countDocuments(filter)
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update booking lifecycle (Confirm, Cancel, Complete)
   */
  static async updateBookingStatus(
    bookingId: string,
    tenantId: string | mongoose.Types.ObjectId,
    update: {
      status?: 'REQUESTED' | 'CONFIRMED' | 'DEPOSIT_PAID' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
      payment_status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
      cancelled_reason?: string;
      refund_amount?: number;
    }
  ) {
    const booking = await MarketplaceBooking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      seller_tenant_id: new mongoose.Types.ObjectId(tenantId)
    });

    if (!booking) {
      throw new Error('Booking not found or access denied.');
    }

    if (update.status) booking.status = update.status;
    if (update.payment_status) booking.payment_status = update.payment_status;
    if (update.cancelled_reason !== undefined) booking.cancelled_reason = update.cancelled_reason;
    if (update.refund_amount !== undefined) booking.refund_amount = update.refund_amount;
    booking.updated_at = new Date();

    await booking.save();

    // Sync CRM lead
    if (booking.crm_lead_id && update.status) {
      try {
        let crmStatus = 'inprogress';
        if (update.status === 'CONFIRMED' || update.status === 'PAID') crmStatus = 'won';
        else if (update.status === 'CANCELLED') crmStatus = 'lost';
        await Lead.findByIdAndUpdate(booking.crm_lead_id, {
          status: crmStatus,
          updated_on: new Date()
        });
      } catch (e) {
        console.warn('[MarketplaceBookingService] CRM sync failed:', e);
      }
    }

    return booking;
  }
}
