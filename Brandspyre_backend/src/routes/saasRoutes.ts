import express from "express";
import {
  createTenant,
  getTenantInfo,
  updateTenantSettings,
  getSubscriptionPlans,
  upgradeSubscription
} from "../controllers/saas/tenantController";
import {
  registerTenant,
  getPendingTenants,
  approveTenant
} from "../controllers/saas/tenantRegistrationController";
import authenticateToken from "../middleware/auth";
import saasAuthRoutes from "./saasAuthRoutes";
import saasSubscriptionRoutes from "./saasSubscriptionRoutes";
import saasOnboardingRoutes from "./saasOnboardingRoutes";
import superAdminRoutes from "./superAdminRoutes";

const router = express.Router();

// Mount Auth Sub-router (handles public & private auth endpoints)
router.use("/auth", saasAuthRoutes);

// Mount Subscription Sub-router (handles webhook, plans, checkout, usage)
router.use("/subscription", saasSubscriptionRoutes);

// Mount Onboarding Sub-router
router.use("/onboarding", saasOnboardingRoutes);

// Mount Super Admin Sub-router
router.use("/admin", superAdminRoutes);

// Legacy Tenant management routes (requires auth)
router.post("/tenant/create", authenticateToken, createTenant);
router.get("/tenant/info", authenticateToken, getTenantInfo);
router.put("/tenant/settings", authenticateToken, updateTenantSettings);

// Legacy Tenant registration and approval routes
router.post("/tenants/register", registerTenant); // Public
router.get("/tenants/pending", authenticateToken, getPendingTenants);
router.post("/tenants/approve", authenticateToken, approveTenant);

export default router;
