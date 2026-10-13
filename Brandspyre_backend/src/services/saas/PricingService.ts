import mongoose from 'mongoose';
import { SubscriptionPlan, TenantSubscription } from '../../db/ModelSceham/saasSchema';
import { ModulePricing, Addon, SubscriptionPriceSnapshot, PlatformTaxConfig } from '../../db/ModelSceham/pricingSchema';
import { PlanModuleAllowance } from '../../db/ModelSceham/industryModuleSchema';
import { Coupon } from '../../db/ModelSceham/subscriptionSystemSchema';

export interface IPricingCalculationParams {
  planId?: string;
  planCode?: string;
  businessTypeCode?: string;
  moduleCodes?: string[];
  addonCodes?: string[];
  billingCycle?: 'monthly' | 'yearly';
  discountCode?: string;
  customDiscountPercent?: number;
  tenantId?: string;
}

export interface IPricingCalculationResult {
  planName: string;
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  basePlanPrice: number;
  moduleAddonsPrice: number;
  featureAddonsPrice: number;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  itemizedBreakdown: Array<{
    title: string;
    type: 'BASE_PLAN' | 'MODULE_ADDON' | 'FEATURE_ADDON' | 'DISCOUNT' | 'TAX';
    amount: number;
  }>;
  modulesBreakdown: Array<{
    moduleCode: string;
    isIncluded: boolean;
    price: number;
  }>;
  addonsBreakdown: Array<{
    addonCode: string;
    price: number;
  }>;
}

export class PricingService {
  /**
   * Server-side dynamic price calculation engine
   */
  static async calculateSubscriptionPrice(params: IPricingCalculationParams): Promise<IPricingCalculationResult> {
    const billingCycle = params.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const currency = 'INR';

    // 1. Resolve Subscription Plan
    let planDoc: any = null;
    if (params.planId && mongoose.Types.ObjectId.isValid(params.planId)) {
      planDoc = await SubscriptionPlan.findById(params.planId);
    } else if (params.planId) {
      planDoc = await SubscriptionPlan.findOne({ plan_code: params.planId.toLowerCase() });
    }
    if (!planDoc && params.planCode) {
      planDoc = await SubscriptionPlan.findOne({ plan_code: params.planCode.toLowerCase() });
    }

    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({ plan_code: 'starter' });
    }

    const planCode = planDoc?.plan_code || 'starter';
    const planName = planDoc?.plan_name || 'Starter Plan';

    const basePlanPrice = billingCycle === 'yearly'
      ? (planDoc?.price_yearly || planDoc?.price_monthly * 12 || 0)
      : (planDoc?.price_monthly || 0);

    const itemizedBreakdown: Array<{ title: string; type: 'BASE_PLAN' | 'MODULE_ADDON' | 'FEATURE_ADDON' | 'DISCOUNT' | 'TAX'; amount: number }> = [];
    itemizedBreakdown.push({
      title: `${planName} (${billingCycle.toUpperCase()})`,
      type: 'BASE_PLAN',
      amount: basePlanPrice
    });

    // 2. Resolve Module Allowances & Add-on Prices
    let moduleAddonsPrice = 0;
    const modulesBreakdown: Array<{ moduleCode: string; isIncluded: boolean; price: number }> = [];
    
    if (params.moduleCodes && params.moduleCodes.length > 0) {
      const planAllowances = await PlanModuleAllowance.find({ plan_code: planCode, is_included: true });
      const includedCodes = new Set(planAllowances.map((pa) => pa.module_code));

      for (const mCode of params.moduleCodes) {
        const codeUpper = mCode.toUpperCase();
        // Core modules are always included
        if (['DASHBOARD', 'ORGANIZATION', 'NOTIFICATIONS', 'ADMINISTRATION'].includes(codeUpper)) {
          modulesBreakdown.push({ moduleCode: codeUpper, isIncluded: true, price: 0 });
          continue;
        }

        const isInc = includedCodes.has(codeUpper);
        let addPrice = 0;

        if (!isInc) {
          const pricingDoc = await ModulePricing.findOne({ module_code: codeUpper, is_active: true });
          if (pricingDoc) {
            addPrice = billingCycle === 'yearly' ? pricingDoc.yearly_price : pricingDoc.monthly_price;
            moduleAddonsPrice += addPrice;
            itemizedBreakdown.push({
              title: `Module Add-on: ${pricingDoc.module_name || codeUpper}`,
              type: 'MODULE_ADDON',
              amount: addPrice
            });
          }
        }

        modulesBreakdown.push({ moduleCode: codeUpper, isIncluded: isInc, price: addPrice });
      }
    }

