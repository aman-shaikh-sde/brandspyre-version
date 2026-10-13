import mongoose from "mongoose";
import crypto from "crypto";
import {
  Event,
  EventTicketType,
  EventAddon,
  EventOrder,
  EventTicket,
  IEventOrder,
  IOrderItem
} from "../../db/ModelSceham/eventSchema";
import EventCommissionService from "./EventCommissionService";
import EventInventoryService from "./EventInventoryService";
import EventTicketService from "./EventTicketService";
import EventLedgerService from "./EventLedgerService";
import { RazorpayService } from "../razorpayService";
import EmailService from "../email/EmailService";
import QRCode from "qrcode";

export interface InitiateCheckoutInput {
  event_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  user_id?: string;
  items: Array<{
    type: 'TICKET' | 'ADDON';
    item_id: string;
    variant_name?: string;
    quantity: number;
    attendee_info?: {
      name: string;
      email: string;
      phone?: string;
      answers?: Record<string, any>;
    };
  }>;
  ip_address?: string;
  user_agent?: string;
}

export class EventCheckoutService {
  /**
   * Validates cart, reserves inventory, computes fees & commission, and creates Razorpay order
   */
  static async initiateCheckout(input: InitiateCheckoutInput): Promise<{
    success: boolean;
    order?: IEventOrder;
    razorpay_order?: any;
    is_free_order?: boolean;
    error?: string;
  }> {
    // 1. Fetch Event
    const event = await Event.findById(input.event_id);
    if (!event) {
      return { success: false, error: 'Event not found.' };
    }

    if (event.status !== 'PUBLISHED') {
      return { success: false, error: `Event is currently not accepting registrations (${event.status.toLowerCase()}).` };
    }

    const now = new Date();
    if (event.sales_end_date && now > event.sales_end_date) {
      return { success: false, error: 'Ticket sales for this event have closed.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Cart cannot be empty.' };
    }

    // 2. Authoritative Price Verification
    const validatedItems: IOrderItem[] = [];
    const inventoryReservationList: Array<{ type: 'TICKET' | 'ADDON'; id: string; quantity: number }> = [];

    for (const reqItem of input.items) {
      if (reqItem.quantity <= 0) continue;

      if (reqItem.type === 'TICKET') {
        const ticketType = await EventTicketType.findOne({
          _id: reqItem.item_id,
          event_id: event._id,
          status: 'ACTIVE',
          is_active: true
        });

        if (!ticketType) {
          return { success: false, error: `Ticket category unavailable or inactive.` };
        }

        if (reqItem.quantity < ticketType.min_per_order) {
          return { success: false, error: `Minimum order quantity for ${ticketType.name} is ${ticketType.min_per_order}.` };
        }
        if (reqItem.quantity > ticketType.max_per_order) {
          return { success: false, error: `Maximum order quantity for ${ticketType.name} is ${ticketType.max_per_order}.` };
        }

        const subtotal = Math.round(ticketType.price * reqItem.quantity * 100) / 100;
        validatedItems.push({
          item_type: 'TICKET',
          item_id: ticketType._id as any,
          name: ticketType.name,
          unit_price: ticketType.price,
          quantity: reqItem.quantity,
          subtotal,
          attendee_info: reqItem.attendee_info
        });

        inventoryReservationList.push({
          type: 'TICKET',
          id: ticketType._id.toString(),
          quantity: reqItem.quantity
        });
      } else {
        const addon = await EventAddon.findOne({
          _id: reqItem.item_id,
          event_id: event._id,
          is_active: true
        });

        if (!addon) {
          return { success: false, error: `Add-on product unavailable.` };
        }

        let unitPrice = addon.price;
        if (reqItem.variant_name && addon.variants && addon.variants.length > 0) {
          const matchVar = addon.variants.find((v: any) => v.name === reqItem.variant_name);
          if (matchVar) {
            unitPrice += matchVar.price_modifier;
          }
        }

        const subtotal = Math.round(unitPrice * reqItem.quantity * 100) / 100;
        validatedItems.push({
          item_type: 'ADDON',
          item_id: addon._id as any,
          name: addon.name,
          variant_name: reqItem.variant_name,
          unit_price: unitPrice,
          quantity: reqItem.quantity,
          subtotal
        });

        inventoryReservationList.push({
          type: 'ADDON',
          id: addon._id.toString(),
          quantity: reqItem.quantity
        });
      }
    }

    // 3. Concurrency-Safe Atomic Inventory Reservation
    const reservationResult = await EventInventoryService.reserve(inventoryReservationList);
    if (!reservationResult.success) {
      return { success: false, error: reservationResult.error };
    }

    // 4. Authoritative Commission Calculation
    const commissionRule = await EventCommissionService.resolveRule({
      tenant_id: event.tenant_id,
      event_id: event._id,
      override_rule_id: event.commission_override_rule_id
    });

    const calcItems = validatedItems.map(i => ({
      type: i.item_type,
      unit_price: i.unit_price,
      quantity: i.quantity
    }));

    const financials = EventCommissionService.calculate(commissionRule, calcItems, 0);

    // 5. Create Pending Order
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `EVT-ORD-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins TTL

    const order = new EventOrder({
      order_number: orderNumber,
      event_id: event._id,
      tenant_id: event.tenant_id,
      customer_name: input.customer_name,
      customer_email: input.customer_email.toLowerCase().trim(),
      customer_phone: input.customer_phone,
      user_id: input.user_id ? new mongoose.Types.ObjectId(input.user_id) : undefined,
      status: 'RESERVED',
      reservation_expires_at: reservationExpiry,
      items: validatedItems,

      gross_ticket_amount: financials.gross_ticket_amount,
      gross_addon_amount: financials.gross_addon_amount,
      subtotal: financials.subtotal,
      discount_amount: 0,
      buyer_service_fee: financials.buyer_service_fee,
      tax_amount: 0,
      total_payable: financials.total_payable_by_customer,

      commission_snapshot: {
        rule_id: financials.rule_id,
        scope: financials.scope,
        model: financials.model,
        rate_percentage: financials.rate_percentage,
        fixed_fee: financials.fixed_fee,
        applies_to: financials.applies_to,
        fee_payer: financials.fee_payer,
        base_commission_amount: financials.base_commission_amount,
        commission_tax: financials.commission_tax,
        total_commission_deduction: financials.total_commission_deduction
      },
      net_organizer_payable: financials.net_organizer_payable,
      currency: financials.currency,
      ip_address: input.ip_address,
      user_agent: input.user_agent
    });

    await order.save();

    // 6. Handle Free Ticket Order (₹0)
    if (order.total_payable === 0) {
      // Commit inventory directly
      await EventInventoryService.commit(inventoryReservationList);
      order.status = 'PAID';
      order.paid_at = new Date();
      order.payment_method = 'FREE';
      await order.save();

      // Issue Tickets & Record Ledger
      const issuedTickets = await EventTicketService.issueTicketsForOrder(order);
      await EventLedgerService.recordOrderPayment(order);

      // Async email notification
      this.sendConfirmationEmail(order, event, issuedTickets).catch(err => {
        console.warn(`[EventCheckout] Confirmation email warning:`, err.message);
      });

      return {
        success: true,
        order,
        is_free_order: true
      };
    }

    // 7. Create Razorpay Payment Order for Paid Registration
    try {
      const razorpayOrder = await RazorpayService.createOrder({
        amount: order.total_payable,
        currency: order.currency,
        receipt: `rcpt_evt_${order._id.toString().slice(-10)}`,
        notes: {
          brandspyre_order_id: order._id.toString(),
          order_number: order.order_number,
          event_id: event._id.toString(),
          event_title: event.title.slice(0, 40),
          tenant_id: event.tenant_id.toString(),
          module: 'event_ticketing'
        }
      });

      order.razorpay_order_id = razorpayOrder.id;
      await order.save();

      return {
        success: true,
        order,
        razorpay_order: razorpayOrder,
        is_free_order: false
      };
    } catch (err: any) {
      // On Razorpay failure, release reservation immediately
      await EventInventoryService.release(inventoryReservationList);
      order.status = 'FAILED';
      order.failure_reason = err.message || 'Payment gateway order creation failed';
      await order.save();

      return {
        success: false,
        error: `Payment initialization failed: ${err.message || 'Gateway error'}`
      };
    }
  }

  /**
   * Authoritatively verifies Razorpay signature, commits inventory, and completes order
   */
  static async verifyAndConfirmPayment(params: {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    order?: IEventOrder;
    tickets?: any[];
    error?: string;
  }> {
    const order = await EventOrder.findById(params.order_id);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    // Idempotent check: if already paid, return confirmation
    if (order.status === 'PAID') {
      const tickets = await EventTicketService.issueTicketsForOrder(order);
      return { success: true, order, tickets };
    }

    if (order.status !== 'RESERVED' && order.status !== 'PENDING') {
      return { success: false, error: `Invalid order state for payment verification: ${order.status}` };
    }

    // 1. Authoritative Razorpay Signature Verification
    const isSignatureValid = RazorpayService.verifyPaymentSignature(
      params.razorpay_order_id,
      params.razorpay_payment_id,
      params.razorpay_signature
    );

    if (!isSignatureValid) {
      order.status = 'FAILED';
      order.failure_reason = 'Payment gateway signature verification failed (tampering detected)';
      await order.save();
      return { success: false, error: 'Invalid payment signature. Payment cannot be verified.' };
    }

    // 2. Authoritative Server-Side Payment Verification via Razorpay API
    let paymentDetails: any;
    try {
      paymentDetails = await RazorpayService.fetchPayment(params.razorpay_payment_id);
    } catch (fetchErr: any) {
      return { success: false, error: `Failed to verify payment status with gateway: ${fetchErr.message}` };
    }

    if (paymentDetails.status !== 'captured') {
      return {
        success: false,
        error: `Payment is not captured. Current gateway status is '${paymentDetails.status}'. Tickets can only be issued for captured payments.`
      };
    }

    if (order.razorpay_order_id && order.razorpay_order_id !== params.razorpay_order_id) {
      order.status = 'FAILED';
      order.failure_reason = 'Submitted Razorpay order ID does not match order record';
      await order.save();
      return { success: false, error: 'Payment order ID tampering detected.' };
    }

    if (paymentDetails.order_id && paymentDetails.order_id !== params.razorpay_order_id) {
      order.status = 'FAILED';
      order.failure_reason = 'Gateway payment order mismatch detected';
      await order.save();
      return { success: false, error: 'Payment order mismatch detected.' };
    }

    const expectedPaise = Math.round(order.total_payable * 100);
    if (paymentDetails.amount < expectedPaise) {
      order.status = 'FAILED';
      order.failure_reason = `Underpayment detected: expected ${expectedPaise} paise, received ${paymentDetails.amount} paise`;
      await order.save();
      return { success: false, error: 'Payment amount mismatch. Order has been flagged.' };
    }

    // 3. Commit Reserved Inventory
    const itemsToCommit = order.items.map((i: any) => ({
      type: i.item_type,
      id: i.item_id.toString(),
      quantity: i.quantity
    }));
    await EventInventoryService.commit(itemsToCommit);

    // 4. Mark Order as PAID
    order.status = 'PAID';
    order.razorpay_order_id = params.razorpay_order_id;
    order.razorpay_payment_id = params.razorpay_payment_id;
    order.razorpay_signature = params.razorpay_signature;
    order.paid_at = new Date();
    order.payment_method = 'RAZORPAY';
    await order.save();

    // 5. Issue Attendee Tickets & Secure QR Tokens
    const issuedTickets = await EventTicketService.issueTicketsForOrder(order);

    // 6. Append-Only Financial Ledger Persistence
    await EventLedgerService.recordOrderPayment(order);

    // 7. Asynchronous Confirmation Email
    const event = await Event.findById(order.event_id);
    if (event) {
      this.sendConfirmationEmail(order, event, issuedTickets).catch(err => {
        console.warn(`[EventCheckout] Confirmation email warning:`, err.message);
      });
    }

    return {
      success: true,
      order,
      tickets: issuedTickets
    };
  }

  /**
   * Helper to dispatch booking confirmation emails with embedded QR codes and attachments
   */
  public static async sendConfirmationEmail(order: IEventOrder, event: any, tickets: any[]): Promise<void> {
    const venueText = event.event_type === 'ONLINE' 
      ? `Online Event (${event.online_details?.platform || 'Brandspyre Rooms'})`
      : `${event.venue_details?.venue_name || ''}, ${event.venue_details?.city || ''}`;

    const dateFormatted = new Date(event.start_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const confirmationUrl = `${frontendUrl}/tickets/confirmation/${order._id.toString()}`;

    const attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
      cid?: string;
    }> = [];

    const ticketBlocksHtml: string[] = [];

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      const verifyUrl = `${frontendUrl}/tickets/verify/${t.qr_token}`;
      const safeTicketCode = (t.ticket_number || `tkt_${i}`).replace(/[^a-zA-Z0-9]/g, '_');
      const cidName = `qr_${safeTicketCode}@brandspyre.in`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(verifyUrl)}`;

      try {
        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
          width: 280,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        attachments.push({
          filename: `ticket-${t.ticket_number}.png`,
          content: qrBuffer,
          contentType: 'image/png',
          cid: cidName
        });
      } catch (qrErr: any) {
        console.warn(`[EventCheckout] Failed to generate QR buffer for ${t.ticket_number}:`, qrErr.message);
      }

      ticketBlocksHtml.push(`
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="padding-right:16px;">
                <span style="display:inline-block; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; background:#eef2ff; color:#4f46e5; padding:3px 8px; border-radius:4px; margin-bottom:8px;">
                  Admission Pass
                </span>
                <h4 style="margin:4px 0 2px 0; font-size:16px; color:#0f172a; font-weight:bold;">${t.attendee_name || order.customer_name}</h4>
                <p style="margin:0 0 8px 0; font-size:12px; color:#64748b;">${t.attendee_email || order.customer_email}</p>
                <div style="font-size:12px; color:#475569; line-height:1.5;">
                  <p style="margin:2px 0;"><strong>Ticket Code:</strong> <span style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:bold; color:#0f172a;">${t.ticket_number}</span></p>
                  <p style="margin:2px 0;"><strong>Event:</strong> ${event.title}</p>
                  <p style="margin:2px 0;"><strong>Date:</strong> ${dateFormatted}</p>
                </div>
                <div style="margin-top:12px;">
                  <a href="${verifyUrl}" target="_blank" style="display:inline-block; font-size:11px; font-weight:bold; color:#4f46e5; text-decoration:none; border:1px solid #c7d2fe; padding:5px 12px; border-radius:6px; background:#faf5ff;">
                    View Live Ticket & Verification &rarr;
                  </a>
                </div>
              </td>
              <td width="160" valign="middle" align="center" style="text-align:center; padding-left:12px; border-left:1px dashed #cbd5e1;">
                <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:6px; display:inline-block;">
                  <img src="${qrImageUrl}" alt="Admission QR Code: ${t.ticket_number}" width="140" height="140" style="display:block; width:140px; height:140px; border:0; margin:0 auto;" />
                </div>
                <p style="margin:6px 0 0 0; font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
                  Scan for Entry
                </p>
                <p style="margin:2px 0 0 0; font-size:9px; color:#94a3b8;">
                  (Attachment: ticket-${t.ticket_number}.png)
                </p>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif; max-width:620px; margin:0 auto; padding:24px; color:#334155; background:#f8fafc; border-radius:16px;">
        <div style="background:#ffffff; padding:24px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:16px;">
          <div style="text-align:center; margin-bottom:16px;">
            <span style="display:inline-block; background:#dcfce7; color:#15803d; font-size:11px; font-weight:bold; text-transform:uppercase; padding:4px 12px; border-radius:999px;">
              &#10003; Booking Confirmed
            </span>
            <h2 style="color:#0f172a; margin:12px 0 4px 0; font-size:22px; font-weight:800;">You're Going to ${event.title}!</h2>
            <p style="color:#64748b; font-size:13px; margin:0;">Receipt & Digital Entry Passes for Order #${order.order_number}</p>
          </div>

          <div style="background:#f1f5f9; border-radius:8px; padding:16px; margin:16px 0; font-size:13px; line-height:1.6;">
            <p style="margin:2px 0;"><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
            <p style="margin:2px 0;"><strong>Date & Time:</strong> ${dateFormatted}</p>
            <p style="margin:2px 0;"><strong>Venue / Format:</strong> ${venueText}</p>
            <p style="margin:2px 0;"><strong>Total Paid:</strong> ₹${order.total_payable.toLocaleString('en-IN')}</p>
          </div>

          <div style="text-align:center; margin:16px 0;">
            <a href="${confirmationUrl}" target="_blank" style="display:inline-block; background:#4f46e5; color:#ffffff; font-size:13px; font-weight:bold; text-decoration:none; padding:10px 22px; border-radius:8px; box-shadow:0 2px 4px rgba(79,70,229,0.3);">
              View & Print All Tickets Online
            </a>
          </div>
        </div>

        <div style="margin-top:20px;">
          <h3 style="color:#0f172a; font-size:16px; margin-bottom:12px;">Admission Tickets & Entry QR Codes</h3>
          ${ticketBlocksHtml.join('')}
        </div>

        <div style="margin-top:20px; padding:16px; background:#f1f5f9; border-radius:8px; font-size:11px; color:#64748b; line-height:1.5;">
          <p style="margin:0 0 6px 0; font-weight:bold; color:#475569;">Event Check-In Instructions:</p>
          <ul style="margin:0; padding-left:18px;">
            <li>Please present the QR codes above or open the downloadable attached ticket file (<code>.png</code>) on your smartphone at the gate.</li>
            <li>Each ticket code is unique to the named attendee and can only be scanned once.</li>
            <li>Government-issued photo identification may be requested at security.</li>
          </ul>
        </div>
      </div>
    `;

    await EmailService.sendEmail({
      to: order.customer_email,
      subject: `Your Tickets: ${event.title} (${order.order_number})`,
      html,
      attachments,
      eventType: 'EVENT_BOOKING_CONFIRMATION',
      tenantId: order.tenant_id,
      referenceId: order._id.toString()
    });
  }

  /**
   * Resend booking confirmation email with tickets and QR codes
   */
  public static async resendOrderConfirmationEmail(orderIdOrNumber: string): Promise<{ success: boolean; message: string }> {
    const query: any = {};
    if (mongoose.Types.ObjectId.isValid(orderIdOrNumber)) {
      query.$or = [{ _id: new mongoose.Types.ObjectId(orderIdOrNumber) }, { order_number: orderIdOrNumber }];
    } else {
      query.order_number = orderIdOrNumber;
    }

    const order = await EventOrder.findOne(query);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    const event = await Event.findById(order.event_id);
    if (!event) {
      return { success: false, message: 'Associated event not found.' };
    }

    const tickets = await EventTicket.find({ order_id: order._id });
    if (!tickets || tickets.length === 0) {
      return { success: false, message: 'No tickets found for this order.' };
    }

    await this.sendConfirmationEmail(order, event, tickets);
    return { success: true, message: `Tickets and QR codes resent to ${order.customer_email}.` };
  }
}

export default EventCheckoutService;
