import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { platformAdminAuth } from '../middleware/platformAdminAuth';
import PlatformAdminController from '../controllers/platformAdmin/platformAdminController';

const router = Router();

// Apply authMiddleware + platformAdminAuth to all routes in this router
router.use(authMiddleware);
router.use(platformAdminAuth);

// 1. Dashboard
router.get('/dashboard-stats', PlatformAdminController.getDashboardStats);
router.get('/dashboard', PlatformAdminController.getDashboardStats);

// 2. Organizations
router.get('/organizations', PlatformAdminController.getOrganizations);
router.get('/organizations/:id', PlatformAdminController.getOrganizationById);
router.put('/organizations/:id/status', PlatformAdminController.updateOrganizationStatus);
router.put('/organizations/:id/modules', PlatformAdminController.updateOrganizationModules);

// 3. Matrix & Business Types
router.get('/business-types', PlatformAdminController.getBusinessTypes);
router.put('/business-types/:code/matrix', PlatformAdminController.updateBusinessTypeMatrix);

// 4. Commercial Pricing & Add-ons
router.get('/module-pricing', PlatformAdminController.getModulePricings);
router.put('/module-pricing/:module_code', PlatformAdminController.updateModulePricing);

// 5. Fixed Plans & Addons
router.get('/plans', PlatformAdminController.getSubscriptionPlans);
router.post('/plans', PlatformAdminController.saveSubscriptionPlan);
router.put('/plans/:id', PlatformAdminController.saveSubscriptionPlan);
router.put('/plans', PlatformAdminController.saveSubscriptionPlan);
router.get('/addons', PlatformAdminController.getAddons);
router.post('/addons', PlatformAdminController.saveAddon);
router.put('/addons/:id', PlatformAdminController.saveAddon);
router.put('/addons', PlatformAdminController.saveAddon);

// 6. Custom Packages
router.get('/custom-package-requests', PlatformAdminController.getCustomPackageRequests);
router.put('/custom-package-requests/:id', PlatformAdminController.updateCustomPackageRequest);

// 7. Pricing Engine Calculate Endpoint
router.post('/calculate-price', PlatformAdminController.calculatePrice);

export default router;
