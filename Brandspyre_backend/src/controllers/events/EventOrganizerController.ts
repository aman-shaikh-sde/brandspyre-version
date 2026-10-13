import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  Event,
  EventTicketType,
  EventAddon,
  EventSession,
  EventOrder,
  EventTicket,
  EventSettlement,
  EventFinancialTransaction
} from "../../db/ModelSceham/eventSchema";
import FeatureLimitService from "../../services/saas/FeatureLimitService";
import EventTicketService from "../../services/events/EventTicketService";
import EventRefundService from "../../services/events/EventRefundService";
import EventLedgerService from "../../services/events/EventLedgerService";

export class EventOrganizerController {
  /**
   * Helper to safely extract tenant_id from security context
   */
  private static getTenantId(req: any): mongoose.Types.ObjectId {
    const tid = req.tenant?.id || req.user?.tenantId;
    if (!tid) throw new Error('Tenant context missing from authenticated session.');
    return new mongoose.Types.ObjectId(tid.toString());
  }

  /**
   * Helper to safely extract user_id
   */
  private static getUserId(req: any): mongoose.Types.ObjectId {
    const uid = req.user?.userId || req.user?.id;
    if (!uid) throw new Error('User context missing.');
    return new mongoose.Types.ObjectId(uid.toString());
  }

  /**
   * GET /api/events/dashboard-stats - Organizer Event Dashboard Overview
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);

      const [totalEvents, publishedEvents, draftEvents] = await Promise.all([
        Event.countDocuments({ tenant_id: tenantId }),
        Event.countDocuments({ tenant_id: tenantId, status: 'PUBLISHED' }),
        Event.countDocuments({ tenant_id: tenantId, status: 'DRAFT' })
      ]);

      const balance = await EventLedgerService.getOrganizerBalance(tenantId);

      // Total tickets sold and check-ins
      const ticketStats = await EventTicket.aggregate([
        { $match: { tenant_id: tenantId } },
        {
          $group: {
            _id: null,
            totalIssued: { $sum: 1 },
            checkedIn: { $sum: { $cond: ["$is_checked_in", 1, 0] } }
          }
        }
      ]);

      const totalTicketsIssued = ticketStats[0]?.totalIssued || 0;
      const totalCheckedIn = ticketStats[0]?.checkedIn || 0;

      // Recent 5 Events
      const recentEvents = await Event.find({ tenant_id: tenantId })
        .sort({ created_at: -1 })
        .limit(5)
        .select('title slug status category start_date stats cover_image')
        .lean();

      // Recent 5 Orders
      const recentOrders = await EventOrder.find({ tenant_id: tenantId, status: 'PAID' })
        .sort({ created_at: -1 })
        .limit(5)
        .populate('event_id', 'title')
        .select('order_number customer_name customer_email total_payable net_organizer_payable paid_at')
        .lean();

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            total_events: totalEvents,
            published_events: publishedEvents,
            draft_events: draftEvents,
            tickets_sold: totalTicketsIssued,
            attendees_checked_in: totalCheckedIn,
            gross_revenue: balance.total_gross_sales,
            platform_commission_paid: balance.total_commission_deductions,
            net_earned: balance.net_earned,
            pending_payable_balance: balance.pending_payable_balance,
            currency: balance.currency
          },
          recent_events: recentEvents,
          recent_orders: recentOrders
        }
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.getDashboardStats] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to retrieve stats.' });
    }
  }

  /**
   * GET /api/events - List organizer events
   */
  static async listEvents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = (req.query.search as string || '').trim();
      const status = (req.query.status as string || '').trim();

      const filter: any = { tenant_id: tenantId };

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      if (status && status !== 'ALL') {
        filter.status = status;
      }

