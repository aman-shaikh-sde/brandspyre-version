import { Request, Response } from 'express';
import documentTemplateService from '../../services/documentTemplateService';
import { DOCUMENT_TYPES, DOCUMENT_MODULES, TEMPLATE_CATEGORIES, DOCUMENT_TYPE_MODULE_MAP } from '../../db/ModelSceham/documentTemplateSchema';

// ---------------------------------------------------------------
// Helper: extract tenant_id from request (set by tenantAuth middleware)
// ---------------------------------------------------------------
function getTenantId(req: any): string {
  return req.tenant?.id?.toString() || req.user?.tenantId || '';
}

function getUserId(req: any): string {
  return req.user?.userId?.toString() || '';
}

// ---------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------

/**
 * POST /seed  — Seed default sample templates
 */
export const seedTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const templates = await documentTemplateService.seedDefaultTemplates(tenantId, userId);
    res.status(200).json({ status: true, message: `Seeded sample templates`, data: templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * GET /  — List templates (paginated, filterable)
 */
export const listTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const result = await documentTemplateService.list(tenantId, {
      search: req.query.search as string,
      module: req.query.module as string,
      document_type: req.query.document_type as string,
      status: req.query.status as string,
      category: req.query.category as string,
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    });

    res.status(200).json({ status: true, data: result.templates, pagination: result.pagination });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error listing templates:', message);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * GET /:id  — Get single template
 */
export const getTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.getById(tenantId, req.params.id);
    if (!template) { res.status(404).json({ status: false, error: 'Template not found' }); return; }

    res.status(200).json({ status: true, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /  — Create template
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const { name, document_type } = req.body;
    if (!name || !document_type) {
      res.status(400).json({ status: false, error: 'name and document_type are required' });
      return;
    }

    if (!DOCUMENT_TYPES.includes(document_type)) {
      res.status(400).json({ status: false, error: `Invalid document_type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` });
      return;
    }

    const template = await documentTemplateService.create(tenantId, req.body, userId);
    res.status(201).json({ status: true, message: 'Template created successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating template:', message);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * PUT /:id  — Update template
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.update(tenantId, req.params.id, req.body, userId);
    res.status(200).json({ status: true, message: 'Template updated successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * DELETE /:id  — Delete template
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    await documentTemplateService.delete(tenantId, req.params.id);
    res.status(200).json({ status: true, message: 'Template deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

// ---------------------------------------------------------------
// Template Actions
// ---------------------------------------------------------------

/**
 * POST /:id/duplicate  — Clone template
 */
export const duplicateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.duplicate(tenantId, req.params.id, userId);
    res.status(201).json({ status: true, message: 'Template duplicated successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/publish  — Publish template
 */
export const publishTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.publish(tenantId, req.params.id, userId);
    res.status(200).json({ status: true, message: 'Template published successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/archive  — Archive template
 */
export const archiveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.archive(tenantId, req.params.id, userId);
    res.status(200).json({ status: true, message: 'Template archived successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/restore  — Restore from archive
 */
export const restoreTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.restore(tenantId, req.params.id, userId);
    res.status(200).json({ status: true, message: 'Template restored successfully', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/set-default  — Set as default for document type
 */
export const setDefaultTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const template = await documentTemplateService.setDefault(tenantId, req.params.id, userId);
    res.status(200).json({ status: true, message: 'Template set as default', data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

// ---------------------------------------------------------------
// Version Control
// ---------------------------------------------------------------

/**
 * GET /:id/versions  — List version history
 */
export const getVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const versions = await documentTemplateService.getVersions(tenantId, req.params.id);
    res.status(200).json({ status: true, data: versions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/versions/:versionNumber/restore  — Restore a version
 */
export const restoreVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const versionNumber = parseInt(req.params.versionNumber);
    if (isNaN(versionNumber)) { res.status(400).json({ status: false, error: 'Invalid version number' }); return; }

    const template = await documentTemplateService.restoreVersion(tenantId, req.params.id, versionNumber, userId);
    res.status(200).json({ status: true, message: `Restored to version ${versionNumber}`, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

// ---------------------------------------------------------------
// Rendering & Preview
// ---------------------------------------------------------------

/**
 * POST /:id/render  — Render with context data
 */
export const renderTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const result = await documentTemplateService.renderTemplate(tenantId, req.params.id, req.body);
    res.status(200).json({ status: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * POST /:id/preview  — Preview with sample data
 */
export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const result = await documentTemplateService.previewTemplate(tenantId, req.params.id);
    res.status(200).json({ status: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

// ---------------------------------------------------------------
// Variables & Metadata
// ---------------------------------------------------------------

/**
 * GET /variables/:documentType  — Get available variables
 */
export const getVariables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentType } = req.params;
    if (!DOCUMENT_TYPES.includes(documentType as any)) {
      res.status(400).json({ status: false, error: 'Invalid document type' });
      return;
    }

    const variables = documentTemplateService.getVariableDefinitions(documentType);
    res.status(200).json({ status: true, data: variables });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * GET /metadata  — Get document types, modules, categories
 */
export const getMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const categories = tenantId
      ? await documentTemplateService.listCategories(tenantId)
      : TEMPLATE_CATEGORIES.map(c => ({ code: c, name: c.charAt(0).toUpperCase() + c.slice(1) }));

    res.status(200).json({
      status: true,
      data: {
        document_types: DOCUMENT_TYPES,
        modules: DOCUMENT_MODULES,
        categories,
        type_module_map: DOCUMENT_TYPE_MODULE_MAP,
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

// ---------------------------------------------------------------
// Asset Upload
// ---------------------------------------------------------------

/**
 * POST /assets/upload  — Upload template asset
 */
export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const file = (req as any).file;
    if (!file) { res.status(400).json({ status: false, error: 'No file uploaded' }); return; }

    const asset = await documentTemplateService.createAsset(tenantId, {
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_path: file.path,
      file_size: file.size,
      asset_type: req.body.asset_type || 'image',
    }, userId);

    res.status(201).json({ status: true, message: 'Asset uploaded successfully', data: asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};

/**
 * GET /assets  — List tenant assets
 */
export const listAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(400).json({ status: false, error: 'Tenant context required' }); return; }

    const assets = await documentTemplateService.listAssets(tenantId);
    res.status(200).json({ status: true, data: assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: false, error: message });
  }
};
