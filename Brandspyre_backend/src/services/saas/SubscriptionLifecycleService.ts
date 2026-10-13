import mongoose from 'mongoose';
import {
  Tenant,
  TenantSubscription,
  SubscriptionPlan,
  ITenantSubscription,
  ISubscriptionPlan
} from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import {
  SubscriptionHistory,
  PaymentTransaction,
  SaasInvoice,
  RenewalLog
} from '../../db/ModelSceham/subscriptionSystemSchema';
import EmailService from '../email/EmailService';

export class SubscriptionLifecycleService {
  /**
   * Generates a unique invoice number format: INV-YYYYMM-XXXX
   */
  static async generateInvoiceNumber(): Promise<string> {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await SaasInvoice.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${datePrefix}-${sequence}`;
  }

  /**
   * Calculates proration credit for plan upgrades/downgrades
   */
  static calculateProration(
    currentAmount: number,
    currentStartDate: Date,
    currentEndDate: Date,
    newPlanAmount: number
  ): { unusedCredit: number; netPayable: number; remainingDays: number; totalDays: number } {
    const now = new Date();
    const totalTime = currentEndDate.getTime() - currentStartDate.getTime();
    const remainingTime = Math.max(0, currentEndDate.getTime() - now.getTime());

    const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24)) || 30;
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    const unusedCredit = Math.round((currentAmount / totalDays) * remainingDays);
    const netPayable = Math.max(0, newPlanAmount - unusedCredit);

    return {
      unusedCredit,
      netPayable,
      remainingDays,
      totalDays
    };
  }

  /**
   * Activates or upgrades subscription after successful payment
   */
  static async activateOrUpgradeSubscription(params: {
    tenantId: string;
    planId: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    paymentId?: string;
    orderId?: string;
    amountPaid: number;
    paymentMethod?: string;
    performedBy?: string;
    ipAddress?: string;
  }) {
    const { tenantId, planId, billingCycle, paymentId, orderId, amountPaid, paymentMethod, performedBy, ipAddress } = params;

    const tId = new mongoose.Types.ObjectId(tenantId);

    let plan = null;
    if (mongoose.Types.ObjectId.isValid(planId)) {
      plan = await SubscriptionPlan.findById(planId);
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ plan_code: planId.toLowerCase() });
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({
        plan_name: { $regex: new RegExp(`^${planId}$`, 'i') }
      });
    }
    if (!plan) throw new Error(`Subscription plan not found: ${planId}`);
    const pId = plan._id;

    const tenant = await Tenant.findById(tId);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

    const existingSub = await TenantSubscription.findOne({ tenant_id: tId });
    const fromStatus = existingSub?.status || 'none';
    const fromPlanId = existingSub?.plan_id;

    const now = new Date();
    const endDate = new Date(now);

    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (billingCycle === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const graceDays = plan.grace_period_days || 7;

    // Update Subscription Record
    const sub = await TenantSubscription.findOneAndUpdate(
      { tenant_id: tId },
      {
        tenant_id: tId,
        plan_id: pId,
        subscription_type: billingCycle,
        status: 'active',
        start_date: now,
        end_date: endDate,
        next_billing_date: endDate,
        last_payment_date: now,
        auto_renew: true,
        amount: amountPaid,
        grace_period_days: graceDays,
        grace_end_date: undefined,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        payment_status: 'completed',
        paid_amount: amountPaid,
        paid_at: now,
        downgrade_scheduled_plan_id: undefined,
        downgrade_effective_date: undefined,
        updated_at: now
      },
      { upsert: true, new: true }
    );

    // Update Tenant Status & Limits
    await Tenant.findByIdAndUpdate(tId, {
      status: 'active',
      subscription_plan: plan.plan_code,
      subscription_status: 'active',
      subscription_start_date: now,
      subscription_end_date: endDate,
      max_users: plan.max_users,
      max_storage_mb: (plan.max_storage_gb || 1) * 1024,
      locked_at: undefined,
      lock_reason: undefined,
      updated_at: now
    });

    // Auto-enable module allowances included in the upgraded plan
    try {
      const { PlanModuleAllowance } = require('../../db/ModelSceham/industryModuleSchema');
      const { OrganizationEntitlementService } = require('./OrganizationEntitlementService');
      const allowedInPlan = await PlanModuleAllowance.find({ plan_code: plan.plan_code, is_included: true });
      const allowedCodes = allowedInPlan.map((p: any) => p.module_code);
      if (allowedCodes.length > 0) {
        await OrganizationEntitlementService.enableModules(tId, allowedCodes, 'subscription', performedBy);
      }
    } catch (modErr) {
      console.warn('[SubscriptionLifecycleService] Module sync warning:', modErr);
    }

    // Create PaymentTransaction Record
    const transaction = await PaymentTransaction.create({
      tenant_id: tId,
      subscription_id: sub._id,
      transaction_type: fromStatus === 'active' ? 'upgrade' : 'subscription_payment',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount: amountPaid,
      currency: 'INR',
      status: 'captured',
      payment_method: paymentMethod || 'razorpay',
      plan_id: pId,
      plan_code: plan.plan_code,
      billing_cycle: billingCycle,
      ip_address: ipAddress
    });

    // Generate Invoice
    const invoiceNum = await this.generateInvoiceNumber();
    const taxRate = 18; // 18% GST
    const subtotal = Math.round(amountPaid / (1 + taxRate / 100));
    const taxAmount = amountPaid - subtotal;

    const invoice = await SaasInvoice.create({
      tenant_id: tId,
      subscription_id: sub._id,
      payment_transaction_id: transaction._id,
      invoice_number: invoiceNum,
      invoice_date: now,
      due_date: now,
      billing_period_start: now,
      billing_period_end: endDate,
      status: 'paid',
      items: [{
        description: `${plan.plan_name} Plan (${billingCycle.toUpperCase()})`,
        plan_name: plan.plan_name,
        billing_cycle: billingCycle,
        quantity: 1,
        unit_price: subtotal,
        amount: subtotal,
        tax_amount: taxAmount
      }],
      subtotal,
      discount_amount: 0,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: amountPaid,
      paid_amount: amountPaid,
      balance_due: 0,
      billing_name: tenant.billing_name || tenant.company_name || tenant.name,
      billing_email: tenant.billing_email,
      billing_address: tenant.billing_address,
      gst_number: tenant.gst_number,
      pan_number: tenant.pan_number,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      payment_method: paymentMethod || 'razorpay',
      paid_at: now
    });

    // Link invoice to transaction
    await PaymentTransaction.findByIdAndUpdate(transaction._id, { invoice_id: invoice._id });

    // Log History
    await SubscriptionHistory.create({
      tenant_id: tId,
      subscription_id: sub._id,
      action: fromStatus === 'active' ? 'upgraded' : 'activated',
      from_plan_id: fromPlanId,
      to_plan_id: pId,
      from_status: fromStatus,
      to_status: 'active',
      billing_cycle: billingCycle,
      amount: amountPaid,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      performed_by: performedBy ? new mongoose.Types.ObjectId(performedBy) : undefined,
      performed_by_type: performedBy ? 'user' : 'system',
      ip_address: ipAddress
    });

    // Trigger Activation & Invoice Emails via Zoho SMTP (non-blocking)
    (async () => {
      try {
        const adminUser = await UserInfo.findOne({
          tenant_id: tId,
          role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
        });
        const recipientEmail = tenant.billing_email || adminUser?.email;
        const customerName = adminUser ? `${adminUser.firstname} ${adminUser.lastname || ''}`.trim() : (tenant.name || 'Valued Customer');

        if (recipientEmail) {
          await EmailService.sendSubscriptionActivatedEmail({
            tenant,
            subscription: sub,
            payment: {
              amount: amountPaid,
              currency: 'INR',
              razorpay_payment_id: paymentId,
              payment_id: paymentId
            },
            invoice,
            recipientEmail,
            customerName
          });

          await EmailService.sendInvoiceEmail({
            tenant,
            invoice,
            recipientEmail
          });
        }
      } catch (emailErr) {
        console.warn('[SubscriptionLifecycleService] Email trigger notice:', emailErr);
      }
    })();

    return { subscription: sub, invoice, transaction };
  }

  /**
   * Transition subscription to Grace period
   */
  static async enterGracePeriod(tenantId: string) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const sub = await TenantSubscription.findOne({ tenant_id: tId });
    if (!sub) return null;

    const graceDays = sub.grace_period_days || 7;
    const now = new Date();
    const graceEndDate = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);

    const oldStatus = sub.status;
    sub.status = 'grace';
    sub.grace_end_date = graceEndDate;
    sub.updated_at = now;
    await sub.save();

    const tenant = await Tenant.findByIdAndUpdate(tId, {
      subscription_status: 'grace',
      updated_at: now
    }, { new: true });

    await SubscriptionHistory.create({
      tenant_id: tId,
      subscription_id: sub._id,
      action: 'grace_entered',
      from_status: oldStatus,
      to_status: 'grace',
      notes: `Entered ${graceDays}-day grace period ending ${graceEndDate.toISOString()}`,
      performed_by_type: 'cron'
    });

    // Send Grace Period Email (non-blocking)
    (async () => {
      try {
        const adminUser = await UserInfo.findOne({
          tenant_id: tId,
          role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
        });
        const recipientEmail = tenant?.billing_email || adminUser?.email;
        if (recipientEmail && tenant) {
          await EmailService.sendSubscriptionGracePeriodEmail({
            tenant,
            recipientEmail,
            adminName: adminUser ? `${adminUser.firstname} ${adminUser.lastname || ''}`.trim() : 'Admin',
            graceDays,
            graceEndDate
          });
        }
      } catch (emailErr) {
        console.warn('[SubscriptionLifecycleService] Grace email trigger notice:', emailErr);
      }
    })();

    return sub;
  }

  /**
   * Lock tenant account on grace period expiration
   */
  static async lockAccount(tenantId: string, reason: string = 'Subscription and grace period expired') {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const sub = await TenantSubscription.findOne({ tenant_id: tId });
    const oldStatus = sub?.status || 'expired';

    const now = new Date();

    if (sub) {
      sub.status = 'expired';
      sub.updated_at = now;
      await sub.save();
    }

    const tenant = await Tenant.findByIdAndUpdate(tId, {
      status: 'suspended',
      subscription_status: 'expired',
      locked_at: now,
      lock_reason: reason,
      updated_at: now
    }, { new: true });

    await SubscriptionHistory.create({
      tenant_id: tId,
      subscription_id: sub?._id,
      action: 'locked',
      from_status: oldStatus,
      to_status: 'expired',
      notes: reason,
      performed_by_type: 'cron'
    });

    // Send Account Suspended Email (non-blocking)
    (async () => {
      try {
        const adminUser = await UserInfo.findOne({
          tenant_id: tId,
          role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
        });
        const recipientEmail = tenant?.billing_email || adminUser?.email;
        if (recipientEmail && tenant) {
          await EmailService.sendAccountSuspendedEmail({
            tenant,
            recipientEmail,
            adminName: adminUser ? `${adminUser.firstname} ${adminUser.lastname || ''}`.trim() : 'Admin',
            reason
          });
        }
      } catch (emailErr) {
        console.warn('[SubscriptionLifecycleService] Suspended email trigger notice:', emailErr);
      }
    })();
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(tenantId: string, reason: string, performedBy?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const sub = await TenantSubscription.findOne({ tenant_id: tId });
    if (!sub) throw new Error('Subscription not found');

    const now = new Date();
    const oldStatus = sub.status;

    sub.status = 'cancelled';
    sub.cancel_reason = reason;
    sub.cancelled_at = now;
    sub.updated_at = now;
    await sub.save();

    const tenant = await Tenant.findByIdAndUpdate(tId, {
      subscription_status: 'cancelled',
      updated_at: now
    }, { new: true });

    await SubscriptionHistory.create({
      tenant_id: tId,
      subscription_id: sub._id,
      action: 'cancelled',
      from_status: oldStatus,
      to_status: 'cancelled',
      notes: reason,
      performed_by: performedBy ? new mongoose.Types.ObjectId(performedBy) : undefined,
      performed_by_type: performedBy ? 'user' : 'system'
    });

    // Send Subscription Cancelled Email (non-blocking)
    (async () => {
      try {
        const adminUser = await UserInfo.findOne({
          tenant_id: tId,
          role: { $in: ['admin', 'owner', 'org_owner', 'Super Admin'] }
        });
        const recipientEmail = tenant?.billing_email || adminUser?.email;
        const customerName = adminUser ? `${adminUser.firstname} ${adminUser.lastname || ''}`.trim() : 'Valued Customer';
        const effectiveDate = sub.end_date || now;

        if (recipientEmail && tenant) {
          await EmailService.sendSubscriptionCancelledEmail({
            tenant,
            recipientEmail,
            customerName,
            effectiveDate,
            reason
          });
        }
      } catch (emailErr) {
        console.warn('[SubscriptionLifecycleService] Cancellation email trigger notice:', emailErr);
      }
    })();

    return sub;
  }
}

export default SubscriptionLifecycleService;
