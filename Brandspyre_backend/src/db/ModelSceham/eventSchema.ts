import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// 1. EVENT COMMISSION CONFIGURATION
// ============================================================
export type CommissionScope = 'GLOBAL' | 'PLAN' | 'ORGANIZATION' | 'EVENT';
export type CommissionModel = 'PERCENTAGE' | 'FIXED_PER_TICKET' | 'PERCENTAGE_PLUS_FIXED';
export type CommissionFeePayer = 'ORGANIZER' | 'BUYER' | 'HYBRID';
export type CommissionAppliesTo = 'TICKETS_ONLY' | 'TICKETS_AND_ADDONS';

export interface IEventCommissionRule extends Document {
  rule_code: string;               // e.g. COMM-GLOBAL, COMM-ORG-65a...
  scope: CommissionScope;
  plan_id?: mongoose.Types.ObjectId;
  tenant_id?: mongoose.Types.ObjectId;
  event_id?: mongoose.Types.ObjectId;
  
  commission_model: CommissionModel;
  rate_percentage: number;          // e.g. 5 (%)
  fixed_fee: number;                // e.g. 15 (₹15 per ticket/item)
  currency: string;                 // 'INR'
  applies_to: CommissionAppliesTo;
  fee_payer: CommissionFeePayer;    // Who absorbs the fee
  buyer_service_fee_percentage?: number; // Optional buyer fee
  buyer_fixed_fee?: number;

  min_commission_cap?: number;      // e.g. Min ₹10
  max_commission_cap?: number;      // e.g. Max ₹500
  tax_percentage: number;           // GST on platform commission (18%)
  
