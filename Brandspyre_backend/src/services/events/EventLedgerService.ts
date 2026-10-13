import mongoose from "mongoose";
import crypto from "crypto";
import {
  EventFinancialTransaction,
  IEventFinancialTransaction,
  IEventOrder,
  IEventSettlement,
  EventSettlement,
  Event
} from "../../db/ModelSceham/eventSchema";

export class EventLedgerService {
  /**
   * Generates a unique transaction reference
   */
  private static generateRef(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TXN-${prefix}-${timestamp}-${randomHex}`;
  }

  /**
   * Records ledger entries upon successful order payment
   */
  static async recordOrderPayment(order: IEventOrder): Promise<IEventFinancialTransaction[]> {
    const entries: IEventFinancialTransaction[] = [];
    const now = new Date();

    // 1. Gross Ticket Sale (Credit)
    if (order.gross_ticket_amount > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('TKT'),
        tenant_id: order.tenant_id,
        event_id: order.event_id,
        order_id: order._id,
        type: 'TICKET_SALE',
        entry_type: 'CREDIT',
        amount: order.gross_ticket_amount,
        currency: order.currency,
        notes: `Ticket sales for order ${order.order_number}`
      }));
    }

    // 2. Gross Addon Sale (Credit)
    if (order.gross_addon_amount > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('ADDON'),
        tenant_id: order.tenant_id,
        event_id: order.event_id,
        order_id: order._id,
        type: 'ADDON_SALE',
        entry_type: 'CREDIT',
        amount: order.gross_addon_amount,
        currency: order.currency,
        notes: `Addon sales for order ${order.order_number}`
      }));
    }

    // 3. Buyer Service Fee (Credit to Platform)
    if (order.buyer_service_fee > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('FEE'),
        tenant_id: order.tenant_id,
        event_id: order.event_id,
        order_id: order._id,
        type: 'BUYER_FEE',
        entry_type: 'CREDIT',
        amount: order.buyer_service_fee,
        currency: order.currency,
        notes: `Buyer-paid service fee for order ${order.order_number}`
      }));
    }

    // 4. Platform Base Commission (Debit from organizer revenue)
    if (order.commission_snapshot.base_commission_amount > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('COMM'),
        tenant_id: order.tenant_id,
        event_id: order.event_id,
        order_id: order._id,
        type: 'PLATFORM_COMMISSION',
        entry_type: 'DEBIT',
        amount: order.commission_snapshot.base_commission_amount,
        currency: order.currency,
        notes: `Brandspyre platform commission (${order.commission_snapshot.rate_percentage}%)`
      }));
    }

    // 5. Commission GST Tax (Debit)
    if (order.commission_snapshot.commission_tax > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('TAX'),
        tenant_id: order.tenant_id,
        event_id: order.event_id,
        order_id: order._id,
        type: 'COMMISSION_TAX',
        entry_type: 'DEBIT',
        amount: order.commission_snapshot.commission_tax,
        currency: order.currency,
        notes: `18% GST on platform commission`
      }));
    }

    // 6. Net Organizer Payable Credit
    entries.push(new EventFinancialTransaction({
      transaction_ref: this.generateRef('NET'),
      tenant_id: order.tenant_id,
      event_id: order.event_id,
      order_id: order._id,
      type: 'ORGANIZER_PAYABLE',
      entry_type: 'CREDIT',
      amount: order.net_organizer_payable,
      currency: order.currency,
      notes: `Net settlement balance payable for order ${order.order_number}`
    }));

    await EventFinancialTransaction.insertMany(entries);

    // Update aggregated stats on Event document
    await Event.updateOne(
      { _id: order.event_id },
      {
        $inc: {
          "stats.total_orders": 1,
          "stats.tickets_sold": order.items.filter(i => i.item_type === 'TICKET').reduce((sum, i) => sum + i.quantity, 0),
          "stats.gross_revenue": order.subtotal,
          "stats.total_commission_collected": order.commission_snapshot.total_commission_deduction
        }
      }
    );

    return entries;
  }

  /**
   * Records ledger entries for order refunds and commission reversals
   */
  static async recordRefund(params: {
    order: IEventOrder;
    refund_id: mongoose.Types.ObjectId;
    refund_amount: number;
    commission_reversed: number;
    reason: string;
  }): Promise<IEventFinancialTransaction[]> {
    const entries: IEventFinancialTransaction[] = [];
    const netOrganizerDebit = Math.max(0, params.refund_amount - params.commission_reversed);

    // 1. Debit organizer payable balance
    entries.push(new EventFinancialTransaction({
      transaction_ref: this.generateRef('RFD-ORG'),
      tenant_id: params.order.tenant_id,
      event_id: params.order.event_id,
      order_id: params.order._id,
      refund_id: params.refund_id,
      type: 'REFUND_ORGANIZER_DEBIT',
      entry_type: 'DEBIT',
      amount: netOrganizerDebit,
      currency: params.order.currency,
      notes: `Refund deduction: ${params.reason}`
    }));

    // 2. Credit commission reversal back to organizer balance
    if (params.commission_reversed > 0) {
      entries.push(new EventFinancialTransaction({
        transaction_ref: this.generateRef('RFD-REV'),
        tenant_id: params.order.tenant_id,
        event_id: params.order.event_id,
        order_id: params.order._id,
        refund_id: params.refund_id,
        type: 'REFUND_COMMISSION_REVERSAL',
        entry_type: 'CREDIT',
        amount: params.commission_reversed,
        currency: params.order.currency,
        notes: `Platform commission reversal on refunded order`
      }));
    }

    await EventFinancialTransaction.insertMany(entries);

    // Update event stats
    await Event.updateOne(
      { _id: params.order.event_id },
      { $inc: { "stats.total_refunded": params.refund_amount } }
    );

    return entries;
  }

  /**
   * Records ledger entry for organizer settlement disbursement
   */
  static async recordSettlementPayout(settlement: IEventSettlement): Promise<IEventFinancialTransaction> {
    const existing = await EventFinancialTransaction.findOne({
      settlement_id: settlement._id,
      type: 'SETTLEMENT_PAYOUT'
    });
    if (existing) {
      return existing;
    }

    const entry = new EventFinancialTransaction({
      transaction_ref: this.generateRef('PAYOUT'),
      tenant_id: settlement.tenant_id,
      event_id: settlement.event_id || undefined,
      settlement_id: settlement._id,
      type: 'SETTLEMENT_PAYOUT',
      entry_type: 'DEBIT',
      amount: settlement.net_payout_amount,
      currency: settlement.currency || 'INR',
      notes: `Settlement payout disbursed via ${settlement.payout_method || 'BANK_TRANSFER'}. Ref: ${settlement.payout_reference || 'N/A'}`
    });

    await entry.save();
    return entry;
  }

  /**
   * Authoritatively computes live balances and settlement eligibility for an organizer.
   * Deducts both already-disbursed payouts and in-flight settlement batches
   * so an organizer only has remaining unsettled amounts eligible for new batches.
   */
  static async getOrganizerBalance(tenant_id: string | mongoose.Types.ObjectId, event_id?: string | mongoose.Types.ObjectId) {
    const matchQuery: any = { tenant_id: new mongoose.Types.ObjectId(tenant_id as string) };
    if (event_id) {
      matchQuery.event_id = new mongoose.Types.ObjectId(event_id as string);
    }

    const txns = await EventFinancialTransaction.find(matchQuery);

    let grossTicketSales = 0;
    let grossAddonSales = 0;
    let platformCommission = 0;
    let commissionTax = 0;
    let buyerFees = 0;
    let refundsDebit = 0;
    let commissionReversals = 0;
    let settlementPayouts = 0;

    for (const t of txns) {
      switch (t.type) {
        case 'TICKET_SALE':
          grossTicketSales += t.amount;
          break;
        case 'ADDON_SALE':
          grossAddonSales += t.amount;
          break;
        case 'PLATFORM_COMMISSION':
          platformCommission += t.amount;
          break;
        case 'COMMISSION_TAX':
          commissionTax += t.amount;
          break;
        case 'BUYER_FEE':
          buyerFees += t.amount;
          break;
        case 'REFUND_ORGANIZER_DEBIT':
          refundsDebit += t.amount;
          break;
        case 'REFUND_COMMISSION_REVERSAL':
          commissionReversals += t.amount;
          break;
        case 'SETTLEMENT_PAYOUT':
          settlementPayouts += t.amount;
          break;
      }
    }

    // Inspect existing settlement statements for this tenant
    const settlementQuery: any = { tenant_id: new mongoose.Types.ObjectId(tenant_id as string) };
    if (event_id) {
      settlementQuery.event_id = new mongoose.Types.ObjectId(event_id as string);
    }
    const allSettlements = await EventSettlement.find(settlementQuery);

    let completedDisbursed = 0;
    let completedGross = 0;
    let completedCommission = 0;

    let inFlightNet = 0;
    let inFlightGross = 0;
    let inFlightCommission = 0;

    for (const st of allSettlements) {
      if (st.status === 'COMPLETED') {
        completedDisbursed += st.net_payout_amount || 0;
        completedGross += st.gross_sales || 0;
        completedCommission += st.total_commission_deducted || 0;
      } else if (['PENDING_APPROVAL', 'APPROVED', 'PROCESSING'].includes(st.status)) {
        inFlightNet += st.net_payout_amount || 0;
        inFlightGross += st.gross_sales || 0;
        inFlightCommission += st.total_commission_deducted || 0;
      }
    }

    // Reconcile total disbursed: ledger transactions vs marked completed settlements
    const effectiveTotalDisbursed = Math.round(Math.max(settlementPayouts, completedDisbursed) * 100) / 100;
    const effectiveInFlight = Math.round(inFlightNet * 100) / 100;

    const totalGross = Math.round((grossTicketSales + grossAddonSales) * 100) / 100;
    const totalCommissionDeductions = Math.round((platformCommission + commissionTax - commissionReversals) * 100) / 100;
    const netEarned = Math.round((totalGross - totalCommissionDeductions - refundsDebit) * 100) / 100;

    // Remaining unbatched, un-disbursed payable balance
    const pendingPayable = Math.max(0, Math.round((netEarned - effectiveTotalDisbursed - effectiveInFlight) * 100) / 100);

    // Remaining unbatched gross sales & commission
    const totalCommittedGross = Math.min(totalGross, completedGross + inFlightGross);
    const remainingGross = Math.max(0, Math.round((totalGross - totalCommittedGross) * 100) / 100);

    const totalCommittedCommission = Math.min(totalCommissionDeductions, completedCommission + inFlightCommission);
    const remainingCommission = Math.max(0, Math.round((totalCommissionDeductions - totalCommittedCommission) * 100) / 100);

    return {
      gross_ticket_sales: Math.round(grossTicketSales * 100) / 100,
      gross_addon_sales: Math.round(grossAddonSales * 100) / 100,
      total_gross_sales: totalGross,
      platform_commission: Math.round(platformCommission * 100) / 100,
      commission_tax: Math.round(commissionTax * 100) / 100,
      total_commission_deductions: totalCommissionDeductions,
      buyer_fees: Math.round(buyerFees * 100) / 100,
      refunds_deducted: Math.round(refundsDebit * 100) / 100,
      net_earned: netEarned,
      total_payouts_disbursed: effectiveTotalDisbursed,
      total_settled_disbursed: effectiveTotalDisbursed,
      in_flight_settlement_amount: effectiveInFlight,
      pending_payable_balance: pendingPayable,
      remaining_gross_sales: remainingGross,
      remaining_commission_deductions: remainingCommission,
      currency: 'INR'
    };
  }
}

export default EventLedgerService;
