import { Router } from "express";
import { TenantController } from "../controllers/tenant/tenantController";
import { tenantAuth, checkTenantRole } from "../middleware/tenantAuth";

const router = Router();
const tenantController = new TenantController();

// Public route - register new tenant
router.post("/register", async (req, res) => {
  await tenantController.registerTenant(req, res);
});

// Protected routes - require tenant authentication
router.use(tenantAuth());

// Get all tenants (super admin dashboard)
router.get("/", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.getAllTenants(req, res);
});

// Get tenant by ID
router.get("/:id", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.getTenantById(req, res);
});

// Update tenant subscription
router.put("/:id/subscription", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.updateSubscription(req, res);
});

// Create role within tenant
router.post("/:id/roles", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.createRole(req, res);
});

// Get all roles for tenant
router.get("/:id/roles", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.getTenantRoles(req, res);
});

// Create branch for tenant
router.post("/:id/branches", checkTenantRole(['super_admin', 'admin']), async (req, res) => {
  await tenantController.createBranch(req, res);
});

// Get all branches for tenant
router.get("/:id/branches", checkTenantRole(['super_admin', 'admin']), async (req, res) => {
  await tenantController.getTenantBranches(req, res);
});

// Add admin to tenant
router.post("/:id/admins", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.addAdminToTenant(req, res);
});

// Get all admins for tenant
router.get("/:id/admins", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.getTenantAdmins(req, res);
});

// Update admin in tenant
router.put("/:id/admins/:adminId", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.updateTenantAdmin(req, res);
});

// Remove admin from tenant
router.delete("/:id/admins/:adminId", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.removeAdminFromTenant(req, res);
});

// Suspend tenant
router.put("/:id/suspend", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.suspendTenant(req, res);
});

// Approve subscription plan for tenant
router.put("/:id/subscription/approve", checkTenantRole(['super_admin']), async (req, res) => {
  await tenantController.approveSubscriptionPlan(req, res);
});

export default router;
