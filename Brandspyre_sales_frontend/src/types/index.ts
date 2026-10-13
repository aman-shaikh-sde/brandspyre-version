export interface Product {
  _id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: {
    _id: string;
    name: string;
    code: string;
  };
  brand_id?: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  unit_id?: {
    _id: string;
    name: string;
    code: string;
  };
  tenant_id?: {
    _id: string;
    company_name: string;
    name: string;
    industry?: string;
    billing_address?: any;
  };
  product_type: 'single' | 'variant' | 'combo' | 'service';
  selling_price: number;
  purchase_price: number;
  tax_rate: number;
  tax_inclusive?: boolean;
  reorder_level: number;
  track_inventory: boolean;
  image_url?: string;
  images?: string[];
  is_active: boolean;
  is_featured?: boolean;
  rating?: number;
  rating_count?: number;
  available_stock?: number;
  related_products?: Product[];
  created_at: string;
}

export interface Category {
  _id: string;
  code: string;
  name: string;
  description?: string;
  image_url?: string;
  product_count?: number;
  is_active: boolean;
}

export interface Brand {
  _id: string;
  code: string;
  name: string;
  logo_url?: string;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BuyerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  addresses?: Array<{
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default?: boolean;
  }>;
}

export interface QuotationEnquiry {
  _id: string;
  enquiry_number: string;
  tenant_id: string;
  tenant_name?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image?: string;
  catalog_price: number;
  requested_quantity: number;
  target_unit_price?: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  delivery_location?: string;
  needed_by_date?: string;
  notes?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  sales_quotation_number?: string;
  seller_quote?: {
    quoted_unit_price?: number;
    quoted_total?: number;
    valid_until?: string;
    seller_notes?: string;
    quoted_at?: string;
  };
  created_at: string;
}

export interface EcommerceOrder {
  _id: string;
  order_number: string;
  order_access_token?: string;
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
  items: Array<{
    product_id: string;
    tenant_id: string;
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
  }>;
  subtotal: number;
  tax_total: number;
  shipping_fee: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  seller_orders?: Array<{
    tenant_id: string;
    tenant_name?: string;
    sales_order_id: string;
    order_number: string;
    subtotal: number;
    status: string;
  }>;
  timeline?: Array<{
    status: string;
    title: string;
    description?: string;
    timestamp: string;
  }>;
  created_at: string;
}

