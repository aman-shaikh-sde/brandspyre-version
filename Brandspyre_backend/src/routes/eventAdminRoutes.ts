import { Router } from "express";
import authMiddleware from "../middleware/auth";
import { platformAdminAuth } from "../middleware/platformAdminAuth";
import EventAdminController from "../controllers/events/EventAdminController";

const router = Router();

// Apply auth + Platform Admin Auth
router.use(authMiddleware);
router.use(platformAdminAuth);

// Platform GMV & Financial Metrics
router.get("/overview", EventAdminController.getPlatformOverview);

// Events Moderation
router.get("/", EventAdminController.listAllEvents);
router.put("/:id/moderate", EventAdminController.moderateEvent);

// Commission Rules Management
router.get("/commissions", EventAdminController.getCommissionRules);
router.post("/commissions", EventAdminController.saveCommissionRule);

// Settlements Oversight
router.get("/settlements", EventAdminController.listSettlements);
router.post("/settlements/generate", EventAdminController.generateSettlementBatch);
router.post("/settlements/:id/approve", EventAdminController.approveSettlement);
router.post("/settlements/:id/disburse", EventAdminController.disburseSettlement);
router.post("/settlements/:id/cancel", EventAdminController.cancelSettlement);
router.delete("/settlements/:id", EventAdminController.deleteSettlement);

export default router;
