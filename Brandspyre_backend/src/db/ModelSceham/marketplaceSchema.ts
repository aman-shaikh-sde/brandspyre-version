import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// ============================================================
// 1. MARKETPLACE SELLER PROFILE
// Represents an organization's public storefront profile
// ============================================================
export interface IMarketplaceSellerProfile extends Document {
  tenant_id: mongoose.Types.ObjectId;
  store_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email: string;
  contact_phone: string;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number; // Platform commission %
  shipping_policy?: string;
  return_policy?: string;
  created_at: Date;
  updated_at: Date;
}

const MarketplaceSellerProfileSchema = new Schema<IMarketplaceSellerProfile>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true, index: true },
  store_name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  logo_url: { type: String, default: '' },
  banner_url: { type: String, default: '' },
  contact_email: { type: String, required: true, lowercase: true, trim: true },
  contact_phone: { type: String, required: true, trim: true },
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  commission_rate: { type: Number, default: 0 },
  shipping_policy: { type: String, default: '' },
  return_policy: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 2. MARKETPLACE LISTING
// Public listing referencing the seller's internal product master
// ============================================================
export interface IMarketplaceListing extends Document {
  tenant_id: mongoose.Types.ObjectId;   // Seller Organization
  product_id?: mongoose.Types.ObjectId;  // Internal ERP Product (Optional for non-product verticals)
  marketplace_category_id?: mongoose.Types.ObjectId; // References MarketplaceCategory
  listing_type?: string;                // E.g., 'PRODUCT_SALE', 'PROPERTY_RENT', 'SERVICE', 'BOOKING'
  title: string;
  slug: string;
  description: string;
  category_id?: mongoose.Types.ObjectId;
  brand_id?: mongoose.Types.ObjectId;
  unit_id?: mongoose.Types.ObjectId;
  listing_price: number;
  compare_price?: number;
  pricing?: {
    mode: 'FIXED' | 'NEGOTIABLE' | 'PRICE_ON_REQUEST' | 'STARTING_FROM';
    amount?: number;
    currency?: string;
    unit?: string;
    compare_amount?: number;
    min_amount?: number;
    max_amount?: number;
    negotiation_allowed?: boolean;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    coordinates?: { lat: number; lng: number };
  };
  category_data?: mongoose.Types.ObjectId; // References ListingCategoryData
  availability?: {
    type: 'ALWAYS' | 'DATE_RANGE' | 'SCHEDULE' | 'ON_REQUEST';
    start_date?: Date;
    end_date?: Date;
    schedule?: any;
  };
  tax_rate: number;
  images: string[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  rejection_reason?: string;
  is_published: boolean;
  is_featured: boolean;
  rating: number;
  rating_count: number;
  min_order_quantity: number;
  max_order_quantity?: number;
  attributes: Record<string, any>;
  tags: string[];
  moderation_history?: Array<{
    action: string;
    reason?: string;
    moderator_id?: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

const MarketplaceListingSchema = new Schema<IMarketplaceListing>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
  marketplace_category_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', index: true },
  listing_type: { type: String, default: 'STANDARD', index: true },
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, lowercase: true, trim: true, index: true },
  description: { type: String, default: '' },
  category_id: { type: Schema.Types.ObjectId, ref: 'ProductCategory', index: true },
  brand_id: { type: Schema.Types.ObjectId, ref: 'ProductBrand', index: true },
  unit_id: { type: Schema.Types.ObjectId, ref: 'ProductUnit' },
  listing_price: { type: Number, required: true, min: 0, index: true },
  compare_price: { type: Number, min: 0 },
  pricing: {
    mode: { type: String, enum: ['FIXED', 'NEGOTIABLE', 'PRICE_ON_REQUEST', 'STARTING_FROM'], default: 'FIXED' },
    amount: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    unit: { type: String, default: 'PER_UNIT' },
    compare_amount: { type: Number, min: 0 },
    min_amount: { type: Number, min: 0 },
    max_amount: { type: Number, min: 0 },
    negotiation_allowed: { type: Boolean, default: false }
  },
  location: {
    address: { type: String },
    city: { type: String, index: true },
    state: { type: String, index: true },
    country: { type: String, default: 'India' },
    postal_code: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  category_data: { type: Schema.Types.ObjectId, ref: 'ListingCategoryData', index: true },
  availability: {
    type: { type: String, enum: ['ALWAYS', 'DATE_RANGE', 'SCHEDULE', 'ON_REQUEST'], default: 'ALWAYS' },
    start_date: { type: Date },
    end_date: { type: Date },
    schedule: { type: Schema.Types.Mixed }
  },
  tax_rate: { type: Number, default: 0 },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING_APPROVAL',
    index: true
  },
  rejection_reason: { type: String, default: '' },
  is_published: { type: Boolean, default: false, index: true },
  is_featured: { type: Boolean, default: false, index: true },
  rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  min_order_quantity: { type: Number, default: 1 },
  max_order_quantity: { type: Number },
  attributes: { type: Schema.Types.Mixed, default: {} },
  tags: [{ type: String }],
  moderation_history: [{
    action: { type: String, required: true },
    reason: { type: String },
    moderator_id: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MarketplaceListingSchema.index({ tenant_id: 1, product_id: 1 }, { unique: true, sparse: true });
MarketplaceListingSchema.index({ tenant_id: 1, slug: 1 }, { unique: true });
MarketplaceListingSchema.index({ marketplace_category_id: 1, is_published: 1, status: 1 });
MarketplaceListingSchema.index({ title: 'text', description: 'text', tags: 'text' });
MarketplaceListingSchema.index({ is_published: 1, status: 1, listing_price: 1 });

// ============================================================
// 3. BUYER USER
// Independent public buyers and linked organization buyers
// ============================================================
export interface IBuyerAddress {
  _id?: mongoose.Types.ObjectId;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface IBuyerUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone: string;
  company_name?: string;
  tax_id?: string;
  is_active: boolean;
  is_org_user: boolean;
  linked_user_id?: mongoose.Types.ObjectId;
  linked_tenant_id?: mongoose.Types.ObjectId;
  addresses: IBuyerAddress[];
  created_at: Date;
  updated_at: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const BuyerAddressSchema = new Schema<IBuyerAddress>({
  label: { type: String, default: 'Default' },
  line1: { type: String, required: true },
  line2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, default: 'India' },
  is_default: { type: Boolean, default: false }
});

const BuyerUserSchema = new Schema<IBuyerUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  company_name: { type: String, default: '' },
  tax_id: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  is_org_user: { type: Boolean, default: false },
  linked_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  linked_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  addresses: [BuyerAddressSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BuyerUserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

BuyerUserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// ============================================================
// 4. ECOMMERCE ORDER
// Master order supporting multi-seller carts with atomic links
// to each seller organization's ERP SalesOrder
// ============================================================
export interface IEcommerceOrderItem {
  product_id: mongoose.Types.ObjectId;
  listing_id?: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId; // Seller Organization ID
  tenant_name?: string;
  sku: string;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

export interface ISellerOrderRef {
  tenant_id: mongoose.Types.ObjectId;
  tenant_name?: string;
  sales_order_id: mongoose.Types.ObjectId;
  order_number: string;
  subtotal: number;
  status: string;
}

export interface ITimelineEvent {
  status: string;
  title: string;
  description?: string;
  timestamp: Date;
}

export interface IEcommerceOrder extends Document {
  order_number: string;
  order_access_token?: string;
  idempotency_key?: string;
  buyer_id?: mongoose.Types.ObjectId;
  buyer_tenant_id?: mongoose.Types.ObjectId; // If buying on behalf of an organization
  buyer_type: 'GUEST' | 'REGISTERED_BUYER' | 'ORGANIZATION_USER';
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: IEcommerceOrderItem[];
  subtotal: number;
  tax_total: number;
  shipping_fee: number;
  discount: number;
  grand_total: number;
  payment_method: 'COD' | 'ONLINE_CARD' | 'UPI' | 'RAZORPAY' | 'STRIPE' | 'B2B_PO';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_reference?: string;
  payment_gateway_order_id?: string;
  payment_signature?: string;
  status: 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  seller_orders: ISellerOrderRef[];
  notes?: string;
  timeline: ITimelineEvent[];
  created_at: Date;
  updated_at: Date;
}

const EcommerceOrderSchema = new Schema<IEcommerceOrder>({
  order_number: { type: String, required: true, unique: true, index: true },
  order_access_token: { type: String, index: true },
  idempotency_key: { type: String, sparse: true, unique: true, index: true },
  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser', index: true },
  buyer_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  buyer_type: {
    type: String,
    enum: ['GUEST', 'REGISTERED_BUYER', 'ORGANIZATION_USER'],
    default: 'REGISTERED_BUYER'
  },
  buyer_name: { type: String, required: true, trim: true },
  buyer_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  buyer_phone: { type: String, required: true, trim: true },
  buyer_company: { type: String, default: '' },
  shipping_address: {
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  billing_address: {
    line1: { type: String },
    line2: { type: String, default: '' },
    city: { type: String },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'India' }
  },
  items: [{
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing' },
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    tenant_name: { type: String, default: '' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    image_url: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  tax_total: { type: Number, default: 0 },
  shipping_fee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  grand_total: { type: Number, required: true },
  payment_method: {
    type: String,
    enum: ['COD', 'ONLINE_CARD', 'UPI', 'RAZORPAY', 'STRIPE', 'B2B_PO'],
    default: 'COD'
  },
  payment_status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  payment_reference: { type: String, default: '' },
  payment_gateway_order_id: { type: String, default: '' },
  payment_signature: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    default: 'PLACED',
    index: true
  },
  seller_orders: [{
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tenant_name: { type: String },
    sales_order_id: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    order_number: { type: String, required: true },
    subtotal: { type: Number, required: true },
    status: { type: String, default: 'CONFIRMED' }
  }],
  notes: { type: String, default: '' },
  timeline: [{
    status: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 5. QUOTATION ENQUIRY (RFQ)
// Linked directly to seller organization's SalesQuotation
// ============================================================
export interface ISellerQuoteResponse {
  quoted_unit_price?: number;
  quoted_total?: number;
  valid_until?: Date;
  seller_notes?: string;
  quoted_at?: Date;
}

export interface IQuotationEnquiry extends Document {
  enquiry_number: string;
  tenant_id: mongoose.Types.ObjectId; // Seller Organization ID
  tenant_name?: string;
  product_id: mongoose.Types.ObjectId;
  product_name: string;
  product_sku: string;
  product_image?: string;
  catalog_price: number;
  requested_quantity: number;
  target_unit_price?: number;
  buyer_id?: mongoose.Types.ObjectId;
  buyer_tenant_id?: mongoose.Types.ObjectId;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  delivery_location?: string;
  needed_by_date?: Date;
  notes?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  sales_quotation_id?: mongoose.Types.ObjectId; // Linked CRM SalesQuotation
  sales_quotation_number?: string;
  seller_quote?: ISellerQuoteResponse;
  created_at: Date;
  updated_at: Date;
}

const QuotationEnquirySchema = new Schema<IQuotationEnquiry>({
  enquiry_number: { type: String, required: true, unique: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  tenant_name: { type: String, default: '' },
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  product_name: { type: String, required: true },
  product_sku: { type: String, required: true },
  product_image: { type: String, default: '' },
  catalog_price: { type: Number, default: 0 },
  requested_quantity: { type: Number, required: true, min: 1 },
  target_unit_price: { type: Number },
  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser', index: true },
  buyer_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  buyer_name: { type: String, required: true },
  buyer_email: { type: String, required: true, index: true },
  buyer_phone: { type: String, required: true },
  buyer_company: { type: String, default: '' },
  delivery_location: { type: String, default: '' },
  needed_by_date: { type: Date },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'CONVERTED'],
    default: 'SUBMITTED',
    index: true
  },
  sales_quotation_id: { type: Schema.Types.ObjectId, ref: 'SalesQuotation' },
  sales_quotation_number: { type: String },
  seller_quote: {
    quoted_unit_price: { type: Number },
    quoted_total: { type: Number },
    valid_until: { type: Date },
    seller_notes: { type: String },
    quoted_at: { type: Date }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 6. PRODUCT REVIEW
// ============================================================
export interface IProductReview extends Document {
  product_id: mongoose.Types.ObjectId;
  listing_id?: mongoose.Types.ObjectId;
  buyer_id?: mongoose.Types.ObjectId;
  buyer_name: string;
  rating: number;
  review_title?: string;
  comment: string;
  is_verified_purchase?: boolean;
  created_at: Date;
}

const ProductReviewSchema = new Schema<IProductReview>({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', index: true },
  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser' },
  buyer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_title: { type: String, default: '' },
  comment: { type: String, required: true },
  is_verified_purchase: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// ============================================================
// 7. WISHLIST
// ============================================================
export interface IWishlist extends Document {
  buyer_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  listing_id?: mongoose.Types.ObjectId;
  created_at: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser', required: true, index: true },
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing' },
  created_at: { type: Date, default: Date.now }
});

WishlistSchema.index({ buyer_id: 1, product_id: 1 }, { unique: true });

// ============================================================
// MODEL REGISTRATIONS & EXPORTS
// ============================================================
export const MarketplaceSellerProfile =
  mongoose.models.MarketplaceSellerProfile ||
  mongoose.model<IMarketplaceSellerProfile>('MarketplaceSellerProfile', MarketplaceSellerProfileSchema);

export const MarketplaceListing =
  mongoose.models.MarketplaceListing ||
  mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);

export const BuyerUser =
  mongoose.models.BuyerUser ||
  mongoose.model<IBuyerUser>('BuyerUser', BuyerUserSchema);

export const EcommerceOrder =
  mongoose.models.EcommerceOrder ||
  mongoose.model<IEcommerceOrder>('EcommerceOrder', EcommerceOrderSchema);

export const QuotationEnquiry =
  mongoose.models.QuotationEnquiry ||
  mongoose.model<IQuotationEnquiry>('QuotationEnquiry', QuotationEnquirySchema);

export const ProductReview =
  mongoose.models.ProductReview ||
  mongoose.model<IProductReview>('ProductReview', ProductReviewSchema);

export const Wishlist =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export const initializeMarketplaceSchema = async () => {
  try {
    const { MarketplaceCategory, CategoryFormSchema, ListingCategoryData } = require('./marketplaceCategorySchema');
    const { MarketplaceEnquiry, MarketplaceBooking } = require('./marketplaceEnquirySchema');

    await MarketplaceSellerProfile.createIndexes();
    await MarketplaceListing.createIndexes();
    await BuyerUser.createIndexes();
    await EcommerceOrder.createIndexes();
    await QuotationEnquiry.createIndexes();
    await ProductReview.createIndexes();
    await Wishlist.createIndexes();
    await MarketplaceCategory.createIndexes();
    await CategoryFormSchema.createIndexes();
    await ListingCategoryData.createIndexes();
    await MarketplaceEnquiry.createIndexes();
    await MarketplaceBooking.createIndexes();
    console.log('✅ Universal Marketplace schema indexes initialized successfully.');
  } catch (err: any) {
    console.error('❌ Error initializing marketplace schema indexes:', err.message);
  }
};
