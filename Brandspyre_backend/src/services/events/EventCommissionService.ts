import mongoose from "mongoose";
import {
  EventCommissionRule,
  IEventCommissionRule,
  CommissionScope,
  CommissionModel,
  CommissionFeePayer,
  CommissionAppliesTo
} from "../../db/ModelSceham/eventSchema";
import { TenantSubscription } from "../../db/ModelSceham/saasSchema";

export interface CommissionCalculationItem {
  type: 'TICKET' | 'ADDON';
  unit_price: number;
  quantity: number;
}

export interface CommissionCalculationResult {
  rule_id?: mongoose.Types.ObjectId;
  scope: CommissionScope;
  model: CommissionModel;
  rate_percentage: number;
  fixed_fee: number;
  applies_to: CommissionAppliesTo;
  fee_payer: CommissionFeePayer;

  gross_ticket_amount: number;
  gross_addon_amount: number;
  subtotal: number;
  
  buyer_service_fee: number;
  total_payable_by_customer: number;

  base_commission_amount: number;
  commission_tax: number;
  total_commission_deduction: number;
  net_organizer_payable: number;

  currency: string;
}

export class EventCommissionService {
  /**
   * Resolves the authoritative commission rule for an event by strict precedence:
   * 1. Event Override (if specified on event and active)
   * 2. Organization Rule (tenant_id)
   * 3. Subscription Plan Rule (tenant's current active subscription plan)
   * 4. Platform Global Default
   */
  static async resolveRule(params: {
    tenant_id: string | mongoose.Types.ObjectId;
    event_id?: string | mongoose.Types.ObjectId;
    override_rule_id?: string | mongoose.Types.ObjectId;
  }): Promise<IEventCommissionRule> {
    const now = new Date();

    // 1. Explicit Event Override Rule
    if (params.override_rule_id) {
      const eventRule = await EventCommissionRule.findOne({
        _id: params.override_rule_id,
        is_active: true,
        effective_from: { $lte: now },
        $or: [{ effective_until: { $exists: false } }, { effective_until: { $gte: now } }]
      });
      if (eventRule) return eventRule;
    }

    if (params.event_id) {
      const eventRule = await EventCommissionRule.findOne({
        event_id: params.event_id,
        scope: 'EVENT',
        is_active: true,
        effective_from: { $lte: now },
        $or: [{ effective_until: { $exists: false } }, { effective_until: { $gte: now } }]
      });
      if (eventRule) return eventRule;
    }

    // 2. Organization Specific Rule
    const orgRule = await EventCommissionRule.findOne({
      tenant_id: params.tenant_id,
      scope: 'ORGANIZATION',
      is_active: true,
      effective_from: { $lte: now },
      $or: [{ effective_until: { $exists: false } }, { effective_until: { $gte: now } }]
    });
    if (orgRule) return orgRule;

    // 3. Subscription Plan Rule
    const sub = await TenantSubscription.findOne({
      tenant_id: params.tenant_id,
      status: { $in: ['active', 'trial', 'grace'] }
    });

    if (sub && sub.plan_id) {
      const planRule = await EventCommissionRule.findOne({
        plan_id: sub.plan_id,
        scope: 'PLAN',
        is_active: true,
        effective_from: { $lte: now },
        $or: [{ effective_until: { $exists: false } }, { effective_until: { $gte: now } }]
      });
      if (planRule) return planRule;
    }

    // 4. Global Platform Default Rule
    const globalRule = await EventCommissionRule.findOne({
      scope: 'GLOBAL',
      is_active: true,
      effective_from: { $lte: now },
      $or: [{ effective_until: { $exists: false } }, { effective_until: { $gte: now } }]
    }).sort({ created_at: -1 });

    if (globalRule) return globalRule;

    // In-memory fallback if database has not initialized global default yet
    return {
      scope: 'GLOBAL',
      commission_model: 'PERCENTAGE',
      rate_percentage: 5,
      fixed_fee: 0,
      currency: 'INR',
      applies_to: 'TICKETS_AND_ADDONS',
      fee_payer: 'ORGANIZER',
      tax_percentage: 18,
      is_active: true,
      version: 1
    } as any;
  }

