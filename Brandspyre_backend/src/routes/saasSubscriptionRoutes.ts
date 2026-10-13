import express from 'express';
import {
  getSubscriptionPlans,
  getRazorpayKey,
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
} from '../controllers/saas/saasSubscriptionController';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();

// Public webhook route (must be unauthenticated to accept Razorpay callbacks)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Public plans list & Razorpay public key
router.get('/plans', getSubscriptionPlans);
router.get('/key', getRazorpayKey);
router.post('/apply-coupon', applyCoupon);

// Checkout and verify payment support optional auth (for onboarding registration flow)
router.post('/checkout', optionalAuthMiddleware, createCheckout);
router.post('/verify-payment', optionalAuthMiddleware, verifyPayment);

// Authenticated subscription & feature usage management
router.use(authMiddleware);
router.get('/current', getCurrentSubscription);
router.get('/history', getSubscriptionHistory);
router.get('/invoices', getInvoices);
router.get('/payment-history', getPaymentTransactions);
router.put('/billing-info', updateBillingInfo);
router.get('/usage', getTenantUsage);

export default router;
