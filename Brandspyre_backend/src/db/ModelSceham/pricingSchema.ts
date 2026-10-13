import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. MODULE PRICING — Platform commercial module add-on pricing
// ============================================================
export interface IModulePricing extends Document {
  module_code: string;       // e.g. 'AI_ASSISTANT', 'LEAD_EXCHANGE', 'PROJECTS'
  module_name: string;
  monthly_price: number;
  yearly_price: number;
  one_time_price?: number;
  currency: string;
  is_active: boolean;
  is_addon_available: boolean;
  min_plan_type?: string;     // e.g. 'starter', 'professional'
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

const ModulePricingSchema = new Schema<IModulePricing>({
  module_code: { type: String, required: true, unique: true, index: true },
  module_name: { type: String, required: true },
  monthly_price: { type: Number, required: true, default: 0 },
  yearly_price: { type: Number, required: true, default: 0 },
  one_time_price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  is_active: { type: Boolean, default: true },
  is_addon_available: { type: Boolean, default: true },
  min_plan_type: { type: String, default: 'all' },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 2. ADDON — Feature / Module level add-ons
// ============================================================
export interface IAddon extends Document {
  addon_code: string;        // e.g. 'AI_ASSISTANT', 'ADDITIONAL_USER', 'COLLABORATION_PACKAGE'
  name: string;
  type?: 'RESOURCE' | 'FEATURE' | 'BUNDLE' | string;
  description?: string;
  module_id?: mongoose.Types.ObjectId;
  module_code?: string;
  feature_id?: mongoose.Types.ObjectId;
  feature_code?: string;
  monthly_price: number;
  yearly_price?: number | null;
  currency: string;
  is_active: boolean;
  available_for_plans: string[];
  limits?: Record<string, number>;
  included_module_codes?: string[];
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const AddonSchema = new Schema<IAddon>({
  addon_code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, default: 'FEATURE' },
  description: { type: String, default: '' },
  module_id: { type: Schema.Types.ObjectId, ref: 'Module' },
  module_code: { type: String },
  feature_id: { type: Schema.Types.ObjectId, ref: 'Feature' },
  feature_code: { type: String },
  monthly_price: { type: Number, required: true, default: 0 },
  yearly_price: { type: Number, default: null },
  currency: { type: String, default: 'INR' },
  is_active: { type: Boolean, default: true },
  available_for_plans: [{ type: String }],
  limits: { type: Schema.Types.Mixed, default: {} },
  included_module_codes: [{ type: String }],
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 3. CUSTOM PACKAGE REQUEST — Organization custom package builder
// ============================================================
export interface ICustomPackageRequest extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  business_type_code: string;
  industry_code: string;
  selected_modules: string[];
  selected_addons: string[];
  user_count: number;
  branch_count: number;
  warehouse_count: number;
  custom_requirements?: string;
  estimated_monthly_price: number;
  estimated_yearly_price: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'QUOTATION_SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  quoted_monthly_price?: number;
  quoted_yearly_price?: number;
  admin_notes?: string;
  assigned_admin?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CustomPackageRequestSchema = new Schema<ICustomPackageRequest>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  company_name: { type: String, required: true },
  contact_name: { type: String, required: true },
  contact_email: { type: String, required: true },
  contact_phone: { type: String, default: '' },
  business_type_code: { type: String, required: true },
  industry_code: { type: String, required: true },
  selected_modules: [{ type: String }],
  selected_addons: [{ type: String }],
  user_count: { type: Number, default: 5 },
  branch_count: { type: Number, default: 1 },
  warehouse_count: { type: Number, default: 1 },
  custom_requirements: { type: String, default: '' },
  estimated_monthly_price: { type: Number, default: 0 },
  estimated_yearly_price: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'QUOTATION_SENT', 'APPROVED', 'REJECTED', 'CONVERTED'], default: 'PENDING', index: true },
  quoted_monthly_price: { type: Number },
  quoted_yearly_price: { type: Number },
  admin_notes: { type: String, default: '' },
  assigned_admin: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 4. SUBSCRIPTION PRICE SNAPSHOT — Price lock per subscription
// ============================================================
export interface ISubscriptionPriceSnapshot extends Document {
  tenant_id: mongoose.Types.ObjectId;
  subscription_id: mongoose.Types.ObjectId;
  plan_id: mongoose.Types.ObjectId;
  plan_code: string;
  plan_base_price: number;
  billing_cycle: 'monthly' | 'yearly';
  currency: string;
  modules_breakdown: Array<{
    module_code: string;
    is_included: boolean;
    addon_price: number;
  }>;
  addons_breakdown: Array<{
    addon_code: string;
    addon_price: number;
  }>;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  final_amount: number;
  locked_at: Date;
}

const SubscriptionPriceSnapshotSchema = new Schema<ISubscriptionPriceSnapshot>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  subscription_id: { type: Schema.Types.ObjectId, required: true, ref: 'TenantSubscription', index: true },
  plan_id: { type: Schema.Types.ObjectId, required: true, ref: 'SubscriptionPlan' },
  plan_code: { type: String, required: true },
  plan_base_price: { type: Number, required: true },
  billing_cycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  currency: { type: String, default: 'INR' },
  modules_breakdown: [{
    module_code: { type: String, required: true },
    is_included: { type: Boolean, default: true },
    addon_price: { type: Number, default: 0 }
  }],
  addons_breakdown: [{
    addon_code: { type: String, required: true },
    addon_price: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 18 },
  tax_amount: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  locked_at: { type: Date, default: Date.now }
});

// ============================================================
// 5. PLATFORM TAX CONFIGURATION
// ============================================================
export interface IPlatformTaxConfig extends Document {
  tax_name: string;          // e.g. 'GST', 'VAT'
  tax_percentage: number;    // e.g. 18
  country: string;           // e.g. 'India'
  region?: string;
  is_active: boolean;
  effective_date: Date;
  created_at: Date;
  updated_at: Date;
}

const PlatformTaxConfigSchema = new Schema<IPlatformTaxConfig>({
  tax_name: { type: String, required: true },
  tax_percentage: { type: Number, required: true, default: 18 },
  country: { type: String, required: true, default: 'India' },
  region: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  effective_date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const ModulePricing = mongoose.models.ModulePricing || mongoose.model<IModulePricing>('ModulePricing', ModulePricingSchema);
export const Addon = mongoose.models.Addon || mongoose.model<IAddon>('Addon', AddonSchema);
export const CustomPackageRequest = mongoose.models.CustomPackageRequest || mongoose.model<ICustomPackageRequest>('CustomPackageRequest', CustomPackageRequestSchema);
export const SubscriptionPriceSnapshot = mongoose.models.SubscriptionPriceSnapshot || mongoose.model<ISubscriptionPriceSnapshot>('SubscriptionPriceSnapshot', SubscriptionPriceSnapshotSchema);
export const PlatformTaxConfig = mongoose.models.PlatformTaxConfig || mongoose.model<IPlatformTaxConfig>('PlatformTaxConfig', PlatformTaxConfigSchema);

export const initializePricingSchema = async () => {
  try {
    await ModulePricing.createIndexes();
    await Addon.createIndexes();
    await CustomPackageRequest.createIndexes();
    await SubscriptionPriceSnapshot.createIndexes();
    await PlatformTaxConfig.createIndexes();
    console.log('✅ Pricing schema indexes initialized successfully.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Pricing schema init warning: ${message}`);
  }
};
