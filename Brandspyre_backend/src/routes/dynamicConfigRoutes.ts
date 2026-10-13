import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth, checkTenantRole } from '../middleware/tenantAuth';
import DynamicConfigService from '../services/saas/DynamicConfigService';
import { Industry, Module } from '../db/ModelSceham/industryModuleSchema';
import { Tenant } from '../db/ModelSceham/saasSchema';
import { EntityFieldDefinition, TerminologyDefinition, NavigationDefinition } from '../db/ModelSceham/dynamicConfigSchema';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/config/industries
 * List all active platform industries (Public)
 */
router.get('/industries', async (req: Request, res: Response): Promise<void> => {
  try {
    const industries = await Industry.find({ is_active: true }).sort({ sort_order: 1 }).lean();
    res.status(200).json({ success: true, data: industries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/modules
 * List all active platform modules (Public)
 */
router.get('/modules', async (req: Request, res: Response): Promise<void> => {
  try {
    const modules = await Module.find({ is_active: true }).sort({ sort_order: 1 }).lean();
    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

// Authenticated & Tenant-isolated endpoints below
router.use(authMiddleware);
router.use(tenantAuth());

/**
 * GET /api/config/organization
 * Consolidated configuration payload for client state hydration
 */
router.get('/organization', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = ((req as any).user?.userRole || (req as any).user?.role || '').toLowerCase();
    const userId = (req as any).user?.userId || (req as any).user?._id || (req as any).user?.id;
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin', 'platform_admin', 'super admin'].includes(userRole);
    let tenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req as any).user?.tenantId;
    if (isPlatformAdmin) {
      const headerTenant = (req.headers['x-tenant-id'] || req.headers['tenant-id']) as string;
      if (headerTenant && mongoose.Types.ObjectId.isValid(headerTenant)) {
        tenantId = headerTenant;
      }
    }

    if (!tenantId && !isPlatformAdmin) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "No organization associated with this session."
      });
      return;
    }

    if (!tenantId) {
      // Platform Admin default master fallback if database has no active tenant records yet
      const allModules = await Module.find({ is_active: true }).lean();
      res.status(200).json({
        success: true,
        data: {
          tenantId: 'platform_master',
          companyName: 'NXT Aspect Platform Master',
          industry: 'TECHNOLOGY',
          enabledModules: allModules.map((m) => m.code),
          enabledFeatures: [],
          permissions: ['*'],
          subscription: { planCode: 'enterprise', planName: 'Platform Super Admin', status: 'active' }
        }
      });
      return;
    }

    const config = await DynamicConfigService.getConsolidatedFullConfig(tenantId, userId);

    if (isPlatformAdmin) {
      // Platform Admins have access to ALL modules and ALL features across the platform
      const allModules = await Module.find({ is_active: true }).lean();
      const allCodes = allModules.map((m) => m.code);
      config.enabledModules = Array.from(new Set([...(config.enabledModules || []), ...allCodes]));
      config.permissions = ['*'];
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching dynamic organization config:', error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/entities/:entity
 * Consolidated entity configuration (fields, form sections, table columns, terminology)
 */
router.get('/entities/:entity', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const entityType = req.params.entity.toUpperCase();

    const [fields, form, table, terminologyMap] = await Promise.all([
      DynamicConfigService.getEntityFields(tenantId, undefined, entityType),
      DynamicConfigService.getFormConfig(tenantId, undefined, entityType),
      DynamicConfigService.getTableConfig(tenantId, undefined, entityType),
      DynamicConfigService.getTerminologyMap(tenantId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        entity_type: entityType,
        terminology: terminologyMap[entityType] || { label: entityType, plural_label: `${entityType}s` },
        fields,
        form,
        table
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/entities/:entity/form
 * Form configuration layout
 */
router.get('/entities/:entity/form', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const entityType = req.params.entity.toUpperCase();
    const formConfig = await DynamicConfigService.getFormConfig(tenantId, undefined, entityType);
    res.status(200).json({ success: true, data: formConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/entities/:entity/table
 * Table configuration layout
 */
router.get('/entities/:entity/table', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const entityType = req.params.entity.toUpperCase();
    const tableConfig = await DynamicConfigService.getTableConfig(tenantId, undefined, entityType);
    res.status(200).json({ success: true, data: tableConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/entities/:entity/fields
 * Field definitions list
 */
router.get('/entities/:entity/fields', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const entityType = req.params.entity.toUpperCase();
    const fields = await DynamicConfigService.getEntityFields(tenantId, undefined, entityType);
    res.status(200).json({ success: true, data: fields });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/dashboard
 * Resolved Dashboard configuration
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const dashboard = await DynamicConfigService.getDashboardConfig(tenantId);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/config/navigation
 * Resolved Dynamic Navigation
 */
router.get('/navigation', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
    const navigation = await DynamicConfigService.getNavigation(tenantId);
    res.status(200).json({ success: true, data: navigation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

// ============================================================
// ADMIN CONFIGURATION MUTATION ENDPOINTS (Admin only)
// ============================================================

/**
 * POST /api/config/entities/:entity/fields
 * Add custom field for tenant organization
 */
router.post(
  '/entities/:entity/fields',
  checkTenantRole(['admin', 'org_owner', 'org_admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      const entityType = req.params.entity.toUpperCase();
      const { field_code, label, data_type, input_type, required, section, options, placeholder } = req.body;

      if (!field_code || !label) {
        res.status(400).json({ success: false, error: 'field_code and label are required.' });
        return;
      }

      const tId = new mongoose.Types.ObjectId(tenantId as string);

      const fieldDef = await EntityFieldDefinition.findOneAndUpdate(
        { scope: 'ORGANIZATION', tenant_id: tId, entity_type: entityType, field_code: field_code.toLowerCase() },
        {
          scope: 'ORGANIZATION',
          tenant_id: tId,
          entity_type: entityType,
          field_code: field_code.toLowerCase(),
          label,
          data_type: data_type || 'string',
          input_type: input_type || 'text',
          required: Boolean(required),
          section: section || 'Custom Fields',
          options: options || [],
          placeholder: placeholder || '',
          visible: true,
          editable: true,
          sortable: true,
          filterable: true,
          searchable: true,
          is_system: false,
          is_industry_specific: false,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      res.status(201).json({ success: true, data: fieldDef, message: 'Custom field saved successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: message });
    }
  }
);

/**
 * DELETE /api/config/entities/:entity/fields/:field_code
 * Delete organization custom field definition
 */
router.delete(
  '/entities/:entity/fields/:field_code',
  checkTenantRole(['admin', 'org_owner', 'org_admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      const entityType = req.params.entity.toUpperCase();
      const fieldCode = req.params.field_code.toLowerCase();

      const tId = new mongoose.Types.ObjectId(tenantId as string);

      const deleted = await EntityFieldDefinition.findOneAndDelete({
        scope: 'ORGANIZATION',
        tenant_id: tId,
        entity_type: entityType,
        field_code: fieldCode
      });

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Custom field not found or system fields cannot be deleted.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Custom field deleted successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: message });
    }
  }
);

/**
 * PUT /api/config/terminology
 * Update tenant terminology overrides
 */
router.put(
  '/terminology',
  checkTenantRole(['admin', 'org_owner', 'org_admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      const { entity_type, label, plural_label, field_labels } = req.body;

      if (!entity_type || !label || !plural_label) {
        res.status(400).json({ success: false, error: 'entity_type, label, and plural_label are required.' });
        return;
      }

      const tId = new mongoose.Types.ObjectId(tenantId as string);
      const updatedTerm = await TerminologyDefinition.findOneAndUpdate(
        { scope: 'ORGANIZATION', tenant_id: tId, entity_type: entity_type.toUpperCase() },
        {
          scope: 'ORGANIZATION',
          tenant_id: tId,
          entity_type: entity_type.toUpperCase(),
          label,
          plural_label,
          field_labels: field_labels || {},
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ success: true, data: updatedTerm, message: 'Terminology updated successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
