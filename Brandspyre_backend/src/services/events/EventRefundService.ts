import mongoose from "mongoose";
import crypto from "crypto";
import {
  EventOrder,
  EventTicket,
  EventRefund,
  EventTicketType,
  IEventRefund
} from "../../db/ModelSceham/eventSchema";
import EventLedgerService from "./EventLedgerService";

export class EventRefundService {
  /**
   * Processes a refund for an order or specific tickets within an order
   */
  static async processRefund(params: {
    order_id: string | mongoose.Types.ObjectId;
    ticket_ids?: string[];
    reason: string;
    requested_by?: string | mongoose.Types.ObjectId;
    gateway_refund_id?: string;
  }): Promise<{ success: boolean; refund?: IEventRefund; message?: string }> {
    const order = await EventOrder.findById(params.order_id);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    if (order.status !== 'PAID' && order.status !== 'PARTIALLY_REFUNDED') {
      return { success: false, message: `Cannot refund order with status '${order.status}'.` };
    }

    let ticketsToRefund = await EventTicket.find({
      order_id: order._id,
      status: 'VALID'
    });

    if (params.ticket_ids && params.ticket_ids.length > 0) {
      ticketsToRefund = ticketsToRefund.filter(t => params.ticket_ids!.includes(t._id.toString()));
    }

    if (ticketsToRefund.length === 0) {
      return { success: false, message: 'No valid tickets found eligible for refund.' };
    }

    // Calculate refund amount based on tickets
    let calculatedRefundAmount = 0;
    const ticketTypeCounts: Record<string, number> = {};

    for (const ticket of ticketsToRefund) {
      // Find unit price from order item
      const orderItem = order.items.find(
        (i: any) => i.item_type === 'TICKET' && i.item_id.toString() === ticket.ticket_type_id.toString()
      );
      const unitPrice = orderItem ? orderItem.unit_price : 0;
      calculatedRefundAmount += unitPrice;

      const tKey = ticket.ticket_type_id.toString();
      ticketTypeCounts[tKey] = (ticketTypeCounts[tKey] || 0) + 1;
    }

    // Proportional commission reversal
    const orderTotalGross = order.subtotal || 1;
    const refundRatio = Math.min(1, calculatedRefundAmount / orderTotalGross);
    const commissionReversed = Math.round((order.commission_snapshot.total_commission_deduction * refundRatio) * 100) / 100;

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const refundNumber = `RFD-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const refund = new EventRefund({
      refund_number: refundNumber,
      order_id: order._id,
      event_id: order.event_id,
      tenant_id: order.tenant_id,
      ticket_ids: ticketsToRefund.map(t => t._id),
      amount: calculatedRefundAmount,
      commission_reversed: commissionReversed,
      currency: order.currency,
      reason: params.reason,
      status: 'COMPLETED',
      gateway_refund_id: params.gateway_refund_id,
      requested_by: params.requested_by,
      processed_at: new Date()
    });

    await refund.save();

    // 1. Mark tickets as REFUNDED
    await EventTicket.updateMany(
      { _id: { $in: ticketsToRefund.map(t => t._id) } },
      { $set: { status: 'REFUNDED' } }
    );

    // 2. Decrement sold_quantity on ticket types
    for (const [ticketTypeId, count] of Object.entries(ticketTypeCounts)) {
      await EventTicketType.updateOne(
        { _id: ticketTypeId },
        {
          $inc: { sold_quantity: -count },
          $set: { status: 'ACTIVE' } // Reactivate if was SOLD_OUT
        }
      );
    }

    // 3. Append Reversing Entries in Event Financial Ledger
    await EventLedgerService.recordRefund({
      order,
      refund_id: refund._id as any,
      refund_amount: calculatedRefundAmount,
      commission_reversed: commissionReversed,
      reason: params.reason
    });

    // 4. Update Order status
    order.refunded_amount = (order.refunded_amount || 0) + calculatedRefundAmount;
    order.commission_reversed_amount = (order.commission_reversed_amount || 0) + commissionReversed;
    const remainingValidTickets = await EventTicket.countDocuments({
      order_id: order._id,
      status: 'VALID'
    });

    order.refund_status = remainingValidTickets === 0 ? 'FULL' : 'PARTIAL';
    order.status = remainingValidTickets === 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await order.save();

    return {
      success: true,
      refund
    };
  }
}

export default EventRefundService;
