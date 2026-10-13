import mongoose from 'mongoose';
import {
  DocumentTemplate,
  TemplateVersion,
  TemplateAsset,
  TemplateCategory,
  DOCUMENT_TYPE_MODULE_MAP,
  IDocumentTemplate
} from '../db/ModelSceham/documentTemplateSchema';
import { getAvailableVariables, getSampleData, resolveVariables, replaceVariables } from './variableEngine';
import { filterComponentsByConditions } from './conditionEngine';
import { getDefaultLayoutForType } from './sampleTemplates';

// ---------------------------------------------------------------
// Document Template Service — Business Logic Layer
// ---------------------------------------------------------------

class DocumentTemplateService {

  /**
   * Create a new template
   */
  async create(tenantId: string, data: any, userId: string) {
    const module = data.module || DOCUMENT_TYPE_MODULE_MAP[data.document_type] || 'hr';
    const slug = this.generateSlug(data.name);

    let layoutJson = data.layout_json;
    if (!layoutJson || !layoutJson.components || layoutJson.components.length === 0) {
      layoutJson = getDefaultLayoutForType(data.document_type);
    }

    const template = new DocumentTemplate({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      name: data.name,
      slug,
      document_type: data.document_type,
      module,
      category: data.category || 'professional',
      layout_json: layoutJson,
      generated_html: data.generated_html || '',
      css: data.css || '',
      branding_overrides: data.branding_overrides || {},
      pdf_settings: data.pdf_settings || undefined,
      variables_used: data.variables_used || [],
      conditions: data.conditions || [],
      status: 'draft',
      is_default: false,
      version: 1,
      created_by: new mongoose.Types.ObjectId(userId),
      updated_by: new mongoose.Types.ObjectId(userId),
    });

    await template.save();

    // Save initial version
    await new TemplateVersion({
      tenant_id: template.tenant_id,
      template_id: template._id,
      version: 1,
      layout_json: template.layout_json,
      generated_html: template.generated_html,
      css: template.css,
      change_summary: 'Initial version',
      created_by: new mongoose.Types.ObjectId(userId),
    }).save();

    return template;
  }

  /**
   * Update an existing template — auto-increments version
   */
  async update(tenantId: string, templateId: string, data: any, userId: string) {
    const template = await DocumentTemplate.findOne({
      _id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    });

    if (!template) throw new Error('Template not found');

    const newVersion = template.version + 1;

    // Update fields
    if (data.name !== undefined) template.name = data.name;
    if (data.category !== undefined) template.category = data.category;
    if (data.layout_json !== undefined) template.layout_json = data.layout_json;
    if (data.generated_html !== undefined) template.generated_html = data.generated_html;
    if (data.css !== undefined) template.css = data.css;
    if (data.branding_overrides !== undefined) template.branding_overrides = data.branding_overrides;
    if (data.pdf_settings !== undefined) template.pdf_settings = data.pdf_settings;
    if (data.variables_used !== undefined) template.variables_used = data.variables_used;
    if (data.conditions !== undefined) template.conditions = data.conditions;

    template.version = newVersion;
    template.updated_by = new mongoose.Types.ObjectId(userId);
    template.updated_at = new Date();

    await template.save();

    // Save version snapshot
    await new TemplateVersion({
      tenant_id: template.tenant_id,
      template_id: template._id,
      version: newVersion,
      layout_json: template.layout_json,
      generated_html: template.generated_html,
      css: template.css,
      change_summary: data.change_summary || `Updated to version ${newVersion}`,
      created_by: new mongoose.Types.ObjectId(userId),
    }).save();

    return template;
  }

  /**
   * Get a single template by ID
   */
  async getById(tenantId: string, templateId: string) {
    return DocumentTemplate.findOne({
      _id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    });
  }

