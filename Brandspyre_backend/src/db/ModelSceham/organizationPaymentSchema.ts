import mongoose, { Schema, Document } from "mongoose";

export type OrgPaymentStatus = 
  | 'PENDING'
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'PROCESSING'
  | 'SETTLED'
  | 'FAILED'
  | 'TRANSFER_FAILED'
  | 'RECONCILIATION_REQUIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'DISPUTED';

export interface IRefundItem {
  refund_id: string; // Razorpay refund ID
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  created_at: Date;
}

export interface IOrganizationPayment extends Document {
  transaction_code: string; // Unique transaction code e.g. TXN-ORG-2026-0001
  receiver_tenant_id: mongoose.Types.ObjectId; // Seller / Receiving organization
  payer_tenant_id?: mongoose.Types.ObjectId; // Buyer organization if registered tenant
  payment_request_id: mongoose.Types.ObjectId;
  invoice_id?: mongoose.Types.ObjectId;
  sales_order_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  
  // Financial breakdown
  amount: number; // Gross amount paid in INR / currency
  currency: string;
  platform_fee: number; // Platform commission retained by Brandspyre
  tax_on_platform_fee: number; // GST on platform fee
  receiver_amount: number; // Net amount routed to receiver's linked account
  
  // Gateway references
  provider: 'razorpay' | 'stripe';
  provider_order_id: string; // Razorpay order ID or Stripe PaymentIntent/Session ID
  provider_payment_id?: string; // Razorpay payment ID (e.g. pay_xxx) or Stripe Charge/PI ID (e.g. ch_xxx / pi_xxx)
  provider_transfer_id?: string; // Razorpay Route transfer ID or Stripe Transfer ID (e.g. tr_xxx)
  provider_checkout_id?: string; // Stripe Checkout Session ID (e.g. cs_xxx)
  provider_signature?: string;
  provider_fee?: number; // Gateway processing fee charged by provider
  provider_metadata?: Record<string, any>;
  
  status: OrgPaymentStatus;
  payment_method?: string; // card, upi, netbanking, wallet
  payment_method_details?: Record<string, any>;
  failure_reason?: string;
  error_code?: string;
  
  receipt_number: string; // Official receipt voucher number
  idempotency_key: string; // sha256 lock to prevent duplicate payment reconciliations
  
  // Timestamps
  initiated_at: Date;
  authorized_at?: Date;
  captured_at?: Date;
  settled_at?: Date;
  failed_at?: Date;
  
  // Refunds
  refunded_amount: number;
  refunds: IRefundItem[];

  // Post-Transfer Reconciliations & Adjustments
  receiver_adjustment_required?: boolean;
  receiver_adjustment_amount?: number;
  receiver_adjustment_status?: 
    | 'NOT_REQUIRED'
    | 'NONE'
    | 'PENDING_RECONCILIATION'
    | 'UNDER_REVIEW'
    | 'ADJUSTMENT_REQUESTED'
    | 'ADJUSTMENT_RECEIVED'
    | 'COMPLETED'
    | 'FAILED'
    | 'ADJUSTED'
    | 'DISPUTED';
  
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const OrganizationPaymentSchema = new Schema<IOrganizationPayment>({
  transaction_code: { type: String, required: true, unique: true, index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  payer_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  payment_request_id: { type: Schema.Types.ObjectId, required: true, ref: 'OrganizationPaymentRequest', index: true },
  invoice_id: { type: Schema.Types.ObjectId, index: true },
  sales_order_id: { type: Schema.Types.ObjectId },
  project_id: { type: Schema.Types.ObjectId },
  
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'INR' },
  platform_fee: { type: Number, default: 0 },
  tax_on_platform_fee: { type: Number, default: 0 },
  receiver_amount: { type: Number, required: true },
  
  provider: { type: String, default: 'razorpay', enum: ['razorpay', 'stripe'] },
  provider_order_id: { type: String, required: true, index: true },
  provider_payment_id: { type: String, sparse: true, index: true },
  provider_transfer_id: { type: String, sparse: true },
  provider_checkout_id: { type: String, sparse: true, index: true },
  provider_signature: { type: String },
  provider_fee: { type: Number, default: 0 },
  provider_metadata: { type: Schema.Types.Mixed },
  
  status: { 
    type: String, 
    default: 'CREATED',
    enum: [
      'PENDING',
      'CREATED',
      'AUTHORIZED',
      'CAPTURED',
      'PROCESSING',
      'SETTLED',
      'FAILED',
      'TRANSFER_FAILED',
      'RECONCILIATION_REQUIRED',
      'CANCELLED',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
      'DISPUTED'
    ],
    index: true 
  },
  payment_method: { type: String },
  payment_method_details: { type: Schema.Types.Mixed },
  failure_reason: { type: String },
  error_code: { type: String },
  
  receipt_number: { type: String, required: true, unique: true, index: true },
  idempotency_key: { type: String, required: true, unique: true, index: true },
  
  initiated_at: { type: Date, default: Date.now },
  authorized_at: { type: Date },
  captured_at: { type: Date },
  settled_at: { type: Date },
  failed_at: { type: Date },
  
  refunded_amount: { type: Number, default: 0 },
  refunds: [{
    refund_id: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    reason: { type: String },
    status: { type: String, default: 'processed' },
    created_at: { type: Date, default: Date.now }
  }],

  receiver_adjustment_required: { type: Boolean, default: false },
  receiver_adjustment_amount: { type: Number, default: 0 },
  receiver_adjustment_status: { 
    type: String, 
    default: 'NOT_REQUIRED', 
    enum: [
      'NOT_REQUIRED',
      'NONE',
      'PENDING_RECONCILIATION',
      'UNDER_REVIEW',
      'ADJUSTMENT_REQUESTED',
      'ADJUSTMENT_RECEIVED',
      'COMPLETED',
      'FAILED',
      'ADJUSTED',
      'DISPUTED'
    ] 
  },
  
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

OrganizationPaymentSchema.index({ receiver_tenant_id: 1, created_at: -1 });
OrganizationPaymentSchema.index({ payer_tenant_id: 1, created_at: -1 });
OrganizationPaymentSchema.index({ provider_order_id: 1, provider_payment_id: 1 });
OrganizationPaymentSchema.index({ status: 1, created_at: -1 });

export const OrganizationPayment = mongoose.models.OrganizationPayment || 
  mongoose.model<IOrganizationPayment>('OrganizationPayment', OrganizationPaymentSchema);