  is_active: boolean;
  version: number;
  effective_from: Date;
  effective_until?: Date;
  created_by?: mongoose.Types.ObjectId;
  updated_by?: mongoose.Types.ObjectId;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const EventCommissionRuleSchema = new Schema<IEventCommissionRule>({
  rule_code: { type: String, required: true, unique: true, index: true },
  scope: { 
    type: String, 
    required: true, 
    enum: ['GLOBAL', 'PLAN', 'ORGANIZATION', 'EVENT'],
    index: true 
  },
  plan_id: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'Event', index: true },

  commission_model: { 
    type: String, 
    required: true, 
    enum: ['PERCENTAGE', 'FIXED_PER_TICKET', 'PERCENTAGE_PLUS_FIXED'],
    default: 'PERCENTAGE' 
  },
  rate_percentage: { type: Number, required: true, default: 5, min: 0 },
  fixed_fee: { type: Number, required: true, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  applies_to: { 
    type: String, 
    required: true, 
    enum: ['TICKETS_ONLY', 'TICKETS_AND_ADDONS'], 
    default: 'TICKETS_AND_ADDONS' 
  },
  fee_payer: { 
    type: String, 
    required: true, 
    enum: ['ORGANIZER', 'BUYER', 'HYBRID'], 
    default: 'ORGANIZER' 
  },
  buyer_service_fee_percentage: { type: Number, default: 0, min: 0 },
  buyer_fixed_fee: { type: Number, default: 0, min: 0 },

  min_commission_cap: { type: Number },
  max_commission_cap: { type: Number },
  tax_percentage: { type: Number, default: 18 },

  is_active: { type: Boolean, default: true, index: true },
  version: { type: Number, default: 1 },
  effective_from: { type: Date, default: Date.now },
  effective_until: { type: Date },
  created_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventCommissionRuleSchema.index({ scope: 1, is_active: 1 });
EventCommissionRuleSchema.index({ tenant_id: 1, is_active: 1 });
EventCommissionRuleSchema.index({ plan_id: 1, is_active: 1 });
EventCommissionRuleSchema.index({ event_id: 1, is_active: 1 });

// ============================================================
// 2. EVENT ENTITY
// ============================================================
export type EventType = 'PHYSICAL' | 'ONLINE' | 'HYBRID';
export type EventStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'PAUSED' 
  | 'SOLDOUT' 
  | 'CANCELLED' 
  | 'COMPLETED';

export interface IRegistrationQuestion {
  id: string;
  label: string;
  field_type: 'TEXT' | 'EMAIL' | 'PHONE' | 'SELECT' | 'CHECKBOX' | 'NUMBER';
  options?: string[];
  is_required: boolean;
  applies_per_ticket: boolean;
}

export interface IEvent extends Document {
  tenant_id: mongoose.Types.ObjectId;  // Organization owner
  title: string;
  slug: string;
  description: string;
  short_summary?: string;
  category: string;                   // Tech, Business, Music, Workshop, Conference, etc.
  event_type: EventType;
  
  // Media
  cover_image: string;
  gallery_images: string[];

  // Location / Online details
  venue_details?: {
    venue_name: string;
    address: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    map_url?: string;
  };
  online_details?: {
    platform: string;                // Zoom, Google Meet, YouTube Live, Brandspyre Rooms
    meeting_link?: string;
    passcode?: string;
    access_instructions?: string;
  };

  // Timing
  start_date: Date;
  end_date: Date;
  timezone: string;

  // Status & Visibility
  status: EventStatus;
  is_featured: boolean;
  is_public: boolean;
  sales_start_date?: Date;
  sales_end_date?: Date;

  // Organizer public profile
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string;
  organizer_website?: string;
  organizer_description?: string;

  // Policies
  refund_policy: string;
  terms_and_conditions: string;
  booking_cutoff_hours?: number;

  // Dynamic Custom Questions for Attendees
  registration_questions: IRegistrationQuestion[];

  // Custom commission override if authorized
  commission_override_rule_id?: mongoose.Types.ObjectId;

  // Moderation / Approvals
  approval_status?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  rejection_reason?: string;

  // Aggregated live sales statistics (reconciled by transactions)
  stats: {
    total_orders: number;
    tickets_sold: number;
    gross_revenue: number;
    total_commission_collected: number;
    total_refunded: number;
    checked_in_count: number;
  };

  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const EventSchema = new Schema<IEvent>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  short_summary: { type: String },
  category: { type: String, required: true, index: true },
  event_type: { 
    type: String, 
    required: true, 
    enum: ['PHYSICAL', 'ONLINE', 'HYBRID'],
    default: 'PHYSICAL' 
  },

  cover_image: { type: String, default: '' },
  gallery_images: [{ type: String }],

  venue_details: {
    venue_name: { type: String },
    address: { type: String },
    city: { type: String, index: true },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'India' },
    map_url: { type: String }
  },
  online_details: {
    platform: { type: String },
    meeting_link: { type: String },
    passcode: { type: String },
    access_instructions: { type: String }
  },

  start_date: { type: Date, required: true, index: true },
  end_date: { type: Date, required: true, index: true },
  timezone: { type: String, default: 'Asia/Kolkata' },

  status: { 
    type: String, 
    required: true, 
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'PAUSED', 'SOLDOUT', 'CANCELLED', 'COMPLETED'],
    default: 'DRAFT',
    index: true 
  },
  is_featured: { type: Boolean, default: false, index: true },
  is_public: { type: Boolean, default: true, index: true },
  sales_start_date: { type: Date },
  sales_end_date: { type: Date },

  organizer_name: { type: String, required: true },
  organizer_email: { type: String, required: true },
  organizer_phone: { type: String },
  organizer_website: { type: String },
  organizer_description: { type: String },

  refund_policy: { type: String, default: 'Refunds are permitted up to 24 hours prior to event start.' },
  terms_and_conditions: { type: String, default: 'Standard event rules and admission policies apply.' },
  booking_cutoff_hours: { type: Number, default: 0 },

  registration_questions: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    field_type: { type: String, required: true, enum: ['TEXT', 'EMAIL', 'PHONE', 'SELECT', 'CHECKBOX', 'NUMBER'], default: 'TEXT' },
    options: [{ type: String }],
    is_required: { type: Boolean, default: false },
    applies_per_ticket: { type: Boolean, default: true }
  }],

  commission_override_rule_id: { type: Schema.Types.ObjectId, ref: 'EventCommissionRule' },

  approval_status: { 
    type: String, 
    enum: ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_REQUIRED',
    index: true 
  },
  approved_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  approved_at: { type: Date },
  rejection_reason: { type: String },

  stats: {
    total_orders: { type: Number, default: 0 },
    tickets_sold: { type: Number, default: 0 },
    gross_revenue: { type: Number, default: 0 },
    total_commission_collected: { type: Number, default: 0 },
    total_refunded: { type: Number, default: 0 },
    checked_in_count: { type: Number, default: 0 }
  },

  created_by: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventSchema.index({ tenant_id: 1, status: 1, start_date: -1 });
