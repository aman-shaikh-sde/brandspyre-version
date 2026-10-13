import { Request, Response } from 'express';
import RazorpayService from '../../services/razorpayService';
import { SubscriptionPlan, WebhookEventLog } from '../../db/ModelSceham/saasSchema';
import { PaymentTransaction } from '../../db/ModelSceham/subscriptionSystemSchema';

/**
 * Handle incoming Razorpay webhook events.
 * Enforces raw body HMAC-SHA256 signature verification and database-backed idempotency.
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Handle Razorpay Webhook";

  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      console.error('[Razorpay Webhook Error] Missing x-razorpay-signature header.');
      res.status(400).json({ error: 'Missing signature header' });
      return;
    }

    // Capture the authoritative raw HTTP body buffer/string
    let rawBody: string;
    if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
      rawBody = (req as any).rawBody.toString('utf8');
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      rawBody = JSON.stringify(req.body);
    } else {
      console.error('[Razorpay Webhook Error] Webhook body could not be decoded.');
      res.status(400).json({ error: 'Invalid body encoding' });
      return;
    }

    // Constant-time signature verification
    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Razorpay Webhook Error] Invalid webhook signature detected.');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Parse verified payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseErr) {
      res.status(400).json({ error: 'Malformed JSON payload' });
      return;
    }

    const eventId = event.event_id || `rzp_${event.event}_${event.created_at}_${event.payload?.payment?.entity?.id || ''}`;
    const eventType = event.event;

    // Database-backed idempotency protection via unique event_id index in MongoDB
    try {
      if (WebhookEventLog) {
        await WebhookEventLog.create({
          event_id: eventId,
          provider: 'razorpay',
          event_type: eventType,
          payload: event
        });
      }
    } catch (dbErr: any) {
      if (dbErr.code === 11000 || (dbErr.message && dbErr.message.includes('duplicate key'))) {
        console.log(`[Razorpay Idempotency] Duplicate webhook event ${eventId} ignored (already processed in DB).`);
        res.status(200).json({ message: "Duplicate webhook event ignored", received: true });
        return;
      }
      console.warn(`[Webhook Warning] Event logging notice: ${dbErr.message}`);
    }

    const paymentEntity = event.payload?.payment?.entity;
    const subscriptionEntity = event.payload?.subscription?.entity;
    const refundEntity = event.payload?.refund?.entity;

    console.log(`[Razorpay Webhook Verified] Event: ${eventType} (ID: ${eventId})`);

    switch (eventType) {
      case 'payment.captured':
        if (paymentEntity) {
          await RazorpayService.handlePaymentSuccess({
            order_id: paymentEntity.order_id,
            payment_id: paymentEntity.id,
            amount: paymentEntity.amount,
            notes: paymentEntity.notes || {},
            skipApiVerification: false
          });
        }
        break;

      case 'payment.authorized':
        // Subscriptions require captured payments; log authorized state without marking completed
        console.log(`[Razorpay Webhook] Payment ${paymentEntity?.id} authorized. Awaiting gateway capture.`);
        if (paymentEntity?.order_id) {
          await PaymentTransaction.findOneAndUpdate(
            { razorpay_order_id: paymentEntity.order_id },
            {
              status: 'authorized',
              razorpay_payment_id: paymentEntity.id,
              updated_at: new Date()
            }
          );
        }
        break;

      case 'payment.failed':
        if (paymentEntity) {
          await RazorpayService.handlePaymentFailure({
            order_id: paymentEntity.order_id,
            error_code: paymentEntity.error_code,
            error_description: paymentEntity.error_description,
            notes: paymentEntity.notes || {}
          });
        }
        break;

      case 'refund.processed':
      case 'refund.created':
        if (refundEntity) {
          await PaymentTransaction.findOneAndUpdate(
            { razorpay_payment_id: refundEntity.payment_id },
            {
              status: 'refunded',
              razorpay_refund_id: refundEntity.id,
              refund_amount: refundEntity.amount ? refundEntity.amount / 100 : undefined,
              refund_status: refundEntity.status,
              updated_at: new Date()
            }
          );
        }
        break;

      case 'subscription.charged':
      case 'subscription.activated':
        if (subscriptionEntity) {
          console.log(`[Razorpay Webhook] Subscription event ${eventType}: ${subscriptionEntity.id}`);
        }
        break;

      case 'subscription.cancelled':
      case 'subscription.halted':
        if (subscriptionEntity) {
          console.log(`[Razorpay Webhook] Subscription cancellation: ${subscriptionEntity.id}`);
        }
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      received: true
    });

  } catch (error: any) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Razorpay Webhook Error]: ${message}`);
    // SECURITY: Never expose internal error details in webhook responses
    res.status(500).json({ error: 'Webhook processing error' }); 
  }
};

/**
 * Verify payment from frontend checkout callback.
 * Enforces timing-safe HMAC signature verification and verifies capture status from Razorpay API.
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Verify Payment";

  try {
    const { order_id, payment_id, signature, tenantId, planId, billingCycle } = req.body;

    if (!order_id || !payment_id || !signature) {
      res.status(400).json({ error: 'order_id, payment_id, and signature are required.' });
      return;
    }

    // 1. Constant-Time Signature Verification
    const isValid = RazorpayService.verifyPaymentSignature(order_id, payment_id, signature);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid payment signature. Payment cannot be verified.' });
      return;
    }

    // 2. Resolve Target Tenant from Authentication Context or Request
    const resolvedTenantId = (req as any).user?.tenantId || (req as any).securityContext?.tenantId || tenantId;

    // 3. Process Authoritative Verification & Exactly-Once Subscription Activation
    const result = await RazorpayService.handlePaymentSuccess({
      order_id,
      payment_id,
      notes: {
        tenant_id: resolvedTenantId,
        plan_id: planId,
        billing_cycle: billingCycle
      },
      ipAddress: req.ip,
      performedBy: (req as any).user?.userId || (req as any).securityContext?.userId
    });

    res.status(200).json({ 
      success: true,
      message: 'Payment verified and subscription activated successfully.',
      data: result
    });

  } catch (error: any) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Verify Payment Error]: ${message}`);
    res.status(400).json({ error: message }); 
  }
};

/**
 * Get public Razorpay Key ID for frontend SDK initialization
 */
