import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. MARKETPLACE CATEGORY (Universal Industry Verticals)
// ============================================================
export interface IMarketplaceCategory extends Document {
  code: string;                 // E.g., "REAL_ESTATE", "AUTOMOBILES", "HEALTHCARE"
  name: string;                 // E.g., "Real Estate & Property"
  description: string;
  icon: string;                 // Lucide icon name or image URL
  banner_image?: string;
  parent_id?: mongoose.Types.ObjectId; // For subcategories
  display_order: number;
  is_active: boolean;
  
  // Transaction & business capabilities
  listing_types: string[];      // E.g., ["PROPERTY_SALE", "PROPERTY_RENT", "COMMERCIAL_LEASE"]
  default_listing_type: string;
  pricing_modes: string[];      // E.g., ["FIXED", "NEGOTIABLE", "PRICE_ON_REQUEST", "STARTING_FROM"]
  default_pricing_mode: string;
  pricing_units: string[];      // E.g., ["PER_MONTH", "PER_SQFT", "PER_NIGHT", "PER_HOUR", "FIXED_PROJECT", "PER_UNIT"]
  default_pricing_unit?: string;
  transaction_flow: 'ECOMMERCE' | 'ENQUIRY' | 'BOOKING' | 'RFQ' | 'HYBRID';
  
  // Compatibility & constraints
  requires_product_link: boolean; // true for ERP Products & Ecommerce vertical
  requires_location: boolean;
  allow_instant_booking: boolean;
  
  media_requirements: {
    min_images: number;
    max_images: number;
    allow_video: boolean;
    allow_documents: boolean;
  };

  seo_metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  created_at: Date;
  updated_at: Date;
}

const MarketplaceCategorySchema = new Schema<IMarketplaceCategory>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Layers' },
  banner_image: { type: String },
  parent_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', index: true },
  display_order: { type: Number, default: 0, index: true },
  is_active: { type: Boolean, default: true, index: true },

  listing_types: [{ type: String, trim: true }],
  default_listing_type: { type: String, default: 'STANDARD' },
  pricing_modes: [{ type: String, trim: true }],
  default_pricing_mode: { type: String, default: 'FIXED' },
  pricing_units: [{ type: String, trim: true }],
  default_pricing_unit: { type: String, default: 'PER_UNIT' },
  transaction_flow: {
    type: String,
    enum: ['ECOMMERCE', 'ENQUIRY', 'BOOKING', 'RFQ', 'HYBRID'],
    default: 'ENQUIRY',
    index: true
  },

  requires_product_link: { type: Boolean, default: false },
  requires_location: { type: Boolean, default: false },
  allow_instant_booking: { type: Boolean, default: false },

  media_requirements: {
    min_images: { type: Number, default: 1 },
    max_images: { type: Number, default: 10 },
    allow_video: { type: Boolean, default: true },
    allow_documents: { type: Boolean, default: true }
  },

  seo_metadata: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }]
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MarketplaceCategorySchema.index({ is_active: 1, display_order: 1 });


// ============================================================
// 2. CATEGORY FORM SCHEMA (Dynamic JSON Form Builder Definition)
// ============================================================
export interface IFormFieldDefinition {
  key: string;                  // Identifier: e.g. "bedrooms", "mileage", "hourly_rate"
  label: string;                // Display label: e.g. "Bedrooms", "Odometer Reading (km)"
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 
        'date' | 'daterange' | 'time' | 'location' | 'address' | 'currency' | 'image_upload' | 
        'document_upload' | 'repeater' | 'tags';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  default_value?: any;
  options?: Array<{ label: string; value: any }>; // For select, multiselect, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    min_length?: number;
    max_length?: number;
    allowed_values?: any[];
  };
  conditional?: {
    depends_on: string;         // Parent field key
    show_when: any;             // Value that triggers visibility
  };
  group?: string;               // E.g., "Property Overview", "Vehicle Specifications"
  display_order: number;
}

export interface ICategoryFormSchema extends Document {
  category_id: mongoose.Types.ObjectId;  // References MarketplaceCategory
  listing_type: string;                  // Specific listing type or "*" for all
  version: number;
  is_active: boolean;
  fields: IFormFieldDefinition[];
  created_at: Date;
  updated_at: Date;
}

const CategoryFormSchemaSchema = new Schema<ICategoryFormSchema>({
  category_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', required: true, index: true },
  listing_type: { type: String, default: '*', index: true },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true, index: true },
  fields: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'text', 'textarea', 'number', 'select', 'multiselect', 'radio', 'checkbox',
        'date', 'daterange', 'time', 'location', 'address', 'currency', 'image_upload',
        'document_upload', 'repeater', 'tags'
      ]
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    help_text: { type: String },
    default_value: { type: Schema.Types.Mixed },
    options: [{
      label: { type: String, required: true },
      value: { type: Schema.Types.Mixed, required: true }
    }],
    validation: {
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      min_length: { type: Number },
      max_length: { type: Number },
      allowed_values: [{ type: Schema.Types.Mixed }]
    },
    conditional: {
      depends_on: { type: String },
      show_when: { type: Schema.Types.Mixed }
    },
    group: { type: String, default: 'General Details' },
    display_order: { type: Number, default: 0 }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

CategoryFormSchemaSchema.index({ category_id: 1, listing_type: 1 }, { unique: true });


// ============================================================
// 3. LISTING CATEGORY DATA (Validated Dynamic Form Values)
// ============================================================
export interface IListingCategoryData extends Document {
  listing_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  schema_version: number;
  data: Record<string, any>;             // Validated against CategoryFormSchema
  validated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const ListingCategoryDataSchema = new Schema<IListingCategoryData>({
  listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  category_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', required: true, index: true },
  schema_version: { type: Number, default: 1 },
  data: { type: Schema.Types.Mixed, default: {} },
  validated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ListingCategoryDataSchema.index({ listing_id: 1, category_id: 1 }, { unique: true });


// Export Models
export const MarketplaceCategory = mongoose.models.MarketplaceCategory || 
  mongoose.model<IMarketplaceCategory>('MarketplaceCategory', MarketplaceCategorySchema);

export const CategoryFormSchema = mongoose.models.CategoryFormSchema || 
  mongoose.model<ICategoryFormSchema>('CategoryFormSchema', CategoryFormSchemaSchema);

export const ListingCategoryData = mongoose.models.ListingCategoryData || 
  mongoose.model<IListingCategoryData>('ListingCategoryData', ListingCategoryDataSchema);
