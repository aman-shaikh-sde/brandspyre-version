import crypto from "crypto";
import mongoose from "mongoose";
import {
  EventTicket,
  IEventTicket,
  IEventOrder,
  Event
} from "../../db/ModelSceham/eventSchema";

export interface CheckinResult {
  success: boolean;
  code: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID_TICKET' | 'EVENT_MISMATCH' | 'CANCELLED_OR_REFUNDED';
  message: string;
  ticket?: IEventTicket;
}

export class EventTicketService {
  /**
   * Generates tickets with unique numbers and secure QR tokens for an order
   */
  static async issueTicketsForOrder(order: IEventOrder): Promise<IEventTicket[]> {
    const issuedTickets: IEventTicket[] = [];

    // Filter only ticket items
    const ticketItems = order.items.filter(item => item.item_type === 'TICKET');

    for (const item of ticketItems) {
      for (let i = 0; i < item.quantity; i++) {
        // Unique readable ticket number
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const ticketNumber = `TKT-${order.order_number.replace('EVT-ORD-', '')}-${item.name.slice(0, 3).toUpperCase()}-${randomSuffix}`;
        
        // Unpredictable 48-char hex QR verification token
        const qrToken = crypto.randomBytes(24).toString('hex');

        // Attendee info fallback to order customer if not specified per item
        const attendeeName = item.attendee_info?.name || order.customer_name;
        const attendeeEmail = item.attendee_info?.email || order.customer_email;
        const attendeePhone = item.attendee_info?.phone || order.customer_phone;
        const answers = item.attendee_info?.answers || {};

        const ticket = new EventTicket({
          ticket_number: ticketNumber,
          qr_token: qrToken,
          order_id: order._id,
          event_id: order.event_id,
          tenant_id: order.tenant_id,
          ticket_type_id: item.item_id,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: attendeePhone,
          registration_answers: answers,
          status: 'VALID',
          is_checked_in: false
        });

        await ticket.save();
        issuedTickets.push(ticket);
      }
    }

    return issuedTickets;
  }

  /**
   * Performs atomic, single-scan ticket verification and check-in
   */
  static async checkinTicket(params: {
    qr_token?: string;
    ticket_number?: string;
    event_id?: string | mongoose.Types.ObjectId;
    staff_user_id?: string | mongoose.Types.ObjectId;
    device_info?: string;
  }): Promise<CheckinResult> {
    const query: any = {};
    if (params.qr_token) {
      query.qr_token = params.qr_token.trim();
    } else if (params.ticket_number) {
      query.ticket_number = params.ticket_number.trim().toUpperCase();
    } else {
      return { success: false, code: 'INVALID_TICKET', message: 'QR token or ticket number required.' };
    }

    if (params.event_id) {
      query.event_id = params.event_id;
    }

    // 1. Check current status without locking to provide clear error message
    const existingTicket = await EventTicket.findOne(query).populate('ticket_type_id', 'name price');
    if (!existingTicket) {
      return { success: false, code: 'INVALID_TICKET', message: 'Ticket not found or invalid QR code.' };
    }

    if (params.event_id && existingTicket.event_id.toString() !== params.event_id.toString()) {
      return { success: false, code: 'EVENT_MISMATCH', message: 'This ticket belongs to a different event.' };
    }

    if (existingTicket.status === 'REFUNDED' || existingTicket.status === 'CANCELLED') {
      return {
        success: false,
        code: 'CANCELLED_OR_REFUNDED',
        message: `Entry denied. Ticket was ${existingTicket.status.toLowerCase()}.`,
        ticket: existingTicket
      };
    }

    if (existingTicket.is_checked_in) {
      const checkinTime = existingTicket.checked_in_at ? new Date(existingTicket.checked_in_at).toLocaleTimeString() : 'earlier';
      return {
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: `Duplicate scan. Ticket was already checked in at ${checkinTime}.`,
        ticket: existingTicket
      };
    }

    // 2. Atomic check-in operation — prevents race condition if scanned simultaneously
    const updatedTicket = await EventTicket.findOneAndUpdate(
      {
        _id: existingTicket._id,
        is_checked_in: false,
        status: 'VALID'
      },
      {
        $set: {
          is_checked_in: true,
          status: 'CHECKED_IN',
          checked_in_at: new Date(),
          checked_in_by: params.staff_user_id,
          checkin_device_info: params.device_info || 'Scanner App'
        }
      },
      { new: true }
    ).populate('ticket_type_id', 'name price');

    if (!updatedTicket) {
      return {
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: 'Duplicate scan. Ticket was checked in concurrently on another device.'
      };
    }

    // Increment event checkin counter
    await Event.updateOne(
      { _id: updatedTicket.event_id },
      { $inc: { "stats.checked_in_count": 1 } }
    );

    return {
      success: true,
      code: 'CHECKED_IN',
      message: `Verified! Welcome, ${updatedTicket.attendee_name}.`,
      ticket: updatedTicket
    };
  }

  /**
   * Safe public ticket status lookup (for attendees checking their confirmation)
   */
  static async getPublicTicketDetails(qr_token: string) {
    const ticket = await EventTicket.findOne({ qr_token })
      .populate('event_id', 'title start_date end_date venue_details online_details cover_image organizer_name')
      .populate('ticket_type_id', 'name price currency benefits')
      .select('ticket_number attendee_name status is_checked_in checked_in_at event_id ticket_type_id created_at');

    return ticket;
  }
}

export default EventTicketService;