export const getRazorpayKey = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Razorpay Key";

  try {
    const key = RazorpayService.getKey();

    if (!key) {
      res.status(500).json({ error: 'Razorpay key is not configured in server environment.' });
      return;
    }

    res.status(200).json({ 
      success: true,
      data: { key }
    });

  } catch (error: any) { 
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message }); 
  }
};

/**
 * Create payment order for subscription checkout.
 * Calculates amounts strictly on the server from trusted database plan records.
 */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Payment Order";

  try {
    const tenantId = (req as any).user?.tenantId || (req as any).securityContext?.tenantId || req.body.tenantId;
    const planIdentifier = req.body.plan_id || req.body.planId || req.body.plan_code || req.body.subscriptionPlan;
    const billingCycle = req.body.billing_cycle || req.body.billingCycle || 'monthly';

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context required.' });
      return;
    }

    if (!planIdentifier) {
      res.status(400).json({ error: 'plan_id is required.' });
      return;
    }

    // Call service with server-authoritative price calculation
    const order = await RazorpayService.processSubscriptionPayment(
      tenantId.toString(),
      planIdentifier.toString(),
      undefined, // Disallow client-overridden amount
      billingCycle
    );

    res.status(200).json({ 
      success: true,
      data: order
    });

  } catch (error: any) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Create Payment Order Error]: ${message}`);
    res.status(400).json({ error: message }); 
  }
};

/**
 * Reconcile pending payments (Platform Admin endpoint)
 */
export const reconcilePendingPaymentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const olderThan = req.query.olderThan ? Number(req.query.olderThan) : 15;
    const stats = await RazorpayService.reconcilePendingPayments(olderThan);

    res.status(200).json({
      success: true,
      message: 'Pending payment reconciliation completed.',
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Reconciliation failed' });
  }
};

export default {
  handleRazorpayWebhook,
  verifyPayment,
  getRazorpayKey,
  createPaymentOrder,
  reconcilePendingPaymentsHandler
};