  /**
   * Deterministically calculates immutable commission and fees for an order
   */
  static calculate(
    rule: IEventCommissionRule,
    items: CommissionCalculationItem[],
    discountAmount: number = 0
  ): CommissionCalculationResult {
    let grossTicketAmount = 0;
    let grossAddonAmount = 0;
    let ticketCount = 0;
    let addonCount = 0;

    for (const item of items) {
      const subtotal = Math.round(item.unit_price * item.quantity * 100) / 100;
      if (item.type === 'TICKET') {
        grossTicketAmount += subtotal;
        ticketCount += item.quantity;
      } else {
        grossAddonAmount += subtotal;
        addonCount += item.quantity;
      }
    }

    grossTicketAmount = Math.round(grossTicketAmount * 100) / 100;
    grossAddonAmount = Math.round(grossAddonAmount * 100) / 100;
    const subtotal = Math.max(0, Math.round((grossTicketAmount + grossAddonAmount - discountAmount) * 100) / 100);

    // Determine base amount eligible for commission
    let commissionableAmount = 0;
    let commissionableUnits = 0;

    if (rule.applies_to === 'TICKETS_ONLY') {
      commissionableAmount = Math.max(0, grossTicketAmount - discountAmount);
      commissionableUnits = ticketCount;
    } else {
      commissionableAmount = subtotal;
      commissionableUnits = ticketCount + addonCount;
    }

    // Calculate Platform Base Commission
    const commModel = rule.commission_model || (rule as any).model || 'PERCENTAGE';
    let baseCommission = 0;
    if (commModel === 'PERCENTAGE') {
      baseCommission = (commissionableAmount * (rule.rate_percentage || 0)) / 100;
    } else if (commModel === 'FIXED_PER_TICKET') {
      baseCommission = commissionableUnits * (rule.fixed_fee || 0);
    } else if (commModel === 'PERCENTAGE_PLUS_FIXED') {
      baseCommission = ((commissionableAmount * (rule.rate_percentage || 0)) / 100) + (commissionableUnits * (rule.fixed_fee || 0));
    }

    // Apply Min/Max Caps
    if (rule.min_commission_cap !== undefined && rule.min_commission_cap > 0 && baseCommission > 0) {
      baseCommission = Math.max(baseCommission, rule.min_commission_cap);
    }
    if (rule.max_commission_cap !== undefined && rule.max_commission_cap > 0) {
      baseCommission = Math.min(baseCommission, rule.max_commission_cap);
    }
    baseCommission = Math.round(baseCommission * 100) / 100;

    // Commission GST (18%)
    const taxRate = rule.tax_percentage ?? 18;
    const commissionTax = Math.round(((baseCommission * taxRate) / 100) * 100) / 100;
    const totalCommissionDeduction = Math.round((baseCommission + commissionTax) * 100) / 100;

    // Buyer-paid Service Fees
    let buyerServiceFee = 0;
    if (rule.fee_payer === 'BUYER' || rule.fee_payer === 'HYBRID') {
      if (rule.fee_payer === 'BUYER') {
        buyerServiceFee = totalCommissionDeduction;
      } else {
        const buyerPerc = rule.buyer_service_fee_percentage || 0;
        const buyerFixed = (rule.buyer_fixed_fee || 0) * ticketCount;
        buyerServiceFee = Math.round((((subtotal * buyerPerc) / 100) + buyerFixed) * 100) / 100;
      }
    }

    // Customer Total Payable
    const totalPayableByCustomer = Math.round((subtotal + buyerServiceFee) * 100) / 100;

    // Net Organizer Payable Calculation
    let netOrganizerPayable = 0;
    if (rule.fee_payer === 'ORGANIZER') {
      netOrganizerPayable = Math.max(0, Math.round((subtotal - totalCommissionDeduction) * 100) / 100);
    } else if (rule.fee_payer === 'BUYER') {
      netOrganizerPayable = subtotal; // Buyer absorbed the commission
    } else {
      // Hybrid: organizer absorbs base commission, buyer paid additional fee
      netOrganizerPayable = Math.max(0, Math.round((subtotal - totalCommissionDeduction) * 100) / 100);
    }

    return {
      rule_id: (rule as any)._id,
      scope: rule.scope,
      model: commModel,
      rate_percentage: rule.rate_percentage || 0,
      fixed_fee: rule.fixed_fee || 0,
      applies_to: rule.applies_to,
      fee_payer: rule.fee_payer,

      gross_ticket_amount: grossTicketAmount,
      gross_addon_amount: grossAddonAmount,
      subtotal,

      buyer_service_fee: buyerServiceFee,
      total_payable_by_customer: totalPayableByCustomer,

      base_commission_amount: baseCommission,
      commission_tax: commissionTax,
      total_commission_deduction: totalCommissionDeduction,
      net_organizer_payable: netOrganizerPayable,

      currency: rule.currency || 'INR'
    };
  }
}

export default EventCommissionService;