  /**
   * List templates with search, filter, pagination, sort
   */
  async list(tenantId: string, filters: {
    search?: string;
    module?: string;
    document_type?: string;
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query: any = { tenant_id: new mongoose.Types.ObjectId(tenantId) };

    if (filters.module) query.module = filters.module;
    if (filters.document_type) query.document_type = filters.document_type;
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { document_type: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const sortBy = filters.sortBy || 'updated_at';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    let [templates, total] = await Promise.all([
      DocumentTemplate.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      DocumentTemplate.countDocuments(query)
    ]);

    // If tenant has no templates at all, seed sample default templates automatically
    if (total === 0 && !filters.search && !filters.module && !filters.status && !filters.category) {
      await this.seedDefaultTemplates(tenantId, 'system');
      [templates, total] = await Promise.all([
        DocumentTemplate.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        DocumentTemplate.countDocuments(query)
      ]);
    }

    return {
      templates,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * Duplicate (clone) a template
   */
  async duplicate(tenantId: string, templateId: string, userId: string) {
    const source = await this.getById(tenantId, templateId);
    if (!source) throw new Error('Template not found');

    const newName = `${source.name} (Copy)`;
    const newSlug = this.generateSlug(newName);

    return this.create(tenantId, {
      name: newName,
      slug: newSlug,
      document_type: source.document_type,
      module: source.module,
      category: source.category,
      layout_json: source.layout_json,
      generated_html: source.generated_html,
      css: source.css,
      branding_overrides: source.branding_overrides,
      pdf_settings: source.pdf_settings,
      variables_used: source.variables_used,
      conditions: source.conditions,
    }, userId);
  }

  /**
   * Publish a template
   */
  async publish(tenantId: string, templateId: string, userId: string) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    template.status = 'published';
    template.published_by = new mongoose.Types.ObjectId(userId);
    template.published_at = new Date();
    template.updated_at = new Date();
    await template.save();
    return template;
  }

  /**
   * Archive a template
   */
  async archive(tenantId: string, templateId: string, userId: string) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    template.status = 'archived';
    template.updated_by = new mongoose.Types.ObjectId(userId);
    template.updated_at = new Date();
    await template.save();
    return template;
  }

  /**
   * Restore an archived template to draft
   */
  async restore(tenantId: string, templateId: string, userId: string) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    template.status = 'draft';
    template.updated_by = new mongoose.Types.ObjectId(userId);
    template.updated_at = new Date();
    await template.save();
    return template;
  }

  /**
   * Set a template as the default for its document type
   */
  async setDefault(tenantId: string, templateId: string, userId: string) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    // Unset all other defaults for same document_type in this tenant
    await DocumentTemplate.updateMany(
      {
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        document_type: template.document_type,
        _id: { $ne: template._id }
      },
      { is_default: false }
    );

    template.is_default = true;
    template.updated_by = new mongoose.Types.ObjectId(userId);
    template.updated_at = new Date();
    await template.save();
    return template;
  }

  /**
   * Soft delete a template (set status to archived, or hard-delete)
   */
  async delete(tenantId: string, templateId: string) {
    const result = await DocumentTemplate.deleteOne({
      _id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    });

    // Also clean up version history
    await TemplateVersion.deleteMany({
      template_id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    });

    return result;
  }

  /**
   * Get version history for a template
   */
  async getVersions(tenantId: string, templateId: string) {
    return TemplateVersion.find({
      template_id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    })
    .sort({ version: -1 })
    .populate('created_by', 'firstname lastname')
    .lean();
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(tenantId: string, templateId: string, versionNumber: number, userId: string) {
    const version = await TemplateVersion.findOne({
      template_id: new mongoose.Types.ObjectId(templateId),
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      version: versionNumber
    });

    if (!version) throw new Error('Version not found');

    return this.update(tenantId, templateId, {
      layout_json: version.layout_json,
      generated_html: version.generated_html,
      css: version.css,
      change_summary: `Restored from version ${versionNumber}`
    }, userId);
  }

  /**
   * Render a template with actual data (replace variables, evaluate conditions)
   */
  async renderTemplate(tenantId: string, templateId: string, contextData?: { contextId?: string; data?: Record<string, string> }) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    let variableValues: Record<string, string>;

    if (contextData?.data) {
      variableValues = contextData.data;
    } else {
      variableValues = await resolveVariables(
        template.document_type,
        contextData?.contextId || '',
        tenantId
      );
    }

    // Replace variables in generated HTML
    let renderedHtml = replaceVariables(template.generated_html || '', variableValues);

    // Filter components by conditions if layout_json has components
    let filteredLayout = template.layout_json;
    if (filteredLayout?.components) {
      filteredLayout = {
        ...filteredLayout,
        components: filterComponentsByConditions(filteredLayout.components, variableValues)
      };
    }

    return {
      html: renderedHtml,
      layout_json: filteredLayout,
      css: template.css,
      pdf_settings: template.pdf_settings,
      variables: variableValues
    };
  }

