import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessType extends Document {
  name: string;
  description?: string;
  default_fields?: Record<string, any>;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITenantBusinessDetails extends Document {
  tenant_id: mongoose.Types.ObjectId;
  business_type_id?: mongoose.Types.ObjectId;
  company_name: string;
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  registration_number?: string;
  custom_fields?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface IDynamicFieldDefinition extends Document {
  tenant_id: mongoose.Types.ObjectId;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: any[];
  is_required?: boolean;
  is_active?: boolean;
  display_order?: number;
  category?: string;
  validation_rules?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface IDynamicFieldValue extends Document {
  tenant_id: mongoose.Types.ObjectId;
  field_definition_id: mongoose.Types.ObjectId;
  entity_type: string;
  entity_id: mongoose.Types.ObjectId;
  field_value?: string;
  created_at?: Date;
  updated_at?: Date;
}

const BusinessTypeSchema = new Schema<IBusinessType>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  default_fields: { type: Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const TenantBusinessDetailsSchema = new Schema<ITenantBusinessDetails>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  business_type_id: { type: Schema.Types.ObjectId, ref: 'LegacyBusinessType' },
  company_name: { type: String, required: true },
  industry: { type: String },
  company_size: { type: String },
  website: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postal_code: { type: String },
  tax_id: { type: String },
  registration_number: { type: String },
  custom_fields: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

TenantBusinessDetailsSchema.index({ tenant_id: 1 });

const DynamicFieldDefinitionSchema = new Schema<IDynamicFieldDefinition>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  field_name: { type: String, required: true },
  field_label: { type: String, required: true },
  field_type: { type: String, required: true },
  field_options: { type: Schema.Types.Mixed, default: [] },
  is_required: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  display_order: { type: Number, default: 0 },
  category: { type: String },
  validation_rules: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DynamicFieldDefinitionSchema.index({ tenant_id: 1 });

const DynamicFieldValueSchema = new Schema<IDynamicFieldValue>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  field_definition_id: { type: Schema.Types.ObjectId, required: true, ref: 'DynamicFieldDefinition' },
  entity_type: { type: String, required: true },
  entity_id: { type: Schema.Types.ObjectId, required: true },
  field_value: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DynamicFieldValueSchema.index({ tenant_id: 1 });
DynamicFieldValueSchema.index({ entity_type: 1, entity_id: 1 });

export const BusinessType = mongoose.models.LegacyBusinessType || mongoose.model<IBusinessType>('LegacyBusinessType', BusinessTypeSchema);
export const TenantBusinessDetails = mongoose.models.TenantBusinessDetails || mongoose.model<ITenantBusinessDetails>('TenantBusinessDetails', TenantBusinessDetailsSchema);
export const DynamicFieldDefinition = mongoose.models.DynamicFieldDefinition || mongoose.model<IDynamicFieldDefinition>('DynamicFieldDefinition', DynamicFieldDefinitionSchema);
export const DynamicFieldValue = mongoose.models.DynamicFieldValue || mongoose.model<IDynamicFieldValue>('DynamicFieldValue', DynamicFieldValueSchema);

export const initializeBusinessDetailsSchema = async () => {
  try {
    const defaultBusinessTypes = [
      {
        name: 'Retail',
        description: 'Retail and e-commerce businesses',
        default_fields: { fields: [{ label: 'Store Type', type: 'select', options: ['Physical Store', 'Online', 'Both'] }, { label: 'Product Categories', type: 'multiselect', options: ['Electronics', 'Clothing', 'Food', 'Other'] }] }
      },
      {
        name: 'Services',
        description: 'Service-based businesses',
        default_fields: { fields: [{ label: 'Service Type', type: 'select', options: ['Consulting', 'Professional Services', 'Maintenance', 'Other'] }, { label: 'Hourly Rate', type: 'number' }] }
      },
      {
        name: 'Manufacturing',
        description: 'Manufacturing and production',
        default_fields: { fields: [{ label: 'Production Type', type: 'select', options: ['Assembly', 'Fabrication', 'Processing'] }, { label: 'Production Capacity', type: 'number' }] }
      },
      {
        name: 'Technology',
        description: 'Technology and software companies',
        default_fields: { fields: [{ label: 'Tech Stack', type: 'multiselect', options: ['Web', 'Mobile', 'AI/ML', 'Cloud'] }, { label: 'Development Model', type: 'select', options: ['B2B', 'B2C', 'Both'] }] }
      },
      {
        name: 'Healthcare',
        description: 'Healthcare and medical services',
        default_fields: { fields: [{ label: 'Facility Type', type: 'select', options: ['Hospital', 'Clinic', 'Laboratory', 'Other'] }, { label: 'License Number', type: 'text' }] }
      },
      {
        name: 'Education',
        description: 'Educational institutions',
        default_fields: { fields: [{ label: 'Institution Type', type: 'select', options: ['School', 'College', 'University', 'Training Center'] }, { label: 'Accreditation', type: 'text' }] }
      },
      {
        name: 'Other',
        description: 'Other business types',
        default_fields: { fields: [] }
      }
    ];

    for (const businessType of defaultBusinessTypes) {
      await BusinessType.findOneAndUpdate(
        { name: businessType.name },
        businessType,
        { upsert: true, new: true }
      );
    }

    console.log("Business details schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing business details schema: ${message}`);
    throw new Error(`Error initializing business details schema: ${message}`);
  }
};
