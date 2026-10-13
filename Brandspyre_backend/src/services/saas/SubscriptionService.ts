import mongoose from 'mongoose';
import {
  TenantSubscription,
  SubscriptionPlan,
  Tenant,
  ITenantSubscription,
  ISubscriptionPlan
} from '../../db/ModelSceham/saasSchema';
import { Addon, ModulePricing, PlatformTaxConfig } from '../../db/ModelSceham/pricingSchema';
import { BusinessType } from '../../db/ModelSceham/businessTypeSchema';

export interface PriceCalculationPayload {
  businessTypeCode?: string;
  planCode?: string;
  billingCycle?: 'monthly' | 'yearly';
  additionalUsers?: number;
  additionalBranches?: number;
  additionalStorageGB?: number;
  selectedAddons?: string[];
  selectedModules?: string[];
  discountCode?: string;
  discountAmount?: number;
  taxRate?: number;
}

export class SubscriptionService {
  /**
   * Authoritative Price Calculation Engine (Server-Side Source of Truth)
   */
  static async calculateSubscriptionPrice(payload: PriceCalculationPayload) {
    const billingCycle = payload.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const planCode = payload.planCode || 'retail_starter';

    // 1. Resolve Commercial Category from Business Type
    let commercialCategory = 'RETAIL_PACKAGE';
    if (payload.businessTypeCode) {
      const bt = await BusinessType.findOne({ code: payload.businessTypeCode });
      if (bt && (bt.industry_code === 'TECH' || bt.industry_code === 'SERVICES' || bt.name.toLowerCase().includes('software') || bt.name.toLowerCase().includes('consulting'))) {
        commercialCategory = 'BUSINESS_SERVICES_PACKAGE';
      }
    }

    // 2. Fetch Base Plan from Database
    let plan = await SubscriptionPlan.findOne({ plan_code: planCode });
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ plan_code: 'retail_starter' });
    }
    if (!plan) {
      throw new Error(`Subscription plan '${planCode}' not found in database.`);
    }

    const baseAmount = billingCycle === 'yearly' ? (plan.price_yearly || 0) : (plan.price_monthly || 0);

    // 3. Resource Add-ons Calculation
    const resourceAddons: Array<{ code: string; name: string; quantity: number; unitPrice: number; totalAmount: number }> = [];

    // Additional Users
    if (payload.additionalUsers && payload.additionalUsers > 0) {
      const userAddon = await Addon.findOne({ addon_code: 'ADDITIONAL_USER' });
      const unitPrice = userAddon ? (billingCycle === 'yearly' && userAddon.yearly_price != null ? userAddon.yearly_price : userAddon.monthly_price * (billingCycle === 'yearly' ? 12 : 1)) : 99 * (billingCycle === 'yearly' ? 12 : 1);
      resourceAddons.push({
        code: 'ADDITIONAL_USER',
        name: 'Additional User Slots',
        quantity: payload.additionalUsers,
        unitPrice,
        totalAmount: unitPrice * payload.additionalUsers
      });
    }

    // Additional Branches
    if (payload.additionalBranches && payload.additionalBranches > 0) {
      const branchAddon = await Addon.findOne({ addon_code: 'ADDITIONAL_BRANCH' });
      const unitPrice = branchAddon ? (billingCycle === 'yearly' && branchAddon.yearly_price != null ? branchAddon.yearly_price : branchAddon.monthly_price * (billingCycle === 'yearly' ? 12 : 1)) : 199 * (billingCycle === 'yearly' ? 12 : 1);
      resourceAddons.push({
        code: 'ADDITIONAL_BRANCH',
        name: 'Additional Branch Locations',
        quantity: payload.additionalBranches,
        unitPrice,
        totalAmount: unitPrice * payload.additionalBranches
      });
    }

    // Additional Storage
    if (payload.additionalStorageGB && payload.additionalStorageGB > 0) {
      const storageAddon = await Addon.findOne({ addon_code: 'ADDITIONAL_STORAGE' });
      const unitPrice = storageAddon ? (billingCycle === 'yearly' && storageAddon.yearly_price != null ? storageAddon.yearly_price : storageAddon.monthly_price * (billingCycle === 'yearly' ? 12 : 1)) : 99 * (billingCycle === 'yearly' ? 12 : 1);
      resourceAddons.push({
        code: 'ADDITIONAL_STORAGE',
        name: 'Additional Storage Capacity',
        quantity: payload.additionalStorageGB,
        unitPrice,
        totalAmount: unitPrice * payload.additionalStorageGB
      });
    }

    // 4. Feature & Bundle Add-ons Calculation
    const featureAddons: Array<{ code: string; name: string; amount: number; hasConfiguredYearly: boolean }> = [];
    if (payload.selectedAddons && payload.selectedAddons.length > 0) {
      for (const addonCode of payload.selectedAddons) {
        const addonObj = await Addon.findOne({ addon_code: addonCode, is_active: true });
        if (addonObj) {
          const hasConfiguredYearly = addonObj.yearly_price != null;
          const amount = billingCycle === 'yearly'
            ? (hasConfiguredYearly ? addonObj.yearly_price! : addonObj.monthly_price * 12)
            : addonObj.monthly_price;
          featureAddons.push({
            code: addonObj.addon_code,
            name: addonObj.name,
            amount,
            hasConfiguredYearly
          });
        }
      }
    }

    // 5. Module Add-ons Calculation
    const moduleAddons: Array<{ code: string; name: string; amount: number }> = [];
    if (payload.selectedModules && payload.selectedModules.length > 0) {
      for (const modCode of payload.selectedModules) {
        const modPricing = await ModulePricing.findOne({ module_code: modCode, is_active: true, is_addon_available: true });
        if (modPricing) {
          const amount = billingCycle === 'yearly' ? (modPricing.yearly_price || modPricing.monthly_price * 12) : modPricing.monthly_price;
          moduleAddons.push({
            code: modPricing.module_code,
            name: modPricing.module_name,
            amount
          });
        }
      }
    }

    // 6. Subtotal Calculation
    const resourceTotal = resourceAddons.reduce((sum, r) => sum + r.totalAmount, 0);
    const featureTotal = featureAddons.reduce((sum, f) => sum + f.amount, 0);
    const moduleTotal = moduleAddons.reduce((sum, m) => sum + m.amount, 0);
    const subtotal = baseAmount + resourceTotal + featureTotal + moduleTotal;

    // 7. Taxes & Discounts
    const discountAmount = payload.discountAmount || 0;
    let taxRate = payload.taxRate ?? 18;
    if (payload.taxRate === undefined) {
      const activeTax = await PlatformTaxConfig.findOne({ is_active: true });
      if (activeTax) taxRate = activeTax.tax_percentage;
    }
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableSubtotal * taxRate) / 100);
    const total = taxableSubtotal + taxAmount;

    return {
      currency: plan.currency || 'INR',
      billingCycle,
      commercialCategory: plan.commercial_category || commercialCategory,
      basePlan: {
        code: plan.plan_code,
        name: plan.plan_name,
        amount: baseAmount,
        monthlyPrice: plan.price_monthly,
        yearlyPrice: plan.price_yearly,
        monthlyPriceType: plan.monthly_price_type || 'FIXED',
        yearlyPriceType: plan.yearly_price_type || 'FIXED',
        maxUsers: plan.max_users,
        usersLimitType: plan.users_limit_type || 'FIXED',
        maxBranches: plan.max_branches,
        branchesLimitType: plan.branches_limit_type || 'FIXED'
      },
      resourceAddons,
      featureAddons,
      moduleAddons,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      total
    };
  }

  /**
   * Initializes a 14-day trial subscription for a new tenant.
   */
  static async createTrialSubscription(
    tenantId: mongoose.Types.ObjectId,
    planCode: string = 'trial',
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    session?: mongoose.ClientSession
  ): Promise<ITenantSubscription> {
    const planQuery = SubscriptionPlan.findOne({ plan_code: planCode });
    if (session) planQuery.session(session);
    let plan = await planQuery;

    if (!plan) {
      const fallbackQuery = SubscriptionPlan.findOne({ plan_code: 'retail_starter' });
      if (session) fallbackQuery.session(session);
      plan = await fallbackQuery;
    }

    if (!plan) {
      throw new Error(`Subscription plan '${planCode}' not found`);
    }

    const trialDays = plan.trial_days || 14;
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      tenant_id: tenantId,
      plan_id: plan._id,
      subscription_type: billingCycle,
      status: 'trial',
      payment_status: 'completed',
      start_date: now,
      end_date: trialEndDate,
      trial_start_date: now,
      trial_end_date: trialEndDate,
      auto_renew: true,
      amount: billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly,
      currency: 'INR',
      created_at: now,
      updated_at: now
    };

    if (session) {
      const [sub] = await TenantSubscription.create([subscriptionData], { session });
      return sub;
    } else {
      return await TenantSubscription.create(subscriptionData);
    }
  }

  /**
   * Evaluates subscription status for a tenant.
   */
  static async evaluateSubscriptionStatus(tenantId: string): Promise<string> {
    const sub = await TenantSubscription.findOne({ tenant_id: tenantId });
    if (!sub) return 'expired';

    const now = new Date();

    if (sub.status === 'trial' && sub.trial_end_date && now > sub.trial_end_date) {
      const graceEnd = new Date(sub.trial_end_date.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (now <= graceEnd) {
        sub.status = 'grace';
      } else {
        sub.status = 'expired';
      }
      sub.updated_at = now;
      await sub.save();
    } else if (sub.status === 'active' && sub.end_date && now > sub.end_date) {
      const graceEnd = new Date(sub.end_date.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (now <= graceEnd) {
        sub.status = 'grace';
      } else {
        sub.status = 'expired';
      }
      sub.updated_at = now;
      await sub.save();
    }

    return sub.status || 'expired';
  }

  /**
   * Updates subscription status.
   */
  static async updateStatus(
    tenantId: string,
    status: 'trial' | 'active' | 'grace' | 'suspended' | 'cancelled' | 'expired',
    session?: mongoose.ClientSession
  ) {
    const subQuery = TenantSubscription.findOneAndUpdate(
      { tenant_id: tenantId },
      { $set: { status, updated_at: new Date() } },
      { new: true }
    );
    if (session) subQuery.session(session);
    const updatedSub = await subQuery;

    const tenantQuery = Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { subscription_status: status, updated_at: new Date() } },
      { new: true }
    );
    if (session) tenantQuery.session(session);
    await tenantQuery;

    return updatedSub;
  }
}

export default SubscriptionService;