  /**
   * Preview with sample data
   */
  async previewTemplate(tenantId: string, templateId: string) {
    const template = await this.getById(tenantId, templateId);
    if (!template) throw new Error('Template not found');

    const sampleData = getSampleData(template.document_type);
    const flatData: Record<string, string> = {};
    flattenObject(sampleData, '', flatData);

    let renderedHtml = replaceVariables(template.generated_html || '', flatData);

    let filteredLayout = template.layout_json;
    if (filteredLayout?.components) {
      filteredLayout = {
        ...filteredLayout,
        components: filterComponentsByConditions(filteredLayout.components, flatData)
      };
    }

    return {
      html: renderedHtml,
      layout_json: filteredLayout,
      css: template.css,
      pdf_settings: template.pdf_settings,
      variables: flatData
    };
  }

  /**
   * Get available variables for a document type
   */
  getVariableDefinitions(documentType: string) {
    return getAvailableVariables(documentType);
  }

  /**
   * List template categories (system + tenant custom)
   */
  async listCategories(tenantId: string) {
    return TemplateCategory.find({
      $or: [
        { tenant_id: null, is_system: true },
        { tenant_id: new mongoose.Types.ObjectId(tenantId) }
      ]
    }).sort({ is_system: -1, name: 1 }).lean();
  }

  // ---------------------------------------------------------------
  // Asset management
  // ---------------------------------------------------------------
  async createAsset(tenantId: string, assetData: any, userId: string) {
    const asset = new TemplateAsset({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      filename: assetData.filename,
      original_name: assetData.original_name,
      mime_type: assetData.mime_type,
      file_path: assetData.file_path,
      file_size: assetData.file_size,
      asset_type: assetData.asset_type || 'image',
      uploaded_by: new mongoose.Types.ObjectId(userId),
    });
    await asset.save();
    return asset;
  }

  async listAssets(tenantId: string) {
    return TemplateAsset.find({
      tenant_id: new mongoose.Types.ObjectId(tenantId)
    }).sort({ created_at: -1 }).lean();
  }

  // ---------------------------------------------------------------
  // Seed default sample templates for new tenants
  // ---------------------------------------------------------------
  async seedDefaultTemplates(tenantId: string, userId: string) {
    const samples = [
      { name: 'Standard Tax Invoice', document_type: 'invoice', category: 'professional' },
      { name: 'Employee Offer Letter', document_type: 'offer_letter', category: 'corporate' },
      { name: 'Sales Quotation', document_type: 'quotation', category: 'modern' },
      { name: 'Monthly Payslip', document_type: 'payslip', category: 'professional' },
      { name: 'Project Contract Agreement', document_type: 'project_contract', category: 'corporate' },
    ];

    const created = [];
    const validUserId = mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId().toString();

    for (const sample of samples) {
      const existing = await DocumentTemplate.findOne({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        document_type: sample.document_type,
        name: sample.name
      });
      if (!existing) {
        const layout = getDefaultLayoutForType(sample.document_type);
        const t = await this.create(tenantId, {
          ...sample,
          layout_json: layout,
          status: 'published',
          is_default: true,
        }, validUserId);
        created.push(t);
      }
    }
    return created;
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  private generateSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
  }
}

// Flatten nested object for variable replacement
function flattenObject(obj: Record<string, any>, prefix: string, result: Record<string, string>) {
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], fullPath, result);
    } else {
      result[fullPath] = String(obj[key] ?? '');
    }
  }
}

export default new DocumentTemplateService();
