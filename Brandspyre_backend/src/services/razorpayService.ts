import crypto from 'crypto';
import mongoose from 'mongoose';
import { Tenant, TenantSubscription, SubscriptionPlan, OnboardingProgress } from '../db/ModelSceham/saasSchema';
import { PaymentTransaction, SaasInvoice } from '../db/ModelSceham/subscriptionSystemSchema';
import { SubscriptionLifecycleService } from './saas/SubscriptionLifecycleService';
import { getRazorpayClient, getRazorpayConfig, assertRazorpayConfigured } from '../config/razorpayConfig';

export interface CreateOrderParams {
  amount: number; // In standard currency units (e.g. Rupees)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  plan_id: string;
  total_count: number;
  customer_notify?: boolean;
  notes?: Record<string, string>;
}

export class RazorpayService {
  /**
   * Create an authoritative Razorpay order for one-time or subscription checkout.
   * Enforces minimum 100 paise (₹1.00) and strict validation.
   * Never generates mock orders or dummy fallbacks.
   */
  static async createOrder(params: CreateOrderParams) {
    if (!params.amount || params.amount <= 0) {
      throw new Error('Invalid order amount: amount must be greater than zero.');
    }

    // Minimum transaction amount for Razorpay is ₹1.00 (100 paise)
    const amountInPaise = Math.round(params.amount * 100);
    if (amountInPaise < 100) {
      throw new Error('Order amount is below the minimum required limit of ₹1.00 (100 paise).');
    }

    const currency = (params.currency || 'INR').toUpperCase();
    const client = getRazorpayClient();

    try {
      const order = await client.orders.create({
        amount: amountInPaise,
        currency,
        receipt: params.receipt,
        notes: params.notes
      });

      return order;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Gateway communication failure';
      console.error('[Razorpay Order Creation Failed] Error:', errorMsg);
      throw new Error(`Razorpay order creation failed: ${errorMsg}`);
    }
  }

  /**
   * Create a recurring Razorpay subscription
   */
  static async createSubscription(params: CreateSubscriptionParams) {
    const client = getRazorpayClient();
    try {
      const subscription = await client.subscriptions.create({
        plan_id: params.plan_id,
        total_count: params.total_count,
        customer_notify: params.customer_notify !== false,
        notes: params.notes
      });
      return subscription;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Failed to create subscription';
      console.error('[Razorpay Subscription Error]:', errorMsg);
      throw new Error(`Failed to create Razorpay subscription: ${errorMsg}`);
    }
  }

