import { Router, raw } from "express";
import {
  handleRazorpayWebhook,
  verifyPayment,
  getRazorpayKey,
  createPaymentOrder,
  reconcilePendingPaymentsHandler
} from "../controllers/razorpay/webhookHandler";
import authMiddleware, { optionalAuthMiddleware } from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { platformAdminAuth } from "../middleware/platformAdminAuth";

const router = Router();

// SECURITY: Webhook endpoint receives unparsed raw body for HMAC signature verification
router.post("/webhook", raw({ type: "application/json" }), handleRazorpayWebhook);

// Public / client-safe key retrieval
router.get("/key", getRazorpayKey);

// Authenticated payment order creation and verification
router.post("/create-order", authMiddleware, tenantAuth(), createPaymentOrder);
router.post("/verify", authMiddleware, tenantAuth(), verifyPayment);

// Platform Admin payment reconciliation endpoint
router.post("/reconcile", authMiddleware, platformAdminAuth, reconcilePendingPaymentsHandler);
router.get("/reconcile", authMiddleware, platformAdminAuth, reconcilePendingPaymentsHandler);

export default router;
