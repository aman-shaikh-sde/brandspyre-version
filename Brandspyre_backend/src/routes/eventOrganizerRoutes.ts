import { Router } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { requireActiveSubscription, requireModuleAccess } from "../middleware/subscriptionGuard";
import EventOrganizerController from "../controllers/events/EventOrganizerController";

const router = Router();

// Apply Authentication + Real-time Tenant Verification + Subscription & Module Guard
router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireActiveSubscription);
router.use(requireModuleAccess('event_management'));

// Dashboard Stats & Financials
router.get("/dashboard-stats", EventOrganizerController.getDashboardStats);
router.get("/finance/summary", EventOrganizerController.getFinancialSummary);
router.get("/finance/settlements", EventOrganizerController.getSettlements);

// Global Orders & Attendees
router.get("/orders/all", EventOrganizerController.getOrders);
router.get("/attendees/all", EventOrganizerController.getAttendees);

// Check-in Terminal (global)
router.post("/checkin", EventOrganizerController.checkinAttendee);

// Refunds
router.post("/orders/:orderId/refund", EventOrganizerController.refundOrder);

// Event CRUD & Lifecycle
router.get("/", EventOrganizerController.listEvents);
router.post("/", EventOrganizerController.createEvent);
router.get("/:id", EventOrganizerController.getEvent);
router.put("/:id", EventOrganizerController.updateEvent);
router.post("/:id/publish", EventOrganizerController.publishEvent);
router.post("/:id/cancel", EventOrganizerController.cancelEvent);

// Tickets CRUD
router.get("/:id/tickets", EventOrganizerController.getTickets);
router.post("/:id/tickets", EventOrganizerController.createTicket);
router.put("/:id/tickets/:ticketId", EventOrganizerController.updateTicket);
router.delete("/:id/tickets/:ticketId", EventOrganizerController.deleteTicket);

// Addons CRUD
router.get("/:id/addons", EventOrganizerController.getAddons);
router.post("/:id/addons", EventOrganizerController.createAddon);

// Sessions CRUD
router.get("/:id/sessions", EventOrganizerController.getSessions);
router.post("/:id/sessions", EventOrganizerController.createSession);

// Event-specific Orders, Attendees & Checkin
router.get("/:id/orders", EventOrganizerController.getOrders);
router.get("/:id/attendees", EventOrganizerController.getAttendees);
router.post("/:id/checkin", EventOrganizerController.checkinAttendee);

export default router;