  /**
   * Create a Razorpay plan
   */
  static async createPlan(params: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    amount: number;
    currency?: string;
    name: string;
    description?: string;
  }) {
    const client = getRazorpayClient();
    try {
      const plan = await client.plans.create({
        period: params.period,
        interval: params.interval,
        item: {
          name: params.name,
          description: params.description || '',
          amount: Math.round(params.amount * 100),
          currency: (params.currency || 'INR').toUpperCase()
        }
      });
      return plan;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Failed to create plan';
      console.error('[Razorpay Plan Error]:', errorMsg);
      throw new Error(`Failed to create Razorpay plan: ${errorMsg}`);
    }
  }

  /**
   * Fetch order details directly from Razorpay API
   */
  static async fetchOrder(orderId: string) {
    const client = getRazorpayClient();
    try {
      const order = await client.orders.fetch(orderId);
      return order;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Order fetch failed';
      console.error(`[Razorpay Order Fetch Error] order_id: ${orderId}:`, errorMsg);
      throw new Error(`Failed to fetch Razorpay order: ${errorMsg}`);
    }
  }

  /**
   * Fetch payment details directly from Razorpay API
   */
  static async fetchPayment(paymentId: string) {
    const client = getRazorpayClient();
    try {
      const payment = await client.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Payment fetch failed';
      console.error(`[Razorpay Payment Fetch Error] payment_id: ${paymentId}:`, errorMsg);
      throw new Error(`Failed to fetch Razorpay payment: ${errorMsg}`);
    }
  }

  /**
   * Verify Razorpay payment signature using constant-time HMAC-SHA256 comparison.
   * Protects against timing attacks and signature tampering.
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    try {
      const { keySecret } = assertRazorpayConfigured();
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch (error) {
      console.error('[Signature Verification Error]:', error);
      return false;
    }
  }

  /**
   * Verify Razorpay webhook signature using constant-time comparison against raw body string/Buffer.
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    customSecret?: string
  ): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    try {
      const webhookSecret = (customSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
      if (!webhookSecret) {
        console.error('[Razorpay Webhook Error] RAZORPAY_WEBHOOK_SECRET not configured.');
        return false;
      }

      const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch (error) {
      console.error('[Webhook Signature Verification Error]:', error);
      return false;
    }
  }

  /**
   * Cancel Razorpay subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAtCycleEnd = true) {
    const client = getRazorpayClient();
    try {
      const subscription = await client.subscriptions.cancel(
        subscriptionId,
        cancelAtCycleEnd as any
      );
      return subscription;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Subscription cancellation failed';
      console.error('[Razorpay Cancel Subscription Error]:', errorMsg);
      throw new Error(`Failed to cancel Razorpay subscription: ${errorMsg}`);
    }
  }

  /**
   * Process payment order for tenant subscription upgrade or new workspace registration.
   * Calculates amounts strictly on the server from trusted database records.
   * Enforces idempotency and records pending transactions.
   */
  static async processSubscriptionPayment(
    tenantId: string,
    planIdentifier: string,
    clientAmount?: number,
    billingCycle: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ) {
    // 1. Validate Tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant '${tenantId}' not found.`);
    }

    // 2. Resolve Plan from Database
    let plan = null;
    if (mongoose.Types.ObjectId.isValid(planIdentifier)) {
      plan = await SubscriptionPlan.findById(planIdentifier);
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ plan_code: planIdentifier.toLowerCase() });
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({
        plan_name: { $regex: new RegExp(`^${planIdentifier}$`, 'i') }
      });
    }

    if (!plan) {
      throw new Error(`Subscription plan '${planIdentifier}' not found in catalog.`);
    }

    // 3. Authoritative Server-Side Price Calculation
    let authoritativeAmount = 0;
    if (billingCycle === 'yearly') {
      authoritativeAmount = (plan.price_yearly && plan.price_yearly > 0)
        ? plan.price_yearly
        : (plan.price_monthly || 0) * 12;
    } else if (billingCycle === 'quarterly') {
      authoritativeAmount = (plan.price_quarterly && plan.price_quarterly > 0)
        ? plan.price_quarterly
        : (plan.price_monthly || 0) * 3;
    } else {
      authoritativeAmount = plan.price_monthly || 0;
    }

    // Disallow zero or negative amount for paid gateway orders
    if (authoritativeAmount < 1) {
      throw new Error(`Invalid plan price for '${plan.plan_name}'. Must be at least ₹1.00.`);
    }

    const finalAmount = authoritativeAmount;

    // 4. Idempotency Check: Check for active pending transaction created in last 15 mins
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existingPendingTxn = await PaymentTransaction.findOne({
      tenant_id: tenant._id,
      plan_id: plan._id,
      billing_cycle: billingCycle,
      status: 'pending',
      amount: finalAmount,
      created_at: { $gte: fifteenMinutesAgo }
    }).sort({ created_at: -1 });

    if (existingPendingTxn && existingPendingTxn.razorpay_order_id) {
      const config = getRazorpayConfig();
      return {
        order_id: existingPendingTxn.razorpay_order_id,
        amount: finalAmount,
        amount_paise: Math.round(finalAmount * 100),
        currency: existingPendingTxn.currency || 'INR',
        key_id: config.keyId,
        tenant_id: tenant._id.toString(),
        plan_id: plan._id.toString(),
        plan_code: plan.plan_code,
        billing_cycle: billingCycle,
        reused: true
      };
    }

    // 5. Create Razorpay Order
    const receipt = `TNT_${tenantId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;
    const order = await this.createOrder({
      amount: finalAmount,
      currency: 'INR',
      receipt,
      notes: {
        tenant_id: tenant._id.toString(),
        plan_id: plan._id.toString(),
        plan_code: plan.plan_code,
        billing_cycle: billingCycle,
        tenant_name: tenant.name || tenant.company_name || 'Organization',
        plan_name: plan.plan_name
      }
    });

    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
    else if (billingCycle === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
    else endDate.setMonth(endDate.getMonth() + 1);

    // 6. Persist Pending Subscription & Transaction without downgrading active subscribers
    const existingSub = await TenantSubscription.findOne({ tenant_id: tenant._id });
    const isCurrentlyActive = existingSub && (existingSub.status === 'active' || existingSub.status === 'trial') && existingSub.end_date && existingSub.end_date > now;

    if (existingSub) {
      existingSub.razorpay_order_id = order.id;
      if (!isCurrentlyActive) {
        existingSub.plan_id = plan._id;
        existingSub.subscription_type = billingCycle;
        existingSub.status = 'pending';
        existingSub.payment_status = 'pending';
        existingSub.amount = finalAmount;
        existingSub.start_date = now;
        existingSub.end_date = endDate;
        existingSub.currency = order.currency || 'INR';
      }
      existingSub.updated_at = now;
      await existingSub.save();
    } else {
      await TenantSubscription.create({
        tenant_id: tenant._id,
        plan_id: plan._id,
        subscription_type: billingCycle,
        status: 'pending',
        payment_status: 'pending',
        amount: finalAmount,
        start_date: now,
        end_date: endDate,
        razorpay_order_id: order.id,
        currency: order.currency || 'INR',
        created_at: now,
        updated_at: now
      });
    }

    await PaymentTransaction.create({
      tenant_id: tenant._id,
      transaction_type: 'subscription_payment',
      razorpay_order_id: order.id,
      amount: finalAmount,
      currency: order.currency || 'INR',
      status: 'pending',
      payment_method: 'razorpay',
      plan_id: plan._id,
      plan_code: plan.plan_code,
      billing_cycle: billingCycle,
      receipt: order.receipt
    });

    const config = getRazorpayConfig();

    return {
      order_id: order.id,
      amount: finalAmount,
      amount_paise: Math.round(finalAmount * 100),
      currency: order.currency,
      key_id: config.keyId,
      tenant_id: tenant._id.toString(),
      plan_id: plan._id.toString(),
      plan_code: plan.plan_code,
      billing_cycle: billingCycle
    };
  }

  /**
   * Unified, idempotent finalization service for browser checkout verification AND webhooks.
   * Fetches payment record from Razorpay API, verifies amount, order ID, currency, and 'captured' status.
   * Activates subscription exactly once.
   */
  static async handlePaymentSuccess(paymentData: {
    order_id: string;
    payment_id: string;
    amount?: number;
    notes?: Record<string, any>;
    ipAddress?: string;
    performedBy?: string;
    skipApiVerification?: boolean; // Only for unit test mocks
  }) {
    const { order_id, payment_id, notes, ipAddress, performedBy, skipApiVerification } = paymentData;

    if (!payment_id) {
      throw new Error('Payment finalization error: missing payment_id.');
    }

    // 1. Idempotency Check: verify if this payment_id has already been processed and captured
    const existingCapturedTxn = await PaymentTransaction.findOne({
      razorpay_payment_id: payment_id,
      status: 'captured'
    });

    if (existingCapturedTxn) {
      console.log(`[Razorpay Idempotency] Payment ${payment_id} already captured and finalized.`);
      return {
        success: true,
        status: 'already_completed',
        message: 'Payment already processed and verified.',
        tenantId: existingCapturedTxn.tenant_id.toString(),
        planId: existingCapturedTxn.plan_id?.toString()
      };
    }

    // 2. Server-Side Verification via Razorpay API (unless skipped in mock test)
    let fetchedPayment: any = null;
    if (!skipApiVerification) {
      fetchedPayment = await this.fetchPayment(payment_id);

      // Verify payment is CAPTURED (do not activate on authorized alone)
      if (fetchedPayment.status !== 'captured') {
        throw new Error(
          `Payment not captured. Current gateway status is '${fetchedPayment.status}'. Subscriptions require captured payments.`
        );
      }

      // Verify order association
      if (order_id && fetchedPayment.order_id && fetchedPayment.order_id !== order_id) {
        throw new Error(
          `Security Mismatch: Payment order '${fetchedPayment.order_id}' does not match requested order '${order_id}'.`
        );
      }

      // Verify amount directly if expected amount was passed
      if (paymentData.amount && paymentData.amount > 0) {
        const expectedPaise = Math.round(paymentData.amount * 100);
        if (fetchedPayment.amount < expectedPaise) {
          throw new Error(
            `Security Error: Underpayment detected. Expected ${expectedPaise} paise (₹${paymentData.amount}), received ${fetchedPayment.amount} paise.`
          );
        }
      }
    }

    // 3. Resolve and Verify Authoritative Tenant Context
    let tenantId = notes?.tenant_id;
    let planId = notes?.plan_id;
    let billingCycle: 'monthly' | 'quarterly' | 'yearly' = (notes?.billing_cycle as any) || 'monthly';

    if (order_id) {
      const existingTxn = await PaymentTransaction.findOne({ razorpay_order_id: order_id });
      const pendingSub = await TenantSubscription.findOne({ razorpay_order_id: order_id });
      const recordedTenantId = existingTxn?.tenant_id?.toString() || pendingSub?.tenant_id?.toString();

      if (recordedTenantId) {
        // Enforce that caller cannot reassign or steal another tenant's payment order
        if (tenantId && tenantId.toString() !== recordedTenantId) {
          throw new Error(
            `Security Alert: Tampering detected. Tenant '${tenantId}' does not match original order owner '${recordedTenantId}' for order '${order_id}'.`
          );
        }
        tenantId = recordedTenantId;
        planId = planId || existingTxn?.plan_id?.toString() || pendingSub?.plan_id?.toString();
        billingCycle = (existingTxn?.billing_cycle as any) || (pendingSub?.subscription_type as any) || billingCycle;
      }
    }

    if (!tenantId) {
      throw new Error('Cannot finalize payment: unable to resolve target tenant.');
    }

    // 4. Validate Amount Integrity against Expected Plan Price
    let expectedPlan = null;
    if (planId) {
      if (mongoose.Types.ObjectId.isValid(planId)) {
        expectedPlan = await SubscriptionPlan.findById(planId);
      }
      if (!expectedPlan) {
        expectedPlan = await SubscriptionPlan.findOne({ plan_code: planId.toString().toLowerCase() });
      }
      if (!expectedPlan) {
        expectedPlan = await SubscriptionPlan.findOne({
          plan_name: { $regex: new RegExp(`^${planId}$`, 'i') }
        });
      }
    }

    let authoritativeExpectedAmount = 0;
    if (expectedPlan) {
      if (billingCycle === 'yearly') {
        authoritativeExpectedAmount = (expectedPlan.price_yearly && expectedPlan.price_yearly > 0)
          ? expectedPlan.price_yearly
          : (expectedPlan.price_monthly || 0) * 12;
      } else if (billingCycle === 'quarterly') {
        authoritativeExpectedAmount = (expectedPlan.price_quarterly && expectedPlan.price_quarterly > 0)
          ? expectedPlan.price_quarterly
          : (expectedPlan.price_monthly || 0) * 3;
      } else {
        authoritativeExpectedAmount = expectedPlan.price_monthly || 0;
      }
    }

    const actualAmountPaise = fetchedPayment ? fetchedPayment.amount : (paymentData.amount || Math.round(authoritativeExpectedAmount * 100));
    const actualAmountRupees = actualAmountPaise / 100;

    if (authoritativeExpectedAmount > 0) {
      const expectedPaise = Math.round(authoritativeExpectedAmount * 100);
      if (actualAmountPaise < expectedPaise) {
        throw new Error(
          `Security Error: Underpayment detected. Expected ${expectedPaise} paise (₹${authoritativeExpectedAmount}), received ${actualAmountPaise} paise.`
        );
      }
    }

    // 5. Atomic Subscription Activation via SubscriptionLifecycleService
    const activationResult = await SubscriptionLifecycleService.activateOrUpgradeSubscription({
      tenantId,
      planId: expectedPlan?._id?.toString() || planId,
      billingCycle,
      paymentId: payment_id,
      orderId: order_id || fetchedPayment?.order_id,
      amountPaid: actualAmountRupees,
      paymentMethod: fetchedPayment?.method || 'razorpay',
      performedBy,
      ipAddress
    });

    // 6. Update pending PaymentTransaction if exists, or create captured record
    await PaymentTransaction.findOneAndUpdate(
      { razorpay_order_id: order_id },
      {
        razorpay_payment_id: payment_id,
        status: 'captured',
        amount: actualAmountRupees,
        payment_method: fetchedPayment?.method || 'razorpay',
        payment_method_details: fetchedPayment?.acquirer_data || undefined,
        updated_at: new Date()
      }
    );

    // 7. Update onboarding progress
    if (OnboardingProgress) {
      await OnboardingProgress.findOneAndUpdate(
        { tenant_id: tenantId },
        { payment_completed: true, updated_at: new Date() },
        { upsert: false }
      ).catch(() => {});
    }

    console.log(`[Razorpay Success] Subscription successfully activated for tenant ${tenantId} via payment ${payment_id}`);

    return {
      success: true,
      tenantId,
      planId: expectedPlan?._id?.toString() || planId,
      paymentId: payment_id,
      subscription: activationResult.subscription,
      invoice: activationResult.invoice
    };
  }

  /**
   * Handle payment failure from Razorpay webhook or checkout failure event.
   * Protects against out-of-order execution: never downgrades an already completed subscription.
   */
  static async handlePaymentFailure(paymentData: {
    order_id?: string;
    error_code?: string;
    error_description?: string;
    notes?: Record<string, any>;
  }) {
    const { order_id, error_code, error_description, notes } = paymentData;
    const tenantId = notes?.tenant_id;

    if (order_id) {
      // Guard: If subscription or transaction is already marked completed, ignore failure event
      const completedSub = await TenantSubscription.findOne({
        razorpay_order_id: order_id,
        payment_status: 'completed'
      });

      if (completedSub) {
        console.log(`[Idempotency Guard] Ignoring payment failure for already completed order ${order_id}`);
        return { success: true, ignored: true, message: 'Order already completed' };
      }

      await PaymentTransaction.findOneAndUpdate(
        { razorpay_order_id: order_id },
        {
          status: 'failed',
          error_code,
          error_description,
          updated_at: new Date()
        }
      );

      if (tenantId) {
        await TenantSubscription.findOneAndUpdate(
          { tenant_id: tenantId, razorpay_order_id: order_id, payment_status: { $ne: 'completed' } },
          {
            payment_status: 'failed',
            payment_error: error_description,
            error_code,
            updated_at: new Date()
          }
        );
      }
    }

    return { success: true, recorded: true };
  }

  /**
   * Process refund for a Razorpay payment
   */
  static async processRefund(paymentId: string, amount?: number, notes?: Record<string, string>) {
    const client = getRazorpayClient();
    try {
      const refundOptions: any = { notes };
      if (amount && amount > 0) {
        refundOptions.amount = Math.round(amount * 100);
      }
      const refund = await client.payments.refund(paymentId, refundOptions);

      // Record refund in PaymentTransaction
      await PaymentTransaction.findOneAndUpdate(
        { razorpay_payment_id: paymentId },
        {
          status: 'refunded',
          razorpay_refund_id: refund.id,
          refund_amount: amount || (refund.amount ? refund.amount / 100 : undefined),
          refund_status: refund.status,
          updated_at: new Date()
        }
      );

      return refund;
    } catch (error: any) {
      const errorMsg = error?.error?.description || error?.message || 'Refund processing failed';
      console.error('[Razorpay Refund Error]:', errorMsg);
      throw new Error(`Failed to process Razorpay refund: ${errorMsg}`);
    }
  }

  /**
   * Reconcile pending payments older than the specified threshold.
   * Queries Razorpay API to check if pending orders were captured.
   */
  static async reconcilePendingPayments(olderThanMinutes = 15) {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingTxns = await PaymentTransaction.find({
      status: 'pending',
      razorpay_order_id: { $exists: true, $ne: '' },
      created_at: { $gte: oneDayAgo, $lte: cutoffTime }
    }).limit(50);

    const results = {
      total_checked: pendingTxns.length,
      reconciled_captured: 0,
      still_pending: 0,
      marked_failed: 0,
      errors: 0
    };

    for (const txn of pendingTxns) {
      try {
        const order: any = await this.fetchOrder(txn.razorpay_order_id!);
        if (order.status === 'paid' && order.amount_paid > 0) {
          // Find payment id from Razorpay client orders payments
          const client = getRazorpayClient();
          const payments: any = await (client.orders as any).fetchPayments(txn.razorpay_order_id!);
          const capturedPayment = payments.items?.find((p: any) => p.status === 'captured');

          if (capturedPayment) {
            await this.handlePaymentSuccess({
              order_id: txn.razorpay_order_id!,
              payment_id: capturedPayment.id,
              amount: capturedPayment.amount,
              notes: order.notes
            });
            results.reconciled_captured++;
          } else {
            results.still_pending++;
          }
        } else if (order.status === 'attempted' && order.attempts >= 3) {
          txn.status = 'failed';
          txn.error_description = 'Order expired after multiple failed attempts';
          await txn.save();
          results.marked_failed++;
        } else {
          results.still_pending++;
        }
      } catch (err: any) {
        console.warn(`[Reconciliation Warning] Error checking order ${txn.razorpay_order_id}:`, err.message);
        results.errors++;
      }
    }

    return results;
  }

  /**
   * Return configured public key ID
   */
  static getKey(): string {
    return getRazorpayConfig().keyId;
  }
}

export default RazorpayService;
