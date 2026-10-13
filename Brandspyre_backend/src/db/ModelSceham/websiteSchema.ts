import mongoose, { Schema, Document } from "mongoose";

export interface IWebsite extends Document {
  tenant_id: number;
  site_name: string;
  site_domain?: string;
  subdomain?: string;
  site_description?: string;
  site_type?: string;
  template_id?: number;
  site_config?: Record<string, any>;
  custom_css?: string;
  custom_js?: string;
  favicon_url?: string;
  logo_url?: string;
  status?: string;
  is_published?: boolean;
  published_url?: string;
  published_at?: Date;
  ssl_enabled?: boolean;
  analytics_enabled?: boolean;
  analytics_id?: string;
  seo_config?: Record<string, any>;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IWebsitePage extends Document {
  website_id: number;
  page_name: string;
  page_slug: string;
  page_title?: string;
  page_description?: string;
  page_content?: Record<string, any>;
  page_type?: string;
  is_homepage?: boolean;
  is_published?: boolean;
  display_order?: number;
  seo_config?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface IWebsiteComponent extends Document {
  website_id: number;
  page_id?: number;
  component_name: string;
  component_type: string;
  component_data?: Record<string, any>;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  z_index?: number;
  is_visible?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IWebsiteTemplate extends Document {
  template_name: string;
  template_category?: string;
  template_description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  template_structure?: Record<string, any>;
  default_components?: any[];
  is_public?: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IWebsiteAsset extends Document {
  website_id: number;
  asset_name: string;
  asset_type: string;
  asset_url: string;
  asset_size?: number;
  mime_type?: string;
  storage_path?: string;
  created_by: number;
  created_at?: Date;
}

const WebsiteSchema = new Schema<IWebsite>({
  tenant_id: { type: Number, required: true },
  site_name: { type: String, required: true },
  site_domain: { type: String, unique: true, sparse: true },
  subdomain: { type: String, unique: true, sparse: true },
  site_description: { type: String },
  site_type: { type: String, default: 'business' },
  template_id: { type: Number },
  site_config: { type: Schema.Types.Mixed, default: {} },
  custom_css: { type: String },
  custom_js: { type: String },
  favicon_url: { type: String },
  logo_url: { type: String },
  status: { type: String, default: 'draft' },
  is_published: { type: Boolean, default: false },
  published_url: { type: String },
  published_at: { type: Date },
  ssl_enabled: { type: Boolean, default: false },
  analytics_enabled: { type: Boolean, default: false },
  analytics_id: { type: String },
  seo_config: { type: Schema.Types.Mixed, default: {} },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const WebsitePageSchema = new Schema<IWebsitePage>({
  website_id: { type: Number, required: true },
  page_name: { type: String, required: true },
  page_slug: { type: String, required: true },
  page_title: { type: String },
  page_description: { type: String },
  page_content: { type: Schema.Types.Mixed, default: {} },
  page_type: { type: String, default: 'custom' },
  is_homepage: { type: Boolean, default: false },
  is_published: { type: Boolean, default: false },
  display_order: { type: Number, default: 0 },
  seo_config: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

WebsitePageSchema.index({ website_id: 1, page_slug: 1 }, { unique: true });

const WebsiteComponentSchema = new Schema<IWebsiteComponent>({
  website_id: { type: Number, required: true },
  page_id: { type: Number },
  component_name: { type: String, required: true },
  component_type: { type: String, required: true },
  component_data: { type: Schema.Types.Mixed, default: {} },
  position_x: { type: Number },
  position_y: { type: Number },
  width: { type: Number },
  height: { type: Number },
  z_index: { type: Number, default: 0 },
  is_visible: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const WebsiteTemplateSchema = new Schema<IWebsiteTemplate>({
  template_name: { type: String, required: true, unique: true },
  template_category: { type: String },
  template_description: { type: String },
  thumbnail_url: { type: String },
  preview_url: { type: String },
  template_structure: { type: Schema.Types.Mixed, default: {} },
  default_components: { type: [Schema.Types.Mixed], default: [] },
  is_public: { type: Boolean, default: true },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const WebsiteAssetSchema = new Schema<IWebsiteAsset>({
  website_id: { type: Number, required: true },
  asset_name: { type: String, required: true },
  asset_type: { type: String, required: true },
  asset_url: { type: String, required: true },
  asset_size: { type: Number },
  mime_type: { type: String },
  storage_path: { type: String },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

WebsiteSchema.index({ tenant_id: 1 });
WebsiteSchema.index({ status: 1 });
WebsitePageSchema.index({ website_id: 1 });
WebsiteComponentSchema.index({ website_id: 1 });
WebsiteAssetSchema.index({ website_id: 1 });

export const Website = mongoose.models.Website || mongoose.model<IWebsite>('Website', WebsiteSchema);
export const WebsitePage = mongoose.models.WebsitePage || mongoose.model<IWebsitePage>('WebsitePage', WebsitePageSchema);
export const WebsiteComponent = mongoose.models.WebsiteComponent || mongoose.model<IWebsiteComponent>('WebsiteComponent', WebsiteComponentSchema);
export const WebsiteTemplate = mongoose.models.WebsiteTemplate || mongoose.model<IWebsiteTemplate>('WebsiteTemplate', WebsiteTemplateSchema);
export const WebsiteAsset = mongoose.models.WebsiteAsset || mongoose.model<IWebsiteAsset>('WebsiteAsset', WebsiteAssetSchema);

export const initializeWebsiteSchema = async () => {
  try {
    // Schema is already defined, no initialization needed
    console.log("Website schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing website schema: ${message}`);
    throw new Error(`Error initializing website schema: ${message}`);
  }
};
