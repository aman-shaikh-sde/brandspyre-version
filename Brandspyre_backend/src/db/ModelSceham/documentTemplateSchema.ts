import mongoose, { Schema, Document } from "mongoose";

// ---------------------------------------------------------------
// Document Type & Module Enums
// ---------------------------------------------------------------
export const DOCUMENT_TYPES = [
  // HR
  'offer_letter', 'joining_letter', 'appointment_letter', 'confirmation_letter',
  'promotion_letter', 'salary_revision', 'payslip', 'experience_letter',
  'relieving_letter', 'termination_letter', 'warning_letter',
  // Sales
  'quotation', 'sales_order', 'invoice', 'proforma_invoice',
  'credit_note', 'debit_note', 'payment_receipt',
  // Accounting
  'purchase_order', 'vendor_bill', 'expense_voucher', 'payment_voucher',
  // Projects
  'project_proposal', 'project_contract', 'work_order', 'timesheet', 'project_summary',
  // CRM
  'lead_proposal', 'customer_agreement', 'service_contract',
  // Meetings
  'meeting_invitation', 'minutes_of_meeting', 'attendance_sheet'
] as const;

export const DOCUMENT_MODULES = [
  'hr', 'sales', 'accounting', 'projects', 'crm', 'meetings'
] as const;

export const TEMPLATE_CATEGORIES = [
  'professional', 'corporate', 'minimal', 'modern', 'classic',
  'government', 'gst', 'international', 'custom'
] as const;

export const TEMPLATE_STATUSES = [
  'draft', 'published', 'archived'
] as const;

export const ASSET_TYPES = [
  'logo', 'image', 'stamp', 'signature', 'watermark'
] as const;

// Maps document_type → module for quick lookups
export const DOCUMENT_TYPE_MODULE_MAP: Record<string, string> = {
  offer_letter: 'hr', joining_letter: 'hr', appointment_letter: 'hr',
  confirmation_letter: 'hr', promotion_letter: 'hr', salary_revision: 'hr',
  payslip: 'hr', experience_letter: 'hr', relieving_letter: 'hr',
  termination_letter: 'hr', warning_letter: 'hr',
  quotation: 'sales', sales_order: 'sales', invoice: 'sales',
  proforma_invoice: 'sales', credit_note: 'sales', debit_note: 'sales',
  payment_receipt: 'sales',
  purchase_order: 'accounting', vendor_bill: 'accounting',
  expense_voucher: 'accounting', payment_voucher: 'accounting',
  project_proposal: 'projects', project_contract: 'projects',
  work_order: 'projects', timesheet: 'projects', project_summary: 'projects',
  lead_proposal: 'crm', customer_agreement: 'crm', service_contract: 'crm',
  meeting_invitation: 'meetings', minutes_of_meeting: 'meetings',
  attendance_sheet: 'meetings'
};

// ---------------------------------------------------------------
// 1. DocumentTemplate — Primary template record
// ---------------------------------------------------------------
export interface IDocumentTemplate extends Document {
  tenant_id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  document_type: string;
  module: string;
  category: string;
  layout_json: Record<string, any>;
  generated_html: string;
  css: string;
  branding_overrides: Record<string, any>;
  pdf_settings: {
    orientation: 'portrait' | 'landscape';
    size: 'a4' | 'letter';
    margin_top: number;
    margin_right: number;
    margin_bottom: number;
    margin_left: number;
    header_height: number;
    footer_height: number;
    watermark: string;
    background: string;
    show_page_numbers: boolean;
    show_page_breaks: boolean;
  };
  variables_used: string[];
  conditions: Record<string, any>[];
  status: string;
  is_default: boolean;
  version: number;
  created_by: mongoose.Types.ObjectId;
  updated_by: mongoose.Types.ObjectId;
  published_by: mongoose.Types.ObjectId;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  document_type: { type: String, required: true, enum: DOCUMENT_TYPES, index: true },
  module: { type: String, required: true, enum: DOCUMENT_MODULES, index: true },
  category: { type: String, enum: TEMPLATE_CATEGORIES, default: 'professional' },
  layout_json: { type: Schema.Types.Mixed, required: true, default: { components: [], page: {} } },
  generated_html: { type: String, default: '' },
  css: { type: String, default: '' },
  branding_overrides: { type: Schema.Types.Mixed, default: {} },
  pdf_settings: {
    type: Schema.Types.Mixed,
    default: {
      orientation: 'portrait',
      size: 'a4',
      margin_top: 20,
      margin_right: 20,
      margin_bottom: 20,
      margin_left: 20,
      header_height: 60,
      footer_height: 40,
      watermark: '',
      background: '',
      show_page_numbers: true,
      show_page_breaks: true
    }
  },
  variables_used: { type: [String], default: [] },
  conditions: { type: Schema.Types.Mixed, default: [] },
  status: { type: String, enum: TEMPLATE_STATUSES, default: 'draft', index: true },
  is_default: { type: Boolean, default: false, index: true },
  version: { type: Number, default: 1 },
  created_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  published_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  published_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DocumentTemplateSchema.index({ tenant_id: 1, document_type: 1, slug: 1 }, { unique: true });
DocumentTemplateSchema.index({ tenant_id: 1, status: 1 });
DocumentTemplateSchema.index({ tenant_id: 1, is_default: 1, document_type: 1 });

DocumentTemplateSchema.pre('save', function (next) {
  const doc = this as any;
  doc.updated_at = new Date();
  if (!doc.slug && doc.name) {
    doc.slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!doc.module && doc.document_type) {
    doc.module = DOCUMENT_TYPE_MODULE_MAP[doc.document_type] || 'hr';
  }
  next();
});

// ---------------------------------------------------------------
// 2. TemplateVersion — Version history
// ---------------------------------------------------------------
export interface ITemplateVersion extends Document {
  tenant_id: mongoose.Types.ObjectId;
  template_id: mongoose.Types.ObjectId;
  version: number;
  layout_json: Record<string, any>;
  generated_html: string;
  css: string;
  change_summary: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const TemplateVersionSchema = new Schema<ITemplateVersion>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  template_id: { type: Schema.Types.ObjectId, ref: 'DocumentTemplate', required: true, index: true },
  version: { type: Number, required: true },
  layout_json: { type: Schema.Types.Mixed },
  generated_html: { type: String, default: '' },
  css: { type: String, default: '' },
  change_summary: { type: String, default: '' },
  created_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now }
});

