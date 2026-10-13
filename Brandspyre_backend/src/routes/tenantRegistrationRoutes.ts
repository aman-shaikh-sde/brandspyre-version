import express from "express";
import { registerTenant } from "../controllers/saas/tenantRegistrationController";
import { registerWizard } from "../controllers/saas/saasAuthController";
import { registrationLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// Public route - tenant registration (supports both legacy payload and new 4-step wizard)
router.post("/register", registrationLimiter, async (req, res, next) => {
  if (req.body.adminFirstName || req.body.companyName) {
    // New wizard payload format
    return registerWizard(req, res);
  }
  // Legacy format fallback
  return registerTenant(req, res);
});

export default router;
