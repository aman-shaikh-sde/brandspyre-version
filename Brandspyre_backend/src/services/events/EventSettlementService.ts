import mongoose from "mongoose";
import crypto from "crypto";
import { EventSettlement, IEventSettlement } from "../../db/ModelSceham/eventSchema";
import EventLedgerService from "./EventLedgerService";

export class EventSettlementService {
  /**
   * Generates a settlement batch for an organizer
   */
  static async createSettlement(params: {
    tenant_id: string | mongoose.Types.ObjectId;
    event_id?: string | mongoose.Types.ObjectId;
    period_start: Date;
    period_end: Date;
    notes?: string;
  }): Promise<{ success: boolean; settlement?: IEventSettlement; message?: string }> {
    const balance = await EventLedgerService.getOrganizerBalance(params.tenant_id, params.event_id);

    if (balance.pending_payable_balance <= 0) {
      const msg = (balance.in_flight_settlement_amount && balance.in_flight_settlement_amount > 0)
        ? `No remaining payable balance. Active settlement batches worth ${balance.currency || 'INR'} ${balance.in_flight_settlement_amount.toLocaleString()} are already pending approval/payout.`
        : `No remaining payable balance eligible for settlement. All net earnings have already been disbursed.`;
      return {
        success: false,
        message: msg
      };
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const settlementNumber = `STL-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const grossSalesToBatch = (balance.remaining_gross_sales !== undefined && balance.remaining_gross_sales > 0)
      ? balance.remaining_gross_sales
      : balance.total_gross_sales;

    const commissionToBatch = (balance.remaining_commission_deductions !== undefined && balance.remaining_commission_deductions > 0)
      ? balance.remaining_commission_deductions
      : balance.total_commission_deductions;

    const settlement = new EventSettlement({
      settlement_number: settlementNumber,
      tenant_id: params.tenant_id,
      event_id: params.event_id,
      period_start: params.period_start,
      period_end: params.period_end,
      gross_sales: grossSalesToBatch,
      total_commission_deducted: commissionToBatch,
      total_refunds_deducted: balance.refunds_deducted || 0,
      net_payout_amount: balance.pending_payable_balance,
      currency: balance.currency || 'INR',
      status: 'PENDING_APPROVAL',
      notes: params.notes || 'Automated batch settlement generation'
    });

    await settlement.save();

    return {
      success: true,
      settlement
    };
  }

  /**
   * Approves a settlement batch (Platform Admin)
   */
  static async approveSettlement(settlement_id: string, admin_user_id: string): Promise<IEventSettlement> {
    const settlement = await EventSettlement.findById(settlement_id);
    if (!settlement) {
      throw new Error('Settlement batch not found.');
    }

    if (settlement.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve settlement in '${settlement.status}' status.`);
    }

    settlement.status = 'APPROVED';
    settlement.approved_by = new mongoose.Types.ObjectId(admin_user_id);
    settlement.approved_at = new Date();
    await settlement.save();

    return settlement;
  }

  /**
   * Records payout disbursement and writes ledger entry
   */
  static async markDisbursed(params: {
    settlement_id: string;
    admin_user_id: string;
    payout_method: 'BANK_TRANSFER' | 'RAZORPAY_PAYOUT' | 'MANUAL_NEFT';
    payout_reference: string;
    notes?: string;
  }): Promise<IEventSettlement> {
    const settlement = await EventSettlement.findById(params.settlement_id);
    if (!settlement) {
      throw new Error('Settlement not found.');
    }

    if (settlement.status !== 'APPROVED' && settlement.status !== 'PROCESSING') {
      throw new Error(`Cannot disburse settlement with status '${settlement.status}'. Approval required first.`);
    }

    settlement.status = 'COMPLETED';
    settlement.payout_method = params.payout_method;
    settlement.payout_reference = params.payout_reference;
    settlement.paid_at = new Date();
    settlement.disbursed_by = new mongoose.Types.ObjectId(params.admin_user_id);
    if (params.notes) settlement.notes = params.notes;

    await settlement.save();

    // Persist debit entry in financial ledger
    await EventLedgerService.recordSettlementPayout(settlement);

    return settlement;
  }

  /**
   * Cancels/Reverses an un-disbursed settlement batch (Platform Admin)
   */
  static async cancelSettlement(settlement_id: string, reason?: string): Promise<IEventSettlement> {
    const settlement = await EventSettlement.findById(settlement_id);
    if (!settlement) {
      throw new Error('Settlement batch not found.');
    }

    if (settlement.status === 'COMPLETED') {
      throw new Error('Cannot cancel a settlement that has already been disbursed to the organizer.');
    }

    settlement.status = 'REVERSED';
    settlement.notes = (settlement.notes ? settlement.notes + ' | ' : '') + (reason || 'Cancelled by platform admin');
    await settlement.save();

    return settlement;
  }

  /**
   * Deletes a pending/draft settlement batch to release reserved funds
   */
  static async deleteSettlement(settlement_id: string): Promise<void> {
    const settlement = await EventSettlement.findById(settlement_id);
    if (!settlement) {
      throw new Error('Settlement batch not found.');
    }

    if (settlement.status === 'COMPLETED') {
      throw new Error('Cannot delete a settlement that has already been disbursed to the organizer.');
    }

    await EventSettlement.findByIdAndDelete(settlement_id);
  }
}

export default EventSettlementService;