TemplateVersionSchema.index({ template_id: 1, version: 1 }, { unique: true });

// ---------------------------------------------------------------
// 3. TemplateAsset — Uploaded images, stamps, signatures
// ---------------------------------------------------------------
export interface ITemplateAsset extends Document {
  tenant_id: mongoose.Types.ObjectId;
  filename: string;
  original_name: string;
  mime_type: string;
  file_path: string;
  file_size: number;
  asset_type: string;
  uploaded_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const TemplateAssetSchema = new Schema<ITemplateAsset>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  filename: { type: String, required: true },
  original_name: { type: String, required: true },
  mime_type: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, default: 0 },
  asset_type: { type: String, enum: ASSET_TYPES, default: 'image' },
  uploaded_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now }
});

// ---------------------------------------------------------------
// 4. TemplateCategory — Configurable categories per tenant
// ---------------------------------------------------------------
export interface ITemplateCategory extends Document {
  tenant_id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  created_at: Date;
}

const TemplateCategorySchema = new Schema<ITemplateCategory>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String, default: '' },
  is_system: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

TemplateCategorySchema.index({ tenant_id: 1, code: 1 }, { unique: true });

// ---------------------------------------------------------------
// Model Exports
// ---------------------------------------------------------------
export const DocumentTemplate = mongoose.models.DocumentTemplate || mongoose.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema);
export const TemplateVersion = mongoose.models.TemplateVersion || mongoose.model<ITemplateVersion>('TemplateVersion', TemplateVersionSchema);
export const TemplateAsset = mongoose.models.TemplateAsset || mongoose.model<ITemplateAsset>('TemplateAsset', TemplateAssetSchema);
export const TemplateCategory = mongoose.models.TemplateCategory || mongoose.model<ITemplateCategory>('TemplateCategory', TemplateCategorySchema);

// ---------------------------------------------------------------
// Initialization function (called from index.ts at startup)
// ---------------------------------------------------------------
export const initializeDocumentTemplateSchema = async () => {
  try {
    await DocumentTemplate.createCollection();
    await TemplateVersion.createCollection();
    await TemplateAsset.createCollection();
    await TemplateCategory.createCollection();

    // Seed system categories if they don't exist
    const systemCategories = [
      { code: 'professional', name: 'Professional', description: 'Clean and polished templates for formal business use', is_system: true },
      { code: 'corporate', name: 'Corporate', description: 'Enterprise-grade templates with company branding', is_system: true },
      { code: 'minimal', name: 'Minimal', description: 'Simple and elegant templates with minimal design', is_system: true },
      { code: 'modern', name: 'Modern', description: 'Contemporary designs with bold typography and colors', is_system: true },
      { code: 'classic', name: 'Classic', description: 'Traditional layouts inspired by conventional documents', is_system: true },
      { code: 'government', name: 'Government', description: 'Templates following government document standards', is_system: true },
      { code: 'gst', name: 'GST', description: 'GST-compliant invoice and billing templates', is_system: true },
      { code: 'international', name: 'International', description: 'Multi-currency and multi-language templates', is_system: true },
      { code: 'custom', name: 'Custom', description: 'User-created custom template designs', is_system: true }
    ];

    for (const cat of systemCategories) {
      await TemplateCategory.findOneAndUpdate(
        { code: cat.code, is_system: true, tenant_id: null },
        { ...cat, tenant_id: null },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Document Template schemas initialized");
  } catch (error) {
    console.error("❌ Error initializing Document Template schemas:", error);
  }
};
