import { Request, Response } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import { MarketplacePaymentService } from "../../services/payments/MarketplacePaymentService";
import { OrganizationPayment } from "../../db/ModelSceham/organizationPaymentSchema";
import { OrganizationPaymentRequest } from "../../db/ModelSceham/organizationPaymentRequestSchema";
import { OrganizationPaymentAccount } from "../../db/ModelSceham/organizationPaymentAccountSchema";
import { B2BSettlementInvoice, B2BSettlementTransaction } from "../../db/ModelSceham/b2bSettlementSchema";
import { PaymentAllocation } from "../../db/ModelSceham/paymentAllocationSchema";
import { PlatformCommission } from "../../db/ModelSceham/platformCommissionSchema";
import { WebhookEventLog } from "../../db/ModelSceham/saasSchema";

const verifyRazorpaySignature = (webhookSecret: string, rawBody: string, signature: string): boolean => {
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
 * 1. Razorpay Marketplace Webhook Handler
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.MARKETPLACE_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    if (!webhookSecret) {
      console.error("[Razorpay Webhook Error] RAZORPAY_WEBHOOK_SECRET not configured in environment.");
      res.status(500).json({ error: "Webhook secret not configured." });
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      console.error("[Razorpay Webhook Error] Missing x-razorpay-signature header.");
      res.status(400).json({ error: "Missing signature header." });
      return;
    }

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
      res.status(400).json({ error: "Invalid body encoding." });
      return;
    }

    const isValid = verifyRazorpaySignature(webhookSecret, rawBody, signature);
    if (!isValid) {
      console.error("[Razorpay Webhook Error] Invalid Razorpay webhook signature.");
      res.status(400).json({ error: "Invalid signature." });
      return;
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const eventId = event.event_id || `rzp_b2b_${event.event}_${event.created_at}_${event.payload?.payment?.entity?.id || ''}`;

    // Persistent Idempotency Check
    try {
      if (WebhookEventLog) {
        await WebhookEventLog.create({
          event_id: eventId,
          provider: 'razorpay_b2b',
          event_type: eventType,
          payload: event
        });
      }
    } catch (dbErr: any) {
      if (dbErr.code === 11000 || (dbErr.message && dbErr.message.includes('duplicate key'))) {
        console.log(`[Idempotency] Duplicate Razorpay B2B webhook event ${eventId} safely ignored.`);
        res.status(200).json({ received: true, message: "Duplicate event ignored." });
        return;
      }
    }

    const paymentEntity = event.payload?.payment?.entity;
    const transferEntity = event.payload?.transfer?.entity;
    const refundEntity = event.payload?.refund?.entity;
    const accountEntity = event.payload?.account?.entity;

    console.log(`[Razorpay B2B Webhook] Processing verified event '${eventType}' (ID: ${eventId})`);

    switch (eventType) {
      case 'payment.captured':
      case 'payment.authorized':
        if (paymentEntity) {
          const notes = paymentEntity.notes || {};
          const isB2B = notes.payment_type === 'ORGANIZATION_PAYMENT' || 
                        notes.payment_type === 'LEAD_MARKETPLACE_SETTLEMENT' || 
                        !!notes.payment_request_id;

          let payment = await OrganizationPayment.findOne({
            $or: [
              { provider_order_id: paymentEntity.order_id },
              { provider_payment_id: paymentEntity.id }
            ]
          });

          if (isB2B || payment) {
            await MarketplacePaymentService.reconcileCapturedPayment({
              provider: 'razorpay',
              order_id: paymentEntity.order_id,
              payment_id: paymentEntity.id,
              payment_request_id: notes.payment_request_id,
              amount: paymentEntity.amount ? paymentEntity.amount / 100 : undefined,
              payment_method: paymentEntity.method,
              provider_fee: paymentEntity.fee ? paymentEntity.fee / 100 : undefined,
              provider_signature: signature
            });
          }
        }
        break;

      case 'payment.failed':
        if (paymentEntity) {
          const payment = await OrganizationPayment.findOne({
            $or: [
              { provider_order_id: paymentEntity.order_id },
              { provider_payment_id: paymentEntity.id }
            ]
          });
          if (payment && payment.status !== 'CAPTURED') {
            payment.status = 'FAILED';
            payment.failure_reason = paymentEntity.error_description || paymentEntity.error_reason || 'Payment failed';
            payment.error_code = paymentEntity.error_code;
            payment.failed_at = new Date();
            await payment.save();
          }
        }
        break;

      case 'transfer.processed':
        if (transferEntity) {
          const payment = await OrganizationPayment.findOne({
            $or: [
              { provider_payment_id: transferEntity.source },
              { provider_transfer_id: transferEntity.id }
            ]
          });

          if (payment) {
            payment.provider_transfer_id = transferEntity.id;
            payment.status = 'SETTLED';
            payment.settled_at = new Date();
            await payment.save();

            // Mark platform commissions and transactions settled
            await PlatformCommission.updateMany(
              { payment_id: payment._id },
              { status: 'SETTLED', settled_at: new Date() }
            );

            const allocations = await PaymentAllocation.find({ payment_id: payment._id });
            const txnIds = allocations.map(a => a.settlement_transaction_id).filter(Boolean);
            if (txnIds.length > 0) {
              await B2BSettlementTransaction.updateMany(
                { _id: { $in: txnIds }, remaining_amount: { $lte: 0.01 } },
                { status: 'settled', settled_at: new Date() }
              );
            }
          }
        }
        break;

      case 'transfer.failed':
        if (transferEntity) {
          const payment = await OrganizationPayment.findOne({
            $or: [
              { provider_payment_id: transferEntity.source },
              { provider_transfer_id: transferEntity.id }
            ]
          });

          if (payment) {
            payment.status = 'TRANSFER_FAILED';
            payment.failure_reason = `Route split transfer failed: ${transferEntity.error_description || 'Transfer rejected'}`;
            await payment.save();
          }
        }
        break;

      case 'refund.processed':
      case 'refund.created':
        if (refundEntity) {
          const payment = await OrganizationPayment.findOne({
            provider_payment_id: refundEntity.payment_id
          });

          if (payment) {
            const alreadyProcessed = payment.refunds.some((r: any) => r.refund_id === refundEntity.id);
            if (!alreadyProcessed) {
              const refundAmount = refundEntity.amount ? refundEntity.amount / 100 : 0;
              await MarketplacePaymentService.processRefund(payment._id.toString(), {
                amount: refundAmount,
                reason: refundEntity.notes?.reason || 'Refund processed via Razorpay'
              });
            }
          }
        }
        break;

      case 'account.activated':
      case 'account.under_review':
      case 'account.suspended':
        if (accountEntity) {
          const statusMap: Record<string, string> = {
            'account.activated': 'ACTIVE',
            'account.under_review': 'PENDING_VERIFICATION',
            'account.suspended': 'SUSPENDED'
          };
          const newStatus = statusMap[eventType] || 'PENDING';
          const isActivated = newStatus === 'ACTIVE';

          await OrganizationPaymentAccount.updateMany(
            { $or: [{ provider_account_id: accountEntity.id }, { "razorpay.account_id": accountEntity.id }] },
            {
              account_status: newStatus,
              payments_enabled: isActivated,
              payouts_enabled: isActivated,
              "razorpay.status": newStatus,
              "razorpay.payments_enabled": isActivated,
              "razorpay.payouts_enabled": isActivated,
              updated_at: new Date()
            }
          );
        }
        break;
    }

    res.status(200).json({ received: true, status: "success" });
  } catch (error: any) {
    console.error("[Razorpay Webhook Handler Error]", error);
    // SECURITY: Never expose internal error details in webhook responses
    res.status(500).json({ error: "Internal webhook processing error." });
  }
};

