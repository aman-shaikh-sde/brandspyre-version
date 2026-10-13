import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { EcommerceOrder } from '../../db/ModelSceham/marketplaceSchema';
import { MarketplaceAuthRequest } from './marketplaceAuthController';

export class MarketplacePaymentController {
  private static getRazorpayClient(): Razorpay | null {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return null;
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  /**
   * POST /api/marketplace/payments/create-intent
   * Generate Razorpay order ID for online checkout
   */
  static async createPaymentIntent(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.body;

      if (!orderNumber) {
        res.status(400).json({ success: false, error: 'Order number is required.' });
        return;
      }

      const order = await EcommerceOrder.findOne({ order_number: orderNumber });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      // Check ownership if buyer authenticated
      if (req.buyer) {
        const isOwner =
          (order.buyer_id && order.buyer_id.toString() === (req.buyer.id || req.buyer._id)?.toString()) ||
          order.buyer_email.toLowerCase() === req.buyer.email?.toLowerCase();
        if (!isOwner) {
          res.status(403).json({ success: false, error: 'You do not have permission to pay for this order.' });
          return;
        }
      }

      if (order.payment_status === 'PAID') {
        res.status(400).json({ success: false, error: 'Order is already paid.' });
        return;
      }

      const razorpay = MarketplacePaymentController.getRazorpayClient();
      const amountInPaise = Math.round(order.grand_total * 100);

      if (razorpay) {
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.order_number,
          notes: {
            order_number: order.order_number,
            buyer_email: order.buyer_email
          }
        });

        order.payment_gateway_order_id = razorpayOrder.id;
        await order.save();

        res.status(200).json({
          success: true,
          gateway: 'RAZORPAY',
          key: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount: amountInPaise,
          currency: 'INR'
        });
      } else {
        // In production, reject unconfigured gateways
        if (process.env.NODE_ENV === 'production') {
          res.status(503).json({
            success: false,
            error: 'Online payment gateway is temporarily unconfigured. Please select Cash on Delivery or contact support.'
          });
          return;
        }

        // Staging/Test simulated intent for non-production environments
        const mockGatewayOrderId = `order_sim_${Date.now()}`;
        order.payment_gateway_order_id = mockGatewayOrderId;
        await order.save();

        res.status(200).json({
          success: true,
          gateway: 'SANDBOX',
          key: 'rzp_test_sandbox_dummy',
          orderId: mockGatewayOrderId,
          amount: amountInPaise,
          currency: 'INR'
        });
      }
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      res.status(500).json({ success: false, error: err.message || 'Payment intent creation failed.' });
    }
  }

  /**
   * POST /api/marketplace/payments/verify
   * Cryptographic server-side verification of payment signature.
   * Strictly enforces cryptographic proof, gateway order consistency, and idempotency.
   */
  static async verifyPayment(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const {
        orderNumber,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      if (!orderNumber) {
        res.status(400).json({ success: false, error: 'Order number is required.' });
        return;
      }

      const order = await EcommerceOrder.findOne({ order_number: orderNumber });
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
      }

      // Check ownership if buyer authenticated
      if (req.buyer) {
        const isOwner =
          (order.buyer_id && order.buyer_id.toString() === (req.buyer.id || req.buyer._id)?.toString()) ||
          order.buyer_email.toLowerCase() === req.buyer.email?.toLowerCase();
        if (!isOwner) {
          res.status(403).json({ success: false, error: 'You do not have permission to verify payment for this order.' });
          return;
        }
      }

      // 1. Idempotency Guard - if already paid, return success immediately
      if (order.payment_status === 'PAID') {
        res.status(200).json({
          success: true,
          message: 'Order is already marked as paid.',
          data: order
        });
        return;
      }

      // 2. Reject Simulated Payments in Production
      const isSimulated =
        (razorpay_payment_id && String(razorpay_payment_id).startsWith('pay_sim_')) ||
        (razorpay_order_id && String(razorpay_order_id).startsWith('order_sim_'));

      if (process.env.NODE_ENV === 'production' && isSimulated) {
        res.status(400).json({
          success: false,
          error: 'Simulated payments are strictly forbidden in production.'
        });
        return;
      }

      // 3. Mandatory Verification Payload Validation
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        res.status(400).json({
          success: false,
          error: 'Complete payment credentials (order ID, payment ID, and signature) are required for verification.'
        });
        return;
      }

      // 4. Validate Gateway Order ID matches the stored order
      if (order.payment_gateway_order_id && order.payment_gateway_order_id !== razorpay_order_id) {
        res.status(400).json({
          success: false,
          error: 'Gateway order ID does not match the order record on file.'
        });
        return;
      }

      // 5. Cryptographic Signature Validation
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        // If in test suite or dev without Razorpay keys, require valid non-empty test verification
        if (process.env.NODE_ENV === 'production') {
          res.status(500).json({
            success: false,
            error: 'Server payment configuration is incomplete. Verification cannot proceed.'
          });
          return;
        }
      } else {
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          res.status(400).json({
            success: false,
            error: 'Cryptographic signature mismatch. Payment verification rejected.'
          });
          return;
        }
      }

      // 6. Confirmed Payment Updates (Idempotent)
      order.payment_status = 'PAID';
      order.status = 'CONFIRMED';
      order.payment_reference = razorpay_payment_id;
      order.payment_signature = razorpay_signature;
      order.timeline.push({
        status: 'PAID',
        title: 'Payment Confirmed',
        description: `Payment ₹${order.grand_total.toLocaleString()} verified successfully (${razorpay_payment_id}).`,
        timestamp: new Date()
      });
      order.updated_at = new Date();

      await order.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully! Order is confirmed.',
        data: order
      });
    } catch (err: any) {
      console.error('Payment verification error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/payments/webhook
   * Authenticated, idempotent Razorpay webhook listener
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'] as string;

      if (webhookSecret) {
        if (!signature) {
          res.status(400).json({ success: false, error: 'Missing webhook signature header.' });
          return;
        }

        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        if (expectedSignature !== signature) {
          res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
          return;
        }
      } else if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ success: false, error: 'Webhook secret unconfigured.' });
        return;
      }

      const event = req.body.event;
      const payload = req.body.payload;

      if (event === 'payment.captured' && payload?.payment?.entity) {
        const paymentEntity = payload.payment.entity;
        const receipt = paymentEntity.notes?.order_number || paymentEntity.description;

        if (receipt) {
          const order = await EcommerceOrder.findOne({ order_number: receipt });
          if (order && order.payment_status !== 'PAID') {
            order.payment_status = 'PAID';
            order.status = 'CONFIRMED';
            order.payment_reference = paymentEntity.id;
            order.timeline.push({
              status: 'PAID',
              title: 'Payment Captured via Webhook',
              description: `Automated webhook confirmed payment ${paymentEntity.id}.`,
              timestamp: new Date()
            });
            order.updated_at = new Date();
            await order.save();
          }
        }
      }

      res.status(200).json({ success: true, status: 'acknowledged' });
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplacePaymentController;
