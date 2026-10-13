import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. MARKETPLACE ENQUIRY (CRM Bridge for High-Involvement Verticals)
// ============================================================
export interface IMarketplaceEnquiry extends Document {
  enquiry_number: string;
  listing_id: mongoose.Types.ObjectId;
  marketplace_category_id: mongoose.Types.ObjectId;
  listing_type?: string;

  // Seller organization
  seller_tenant_id: mongoose.Types.ObjectId;

  // Buyer details
  buyer_id?: mongoose.Types.ObjectId;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  buyer_message: string;

  // Flexible category-specific enquiry requirements (e.g. preferred move-in date, car inspection location)
  requirements: Record<string, any>;

  // Integrated CRM Lead connection
  crm_lead_id?: mongoose.Types.ObjectId;
  crm_lead_status?: string;

  // Lifecycle
  type: 'CONTACT' | 'VIEWING' | 'TEST_DRIVE' | 'CONSULTATION' | 'QUOTE_REQUEST' | 'GENERAL';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';

  // Seller follow-up metadata
  assigned_to?: mongoose.Types.ObjectId;
  follow_up_date?: Date;
  notes?: string;

  // Consent & Compliance
  consent: {
    contact_allowed: boolean;
    data_sharing_accepted: boolean;
    timestamp: Date;
  };

  created_at: Date;
  updated_at: Date;
}

const MarketplaceEnquirySchema = new Schema<IMarketplaceEnquiry>({
  enquiry_number: { type: String, required: true, unique: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  marketplace_category_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', required: true, index: true },
  listing_type: { type: String, default: 'STANDARD' },

  seller_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser', index: true },
  buyer_name: { type: String, required: true, trim: true },
  buyer_email: { type: String, required: true, lowercase: true, trim: true },
  buyer_phone: { type: String, required: true, trim: true },
  buyer_company: { type: String, trim: true },
  buyer_message: { type: String, required: true },

  requirements: { type: Schema.Types.Mixed, default: {} },

  crm_lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  crm_lead_status: { type: String, default: 'inprogress' },

  type: {
    type: String,
    enum: ['CONTACT', 'VIEWING', 'TEST_DRIVE', 'CONSULTATION', 'QUOTE_REQUEST', 'GENERAL'],
    default: 'CONTACT',
    index: true
  },
  status: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED'],
    default: 'NEW',
    index: true
  },

  assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
  follow_up_date: { type: Date },
  notes: { type: String },

  consent: {
    contact_allowed: { type: Boolean, default: true },
    data_sharing_accepted: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
  },

  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
});

MarketplaceEnquirySchema.index({ seller_tenant_id: 1, status: 1, created_at: -1 });
MarketplaceEnquirySchema.index({ buyer_id: 1, created_at: -1 });


// ============================================================
// 2. MARKETPLACE BOOKING (Appointments, Slots, Stays, Rentals)
// ============================================================
export interface IMarketplaceBooking extends Document {
  booking_number: string;
  listing_id: mongoose.Types.ObjectId;
  marketplace_category_id: mongoose.Types.ObjectId;

  seller_tenant_id: mongoose.Types.ObjectId;
  buyer_id?: mongoose.Types.ObjectId;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;

  // Scheduling details
  start_date: Date;
  end_date?: Date;
  time_slot?: string;            // E.g., "10:00 AM - 11:00 AM"
  participants: number;

  // Financials
  unit_price: number;
  quantity: number;
  subtotal: number;
  tax_amount: number;
  deposit_amount?: number;
  total: number;
  currency: string;

  // Booking lifecycle
  status: 'REQUESTED' | 'CONFIRMED' | 'DEPOSIT_PAID' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  payment_reference?: string;

  cancellation_policy?: string;
  cancelled_reason?: string;
  refund_amount?: number;

  // Linked CRM lead
  crm_lead_id?: mongoose.Types.ObjectId;

  created_at: Date;
  updated_at: Date;
}

const MarketplaceBookingSchema = new Schema<IMarketplaceBooking>({
  booking_number: { type: String, required: true, unique: true, index: true },
  listing_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  marketplace_category_id: { type: Schema.Types.ObjectId, ref: 'MarketplaceCategory', required: true, index: true },

  seller_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  buyer_id: { type: Schema.Types.ObjectId, ref: 'BuyerUser', index: true },
  buyer_name: { type: String, required: true, trim: true },
  buyer_email: { type: String, required: true, lowercase: true, trim: true },
  buyer_phone: { type: String, required: true, trim: true },

  start_date: { type: Date, required: true, index: true },
  end_date: { type: Date },
  time_slot: { type: String },
  participants: { type: Number, default: 1 },

  unit_price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 1, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  tax_amount: { type: Number, default: 0, min: 0 },
  deposit_amount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },

  status: {
    type: String,
    enum: ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID', 'PAID', 'CANCELLED', 'COMPLETED', 'REFUNDED'],
    default: 'REQUESTED',
    index: true
  },
  payment_status: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  payment_reference: { type: String },

  cancellation_policy: { type: String },
  cancelled_reason: { type: String },
  refund_amount: { type: Number, default: 0 },

  crm_lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },

  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
});

MarketplaceBookingSchema.index({ seller_tenant_id: 1, status: 1, start_date: 1 });
MarketplaceBookingSchema.index({ listing_id: 1, start_date: 1, status: 1 });
MarketplaceBookingSchema.index({ buyer_id: 1, created_at: -1 });


// Export Models
export const MarketplaceEnquiry = mongoose.models.MarketplaceEnquiry || 
  mongoose.model<IMarketplaceEnquiry>('MarketplaceEnquiry', MarketplaceEnquirySchema);

export const MarketplaceBooking = mongoose.models.MarketplaceBooking || 
  mongoose.model<IMarketplaceBooking>('MarketplaceBooking', MarketplaceBookingSchema);