/**
 * 2. Stripe Marketplace Webhook Handler
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error("[Stripe Webhook Error] STRIPE_WEBHOOK_SECRET not configured in environment.");
      res.status(500).json({ error: "Stripe webhook secret not configured." });
      return;
    }

    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      console.error("[Stripe Webhook Error] Missing stripe-signature header.");
      res.status(400).json({ error: "Missing stripe-signature header." });
      return;
    }

    let rawBodyBuffer: Buffer;
    if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
      rawBodyBuffer = (req as any).rawBody;
    } else if (Buffer.isBuffer(req.body)) {
      rawBodyBuffer = req.body;
    } else if (typeof req.body === 'string') {
      rawBodyBuffer = Buffer.from(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      rawBodyBuffer = Buffer.from(JSON.stringify(req.body));
    } else {
      res.status(400).json({ error: "Invalid body encoding." });
      return;
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (process.env.NODE_ENV === "production" && (!stripeKey || stripeKey === 'sk_test_dummy')) {
      console.error("[Stripe Webhook] FATAL: STRIPE_SECRET_KEY is required in production.");
      res.status(500).json({ error: "Stripe configuration error in production." });
      return;
    }

    const stripe = new Stripe(stripeKey || 'sk_test_dummy', {
      apiVersion: '2025-02-24.acacia' as any
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBodyBuffer, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook Signature Verification Error]", err.message);
      // SECURITY: Never expose signature verification details to callers
      res.status(400).json({ error: "Webhook signature verification failed." });
      return;
    }

    const eventType = event.type;
    const eventId = event.id;

    // Persistent Idempotency Check
    try {
      if (WebhookEventLog) {
        await WebhookEventLog.create({
          event_id: eventId,
          provider: 'stripe_b2b',
          event_type: eventType,
          payload: event
        });
      }
    } catch (dbErr: any) {
      if (dbErr.code === 11000 || (dbErr.message && dbErr.message.includes('duplicate key'))) {
        console.log(`[Idempotency] Duplicate Stripe B2B webhook event ${eventId} safely ignored.`);
        res.status(200).json({ received: true, message: "Duplicate event ignored." });
        return;
      }
    }

    console.log(`[Stripe B2B Webhook] Processing verified event '${eventType}' (ID: ${eventId})`);

    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = session.payment_intent as string;
        const paymentRequestId = session.client_reference_id || session.metadata?.payment_request_id;

        await MarketplacePaymentService.reconcileCapturedPayment({
          provider: 'stripe',
          order_id: session.id,
          payment_id: paymentIntentId || session.id,
          payment_request_id: paymentRequestId,
          amount: session.amount_total ? session.amount_total / 100 : undefined,
          payment_method: 'card'
        });
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentRequestId = pi.metadata?.payment_request_id;
        const transferId = (pi as any).transfer || pi.transfer_data?.destination as string;

        await MarketplacePaymentService.reconcileCapturedPayment({
          provider: 'stripe',
          order_id: pi.id,
          payment_id: pi.id,
          payment_request_id: paymentRequestId,
          amount: pi.amount ? pi.amount / 100 : undefined,
          transfer_id: transferId,
          payment_method: pi.payment_method_types?.[0] || 'card'
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const payment = await OrganizationPayment.findOne({
          $or: [{ provider_order_id: pi.id }, { provider_payment_id: pi.id }]
        });

        if (payment && payment.status !== 'CAPTURED') {
          payment.status = 'FAILED';
          payment.failure_reason = pi.last_payment_error?.message || 'Stripe payment failed';
          payment.error_code = pi.last_payment_error?.code;
          payment.failed_at = new Date();
          await payment.save();
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        const payment = await OrganizationPayment.findOne({
          $or: [
            { provider_payment_id: charge.id },
            { provider_payment_id: paymentIntentId },
            { provider_order_id: paymentIntentId }
          ]
        });

        if (payment) {
          const refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : payment.amount;
          await MarketplacePaymentService.processRefund(payment._id.toString(), {
            amount: refundAmount,
            reason: 'Refunded via Stripe Dashboard/API'
          });
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const isLiveActive = Boolean(account.charges_enabled && account.payouts_enabled);
        const newStatus = isLiveActive ? 'ACTIVE' : (account.details_submitted ? 'PENDING_VERIFICATION' : 'ONBOARDING');

        await OrganizationPaymentAccount.updateMany(
          { "stripe.account_id": account.id },
          {
            "stripe.status": newStatus,
            "stripe.charges_enabled": Boolean(account.charges_enabled),
            "stripe.payouts_enabled": Boolean(account.payouts_enabled),
            "stripe.details_submitted": Boolean(account.details_submitted),
            updated_at: new Date()
          }
        );
        break;
      }

      case 'transfer.created':
      case 'transfer.paid' as any: {
        const transfer = event.data.object as any;
        const payment = await OrganizationPayment.findOne({
          $or: [
            { provider_transfer_id: transfer.id },
            { provider_payment_id: transfer.source_transaction }
          ]
        });

        if (payment) {
          payment.provider_transfer_id = transfer.id;
          payment.status = 'SETTLED';
          payment.settled_at = new Date();
          await payment.save();

          await PlatformCommission.updateMany(
            { payment_id: payment._id },
            { status: 'SETTLED', settled_at: new Date() }
          );

          const allocations = await PaymentAllocation.find({ payment_id: payment._id });
          const txnIds = allocations.map(a => a.settlement_transaction_id).filter(Boolean);
          if (txnIds.length > 0) {
            await B2BSettlementTransaction.updateMany(
              { _id: { $in: txnIds }, remaining_amount: { $lte: 0.01 } },
              { status: 'settled', settled_at: new Date() }
            );
          }
        }
        break;
      }
    }

    res.status(200).json({ received: true, status: "success" });
  } catch (error: any) {
    console.error("[Stripe Webhook Handler Error]", error);
    // SECURITY: Never expose internal error details in webhook responses
    res.status(500).json({ error: "Internal webhook processing error." });
  }
};

// Backward-compatible alias
export const handleOrganizationPaymentWebhook = handleRazorpayWebhook;
