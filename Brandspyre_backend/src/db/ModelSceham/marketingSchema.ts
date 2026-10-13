import mongoose, { Schema, Document } from "mongoose";

export interface IMarketingTemplate extends Document {
  tenant_id: number;
  template_name: string;
  template_type: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  template_data?: Record<string, any>;
  is_public?: boolean;
  category?: string;
  tags?: string[];
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IMarketingProject extends Document {
  tenant_id: number;
  project_name: string;
  project_type: string;
  template_id?: number;
  project_data?: Record<string, any>;
  output_url?: string;
  output_thumbnail?: string;
  status?: string;
  published_url?: string;
  published_at?: Date;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IMarketingAsset extends Document {
  tenant_id: number;
  asset_name: string;
  asset_type: string;
  asset_url: string;
  asset_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  storage_path?: string;
  created_by: number;
  created_at?: Date;
}

export interface ITemplateElement extends Document {
  template_id: number;
  element_type: string;
  element_data?: Record<string, any>;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  z_index?: number;
  is_locked?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

const MarketingTemplateSchema = new Schema<IMarketingTemplate>({
  tenant_id: { type: Number, required: true },
  template_name: { type: String, required: true },
  template_type: { type: String, required: true },
  description: { type: String },
  thumbnail_url: { type: String },
  preview_url: { type: String },
  template_data: { type: Schema.Types.Mixed, default: {} },
  is_public: { type: Boolean, default: false },
  category: { type: String },
  tags: { type: [String] },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const MarketingProjectSchema = new Schema<IMarketingProject>({
  tenant_id: { type: Number, required: true },
  project_name: { type: String, required: true },
  project_type: { type: String, required: true },
  template_id: { type: Number },
  project_data: { type: Schema.Types.Mixed, default: {} },
  output_url: { type: String },
  output_thumbnail: { type: String },
  status: { type: String, default: 'draft' },
  published_url: { type: String },
  published_at: { type: Date },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const MarketingAssetSchema = new Schema<IMarketingAsset>({
  tenant_id: { type: Number, required: true },
  asset_name: { type: String, required: true },
  asset_type: { type: String, required: true },
  asset_url: { type: String, required: true },
  asset_size: { type: Number },
  mime_type: { type: String },
  width: { type: Number },
  height: { type: Number },
  duration_seconds: { type: Number },
  storage_path: { type: String },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

const TemplateElementSchema = new Schema<ITemplateElement>({
  template_id: { type: Number, required: true },
  element_type: { type: String, required: true },
  element_data: { type: Schema.Types.Mixed, default: {} },
  position_x: { type: Number },
  position_y: { type: Number },
  width: { type: Number },
  height: { type: Number },
  z_index: { type: Number, default: 0 },
  is_locked: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MarketingTemplateSchema.index({ tenant_id: 1 });
MarketingTemplateSchema.index({ template_type: 1 });
MarketingProjectSchema.index({ tenant_id: 1 });
MarketingAssetSchema.index({ tenant_id: 1 });
TemplateElementSchema.index({ template_id: 1 });

export const MarketingTemplate = mongoose.models.MarketingTemplate || mongoose.model<IMarketingTemplate>('MarketingTemplate', MarketingTemplateSchema);
export const MarketingProject = mongoose.models.MarketingProject || mongoose.model<IMarketingProject>('MarketingProject', MarketingProjectSchema);
export const MarketingAsset = mongoose.models.MarketingAsset || mongoose.model<IMarketingAsset>('MarketingAsset', MarketingAssetSchema);
export const TemplateElement = mongoose.models.TemplateElement || mongoose.model<ITemplateElement>('TemplateElement', TemplateElementSchema);

export const initializeMarketingSchema = async () => {
  try {
    // Schema is already defined, no initialization needed
    console.log("Marketing schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing marketing schema: ${message}`);
    throw new Error(`Error initializing marketing schema: ${message}`);
  }
};
