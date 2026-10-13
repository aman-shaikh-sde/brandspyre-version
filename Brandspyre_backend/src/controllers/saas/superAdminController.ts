import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Tenant, TenantSubscription, SubscriptionPlan, UserTenant } from '../../db/ModelSceham/saasSchema';
import { PaymentTransaction, SaasInvoice, Coupon, SubscriptionHistory } from '../../db/ModelSceham/subscriptionSystemSchema';
import RazorpayService from '../../services/razorpayService';

/**
 * List all organizations with subscription status and usage
 */
export const getAllOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, plan, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (plan) query.subscription_plan = plan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company_name: { $regex: search, $options: 'i' } },
        { tenant_code: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const organizations = await Tenant.find(query).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Get organization detailed details
 */
export const getOrganizationDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id).lean();
    if (!tenant) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const subscription = await TenantSubscription.findOne({ tenant_id: id }).lean();
    const history = await SubscriptionHistory.find({ tenant_id: id }).sort({ created_at: -1 }).limit(20).lean();
    const payments = await PaymentTransaction.find({ tenant_id: id }).sort({ created_at: -1 }).limit(20).lean();
    const invoices = await SaasInvoice.find({ tenant_id: id }).sort({ invoice_date: -1 }).limit(20).lean();
    const usersCount = await UserTenant.countDocuments({ tenant_id: id, is_active: true });

    res.status(200).json({
      success: true,
      data: {
        tenant,
        subscription,
        usersCount,
        history,
        payments,
        invoices
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Update organization status (e.g. suspend, activate)
 */
export const updateOrganizationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, lock_reason } = req.body;

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be active, suspended, or deleted.' });
      return;
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      {
        status,
        locked_at: status === 'suspended' ? new Date() : undefined,
        lock_reason: status === 'suspended' ? (lock_reason || 'Suspended by platform admin') : undefined,
        updated_at: new Date()
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: `Organization status updated to ${status}.`, data: tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Get all payment transactions across platform
 */
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const payments = await PaymentTransaction.find(query)
      .populate('tenant_id', 'name company_name tenant_code')
      .populate('plan_id', 'plan_name plan_code')
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Process payment refund
 */
export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // payment transaction ID
    const { amount, reason } = req.body;

    const transaction = await PaymentTransaction.findById(id);
    if (!transaction) {
      res.status(404).json({ error: 'Payment transaction not found' });
      return;
    }

    if (!transaction.razorpay_payment_id) {
      res.status(400).json({ error: 'Cannot refund: missing Razorpay payment ID' });
      return;
    }

    const refundRes = await RazorpayService.processRefund(
      transaction.razorpay_payment_id,
      amount ? Number(amount) : undefined,
      { reason: reason || 'Platform admin refund' }
    );

    transaction.status = 'refunded';
    transaction.refund_amount = amount ? Number(amount) : transaction.amount;
    transaction.refund_reason = reason;
    transaction.refund_status = 'processed';
    transaction.razorpay_refund_id = refundRes.id;
    transaction.updated_at = new Date();
    await transaction.save();

    res.status(200).json({ success: true, message: 'Refund processed successfully.', data: refundRes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Platform Revenue Dashboard Metrics
 */
export const getRevenueMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalTenants = await Tenant.countDocuments({ status: { $ne: 'deleted' } });
    const activeTenants = await Tenant.countDocuments({ status: 'active', subscription_status: 'active' });
    const trialTenants = await Tenant.countDocuments({ subscription_status: 'trial' });
    const expiredTenants = await Tenant.countDocuments({ subscription_status: 'expired' });

    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubs = await TenantSubscription.find({ status: 'active' }).populate('plan_id').lean();
    let mrr = 0;
    for (const sub of activeSubs) {
      const plan = sub.plan_id as any;
      if (plan) {
        if (sub.subscription_type === 'yearly') {
          mrr += Math.round((plan.price_yearly || plan.price_monthly * 12) / 12);
        } else if (sub.subscription_type === 'quarterly') {
          mrr += Math.round((plan.price_quarterly || plan.price_monthly * 3) / 3);
        } else {
          mrr += plan.price_monthly || 0;
        }
      }
    }

    // Total Revenue Collected
    const revenueAgg = await PaymentTransaction.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalTenants,
          activeTenants,
          trialTenants,
          expiredTenants,
          mrr,
          arr: mrr * 12,
          totalRevenue
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

/**
 * Get and create coupons
 */
export const getCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, description, discount_type, discount_value, max_discount_amount, valid_from, valid_until, usage_limit } = req.body;

    if (!code || !discount_value || !valid_from || !valid_until) {
      res.status(400).json({ error: 'Code, discount value, valid from, and valid until are required.' });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description,
      discount_type: discount_type || 'percentage',
      discount_value: Number(discount_value),
      max_discount_amount: max_discount_amount ? Number(max_discount_amount) : undefined,
      valid_from: new Date(valid_from),
      valid_until: new Date(valid_until),
      usage_limit: usage_limit ? Number(usage_limit) : undefined,
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully.', data: coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

export default {
  getAllOrganizations,
  getOrganizationDetails,
  updateOrganizationStatus,
  getAllPayments,
  processRefund,
  getRevenueMetrics,
  getCoupons,
  createCoupon
};