      const total = await Event.countDocuments(filter);
      const events = await Event.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.listEvents] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to list events.' });
    }
  }

  /**
   * POST /api/events - Create new event (Wizard)
   */
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const userId = EventOrganizerController.getUserId(req);

      // Validate subscription limit for active events
      const limitCheck = await FeatureLimitService.checkLimit(tenantId.toString(), 'active_events', 1);
      if (!limitCheck.allowed) {
        res.status(403).json({
          success: false,
          message: limitCheck.message || 'Active event quota exceeded in your subscription plan. Please upgrade to host more events.'
        });
        return;
      }

      const {
        title,
        description,
        short_summary,
        category,
        event_type,
        cover_image,
        gallery_images,
        venue_details,
        online_details,
        start_date,
        end_date,
        timezone,
        organizer_name,
        organizer_email,
        organizer_phone,
        organizer_website,
        organizer_description,
        refund_policy,
        terms_and_conditions,
        registration_questions,
        is_public
      } = req.body;

      if (!title || !description || !category || !start_date || !end_date) {
        res.status(400).json({ success: false, message: 'Please provide all required event details.' });
        return;
      }

      // Generate clean unique slug
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSuffix = Date.now().toString(36);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      const event = new Event({
        tenant_id: tenantId,
        title: title.trim(),
        slug,
        description,
        short_summary,
        category: category.trim(),
        event_type: event_type || 'PHYSICAL',
        cover_image: cover_image || '',
        gallery_images: gallery_images || [],
        venue_details,
        online_details,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        timezone: timezone || 'Asia/Kolkata',
        status: 'DRAFT',
        is_public: is_public !== false,
        organizer_name: organizer_name?.trim() || req.body.organizer_name || 'Brandspyre Organizer',
        organizer_email: organizer_email?.trim() || req.body.organizer_email,
        organizer_phone,
        organizer_website,
        organizer_description,
        refund_policy,
        terms_and_conditions,
        registration_questions: registration_questions || [],
        created_by: userId
      });

      await event.save();

      res.status(201).json({
        success: true,
        message: 'Event draft created successfully.',
        data: event
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.createEvent] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to create event.' });
    }
  }

  /**
   * GET /api/events/:id - Get event details for editor
   */
  static async getEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId
        ? { _id: id, tenant_id: tenantId }
        : { slug: id, tenant_id: tenantId };

      const event = await Event.findOne(query);
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      const [tickets, addons, sessions] = await Promise.all([
        EventTicketType.find({ event_id: event._id, tenant_id: tenantId }).sort({ sort_order: 1 }),
        EventAddon.find({ event_id: event._id, tenant_id: tenantId }),
        EventSession.find({ event_id: event._id, tenant_id: tenantId }).sort({ day_number: 1, start_time: 1 })
      ]);

      res.status(200).json({
        success: true,
        data: {
          event,
          tickets,
          addons,
          sessions
        }
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.getEvent] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to retrieve event.' });
    }
  }

  /**
   * PUT /api/events/:id - Update event details
   */
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;

      const event = await Event.findOne({ _id: id, tenant_id: tenantId });
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      const allowedFields = [
        'title', 'description', 'short_summary', 'category', 'event_type',
        'cover_image', 'gallery_images', 'venue_details', 'online_details',
        'start_date', 'end_date', 'timezone', 'organizer_name', 'organizer_email',
        'organizer_phone', 'organizer_website', 'organizer_description',
        'refund_policy', 'terms_and_conditions', 'registration_questions', 'is_public'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (event as any)[field] = req.body[field];
        }
      }

      await event.save();

      res.status(200).json({
        success: true,
        message: 'Event updated successfully.',
        data: event
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.updateEvent] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to update event.' });
    }
  }

  /**
   * POST /api/events/:id/publish - Transition event to PUBLISHED
   */
  static async publishEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;

      const event = await Event.findOne({ _id: id, tenant_id: tenantId });
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      // Verify at least one ticket type exists
      const ticketCount = await EventTicketType.countDocuments({
        event_id: event._id,
        is_active: true
      });

      if (ticketCount === 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot publish event without at least one active ticket category.'
        });
        return;
      }

      event.status = 'PUBLISHED';
      await event.save();

      res.status(200).json({
        success: true,
        message: 'Event published successfully! It is now live on the public discovery marketplace.',
        data: event
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.publishEvent] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to publish event.' });
    }
  }

  /**
   * POST /api/events/:id/cancel - Cancel event
   */
  static async cancelEvent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;

      const event = await Event.findOne({ _id: id, tenant_id: tenantId });
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      event.status = 'CANCELLED';
      await event.save();

      // Pause all ticket types
      await EventTicketType.updateMany(
        { event_id: event._id },
        { $set: { status: 'PAUSED' } }
      );

      res.status(200).json({
        success: true,
        message: 'Event has been cancelled. New bookings are suspended.',
        data: event
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.cancelEvent] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to cancel event.' });
    }
  }

  // ============================================================
  // TICKET TYPE CRUD
  // ============================================================
  static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;

      const tickets = await EventTicketType.find({ event_id: id, tenant_id: tenantId }).sort({ sort_order: 1 });
      res.status(200).json({ success: true, data: tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;
      const { name, description, price, total_inventory, min_per_order, max_per_order, benefits, sales_start, sales_end } = req.body;

      if (!name || price === undefined || total_inventory === undefined) {
        res.status(400).json({ success: false, message: 'Name, price, and total inventory are required.' });
        return;
      }

      const ticket = new EventTicketType({
        event_id: new mongoose.Types.ObjectId(id),
        tenant_id: tenantId,
        name: name.trim(),
        description,
        price: Math.max(0, parseFloat(price)),
        total_inventory: Math.max(1, parseInt(total_inventory)),
        min_per_order: Math.max(1, parseInt(min_per_order) || 1),
        max_per_order: Math.max(1, parseInt(max_per_order) || 10),
        benefits: benefits || [],
        sales_start: sales_start ? new Date(sales_start) : new Date(),
        sales_end: sales_end ? new Date(sales_end) : undefined
      });

      await ticket.save();
      res.status(201).json({ success: true, message: 'Ticket category added.', data: ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { ticketId } = req.params;

      const ticket = await EventTicketType.findOne({ _id: ticketId, tenant_id: tenantId });
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket category not found.' });
        return;
      }

      const updatable = ['name', 'description', 'price', 'total_inventory', 'min_per_order', 'max_per_order', 'benefits', 'status', 'is_active', 'sales_start', 'sales_end'];
      for (const field of updatable) {
        if (req.body[field] !== undefined) {
          (ticket as any)[field] = req.body[field];
        }
      }

      await ticket.save();
      res.status(200).json({ success: true, message: 'Ticket category updated.', data: ticket });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteTicket(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { ticketId } = req.params;

      const ticket = await EventTicketType.findOne({ _id: ticketId, tenant_id: tenantId });
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket category not found.' });
        return;
      }

      if (ticket.sold_quantity > 0) {
        // Safe soft delete if tickets were already purchased
        ticket.is_active = false;
        ticket.status = 'ARCHIVED';
        await ticket.save();
        res.status(200).json({ success: true, message: 'Ticket category archived (has paid bookings).' });
      } else {
        await EventTicketType.deleteOne({ _id: ticket._id });
        res.status(200).json({ success: true, message: 'Ticket category deleted.' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================================
  // ADDONS CRUD
  // ============================================================
  static async getAddons(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;
      const addons = await EventAddon.find({ event_id: id, tenant_id: tenantId });
      res.status(200).json({ success: true, data: addons });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createAddon(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;
      const { name, description, price, total_inventory, max_per_order, variants } = req.body;

      const addon = new EventAddon({
        event_id: new mongoose.Types.ObjectId(id),
        tenant_id: tenantId,
        name: name.trim(),
        description,
        price: Math.max(0, parseFloat(price) || 0),
        total_inventory: total_inventory ? parseInt(total_inventory) : 999999,
        max_per_order: max_per_order ? parseInt(max_per_order) : 10,
        variants: variants || []
      });

      await addon.save();
      res.status(201).json({ success: true, message: 'Add-on created.', data: addon });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================================
  // SESSIONS CRUD
  // ============================================================
  static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;
      const sessions = await EventSession.find({ event_id: id, tenant_id: tenantId }).sort({ day_number: 1, start_time: 1 });
      res.status(200).json({ success: true, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const { id } = req.params;
      const { title, description, day_number, start_time, end_time, room_or_stage, capacity, speakers } = req.body;

      const session = new EventSession({
        event_id: new mongoose.Types.ObjectId(id),
        tenant_id: tenantId,
        title: title.trim(),
        description,
        day_number: parseInt(day_number) || 1,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        room_or_stage,
        capacity,
        speakers: speakers || []
      });

      await session.save();
      res.status(201).json({ success: true, message: 'Session added.', data: session });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================================
  // ORDERS & ATTENDEES
  // ============================================================
  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15));
      const eventId = req.query.event_id as string;
      const status = req.query.status as string;

      const query: any = { tenant_id: tenantId };
      if (eventId) query.event_id = new mongoose.Types.ObjectId(eventId);
      if (status && status !== 'ALL') query.status = status;

      const total = await EventOrder.countDocuments(query);
      const orders = await EventOrder.find(query)
        .populate('event_id', 'title start_date')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        total_pages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        data: {
          orders,
          pagination
        },
        orders,
        pagination
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getAttendees(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const eventId = req.query.event_id as string;
      const search = (req.query.search as string || '').trim();

      const query: any = { tenant_id: tenantId };
      if (eventId) query.event_id = new mongoose.Types.ObjectId(eventId);
      if (search) {
        query.$or = [
          { attendee_name: { $regex: search, $options: 'i' } },
          { attendee_email: { $regex: search, $options: 'i' } },
          { ticket_number: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await EventTicket.countDocuments(query);
      const attendees = await EventTicket.find(query)
        .populate('event_id', 'title start_date')
        .populate('ticket_type_id', 'name price')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        total_pages: Math.ceil(total / limit)
      };

      res.status(200).json({
        success: true,
        data: {
          attendees,
          pagination
        },
        attendees,
        pagination
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================================
  // CHECK-IN TERMINAL
  // ============================================================
  static async checkinAttendee(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const userId = EventOrganizerController.getUserId(req);
      const { qr_token, ticket_number, event_id, device_info } = req.body;

      if (!qr_token && !ticket_number) {
        res.status(400).json({ success: false, message: 'Please scan a QR code or enter a ticket number.' });
        return;
      }

      const result = await EventTicketService.checkinTicket({
        qr_token,
        ticket_number,
        event_id,
        staff_user_id: userId,
        device_info
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[EventOrganizerController.checkinAttendee] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Checkin operation failed.' });
    }
  }

  // ============================================================
  // REFUNDS
  // ============================================================
  static async refundOrder(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const userId = EventOrganizerController.getUserId(req);
      const { orderId } = req.params;
      const { ticket_ids, reason } = req.body;

      // Ownership verify
      const order = await EventOrder.findOne({ _id: orderId, tenant_id: tenantId });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found for this organization.' });
        return;
      }

      const result = await EventRefundService.processRefund({
        order_id: order._id,
        ticket_ids,
        reason: reason || 'Organizer initiated refund',
        requested_by: userId
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Refund recorded and processed successfully.',
        refund: result.refund
      });
    } catch (err: any) {
      console.error('[EventOrganizerController.refundOrder] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Refund failed.' });
    }
  }

  // ============================================================
  // FINANCIALS & SETTLEMENTS
  // ============================================================
  static async getFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const balance = await EventLedgerService.getOrganizerBalance(tenantId);

      const recentTxns = await EventFinancialTransaction.find({ tenant_id: tenantId })
        .sort({ created_at: -1 })
        .limit(10)
        .populate('event_id', 'title')
        .lean();

      res.status(200).json({
        success: true,
        data: {
          balance,
          recent_transactions: recentTxns
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getSettlements(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = EventOrganizerController.getTenantId(req);
      const settlements = await EventSettlement.find({ tenant_id: tenantId })
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: settlements
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default EventOrganizerController;
