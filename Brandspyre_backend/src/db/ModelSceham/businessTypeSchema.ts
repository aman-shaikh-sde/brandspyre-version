import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. BUSINESS TYPE — Specific business operational profile
// ============================================================
export interface IBusinessType extends Document {
  code: string;               // e.g. 'IT_SOFTWARE', 'PHARMACY_RETAIL', 'SUPERMARKET_GROCERY'
  name: string;               // e.g. 'Pharmacy / Medical Retail'
  industry_code: string;      // e.g. 'HEALTHCARE_RETAIL', 'RETAIL', 'TECHNOLOGY'
  industry_name: string;      // e.g. 'Healthcare Retail'
  description?: string;
  icon?: string;
  display_modules?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const BusinessTypeSchema = new Schema<IBusinessType>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  industry_code: { type: String, required: true, index: true },
  industry_name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  display_modules: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 2. BUSINESS TYPE MODULE MATRIX — Source of truth mapping
// C = Core / Default Enabled
// R = Recommended
// O = Optional
// - = Not normally needed / Hidden
// ============================================================
export interface IBusinessTypeModule extends Document {
  business_type_code: string;  // e.g. 'PHARMACY_RETAIL'
  module_code: string;         // e.g. 'SALES', 'POS', 'INVENTORY'
  applicability: 'C' | 'R' | 'O' | '-';
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const BusinessTypeModuleSchema = new Schema<IBusinessTypeModule>({
  business_type_code: { type: String, required: true, index: true },
  module_code: { type: String, required: true, index: true },
  applicability: { type: String, enum: ['C', 'R', 'O', '-'], required: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BusinessTypeModuleSchema.index({ business_type_code: 1, module_code: 1 }, { unique: true });

export const BusinessType = mongoose.models.BusinessType || mongoose.model<IBusinessType>('BusinessType', BusinessTypeSchema);
export const BusinessTypeModule = mongoose.models.BusinessTypeModule || mongoose.model<IBusinessTypeModule>('BusinessTypeModule', BusinessTypeModuleSchema);

export const initializeBusinessTypeSchema = async () => {
  try {
    await BusinessType.createIndexes();
    await BusinessTypeModule.createIndexes();
    console.log('✅ BusinessType schema indexes initialized successfully.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ BusinessType schema init warning: ${message}`);
  }
};
