import { Router } from "express";
import { masterSuperAdminAuth } from "../middleware/masterSuperAdminAuth";
import {
  getAllTenants,
  getTenantById,
  updateTenantStatus,
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSystemStats,
  upgradeTenantSubscription
} from "../controllers/masterSuperAdmin/masterSuperAdminController";

const router = Router();

// Apply master super admin authentication to all routes
router.use(masterSuperAdminAuth);

// Tenant management routes
router.get("/tenants", getAllTenants);
router.get("/tenants/:id", getTenantById);
router.put("/tenants/:id/status", updateTenantStatus);
router.put("/tenants/:id/upgrade", upgradeTenantSubscription);

// Subscription plan management routes
router.get("/subscription-plans", getAllSubscriptionPlans);
router.post("/subscription-plans", createSubscriptionPlan);
router.put("/subscription-plans/:id", updateSubscriptionPlan);
router.delete("/subscription-plans/:id", deleteSubscriptionPlan);

// System statistics
router.get("/stats", getSystemStats);

export default router;