    // 3. Resolve Feature Add-on Prices
    let featureAddonsPrice = 0;
    const addonsBreakdown: Array<{ addonCode: string; price: number }> = [];

    if (params.addonCodes && params.addonCodes.length > 0) {
      for (const aCode of params.addonCodes) {
        const addonDoc = await Addon.findOne({ addon_code: aCode, is_active: true });
        if (addonDoc) {
          const aPrice = billingCycle === 'yearly' ? addonDoc.yearly_price : addonDoc.monthly_price;
          featureAddonsPrice += aPrice;
          addonsBreakdown.push({ addonCode: aCode, price: aPrice });
          itemizedBreakdown.push({
            title: `Add-on: ${addonDoc.name}`,
            type: 'FEATURE_ADDON',
            amount: aPrice
          });
        }
      }
    }

    const subtotal = basePlanPrice + moduleAddonsPrice + featureAddonsPrice;

    // 4. Calculate Discounts (Coupon or custom percentage)
    let discountAmount = 0;
    if (params.discountCode) {
      const couponDoc = await Coupon.findOne({ code: params.discountCode.toUpperCase(), is_active: true });
      if (couponDoc && new Date() >= couponDoc.valid_from && new Date() <= couponDoc.valid_until) {
        if (couponDoc.discount_type === 'percentage') {
          discountAmount = (subtotal * couponDoc.discount_value) / 100;
          if (couponDoc.max_discount_amount && discountAmount > couponDoc.max_discount_amount) {
            discountAmount = couponDoc.max_discount_amount;
          }
        } else {
          discountAmount = couponDoc.discount_value;
        }
      }
    } else if (params.customDiscountPercent && params.customDiscountPercent > 0) {
      discountAmount = (subtotal * Math.min(100, params.customDiscountPercent)) / 100;
    }

    if (discountAmount > subtotal) discountAmount = subtotal;

    if (discountAmount > 0) {
      itemizedBreakdown.push({
        title: 'Discount Applied',
        type: 'DISCOUNT',
        amount: -discountAmount
      });
    }

    const taxableAmount = subtotal - discountAmount;

    // 5. Calculate Taxes
    let taxRate = 18; // Default GST 18%
    const taxConfig = await PlatformTaxConfig.findOne({ is_active: true });
    if (taxConfig) {
      taxRate = taxConfig.tax_percentage;
    }

    const taxAmount = (taxableAmount * taxRate) / 100;
    itemizedBreakdown.push({
      title: `Tax (${taxConfig?.tax_name || 'GST'} ${taxRate}%)`,
      type: 'TAX',
      amount: taxAmount
    });

    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    return {
      planName,
      planCode,
      billingCycle,
      currency,
      basePlanPrice,
      moduleAddonsPrice,
      featureAddonsPrice,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      itemizedBreakdown,
      modulesBreakdown,
      addonsBreakdown
    };
  }

  /**
   * Save Subscription Price Snapshot to lock in subscriber pricing
   */
  static async savePriceSnapshot(
    tenantId: string | mongoose.Types.ObjectId,
    subscriptionId: string | mongoose.Types.ObjectId,
    pricingResult: IPricingCalculationResult
  ): Promise<any> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const sId = new mongoose.Types.ObjectId(subscriptionId as string);

    const activeSub = await TenantSubscription.findById(sId);

    return await SubscriptionPriceSnapshot.create({
      tenant_id: tId,
      subscription_id: sId,
      plan_id: activeSub?.plan_id,
      plan_code: pricingResult.planCode,
      plan_base_price: pricingResult.basePlanPrice,
      billing_cycle: pricingResult.billingCycle,
      currency: pricingResult.currency,
      modules_breakdown: pricingResult.modulesBreakdown.map((m) => ({
        module_code: m.moduleCode,
        is_included: m.isIncluded,
        addon_price: m.price
      })),
      addons_breakdown: pricingResult.addonsBreakdown.map((a) => ({
        addon_code: a.addonCode,
        addon_price: a.price
      })),
      subtotal: pricingResult.subtotal,
      discount_amount: pricingResult.discountAmount,
      tax_rate: pricingResult.taxRate,
      tax_amount: pricingResult.taxAmount,
      final_amount: pricingResult.totalAmount,
      locked_at: new Date()
    });
  }
}

export default PricingService;
