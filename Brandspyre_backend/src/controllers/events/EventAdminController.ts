import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  Event,
  EventCommissionRule,
  EventOrder,
  EventSettlement,
  EventFinancialTransaction
} from "../../db/ModelSceham/eventSchema";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import EventSettlementService from "../../services/events/EventSettlementService";
import EventLedgerService from "../../services/events/EventLedgerService";

export class EventAdminController {
  private static getAdminUserId(req: any): mongoose.Types.ObjectId {
    const uid = req.user?.userId || req.user?.id;
    if (!uid) throw new Error('Platform admin user context missing.');
    return new mongoose.Types.ObjectId(uid.toString());
  }

  /**
   * GET /api/platform-admin/events/overview - Platform-wide Financial Overview
   */
  static async getPlatformOverview(req: Request, res: Response): Promise<void> {
    try {
      const [totalEvents, publishedEvents, totalOrders] = await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ status: 'PUBLISHED' }),
        EventOrder.countDocuments({ status: 'PAID' })
      ]);

      // Aggregate ledger across platform
      const ledgerAgg = await EventFinancialTransaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      let gmv = 0;
      let platformCommission = 0;
      let commissionTax = 0;
      let commissionReversals = 0;
      let totalPayoutsDisbursed = 0;
      let totalRefunds = 0;

      for (const row of ledgerAgg) {
        if (row._id === 'TICKET_SALE' || row._id === 'ADDON_SALE') {
          gmv += row.totalAmount;
        } else if (row._id === 'PLATFORM_COMMISSION') {
          platformCommission += row.totalAmount;
        } else if (row._id === 'COMMISSION_TAX') {
          commissionTax += row.totalAmount;
        } else if (row._id === 'REFUND_COMMISSION_REVERSAL') {
          commissionReversals += row.totalAmount;
        } else if (row._id === 'SETTLEMENT_PAYOUT') {
          totalPayoutsDisbursed += row.totalAmount;
        } else if (row._id === 'REFUND_ORGANIZER_DEBIT') {
          totalRefunds += row.totalAmount;
        }
      }

      const netCommissionEarned = Math.round((platformCommission + commissionTax - commissionReversals) * 100) / 100;
      const organizerPayableBalance = Math.max(0, Math.round((gmv - netCommissionEarned - totalRefunds - totalPayoutsDisbursed) * 100) / 100);

      const pendingSettlementsCount = await EventSettlement.countDocuments({ status: 'PENDING_APPROVAL' });

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            total_events: totalEvents,
            published_events: publishedEvents,
            total_orders: totalOrders,
            platform_gmv: Math.round(gmv * 100) / 100,
            platform_commission_earned: netCommissionEarned,
            total_refunds_processed: Math.round(totalRefunds * 100) / 100,
            total_payouts_disbursed: Math.round(totalPayoutsDisbursed * 100) / 100,
            organizer_payable_balance: organizerPayableBalance,
            pending_settlements_count: pendingSettlementsCount,
            currency: 'INR'
          }
        }
      });
    } catch (err: any) {
      console.error('[EventAdminController.getPlatformOverview] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch platform metrics.' });
    }
  }

  /**
   * GET /api/platform-admin/events - Cross-organization event list
   */
  static async listAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = (req.query.search as string || '').trim();
      const status = (req.query.status as string || '').trim();

      const query: any = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { organizer_name: { $regex: search, $options: 'i' } }
        ];
      }
      if (status && status !== 'ALL') {
        query.status = status;
      }

      const total = await Event.countDocuments(query);
      const events = await Event.find(query)
        .populate('tenant_id', 'company_name name domain subscription_status')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: events,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/platform-admin/events/:id/moderate - Moderate event
   */
  static async moderateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, is_featured, rejection_reason } = req.body;
      const adminId = EventAdminController.getAdminUserId(req);

      const event = await Event.findById(id);
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found.' });
        return;
      }

      if (status) {
        event.status = status;
        if (status === 'PUBLISHED') {
          event.approval_status = 'APPROVED';
          event.approved_by = adminId;
          event.approved_at = new Date();
        } else if (status === 'DRAFT' && rejection_reason) {
          event.approval_status = 'REJECTED';
          event.rejection_reason = rejection_reason;
        }
      }

      if (is_featured !== undefined) {
        event.is_featured = !!is_featured;
      }

      await event.save();

      res.status(200).json({
        success: true,
        message: 'Event moderation status updated.',
        data: event
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ============================================================
  // COMMISSION RULES MANAGEMENT
  // ============================================================
  static async getCommissionRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await EventCommissionRule.find()
        .populate('plan_id', 'plan_name plan_code')
        .populate('tenant_id', 'company_name name')
        .populate('event_id', 'title slug')
        .sort({ scope: 1, created_at: -1 });

      res.status(200).json({ success: true, data: rules });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async saveCommissionRule(req: Request, res: Response): Promise<void> {
    try {
      const adminId = EventAdminController.getAdminUserId(req);
      const {
        id,
        rule_code,
        scope,
        plan_id,
        tenant_id,
        event_id,
        model,
        rate_percentage,
        fixed_fee,
        applies_to,
        fee_payer,
        min_commission_cap,
        max_commission_cap,
        tax_percentage,
        is_active,
        notes
      } = req.body;

      if (!scope || !model) {
        res.status(400).json({ success: false, message: 'Scope and commission model are required.' });
        return;
      }

      if (id) {
        const existingRule = await EventCommissionRule.findById(id);
        if (!existingRule) {
          res.status(404).json({ success: false, message: 'Commission rule not found.' });
          return;
        }

        existingRule.commission_model = model || existingRule.commission_model;
        existingRule.rate_percentage = rate_percentage !== undefined ? parseFloat(rate_percentage) : existingRule.rate_percentage;
        existingRule.fixed_fee = fixed_fee !== undefined ? parseFloat(fixed_fee) : existingRule.fixed_fee;
        existingRule.applies_to = applies_to || existingRule.applies_to;
        existingRule.fee_payer = fee_payer || existingRule.fee_payer;
        existingRule.min_commission_cap = min_commission_cap;
        existingRule.max_commission_cap = max_commission_cap;
        existingRule.tax_percentage = tax_percentage !== undefined ? parseFloat(tax_percentage) : existingRule.tax_percentage;
        if (is_active !== undefined) existingRule.is_active = is_active;
        if (notes !== undefined) existingRule.notes = notes;
        existingRule.updated_by = adminId;
        existingRule.version = (existingRule.version || 1) + 1;

        await existingRule.save();
        res.status(200).json({ success: true, message: 'Commission rule updated.', data: existingRule });
      } else {
        const code = rule_code || `COMM-${scope}-${Date.now().toString(36).toUpperCase()}`;

        const newRule = new EventCommissionRule({
          rule_code: code,
          scope,
          plan_id: plan_id ? new mongoose.Types.ObjectId(plan_id) : undefined,
          tenant_id: tenant_id ? new mongoose.Types.ObjectId(tenant_id) : undefined,
          event_id: event_id ? new mongoose.Types.ObjectId(event_id) : undefined,
          commission_model: model || 'PERCENTAGE',
          rate_percentage: parseFloat(rate_percentage) || 0,
          fixed_fee: parseFloat(fixed_fee) || 0,
          applies_to: applies_to || 'TICKETS_AND_ADDONS',
          fee_payer: fee_payer || 'ORGANIZER',
          min_commission_cap: min_commission_cap ? parseFloat(min_commission_cap) : undefined,
          max_commission_cap: max_commission_cap ? parseFloat(max_commission_cap) : undefined,
          tax_percentage: tax_percentage ? parseFloat(tax_percentage) : 18,
          is_active: is_active !== false,
          created_by: adminId,
          notes
        });

        await newRule.save();
        res.status(201).json({ success: true, message: 'Commission rule created.', data: newRule });
      }
    } catch (err: any) {
      console.error('[EventAdminController.saveCommissionRule] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to save commission rule.' });
    }
  }

  // ============================================================
  // SETTLEMENTS ADMINISTRATION
  // ============================================================
  static async listSettlements(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15));
      const status = req.query.status as string;

      const query: any = {};
      if (status && status !== 'ALL') query.status = status;

      const total = await EventSettlement.countDocuments(query);
      const settlements = await EventSettlement.find(query)
        .populate('tenant_id', 'company_name name')
        .populate('event_id', 'title')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: settlements,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async generateSettlementBatch(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id, event_id, period_start, period_end, notes } = req.body;
      if (!tenant_id || !period_start || !period_end) {
        res.status(400).json({ success: false, message: 'Tenant ID, start date, and end date are required.' });
        return;
      }

      const result = await EventSettlementService.createSettlement({
        tenant_id,
        event_id,
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        notes
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json({ success: true, message: 'Settlement batch created.', data: result.settlement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async approveSettlement(req: Request, res: Response): Promise<void> {
    try {
      const adminId = EventAdminController.getAdminUserId(req);
      const { id } = req.params;

      const settlement = await EventSettlementService.approveSettlement(id, adminId.toString());
      res.status(200).json({ success: true, message: 'Settlement batch approved.', data: settlement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async disburseSettlement(req: Request, res: Response): Promise<void> {
    try {
      const adminId = EventAdminController.getAdminUserId(req);
      const { id } = req.params;
      const { payout_method, payout_reference, notes } = req.body;

      if (!payout_reference) {
        res.status(400).json({ success: false, message: 'Payout reference / UTR transaction code is required.' });
        return;
      }

      const settlement = await EventSettlementService.markDisbursed({
        settlement_id: id,
        admin_user_id: adminId.toString(),
        payout_method: payout_method || 'BANK_TRANSFER',
        payout_reference,
        notes
      });

      res.status(200).json({ success: true, message: 'Payout disbursement confirmed and ledger updated.', data: settlement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async cancelSettlement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const settlement = await EventSettlementService.cancelSettlement(id, reason);
      res.status(200).json({ success: true, message: 'Settlement batch cancelled.', data: settlement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async deleteSettlement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await EventSettlementService.deleteSettlement(id);
      res.status(200).json({ success: true, message: 'Settlement batch deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default EventAdminController;
