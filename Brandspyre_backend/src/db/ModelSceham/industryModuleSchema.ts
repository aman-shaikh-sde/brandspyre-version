import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. INDUSTRY — Business type registry
// ============================================================
export interface IIndustry extends Document {
  code: string;          // e.g. 'IT_SOFTWARE', 'RETAIL_SUPERMARKET'
  name: string;          // e.g. 'IT & Software'
  description?: string;
  icon?: string;         // Lucide icon name or URL
  display_modules?: string; // Summary text like 'CRM • Projects • HRMS • Meetings'
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const IndustrySchema = new Schema<IIndustry>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  display_modules: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 2. MODULE — Feature group registry
// ============================================================
export interface IModule extends Document {
  code: string;          // e.g. 'CRM', 'HRMS', 'INVENTORY'
  name: string;          // e.g. 'Customer Relationship Management'
  description?: string;
  category: string;      // e.g. 'CORE', 'CRM', 'SALES', 'HRMS', 'FINANCE', 'COLLABORATION', 'COMMERCIAL', 'DOCUMENTS'
  icon?: string;         // Lucide icon name
  base_route?: string;   // Frontend route prefix, e.g. '/leads', '/employee'
  sort_order: number;
  is_core: boolean;      // Core modules (DASHBOARD, ORGANIZATION, NOTIFICATIONS) cannot be disabled
  is_future: boolean;    // Registry-only modules not yet implemented
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ModuleSchema = new Schema<IModule>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  icon: { type: String, default: '' },
  base_route: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  is_core: { type: Boolean, default: false },
  is_future: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 3. FEATURE — Granular sub-features within a module
// ============================================================
export interface IFeature extends Document {
  module_id?: mongoose.Types.ObjectId;
  module_code: string;   // Denormalized for fast lookups
  code: string;          // e.g. 'BARCODE', 'BATCH', 'POS_BILLING'
  name: string;          // e.g. 'Barcode Scanning'
  description?: string;
  is_default: boolean;   // Enabled by default when module is enabled
  is_future: boolean;    // Registry-only, not yet implemented
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const FeatureSchema = new Schema<IFeature>({
  module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module', index: true },
  module_code: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  is_default: { type: Boolean, default: true },
  is_future: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

FeatureSchema.index({ module_code: 1, code: 1 }, { unique: true });

// ============================================================
// 4. INDUSTRY MODULE — Which modules are recommended for each industry
// ============================================================
export interface IIndustryModule extends Document {
  industry_id?: mongoose.Types.ObjectId;
  industry_code: string;   // Denormalized
  module_id?: mongoose.Types.ObjectId;
  module_code: string;     // Denormalized
  is_recommended: boolean; // true = pre-selected during onboarding
  sort_order: number;
}

const IndustryModuleSchema = new Schema<IIndustryModule>({
  industry_id: { type: Schema.Types.ObjectId, required: false, ref: 'Industry', index: true },
  industry_code: { type: String, required: true, index: true },
  module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module', index: true },
  module_code: { type: String, required: true, index: true },
  is_recommended: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 }
});

IndustryModuleSchema.index({ industry_code: 1, module_code: 1 }, { unique: true });

// ============================================================
// 5. INDUSTRY FEATURE — Which features are recommended for each industry
// ============================================================
export interface IIndustryFeature extends Document {
  industry_id?: mongoose.Types.ObjectId;
  industry_code: string;
  feature_id?: mongoose.Types.ObjectId;
  feature_code: string;
  is_recommended: boolean;
}

const IndustryFeatureSchema = new Schema<IIndustryFeature>({
  industry_id: { type: Schema.Types.ObjectId, required: false, ref: 'Industry', index: true },
  industry_code: { type: String, required: true, index: true },
  feature_id: { type: Schema.Types.ObjectId, required: false, ref: 'Feature', index: true },
  feature_code: { type: String, required: true, index: true },
  is_recommended: { type: Boolean, default: true }
});

IndustryFeatureSchema.index({ industry_code: 1, feature_code: 1 }, { unique: true });

// ============================================================
// 6. MODULE DEPENDENCY — Inter-module dependency graph
// ============================================================
export interface IModuleDependency extends Document {
  module_id?: mongoose.Types.ObjectId;
  module_code: string;
  required_module_id?: mongoose.Types.ObjectId;
  required_module_code: string;
}

const ModuleDependencySchema = new Schema<IModuleDependency>({
  module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module', index: true },
  module_code: { type: String, required: true, index: true },
  required_module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module' },
  required_module_code: { type: String, required: true }
});

ModuleDependencySchema.index({ module_code: 1, required_module_code: 1 }, { unique: true });

// ============================================================
// 7. ORGANIZATION MODULE — Tenant-level module entitlement (SOURCE OF TRUTH)
// ============================================================
export interface IOrganizationModule extends Document {
  tenant_id: mongoose.Types.ObjectId;
  module_id?: mongoose.Types.ObjectId;
  module_code: string;      // Denormalized for fast lookups
  is_enabled?: boolean;
  status: 'active' | 'inactive';
  source: 'onboarding' | 'admin' | 'subscription' | 'migration' | 'system' | 'ADMIN_OVERRIDE';
  enabled_at?: Date;
  disabled_at?: Date;
  enabled_by?: mongoose.Types.ObjectId;  // User who enabled/disabled
  created_at: Date;
  updated_at: Date;
}

const OrganizationModuleSchema = new Schema<IOrganizationModule>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module', index: true },
  module_code: { type: String, required: true, index: true },
  is_enabled: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  source: { type: String, enum: ['onboarding', 'admin', 'subscription', 'migration', 'system', 'ADMIN_OVERRIDE'], default: 'admin' },
  enabled_at: { type: Date, default: Date.now },
  disabled_at: { type: Date },
  enabled_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

OrganizationModuleSchema.index({ tenant_id: 1, module_code: 1 }, { unique: true });
OrganizationModuleSchema.index({ tenant_id: 1, status: 1 });

// ============================================================
// 8. ORGANIZATION FEATURE — Tenant-level feature entitlement
// ============================================================
export interface IOrganizationFeature extends Document {
  tenant_id: mongoose.Types.ObjectId;
  feature_id?: mongoose.Types.ObjectId;
  feature_code: string;     // Denormalized
  module_code: string;      // Denormalized — parent module
  status: 'active' | 'inactive';
  source: 'onboarding' | 'admin' | 'subscription' | 'migration' | 'system' | 'ADMIN_OVERRIDE';
  enabled_at?: Date;
  disabled_at?: Date;
  enabled_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const OrganizationFeatureSchema = new Schema<IOrganizationFeature>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  feature_id: { type: Schema.Types.ObjectId, required: false, ref: 'Feature', index: true },
  feature_code: { type: String, required: true, index: true },
  module_code: { type: String, required: true, index: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  source: { type: String, enum: ['onboarding', 'admin', 'subscription', 'migration', 'system', 'ADMIN_OVERRIDE'], default: 'admin' },
  enabled_at: { type: Date, default: Date.now },
  disabled_at: { type: Date },
  enabled_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

OrganizationFeatureSchema.index({ tenant_id: 1, feature_code: 1 }, { unique: true });
OrganizationFeatureSchema.index({ tenant_id: 1, module_code: 1, status: 1 });

// ============================================================
// 9. PLAN MODULE ALLOWANCE — Which modules each subscription plan allows
// ============================================================
export interface IPlanModuleAllowance extends Document {
  plan_id?: mongoose.Types.ObjectId;
  plan_code: string;        // Denormalized — 'trial', 'starter', 'professional', 'business', 'enterprise'
  module_id?: mongoose.Types.ObjectId;
  module_code: string;      // Denormalized
  is_included: boolean;     // true = plan includes this module
  pricing_type: 'INCLUDED' | 'ADDON' | 'NOT_AVAILABLE';
  addon_allowed?: boolean;
  limit?: number;
  created_at: Date;
}

const PlanModuleAllowanceSchema = new Schema<IPlanModuleAllowance>({
  plan_id: { type: Schema.Types.ObjectId, required: false, ref: 'SubscriptionPlan', index: true },
  plan_code: { type: String, required: true, index: true },
  module_id: { type: Schema.Types.ObjectId, required: false, ref: 'Module', index: true },
  module_code: { type: String, required: true, index: true },
  is_included: { type: Boolean, default: true },
  pricing_type: { type: String, enum: ['INCLUDED', 'ADDON', 'NOT_AVAILABLE'], default: 'INCLUDED' },
  addon_allowed: { type: Boolean, default: true },
  limit: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

PlanModuleAllowanceSchema.index({ plan_code: 1, module_code: 1 }, { unique: true });

// ============================================================
// MODEL EXPORTS
// ============================================================
export const Industry = mongoose.models.Industry || mongoose.model<IIndustry>('Industry', IndustrySchema);
export const Module = mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
export const Feature = mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);
export const IndustryModule = mongoose.models.IndustryModule || mongoose.model<IIndustryModule>('IndustryModule', IndustryModuleSchema);
export const IndustryFeature = mongoose.models.IndustryFeature || mongoose.model<IIndustryFeature>('IndustryFeature', IndustryFeatureSchema);
export const ModuleDependency = mongoose.models.ModuleDependency || mongoose.model<IModuleDependency>('ModuleDependency', ModuleDependencySchema);
export const OrganizationModule = mongoose.models.OrganizationModule || mongoose.model<IOrganizationModule>('OrganizationModule', OrganizationModuleSchema);
export const OrganizationFeature = mongoose.models.OrganizationFeature || mongoose.model<IOrganizationFeature>('OrganizationFeature', OrganizationFeatureSchema);
export const PlanModuleAllowance = mongoose.models.PlanModuleAllowance || mongoose.model<IPlanModuleAllowance>('PlanModuleAllowance', PlanModuleAllowanceSchema);

// ============================================================
// INITIALIZATION
// ============================================================
export const initializeIndustryModuleSchema = async () => {
  try {
    await Industry.createIndexes();
    await Module.createIndexes();
    await Feature.createIndexes();
    await IndustryModule.createIndexes();
    await IndustryFeature.createIndexes();
    await ModuleDependency.createIndexes();
    await OrganizationModule.createIndexes();
    await OrganizationFeature.createIndexes();
    await PlanModuleAllowance.createIndexes();
    console.log('✅ Industry & Module schema indexes initialized.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error initializing industry module schema: ${message}`);
  }
};
