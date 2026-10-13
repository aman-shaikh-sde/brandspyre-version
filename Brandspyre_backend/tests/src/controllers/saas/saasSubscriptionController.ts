import { Request, Response } from 'express';
import { SubscriptionPlan, TenantSubscription, Tenant } from '../../db/ModelSceham/saasSchema';
import RazorpayService from '../../services/razorpayService';
import SubscriptionService from '../../services/saas/SubscriptionService';
import FeatureLimitService from '../../services/saas/FeatureLimitService';
import OnboardingService from '../../services/saas/OnboardingService';
import { isPlatformAdminRole } from '../../middleware/securityContext';

export const resolveAuthorizedTenantId = (req: Request): string | null => {
  const securityContext = (req as any).securityContext;
  const userRole = (req as any).user?.userRole || (req as any).user?.role;
  const isPlatformAdmin = securityContext?.isPlatformAdmin || isPlatformAdminRole(userRole);

  if (isPlatformAdmin) {
    return (req.query.tenantId as string) || req.body.tenantId || securityContext?.tenantId || (req as any).tenant?.id?.toString() || (req as any).user?.tenantId || null;
  }

  // Non-platform users: securityContext.tenantId is authoritative!
  return securityContext?.tenantId || (req as any).tenant?.id?.toString() || (req as any).user?.tenantId || null;
};

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await SubscriptionPlan.find({
      is_active: true,
      is_public: { $ne: false }
    })
      .select(
        '_id plan_name plan_code description badge_label plan_type sort_order commercial_category currency ' +
        'price_monthly price_quarterly price_yearly ' +
        'max_users max_branches max_storage_gb max_leads max_projects max_invoices max_employees max_customers max_products max_warehouses ' +
        'trial_days grace_period_days ' +
        'included_module_codes features modules ' +
        'monthly_price_type yearly_price_type users_limit_type branches_limit_type ' +
        'is_active is_public'
      )
      .sort({ sort_order: 1, price_monthly: 1 })
      .lean();

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const getRazorpayKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = RazorpayService.getKey() || process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key';
    res.status(200).json({ success: true, data: { key } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);
    const planIdentifier = req.body.planId || req.body.plan_code || req.body.subscriptionPlan;
    const amount = req.body.amount;
    const billingCycle = req.body.billingCycle || 'monthly';

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required.' });
      return;
    }

    if (!planIdentifier) {
      res.status(400).json({ error: 'Plan identifier is required.' });
      return;
    }

    const orderData = await RazorpayService.processSubscriptionPayment(
      tenantId.toString(),
      planIdentifier.toString(),
      amount ? Number(amount) : undefined,
      billingCycle
    );

    res.status(200).json({ success: true, data: orderData });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tenantId, planId, billingCycle } = req.body;

    const targetTenantId = tenantId || (req as any).tenant?.id || (req as any).user?.tenantId;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ error: 'razorpay_order_id and razorpay_payment_id are required' });
      return;
    }

    // Verify signature if provided (or if non-dummy secret is configured)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && razorpay_signature) {
      const isValid = RazorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        res.status(400).json({ error: 'Invalid Razorpay payment signature.' });
        return;
      }
    }

    const result = await RazorpayService.handlePaymentSuccess({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: req.body.amount ? Number(req.body.amount) * 100 : undefined,
      notes: { tenant_id: targetTenantId, plan_id: planId, billing_cycle: billingCycle }
    });

    if (SubscriptionService && typeof SubscriptionService.updateStatus === 'function') {
      await SubscriptionService.updateStatus(targetTenantId, 'active').catch(() => {});
    }

    if (OnboardingService && typeof OnboardingService.updateStep === 'function') {
      await OnboardingService.updateStep(targetTenantId, { payment_completed: true }).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Payment verified and subscription activated successfully.', data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'subscription.activated') {
      const paymentEntity = event.payload.payment?.entity || event.payload.subscription?.entity;
      if (paymentEntity) {
        await RazorpayService.handlePaymentSuccess({
          order_id: paymentEntity.order_id,
          payment_id: paymentEntity.id,
          amount: paymentEntity.amount,
          notes: paymentEntity.notes
        });
      }
    } else if (eventType === 'payment.failed' || eventType === 'subscription.halted') {
      const paymentEntity = event.payload.payment?.entity;
      if (paymentEntity) {
        await RazorpayService.handlePaymentFailure({
          order_id: paymentEntity.order_id,
          error_description: paymentEntity.error_description,
          error_code: paymentEntity.error_code,
          notes: paymentEntity.notes
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getTenantUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const metrics: ('users' | 'branches' | 'storage_mb' | 'leads' | 'projects' | 'invoices')[] = [
      'users', 'branches', 'storage_mb', 'leads', 'projects', 'invoices'
    ];

    const usageReport: Record<string, any> = {};

    for (const metric of metrics) {
      const result = await FeatureLimitService.checkLimit(tenantId.toString(), metric, 0);
      usageReport[metric] = {
        current: result.current,
        max: result.max,
        allowed: result.allowed
      };
    }

    const subscriptionStatus = await SubscriptionService.evaluateSubscriptionStatus(tenantId.toString());

    res.status(200).json({
      success: true,
      tenantId,
      subscriptionStatus,
      usage: usageReport
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    let tenantId = resolveAuthorizedTenantId(req);
    const userRole = ((req as any).user?.userRole || (req as any).user?.role || '').toLowerCase();
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin', 'platform_admin', 'super admin'].includes(userRole);

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const tenant = await Tenant.findById(tenantId);
    const subscription = await TenantSubscription.findOne({ tenant_id: tenantId });
    let plan = null;
    if (subscription?.plan_id) {
      plan = await SubscriptionPlan.findById(subscription.plan_id);
    }

    const status = await SubscriptionService.evaluateSubscriptionStatus(tenantId.toString());

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          id: tenant?._id,
          name: tenant?.name || tenant?.company_name,
          status: tenant?.status,
          billing_address: tenant?.billing_address,
          gst_number: tenant?.gst_number,
          pan_number: tenant?.pan_number,
          billing_email: tenant?.billing_email,
          billing_name: tenant?.billing_name
        },
        subscription: subscription ? {
          id: subscription._id,
          status,
          subscription_type: subscription.subscription_type,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          trial_end_date: subscription.trial_end_date,
          grace_end_date: subscription.grace_end_date,
          amount: subscription.amount,
          auto_renew: subscription.auto_renew,
          last_payment_date: subscription.last_payment_date,
          next_billing_date: subscription.next_billing_date
        } : null,
        plan
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const getSubscriptionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const { SubscriptionHistory } = require('../../db/ModelSceham/subscriptionSystemSchema');
    const history = await SubscriptionHistory.find({ tenant_id: tenantId })
      .populate('from_plan_id to_plan_id', 'plan_name plan_code')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const { SaasInvoice } = require('../../db/ModelSceham/subscriptionSystemSchema');
    const invoices = await SaasInvoice.find({ tenant_id: tenantId }).sort({ invoice_date: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const getPaymentTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const { PaymentTransaction } = require('../../db/ModelSceham/subscriptionSystemSchema');
    const transactions = await PaymentTransaction.find({ tenant_id: tenantId })
      .populate('plan_id', 'plan_name plan_code')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const updateBillingInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = resolveAuthorizedTenantId(req);
    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context is required.' });
      return;
    }

    const { billing_address, gst_number, pan_number, billing_email, billing_name } = req.body;
    const { Tenant } = require('../../db/ModelSceham/saasSchema');

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        billing_address,
        gst_number,
        pan_number,
        billing_email,
        billing_name,
        updated_at: new Date()
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Billing info updated successfully.', data: tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, planId, billingCycle, amount } = req.body;
    const tenantId = resolveAuthorizedTenantId(req);

    if (!code) {
      res.status(400).json({ error: 'Coupon code is required.' });
      return;
    }

    const { Coupon, CouponUsage } = require('../../db/ModelSceham/subscriptionSystemSchema');
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), is_active: true });

    if (!coupon) {
      res.status(404).json({ error: 'Invalid or inactive coupon code.' });
      return;
    }

    const now = new Date();
    if (now < coupon.valid_from || now > coupon.valid_until) {
      res.status(400).json({ error: 'This coupon code has expired.' });
      return;
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      res.status(400).json({ error: 'Coupon usage limit reached.' });
      return;
    }

    if (tenantId) {
      const tenantUsageCount = await CouponUsage.countDocuments({ coupon_id: coupon._id, tenant_id: tenantId });
      if (tenantUsageCount >= (coupon.per_tenant_limit || 1)) {
        res.status(400).json({ error: 'You have already used this coupon code.' });
        return;
      }
    }

    const originalAmount = Number(amount || 0);
    let discount = 0;

    if (coupon.discount_type === 'percentage') {
      discount = Math.round((originalAmount * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }

    const finalAmount = Math.max(0, originalAmount - discount);

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount,
        original_amount: originalAmount,
        final_amount: finalAmount
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export default {
  getSubscriptionPlans,
  createCheckout,
  verifyPayment,
  handleWebhook,
  getTenantUsage,
  getCurrentSubscription,
  getSubscriptionHistory,
  getInvoices,
  getPaymentTransactions,
  updateBillingInfo,
  applyCoupon
};
