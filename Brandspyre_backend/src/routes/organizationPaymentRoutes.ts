import { Router } from "express";
import { OrganizationPaymentController } from "../controllers/payments/organizationPaymentController";
import { handleRazorpayWebhook, handleStripeWebhook } from "../controllers/payments/organizationPaymentWebhook";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { platformAdminAuth } from "../middleware/platformAdminAuth";

const router = Router();

// ==========================================
// 1. PUBLIC CHECKOUT ROUTES (No Auth Required)
// ==========================================
router.get("/public/:token", OrganizationPaymentController.getPublicPaymentRequest);
router.post("/public/:token/order", OrganizationPaymentController.publicCheckout);
router.post("/public/:token/verify", OrganizationPaymentController.publicVerify);

// ==========================================
// 2. WEBHOOK RECEIVERS (Signature Verified, Public)
// ==========================================
router.post("/webhook", handleRazorpayWebhook); // Legacy Razorpay fallback
router.post("/webhooks/razorpay", handleRazorpayWebhook);
router.post("/webhooks/stripe", handleStripeWebhook);

// ==========================================
// 3. AUTHENTICATED TENANT PAYMENT ROUTES
// ==========================================
const tenantSecured = [authMiddleware, tenantAuth()];

// Connected Payment Account Management
router.get("/account", ...tenantSecured, OrganizationPaymentController.getPaymentAccount);
router.post("/account/onboard", ...tenantSecured, OrganizationPaymentController.onboardPaymentAccount);
router.post("/account/onboarding-link", ...tenantSecured, OrganizationPaymentController.createOnboardingLink);
router.post("/account/refresh", ...tenantSecured, OrganizationPaymentController.refreshPaymentAccount);
router.post("/account/disconnect", ...tenantSecured, OrganizationPaymentController.disconnectPaymentAccount);
router.post("/account/set-default", ...tenantSecured, OrganizationPaymentController.setDefaultProvider);

// Marketplace Checkout & Verification (In-App)
router.post("/marketplace/checkout", ...tenantSecured, OrganizationPaymentController.createCheckoutOrder);
router.post("/marketplace/verify", ...tenantSecured, OrganizationPaymentController.verifyPayment);

// Payment Requests Management
router.post("/requests", ...tenantSecured, OrganizationPaymentController.createPaymentRequest);
router.get("/requests", ...tenantSecured, OrganizationPaymentController.getPaymentRequests);
router.get("/requests/:id", ...tenantSecured, OrganizationPaymentController.getPaymentRequestById);
router.post("/requests/:id/cancel", ...tenantSecured, OrganizationPaymentController.cancelPaymentRequest);

// Refunds & Dashboard
router.post("/:paymentId/refund", ...tenantSecured, OrganizationPaymentController.processRefund);
router.get("/dashboard", ...tenantSecured, OrganizationPaymentController.getDashboard);

// Platform Admin Fee Config
router.get("/platform/config", authMiddleware, platformAdminAuth, OrganizationPaymentController.getPlatformFeeConfig);
router.post("/platform/config", authMiddleware, platformAdminAuth, OrganizationPaymentController.updatePlatformFeeConfig);

// Platform Admin Reconciliation & Settlement Adjustments
router.get("/admin/reconciliations", authMiddleware, platformAdminAuth, OrganizationPaymentController.getAdminReconciliations);
router.post("/admin/reconciliations/:paymentId/status", authMiddleware, platformAdminAuth, OrganizationPaymentController.updateAdjustmentStatus);

export default router;
