import { Router } from "express";
import EventPublicController from "../controllers/events/EventPublicController";
import { normalApiLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public Rate Limiting
router.use(normalApiLimiter);

// 1. Discover published events
router.get("/", EventPublicController.listEvents);

// 2. Event details by slug or id
router.get("/:slugOrId", EventPublicController.getEventDetails);

// 3. Checkout initiation (Guest or Authenticated)
router.post("/checkout/initiate", EventPublicController.initiateCheckout);

// 4. Razorpay payment signature verification & ticket issuance
router.post("/checkout/verify", EventPublicController.verifyPayment);

// 5. Order details
router.get("/orders/:orderId", EventPublicController.getOrderDetails);

// 6. Resend confirmation email with QR codes
router.post("/orders/:orderId/resend-confirmation", EventPublicController.resendConfirmation);

// 7. Safe ticket lookup by QR token
router.get("/tickets/verify/:qrToken", EventPublicController.getPublicTicket);

export default router;