export interface ProductReview {
  _id: string;
  product_id: string;
  buyer_id?: string;
  buyer_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface MarketplaceListing {
  _id: string;
  tenant_id: {
    _id: string;
    name?: string;
    company_name?: string;
  } | string;
  product_id: Product | string;
  title: string;
  description?: string;
  listing_price: number;
  compare_price?: number;
  min_order_quantity: number;
  is_published: boolean;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  rejection_reason?: string;
  inventory?: number;
  tags?: string[];
  rating?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceSellerProfile {
  _id: string;
  tenant_id: string;
  store_name: string;
  company_name?: string;
  is_verified: boolean;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  gstin?: string;
  business_email?: string;
  business_phone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  fulfillment_sla_days?: number;
  created_at: string;
}

export interface SellerOrder {
  _id?: string;
  order_number: string;
  sales_order_number?: string;
  sales_order_id?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  items: Array<{
    product_id: string;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  status: string;
  shipping_status?: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
  tracking_carrier?: string;
  tracking_number?: string;
  created_at: string;
}

export interface MarketplaceAdminStats {
  total_sellers: number;
  verified_sellers: number;
  total_listings: number;
  pending_listings: number;
  published_listings: number;
  total_orders: number;
  total_gmv: number;
}

// ============================================================
// UNIVERSAL MULTI-VERTICAL ENGINE TYPES
// ============================================================

export type TransactionFlow = 'ECOMMERCE' | 'ENQUIRY' | 'BOOKING' | 'RFQ' | 'HYBRID';
export type PricingMode = 'FIXED' | 'NEGOTIABLE' | 'PRICE_ON_REQUEST' | 'STARTING_FROM';

export interface MarketplaceCategory {
  _id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  banner_image?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  listing_types: string[];
  default_listing_type: string;
  pricing_modes: string[];
  default_pricing_mode: string;
  pricing_units: string[];
  default_pricing_unit?: string;
  transaction_flow: TransactionFlow;
  requires_product_link: boolean;
  requires_location: boolean;
  allow_instant_booking: boolean;
  media_requirements?: {
    min_images: number;
    max_images: number;
    allow_video: boolean;
    allow_documents: boolean;
  };
  listing_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormFieldOption {
  label: string;
  value: any;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' |
        'date' | 'daterange' | 'time' | 'location' | 'address' | 'currency' | 'image_upload' |
        'document_upload' | 'repeater' | 'tags';
  required: boolean;
  placeholder?: string;
  help_text?: string;
  default_value?: any;
  options?: FormFieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    min_length?: number;
    max_length?: number;
    allowed_values?: any[];
  };
  conditional?: {
    depends_on: string;
    show_when: any;
  };
  group?: string;
  display_order: number;
}

export interface CategoryFormSchema {
  _id?: string;
  category_id: string;
  listing_type: string;
  version: number;
  is_active: boolean;
  fields: FormFieldDefinition[];
  created_at?: string;
  updated_at?: string;
}

export interface ListingPricing {
  mode: PricingMode;
  amount?: number;
  currency: string;
  unit?: string;
  compare_amount?: number;
  min_amount?: number;
  max_amount?: number;
  negotiation_allowed?: boolean;
}

export interface ListingLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UniversalListing {
  _id: string;
  id?: string;
  tenant_id: any;
  product_id?: any;
  marketplace_category_id?: MarketplaceCategory | string;
  category_data?: {
    _id?: string;
    data: Record<string, any>;
    schema_version?: number;
  };
  listing_type: string;
  title: string;
  name?: string;
  slug: string;
  description: string;
  category_id?: any;
  brand_id?: any;
  listing_price: number;
  selling_price?: number;
  compare_price?: number;
  pricing?: ListingPricing;
  location?: ListingLocation;
  availability?: {
    type: 'ALWAYS' | 'DATE_RANGE' | 'SCHEDULE' | 'ON_REQUEST';
    start_date?: string;
    end_date?: string;
    schedule?: any;
  };
  images: string[];
  image_url?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';
  is_published: boolean;
  is_featured?: boolean;
  rating?: number;
  rating_count?: number;
  available_stock?: number;
  min_order_quantity?: number;
  tags?: string[];
  attributes?: Record<string, any>;
  seller_profile?: MarketplaceSellerProfile;
  created_at: string;
  updated_at?: string;
}

export interface MarketplaceEnquiry {
  _id: string;
  enquiry_number: string;
  listing_id: any;
  marketplace_category_id?: any;
  listing_type?: string;
  seller_tenant_id: any;
  buyer_id?: any;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  buyer_message: string;
  requirements?: Record<string, any>;
  crm_lead_id?: any;
  crm_lead_status?: string;
  type: 'CONTACT' | 'VIEWING' | 'TEST_DRIVE' | 'CONSULTATION' | 'QUOTE_REQUEST' | 'GENERAL';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';
  notes?: string;
  follow_up_date?: string;
  created_at: string;
}

export interface MarketplaceBooking {
  _id: string;
  booking_number: string;
  listing_id: any;
  marketplace_category_id?: any;
  seller_tenant_id: any;
  buyer_id?: any;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  start_date: string;
  end_date?: string;
  time_slot?: string;
  participants: number;
  unit_price: number;
  quantity: number;
  subtotal: number;
  tax_amount: number;
  deposit_amount?: number;
  total: number;
  currency: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'DEPOSIT_PAID' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  cancellation_policy?: string;
  cancelled_reason?: string;
  created_at: string;
}


