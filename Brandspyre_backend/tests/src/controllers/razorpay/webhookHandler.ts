import { Request, Response } from 'express';
import crypto from 'crypto';
import RazorpayService from '../../services/razorpayService';
import { SubscriptionPlan } from '../../db/ModelSceham/saasSchema';

// In-memory cache for processed webhook event IDs to ensure idempotency (expires after 24 hours)
const processedEventIds = new Set<string>();

/**
 * Verify Razorpay webhook signature using raw body string
 */
const verifyWebhookSignature = (webhookSecret: string, rawBody: string, signature: string): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
    return false;
  }
};

/**
 * Handle Razorpay webhook events
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Handle Razorpay Webhook";
  
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured in environment (RAZORPAY_WEBHOOK_SECRET)');
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      console.error('Missing Razorpay signature header (x-razorpay-signature)');
      res.status(400).json({ error: 'Missing signature header' });
      return;
    }

    // Capture the raw HTTP body string for signature verification
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      rawBody = JSON.stringify(req.body);
    } else {
      console.error('Webhook body was not captured as raw text/Buffer/Object.');
      res.status(400).json({ error: 'Invalid body encoding' });
      return;
    }

    // Verify webhook signature against the raw body string
    const isValid = verifyWebhookSignature(webhookSecret, rawBody, signature);
    
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Parse verified payload
    const event = JSON.parse(rawBody);
    const eventId = event.event_id || `rzp_${event.event}_${event.created_at}_${event.payload?.payment?.entity?.id || ''}`;
    const eventType = event.event;

    // SECURITY: Persistent Idempotency check via MongoDB unique index
    try {
      const { WebhookEventLog } = require('../../db/ModelSceham/saasSchema');
      await WebhookEventLog.create({
        event_id: eventId,
        provider: 'razorpay',
        event_type: eventType,
        payload: event
      });
    } catch (dbErr: any) {
      if (dbErr.code === 11000 || (dbErr.message && dbErr.message.includes('duplicate key'))) {
        console.log(`[Idempotency] Duplicate Razorpay webhook event ${eventId} ignored (already processed in DB).`);
        res.status(200).json({ message: "Duplicate webhook event ignored", received: true });
        return;
      }
      console.warn(`[Idempotency Warning] Webhook log insert warning: ${dbErr.message}`);
    }

    const eventData = event.payload?.payment?.entity || event.payload?.subscription?.entity || {};

    console.log(`Processing verified Razorpay webhook event: ${eventType} (ID: ${eventId})`);

    switch (eventType) {
      case 'payment.captured':
      case 'payment.authorized':
        await RazorpayService.handlePaymentSuccess({
          order_id: eventData.order_id,
          payment_id: eventData.id,
          amount: eventData.amount,
          notes: eventData.notes || {}
        });
        break;

      case 'payment.failed':
        await RazorpayService.handlePaymentFailure({
          order_id: eventData.order_id,
          error_code: eventData.error_code,
          error_description: eventData.error_description,
          notes: eventData.notes || {}
        });
        break;

      case 'subscription.activated':
        console.log('Subscription activated:', eventData.id);
        break;

      case 'subscription.charged':
        console.log('Subscription charged:', eventData.id);
        break;

      case 'subscription.completed':
        console.log('Subscription completed:', eventData.id);
        break;

      case 'subscription.cancelled':
        console.log('Subscription cancelled:', eventData.id);
        break;

      case 'invoice.paid':
        console.log('Invoice paid:', eventData.id);
        break;

      case 'invoice.failed':
        console.log('Invoice failed:', eventData.id);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      received: true
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

/**
 * Verify payment from frontend
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Verify Payment";
  
  try {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      res.status(400).json({ error: 'order_id, payment_id, and signature are required' });
      return;
    }

    // Verify payment signature
    const isValid = RazorpayService.verifyPaymentSignature(order_id, payment_id, signature);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    // Fetch payment details from Razorpay
    const payment = await RazorpayService.fetchPayment(payment_id);

    if (payment.status !== 'captured') {
      res.status(400).json({ error: 'Payment not captured' });
      return;
    }

    // Process the successful payment
    const result = await RazorpayService.handlePaymentSuccess({
      order_id,
      payment_id,
      amount: payment.amount,
      notes: payment.notes || {}
    });

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: result
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

/**
 * Get Razorpay key for frontend
 */
export const getRazorpayKey = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Razorpay Key";
  
  try {
    const key = RazorpayService.getKey();

    if (!key) {
      res.status(500).json({ error: 'Razorpay key not configured' });
      return;
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: { key }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

/**
 * Create payment order for subscription
 */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Payment Order";
  
  try {
    const { userId, userRole, tenantId } = req.user as any;
    const { plan_id } = req.body;

    if (!plan_id) {
      res.status(400).json({ error: 'plan_id is required' });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    // Get subscription plan details
    const plan = await SubscriptionPlan.findById(plan_id);

    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found' });
      return;
    }

    // Create payment order
    const order = await RazorpayService.processSubscriptionPayment(
      tenantId,
      plan_id,
      plan.price_monthly
    );

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: order
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};
