import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth, checkTenantRole } from '../middleware/tenantAuth';
import OrganizationEntitlementService from '../services/saas/OrganizationEntitlementService';

import DynamicConfigService from '../services/saas/DynamicConfigService';

const router = Router();

// All routes require authentication & tenant context
router.use(authMiddleware);
router.use(tenantAuth());

/**
 * GET /api/organization/config
 * Returns full consolidated config payload (enabled modules, features, permissions, subscription, industry, terminology, navigation, dashboard, entityConfigs)
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const userId = (req as any).user?.userId;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Tenant context required.' });
      return;
    }

    const config = await DynamicConfigService.getConsolidatedFullConfig(tenantId, userId);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching organization config:', error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/organization/modules
 * Returns list of enabled module codes for current tenant
 */
router.get('/modules', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const modules = await OrganizationEntitlementService.getEnabledModules(tenantId);
    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * PUT /api/organization/modules
 * Enable or disable modules for current tenant (Admin only)
 * Body: { action: 'enable' | 'disable', modules: string[] | module: string }
 */
router.put('/modules', checkTenantRole(['admin', 'org_owner', 'org_admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const userId = (req as any).user?.userId;
    const { action, modules, module } = req.body;

    if (action === 'enable') {
      const moduleList = Array.isArray(modules) ? modules : [module || modules];
      const result = await OrganizationEntitlementService.enableModules(tenantId, moduleList, 'admin', userId);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.message });
        return;
      }
      res.status(200).json({ success: true, data: result.enabledModules, message: 'Modules enabled successfully.' });
    } else if (action === 'disable') {
      const targetModule = module || (Array.isArray(modules) ? modules[0] : modules);
      const result = await OrganizationEntitlementService.disableModule(tenantId, targetModule, userId);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.message });
        return;
      }
      const updatedModules = await OrganizationEntitlementService.getEnabledModules(tenantId);
      res.status(200).json({ success: true, data: updatedModules, message: `Module '${targetModule}' disabled successfully.` });
    } else {
      res.status(400).json({ success: false, error: "Invalid action. Allowed values: 'enable', 'disable'." });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/organization/features
 * Returns list of enabled feature codes for current tenant
 */
router.get('/features', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const features = await OrganizationEntitlementService.getEnabledFeatures(tenantId);
    res.status(200).json({ success: true, data: features });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * PUT /api/organization/features
 * Toggle a granular feature for current tenant (Admin only)
 * Body: { featureCode: string, enabled: boolean }
 */
router.put('/features', checkTenantRole(['admin', 'org_owner', 'org_admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const userId = (req as any).user?.userId;
    const { featureCode, enabled } = req.body;

    if (!featureCode || typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'featureCode and boolean enabled status are required.' });
      return;
    }

    const result = await OrganizationEntitlementService.setFeatureStatus(tenantId, featureCode, enabled, userId);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }

    res.status(200).json({ success: true, message: `Feature '${featureCode}' ${enabled ? 'enabled' : 'disabled'} successfully.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
