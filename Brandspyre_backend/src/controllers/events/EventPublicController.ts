import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  Event,
  EventTicketType,
  EventAddon,
  EventSession,
  EventOrder,
  EventTicket
} from "../../db/ModelSceham/eventSchema";
import EventCheckoutService from "../../services/events/EventCheckoutService";
import EventTicketService from "../../services/events/EventTicketService";
import { RazorpayService } from "../../services/razorpayService";

export class EventPublicController {
  /**
   * GET /api/public/events - List published public events with search & filters
   */
  static async listEvents(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
      const search = (req.query.search as string || '').trim();
      const category = (req.query.category as string || '').trim();
      const city = (req.query.city as string || '').trim();
      const event_type = (req.query.event_type as string || '').trim();
      const dateFilter = (req.query.date_filter as string || '').trim();

      const filter: any = {
        status: 'PUBLISHED',
        is_public: true
      };

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { organizer_name: { $regex: search, $options: 'i' } }
        ];
      }

      if (category && category !== 'ALL') {
        filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      if (city) {
        filter["venue_details.city"] = { $regex: new RegExp(city, 'i') };
      }

      if (event_type && event_type !== 'ALL') {
        filter.event_type = event_type.toUpperCase();
      }

      const now = new Date();
      if (dateFilter === 'TODAY') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        filter.start_date = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFilter === 'THIS_WEEK') {
        const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        filter.start_date = { $gte: now, $lte: endOfWeek };
      } else if (dateFilter === 'UPCOMING') {
        filter.end_date = { $gte: now };
      }

      const total = await Event.countDocuments(filter);
      const events = await Event.find(filter)
        .select('title slug short_summary category event_type cover_image venue_details online_details start_date end_date timezone organizer_name is_featured stats')
        .sort({ is_featured: -1, start_date: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Fetch starting price for each event
      const eventIds = events.map(e => e._id);
      const ticketTypes = await EventTicketType.find({
        event_id: { $in: eventIds },
        status: 'ACTIVE',
        is_active: true
      }).select('event_id price currency');

      const priceMap: Record<string, number> = {};
      for (const t of ticketTypes) {
        const id = t.event_id.toString();
        if (priceMap[id] === undefined || t.price < priceMap[id]) {
          priceMap[id] = t.price;
        }
      }

      const formattedEvents = (events as any[]).map((e: any) => ({
        ...e,
        starting_price: priceMap[(e._id as any)?.toString()] ?? 0
      }));

      res.status(200).json({
        success: true,
        data: formattedEvents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      console.error('[EventPublicController.listEvents] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch events.' });
    }
  }

  /**
   * GET /api/public/events/:slugOrId - Public event details with tickets & add-ons
   */
  static async getEventDetails(req: Request, res: Response): Promise<void> {
    try {
      const { slugOrId } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);

      const query: any = {
        $or: [
          { slug: slugOrId.toLowerCase() },
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(slugOrId) }] : [])
        ],
        status: 'PUBLISHED',
        is_public: true
      };

      const event = await Event.findOne(query)
        .select('-commission_override_rule_id')
        .lean();

      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found or not currently available.' });
        return;
      }

      // Fetch Active Ticket Types
      const eventDoc = event as any;
      const ticketTypes = await EventTicketType.find({
        event_id: eventDoc._id,
        is_active: true
      }).sort({ sort_order: 1, price: 1 }).lean();

      // Mask internal reservations for public view: calculate available inventory
      const formattedTickets = ticketTypes.map(t => {
        const available = Math.max(0, t.total_inventory - (t.sold_quantity + t.reserved_quantity));
        return {
          _id: t._id,
          name: t.name,
          description: t.description,
          price: t.price,
          currency: t.currency,
          available_quantity: available,
          min_per_order: t.min_per_order,
          max_per_order: Math.min(t.max_per_order, available),
          benefits: t.benefits,
          status: available <= 0 ? 'SOLD_OUT' : t.status,
          sales_end: t.sales_end
        };
      });

      // Fetch Addons
      const addons = await EventAddon.find({
        event_id: eventDoc._id,
        is_active: true
      }).lean();

      const formattedAddons = (addons as any[]).map((a: any) => {
        const available = Math.max(0, a.total_inventory - a.sold_quantity);
        return {
          _id: a._id,
          name: a.name,
          description: a.description,
          price: a.price,
          currency: a.currency,
          available_quantity: available,
          max_per_order: a.max_per_order,
          variants: a.variants
        };
      });

      // Fetch Sessions
      const sessions = await EventSession.find({
        event_id: eventDoc._id
      }).sort({ day_number: 1, start_time: 1 }).lean();

      res.status(200).json({
        success: true,
        data: {
          event,
          tickets: formattedTickets,
          addons: formattedAddons,
          sessions
        }
      });
    } catch (err: any) {
      console.error('[EventPublicController.getEventDetails] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve event.' });
    }
  }

  /**
   * POST /api/public/events/checkout/initiate - Guest or authenticated user checkout
   */
  static async initiateCheckout(req: Request, res: Response): Promise<void> {
    try {
      const {
        event_id,
        customer_name,
        customer_email,
        customer_phone,
        items
      } = req.body;

      if (!event_id || !customer_name || !customer_email || !items || !Array.isArray(items)) {
        res.status(400).json({ success: false, message: 'Missing required checkout information.' });
        return;
      }

      // Safe user id extraction if user has logged in
      const userId = (req as any).user?.userId || (req as any).user?.id;

      const result = await EventCheckoutService.initiateCheckout({
        event_id,
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim(),
        customer_phone: customer_phone?.trim(),
        user_id: userId,
        items,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        order_id: result.order?._id,
        order_number: result.order?.order_number,
        total_payable: result.order?.total_payable,
        currency: result.order?.currency,
        is_free_order: result.is_free_order,
        razorpay_order: result.razorpay_order,
        razorpay_key_id: RazorpayService.getKey(),
        key_id: RazorpayService.getKey()
      });
    } catch (err: any) {
      console.error('[EventPublicController.initiateCheckout] Error:', err);
      res.status(500).json({ success: false, message: 'Checkout initialization failed.' });
    }
  }

  /**
   * POST /api/public/events/checkout/verify - Verify Razorpay payment and issue tickets
   */
  static async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const {
        order_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ success: false, message: 'Missing payment signature verification parameters.' });
        return;
      }

      const result = await EventCheckoutService.verifyAndConfirmPayment({
        order_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully!',
        order: {
          id: result.order?._id,
          order_number: result.order?.order_number,
          total_payable: result.order?.total_payable,
          customer_name: result.order?.customer_name,
          customer_email: result.order?.customer_email,
          paid_at: result.order?.paid_at
        },
        tickets: result.tickets?.map(t => ({
          ticket_number: t.ticket_number,
          qr_token: t.qr_token,
          attendee_name: t.attendee_name,
          status: t.status
        }))
      });
    } catch (err: any) {
      console.error('[EventPublicController.verifyPayment] Error:', err);
      res.status(500).json({ success: false, message: 'Payment verification failed.' });
    }
  }

  /**
   * GET /api/public/events/orders/:orderId - Order details and tickets
   */
  static async getOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await EventOrder.findById(orderId)
        .populate('event_id', 'title start_date end_date venue_details online_details organizer_name cover_image event_type')
        .lean();

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      const orderDoc = order as any;
      // Safe attendee projection
      const tickets = await EventTicket.find({ order_id: orderDoc._id })
        .populate('ticket_type_id', 'name price')
        .select('ticket_number qr_token attendee_name attendee_email status is_checked_in ticket_type_id')
        .lean();

      res.status(200).json({
        success: true,
        data: {
          order: {
            id: orderDoc._id,
            order_number: orderDoc.order_number,
            status: orderDoc.status,
            customer_name: orderDoc.customer_name,
            customer_email: orderDoc.customer_email,
            gross_ticket_amount: orderDoc.gross_ticket_amount,
            gross_addon_amount: orderDoc.gross_addon_amount,
            buyer_service_fee: orderDoc.buyer_service_fee,
            total_payable: orderDoc.total_payable,
            currency: orderDoc.currency,
            paid_at: orderDoc.paid_at,
            event: orderDoc.event_id
          },
          tickets
        }
      });
    } catch (err: any) {
      console.error('[EventPublicController.getOrderDetails] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch order.' });
    }
  }

  /**
   * GET /api/public/events/tickets/verify/:qrToken - Safe public ticket lookup
   */
  static async getPublicTicket(req: Request, res: Response): Promise<void> {
    try {
      const { qrToken } = req.params;
      const ticket = await EventTicketService.getPublicTicketDetails(qrToken);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (err: any) {
      console.error('[EventPublicController.getPublicTicket] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve ticket.' });
    }
  }

  /**
   * POST /api/public/events/orders/:orderId/resend-confirmation - Resend tickets with QR codes
   */
  static async resendConfirmation(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const result = await EventCheckoutService.resendOrderConfirmationEmail(orderId);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      console.error('[EventPublicController.resendConfirmation] Error:', err);
      res.status(500).json({ success: false, message: 'Failed to resend confirmation email.' });
    }
  }
}

export default EventPublicController;