EventSchema.index({ status: 1, is_public: 1, start_date: 1 });
EventSchema.index({ category: 1, status: 1 });
EventSchema.index({ "venue_details.city": 1, status: 1 });

// ============================================================
// 3. SESSIONS & AGENDA
// ============================================================
export interface IEventSession extends Document {
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  day_number: number;               // 1, 2, 3 for multi-day
  start_time: Date;
  end_time: Date;
  room_or_stage?: string;
  capacity?: number;
  speakers: Array<{
    name: string;
    designation?: string;
    company?: string;
    bio?: string;
    photo_url?: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

const EventSessionSchema = new Schema<IEventSession>({
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  title: { type: String, required: true },
  description: { type: String },
  day_number: { type: Number, default: 1 },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  room_or_stage: { type: String },
  capacity: { type: Number },
  speakers: [{
    name: { type: String, required: true },
    designation: { type: String },
    company: { type: String },
    bio: { type: String },
    photo_url: { type: String }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventSessionSchema.index({ event_id: 1, start_time: 1 });

// ============================================================
// 4. TICKET TYPES & TIERS
// ============================================================
export interface IEventTicketType extends Document {
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  name: string;                    // e.g. "Early Bird", "VIP Pass", "General"
  description?: string;
  price: number;                   // 0 = Free
  currency: string;                // 'INR'
  
  total_inventory: number;
  reserved_quantity: number;       // In pending checkouts
  sold_quantity: number;
  
  sales_start: Date;
  sales_end: Date;
  min_per_order: number;
  max_per_order: number;
  
  benefits: string[];
  session_ids?: mongoose.Types.ObjectId[];
  
  is_active: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'ARCHIVED';
  sort_order: number;

  created_at: Date;
  updated_at: Date;
}

const EventTicketTypeSchema = new Schema<IEventTicketType>({
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },

  total_inventory: { type: Number, required: true, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  sold_quantity: { type: Number, default: 0, min: 0 },

  sales_start: { type: Date, default: Date.now },
  sales_end: { type: Date },
  min_per_order: { type: Number, default: 1, min: 1 },
  max_per_order: { type: Number, default: 10, min: 1 },

  benefits: [{ type: String }],
  session_ids: [{ type: Schema.Types.ObjectId, ref: 'EventSession' }],

  is_active: { type: Boolean, default: true, index: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PAUSED', 'SOLD_OUT', 'ARCHIVED'], 
    default: 'ACTIVE',
    index: true 
  },
  sort_order: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventTicketTypeSchema.index({ event_id: 1, is_active: 1, sort_order: 1 });

// ============================================================
// 5. EVENT ADD-ONS (Merchandise, Food, Workshops, Parking, etc.)
// ============================================================
export interface IEventAddon extends Document {
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  currency: string;

  total_inventory: number;
  sold_quantity: number;
  max_per_order: number;

  variants?: Array<{
    name: string;                  // e.g. "Size: L", "Veg Meal"
    price_modifier: number;        // e.g. +50
  }>;

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const EventAddonSchema = new Schema<IEventAddon>({
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },

  total_inventory: { type: Number, required: true, default: 999999 },
  sold_quantity: { type: Number, default: 0 },
  max_per_order: { type: Number, default: 10 },

  variants: [{
    name: { type: String, required: true },
    price_modifier: { type: Number, default: 0 }
  }],

  is_active: { type: Boolean, default: true, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventAddonSchema.index({ event_id: 1, is_active: 1 });

// ============================================================
// 6. EVENT ORDERS (Immutable Purchases)
// ============================================================
export type OrderStatus = 
  | 'PENDING' 
  | 'RESERVED' 
  | 'PAID' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED' 
  | 'CANCELLED';

export interface IOrderItem {
  item_type: 'TICKET' | 'ADDON';
  item_id: mongoose.Types.ObjectId;
  name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  attendee_info?: {
    name: string;
    email: string;
    phone?: string;
    answers?: Record<string, any>;
  };
}

export interface IEventOrder extends Document {
  order_number: string;            // e.g. EVT-ORD-2026-0001
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;

  // Buyer Info
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  user_id?: mongoose.Types.ObjectId; // Optional if registered Brandspyre user

  status: OrderStatus;
  reservation_expires_at?: Date;

  items: IOrderItem[];

  // Authoritative Persisted Financial Snapshot
  gross_ticket_amount: number;
  gross_addon_amount: number;
  subtotal: number;
  discount_amount: number;
  buyer_service_fee: number;
  tax_amount: number;               // Tax on purchase
  total_payable: number;            // Total charged to customer

  // Authoritative Platform Commission Breakdown
  commission_snapshot: {
    rule_id?: mongoose.Types.ObjectId;
    scope: CommissionScope;
    model: CommissionModel;
    rate_percentage: number;
    fixed_fee: number;
    applies_to: CommissionAppliesTo;
    fee_payer: CommissionFeePayer;
    base_commission_amount: number;
    commission_tax: number;        // GST on commission
    total_commission_deduction: number;
  };
  net_organizer_payable: number;   // Gross - Platform Commission
  currency: string;

  // Payment Integration (Razorpay)
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  paid_at?: Date;
  failed_at?: Date;
  failure_reason?: string;

  // Refund Tracking
  refund_status?: 'NONE' | 'REQUESTED' | 'PARTIAL' | 'FULL';
  refunded_amount?: number;
  commission_reversed_amount?: number;

  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

const EventOrderSchema = new Schema<IEventOrder>({
  order_number: { type: String, required: true, unique: true, index: true },
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },

  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true, index: true },
  customer_phone: { type: String },
  user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo', index: true },

  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'RESERVED', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'],
    default: 'PENDING',
    index: true 
  },
  reservation_expires_at: { type: Date, index: true },

  items: [{
    item_type: { type: String, required: true, enum: ['TICKET', 'ADDON'] },
    item_id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    variant_name: { type: String },
    unit_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    attendee_info: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      answers: { type: Schema.Types.Mixed }
    }
  }],

  gross_ticket_amount: { type: Number, required: true, default: 0 },
  gross_addon_amount: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, required: true, default: 0 },
  discount_amount: { type: Number, default: 0 },
  buyer_service_fee: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total_payable: { type: Number, required: true },

  commission_snapshot: {
    rule_id: { type: Schema.Types.ObjectId, ref: 'EventCommissionRule' },
    scope: { type: String, default: 'GLOBAL' },
    model: { type: String, default: 'PERCENTAGE' },
    rate_percentage: { type: Number, default: 0 },
    fixed_fee: { type: Number, default: 0 },
    applies_to: { type: String, default: 'TICKETS_AND_ADDONS' },
    fee_payer: { type: String, default: 'ORGANIZER' },
    base_commission_amount: { type: Number, default: 0 },
    commission_tax: { type: Number, default: 0 },
    total_commission_deduction: { type: Number, default: 0 }
  },
  net_organizer_payable: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  payment_method: { type: String },
  razorpay_order_id: { type: String, index: true },
  razorpay_payment_id: { type: String, sparse: true, index: true },
  razorpay_signature: { type: String },
  paid_at: { type: Date },
  failed_at: { type: Date },
  failure_reason: { type: String },

  refund_status: { type: String, default: 'NONE', enum: ['NONE', 'REQUESTED', 'PARTIAL', 'FULL'] },
  refunded_amount: { type: Number, default: 0 },
  commission_reversed_amount: { type: Number, default: 0 },

  ip_address: { type: String },
  user_agent: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventOrderSchema.index({ tenant_id: 1, created_at: -1 });
EventOrderSchema.index({ event_id: 1, status: 1 });
EventOrderSchema.index({ status: 1, reservation_expires_at: 1 });

// ============================================================
// 7. ISSUED EVENT TICKETS & QR CODES
// ============================================================
export type TicketStatus = 'VALID' | 'CHECKED_IN' | 'REFUNDED' | 'CANCELLED';

export interface IEventTicket extends Document {
  ticket_number: string;           // e.g. TKT-2026-A1B2C3D4
  qr_token: string;                // Secure cryptographic random string
  order_id: mongoose.Types.ObjectId;
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  ticket_type_id: mongoose.Types.ObjectId;

  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  registration_answers?: Record<string, any>;

  status: TicketStatus;

  // Atomic Check-in Status
  is_checked_in: boolean;
  checked_in_at?: Date;
  checked_in_by?: mongoose.Types.ObjectId; // UserInfo id of staff
  checkin_device_info?: string;

  created_at: Date;
  updated_at: Date;
}

const EventTicketSchema = new Schema<IEventTicket>({
  ticket_number: { type: String, required: true, unique: true, index: true },
  qr_token: { type: String, required: true, unique: true, index: true },
  order_id: { type: Schema.Types.ObjectId, required: true, ref: 'EventOrder', index: true },
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  ticket_type_id: { type: Schema.Types.ObjectId, required: true, ref: 'EventTicketType', index: true },

  attendee_name: { type: String, required: true },
  attendee_email: { type: String, required: true, index: true },
  attendee_phone: { type: String },
  registration_answers: { type: Schema.Types.Mixed },

  status: { 
    type: String, 
    required: true, 
    enum: ['VALID', 'CHECKED_IN', 'REFUNDED', 'CANCELLED'],
    default: 'VALID',
    index: true 
  },

  is_checked_in: { type: Boolean, default: false, index: true },
  checked_in_at: { type: Date },
  checked_in_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  checkin_device_info: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventTicketSchema.index({ event_id: 1, is_checked_in: 1 });
EventTicketSchema.index({ tenant_id: 1, event_id: 1, status: 1 });

// ============================================================
// 8. EVENT FINANCIAL LEDGER (Append-Only)
// ============================================================
export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerTransactionType = 
  | 'TICKET_SALE' 
  | 'ADDON_SALE' 
  | 'PLATFORM_COMMISSION' 
  | 'COMMISSION_TAX' 
  | 'BUYER_FEE' 
  | 'ORGANIZER_PAYABLE' 
  | 'REFUND_ORGANIZER_DEBIT' 
  | 'REFUND_COMMISSION_REVERSAL' 
  | 'SETTLEMENT_PAYOUT' 
  | 'ADJUSTMENT';

export interface IEventFinancialTransaction extends Document {
  transaction_ref: string;         // Unique e.g. TXN-EVT-2026-00001
  tenant_id: mongoose.Types.ObjectId;
  event_id?: mongoose.Types.ObjectId;
  order_id?: mongoose.Types.ObjectId;
  settlement_id?: mongoose.Types.ObjectId;
  refund_id?: mongoose.Types.ObjectId;

  type: LedgerTransactionType;
  entry_type: LedgerEntryType;     // CREDIT or DEBIT
  amount: number;
  currency: string;
  balance_after?: number;

  reconciliation_status: 'PENDING' | 'RECONCILED' | 'EXCEPTION';
  notes?: string;
  created_at: Date;
}

const EventFinancialTransactionSchema = new Schema<IEventFinancialTransaction>({
  transaction_ref: { type: String, required: true, unique: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'Event', index: true },
  order_id: { type: Schema.Types.ObjectId, ref: 'EventOrder', index: true },
  settlement_id: { type: Schema.Types.ObjectId, ref: 'EventSettlement', index: true },
  refund_id: { type: Schema.Types.ObjectId, ref: 'EventRefund', index: true },

  type: { 
    type: String, 
    required: true, 
    enum: [
      'TICKET_SALE', 
      'ADDON_SALE', 
      'PLATFORM_COMMISSION', 
      'COMMISSION_TAX', 
      'BUYER_FEE', 
      'ORGANIZER_PAYABLE', 
      'REFUND_ORGANIZER_DEBIT', 
      'REFUND_COMMISSION_REVERSAL', 
      'SETTLEMENT_PAYOUT', 
      'ADJUSTMENT'
    ],
    index: true 
  },
  entry_type: { type: String, required: true, enum: ['CREDIT', 'DEBIT'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  balance_after: { type: Number },

  reconciliation_status: { 
    type: String, 
    default: 'RECONCILED', 
    enum: ['PENDING', 'RECONCILED', 'EXCEPTION'],
    index: true 
  },
  notes: { type: String },
  created_at: { type: Date, default: Date.now, index: true }
});

EventFinancialTransactionSchema.index({ tenant_id: 1, created_at: -1 });
EventFinancialTransactionSchema.index({ event_id: 1, type: 1 });

// ============================================================
// 9. ORGANIZER SETTLEMENTS & PAYOUTS
// ============================================================
export type SettlementStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REVERSED';

export interface IEventSettlement extends Document {
  settlement_number: string;       // e.g. STL-EVT-2026-0001
  tenant_id: mongoose.Types.ObjectId;
  event_id?: mongoose.Types.ObjectId; // Optional: settled per event or aggregate

  period_start: Date;
  period_end: Date;

  gross_sales: number;
  total_commission_deducted: number;
  total_refunds_deducted: number;
  net_payout_amount: number;
  currency: string;

  status: SettlementStatus;
  
  // Payout disbursement details
  payout_method?: 'BANK_TRANSFER' | 'RAZORPAY_PAYOUT' | 'MANUAL_NEFT';
  payout_reference?: string;       // UTR or Gateway Transfer ID
  beneficiary_bank_account?: {
    account_number: string;
    ifsc: string;
    beneficiary_name: string;
    bank_name?: string;
  };

  notes?: string;
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  paid_at?: Date;
  disbursed_by?: mongoose.Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

const EventSettlementSchema = new Schema<IEventSettlement>({
  settlement_number: { type: String, required: true, unique: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'Event', index: true },

  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },

  gross_sales: { type: Number, required: true, default: 0 },
  total_commission_deducted: { type: Number, required: true, default: 0 },
  total_refunds_deducted: { type: Number, default: 0 },
  net_payout_amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },

  status: { 
    type: String, 
    required: true, 
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'],
    default: 'PENDING_APPROVAL',
    index: true 
  },

  payout_method: { type: String, default: 'BANK_TRANSFER' },
  payout_reference: { type: String },
  beneficiary_bank_account: {
    account_number: { type: String },
    ifsc: { type: String },
    beneficiary_name: { type: String },
    bank_name: { type: String }
  },

  notes: { type: String },
  approved_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  approved_at: { type: Date },
  paid_at: { type: Date },
  disbursed_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventSettlementSchema.index({ tenant_id: 1, status: 1 });
EventSettlementSchema.index({ created_at: -1 });

// ============================================================
// 10. REFUNDS & CANCELLATIONS
// ============================================================
export interface IEventRefund extends Document {
  refund_number: string;           // e.g. RFD-EVT-2026-0001
  order_id: mongoose.Types.ObjectId;
  event_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  ticket_ids: mongoose.Types.ObjectId[];

  amount: number;
  commission_reversed: number;
  currency: string;
  reason: string;

  status: 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  gateway_refund_id?: string;

  requested_by?: mongoose.Types.ObjectId; // UserInfo or Customer
  processed_by?: mongoose.Types.ObjectId;
  processed_at?: Date;
  notes?: string;

  created_at: Date;
  updated_at: Date;
}

const EventRefundSchema = new Schema<IEventRefund>({
  refund_number: { type: String, required: true, unique: true, index: true },
  order_id: { type: Schema.Types.ObjectId, required: true, ref: 'EventOrder', index: true },
  event_id: { type: Schema.Types.ObjectId, required: true, ref: 'Event', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  ticket_ids: [{ type: Schema.Types.ObjectId, ref: 'EventTicket' }],

  amount: { type: Number, required: true, min: 0 },
  commission_reversed: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  reason: { type: String, required: true },

  status: { 
    type: String, 
    required: true, 
    enum: ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'],
    default: 'REQUESTED',
    index: true 
  },
  gateway_refund_id: { type: String },

  requested_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  processed_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  processed_at: { type: Date },
  notes: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EventRefundSchema.index({ tenant_id: 1, status: 1 });

// ============================================================
// EXPORT MODELS
// ============================================================
export const EventCommissionRule = mongoose.models.EventCommissionRule || mongoose.model<IEventCommissionRule>('EventCommissionRule', EventCommissionRuleSchema);
export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
export const EventSession = mongoose.models.EventSession || mongoose.model<IEventSession>('EventSession', EventSessionSchema);
export const EventTicketType = mongoose.models.EventTicketType || mongoose.model<IEventTicketType>('EventTicketType', EventTicketTypeSchema);
export const EventAddon = mongoose.models.EventAddon || mongoose.model<IEventAddon>('EventAddon', EventAddonSchema);
export const EventOrder = mongoose.models.EventOrder || mongoose.model<IEventOrder>('EventOrder', EventOrderSchema);
export const EventTicket = mongoose.models.EventTicket || mongoose.model<IEventTicket>('EventTicket', EventTicketSchema);
export const EventFinancialTransaction = mongoose.models.EventFinancialTransaction || mongoose.model<IEventFinancialTransaction>('EventFinancialTransaction', EventFinancialTransactionSchema);
export const EventSettlement = mongoose.models.EventSettlement || mongoose.model<IEventSettlement>('EventSettlement', EventSettlementSchema);
export const EventRefund = mongoose.models.EventRefund || mongoose.model<IEventRefund>('EventRefund', EventRefundSchema);

/**
 * Initialize all Event schema indexes and default platform commission
 */
export const initializeEventSchema = async () => {
  try {
    await EventCommissionRule.createIndexes();
    await Event.createIndexes();
    await EventSession.createIndexes();
    await EventTicketType.createIndexes();
    await EventAddon.createIndexes();
    await EventOrder.createIndexes();
    await EventTicket.createIndexes();
    await EventFinancialTransaction.createIndexes();
    await EventSettlement.createIndexes();
    await EventRefund.createIndexes();

    // Ensure default Global Commission rule exists if none present
    const globalRule = await EventCommissionRule.findOne({ scope: 'GLOBAL', is_active: true });
    if (!globalRule) {
      await EventCommissionRule.create({
        rule_code: 'COMM-GLOBAL-DEFAULT',
        scope: 'GLOBAL',
        commission_model: 'PERCENTAGE',
        rate_percentage: 5,        // Default 5% platform commission
        fixed_fee: 0,
        currency: 'INR',
        applies_to: 'TICKETS_AND_ADDONS',
        fee_payer: 'ORGANIZER',
        tax_percentage: 18,
        is_active: true,
        version: 1,
        effective_from: new Date(),
        notes: 'Default global platform commission rule (5% organizer-paid)'
      });
      console.log('✅ Created default global event commission rule (5%).');
    }

    console.log("✅ Event management schemas and indexes initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Event schema init warning: ${message}`);
  }
};
