import mongoose, { Schema, Document, Model } from "mongoose";

export interface ContentStyle {
  fontSize?: number | string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface ContentBlock {
  id?: string;
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'list' | 'divider' | 'callout' | 'cta' | 'table';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: string;
  alignment?: 'left' | 'center' | 'right';
  citation?: string;
  listType?: 'bullet' | 'ordered';
  items?: string[];
  variant?: 'info' | 'success' | 'warning' | 'tip' | 'primary' | 'secondary' | 'solid' | 'dashed' | 'dotted';
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  headers?: string[];
  rows?: string[][];
  style?: ContentStyle;
}

export interface SEOConfig {
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  keywords?: string[];
}

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_by?: mongoose.Types.ObjectId | string;
  updated_by?: mongoose.Types.ObjectId | string;
  created_at: Date;
  updated_at: Date;
}

export interface IBlogPost extends Document {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category_id?: mongoose.Types.ObjectId;
  category_name: string;
  author_id?: mongoose.Types.ObjectId | string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  cover_image?: string;
  cover_image_alt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at?: Date;
  scheduled_at?: Date;
  read_time_minutes: number;
  featured: boolean;
  sort_order: number;
  content_blocks: ContentBlock[];
  seo?: SEOConfig;
  scope: 'global' | 'tenant';
  tenant_id?: mongoose.Types.ObjectId;
  created_by?: mongoose.Types.ObjectId | string;
  updated_by?: mongoose.Types.ObjectId | string;
  created_at: Date;
  updated_at: Date;
}

export interface ITestimonial extends Document {
  person_name: string;
  person_role: string;
  company_name: string;
  company_logo?: string;
  person_avatar?: string;
  industry?: string;
  sector: string;
  testimonial_quote: string;
  rating?: number;
  headline?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  modules_used?: string[];
  location?: string;
  featured: boolean;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  scope: 'global' | 'tenant';
  tenant_id?: mongoose.Types.ObjectId;
  created_by?: mongoose.Types.ObjectId | string;
  updated_by?: mongoose.Types.ObjectId | string;
  created_at: Date;
  updated_at: Date;
}

export interface IContentMedia extends Document {
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  url: string;
  alt_text?: string;
  caption?: string;
  scope: 'global' | 'tenant';
  tenant_id?: mongoose.Types.ObjectId;
  created_by?: mongoose.Types.ObjectId | string;
  created_at: Date;
}

// -------------------------------------------------------------
// Schemas
// -------------------------------------------------------------

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0, index: true },
    created_by: { type: Schema.Types.Mixed },
    updated_by: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const BlogPostSchema = new Schema<IBlogPost>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    excerpt: { type: String, required: true, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    category_name: { type: String, required: true, trim: true, index: true },
    author_id: { type: Schema.Types.Mixed },
    author_name: { type: String, required: true, default: "Brandspyre Team", trim: true },
    author_role: { type: String, required: true, default: "Editorial", trim: true },
    author_avatar: { type: String },
    cover_image: { type: String },
    cover_image_alt: { type: String },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
      index: true,
    },
    published_at: { type: Date, index: true },
    scheduled_at: { type: Date, index: true },
    read_time_minutes: { type: Number, default: 5 },
    featured: { type: Boolean, default: false, index: true },
    sort_order: { type: Number, default: 0, index: true },
    content_blocks: { type: Array as any, default: [] },
    seo: {
      meta_title: { type: String },
      meta_description: { type: String },
      canonical_url: { type: String },
      og_title: { type: String },
      og_description: { type: String },
      og_image: { type: String },
      keywords: { type: [String], default: [] },
    },
    scope: { type: String, enum: ["global", "tenant"], default: "global", index: true },
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant" },
    created_by: { type: Schema.Types.Mixed },
    updated_by: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Compound indexes for optimal public queries
BlogPostSchema.index({ status: 1, published_at: -1 });
BlogPostSchema.index({ status: 1, featured: 1, published_at: -1 });
BlogPostSchema.index({ status: 1, category_name: 1, published_at: -1 });

const TestimonialSchema = new Schema<ITestimonial>(
  {
    person_name: { type: String, required: true, trim: true },
    person_role: { type: String, required: true, trim: true },
    company_name: { type: String, required: true, trim: true },
    company_logo: { type: String },
    person_avatar: { type: String },
    industry: { type: String, trim: true },
    sector: { type: String, required: true, trim: true, index: true },
    testimonial_quote: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    headline: { type: String, trim: true },
    challenge: { type: String, trim: true },
    solution: { type: String, trim: true },
    outcome: { type: String, trim: true },
    modules_used: { type: [String], default: [] },
    location: { type: String, trim: true },
    featured: { type: Boolean, default: false, index: true },
    sort_order: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    published_at: { type: Date, default: Date.now, index: true },
    scope: { type: String, enum: ["global", "tenant"], default: "global", index: true },
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant" },
    created_by: { type: Schema.Types.Mixed },
    updated_by: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

TestimonialSchema.index({ status: 1, published_at: -1 });
TestimonialSchema.index({ status: 1, featured: 1, published_at: -1 });

const ContentMediaSchema = new Schema<IContentMedia>(
  {
    filename: { type: String, required: true, unique: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    file_size: { type: Number, required: true },
    url: { type: String, required: true },
    alt_text: { type: String },
    caption: { type: String },
    scope: { type: String, enum: ["global", "tenant"], default: "global" },
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant" },
    created_by: { type: Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now },
  }
);

// -------------------------------------------------------------
// Models Export
// -------------------------------------------------------------

export const BlogCategory: Model<IBlogCategory> =
  mongoose.models.BlogCategory || mongoose.model<IBlogCategory>("BlogCategory", BlogCategorySchema);

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export const ContentMedia: Model<IContentMedia> =
  mongoose.models.ContentMedia || mongoose.model<IContentMedia>("ContentMedia", ContentMediaSchema);

export const initializePublicContentSchema = async () => {
  try {
    console.log("✅ Public content CMS schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error initializing public content schema: ${message}`);
    throw new Error(`Error initializing public content schema: ${message}`);
  }
};
