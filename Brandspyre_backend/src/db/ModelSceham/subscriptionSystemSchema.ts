import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// SUBSCRIPTION HISTORY — Immutable log of subscription state changes
// ============================================================
export interface ISubscriptionHistory extends Document {
  tenant_id: mongoose.Types.ObjectId;
  subscription_id: mongoose.Types.ObjectId;
  action: 'created' | 'activated' | 'renewed' | 'upgraded' | 'downgraded' | 'expired' | 'grace_entered' | 'locked' | 'unlocked' | 'cancelled' | 'suspended' | 'reactivated' | 'trial_started' | 'trial_expired' | 'payment_received' | 'payment_failed' | 'refunded';
  from_plan_id?: mongoose.Types.ObjectId;
  to_plan_id?: mongoose.Types.ObjectId;
  from_status?: string;
  to_status?: string;
  billing_cycle?: string;
  amount?: number;
  currency?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  performed_by?: mongoose.Types.ObjectId;
  performed_by_type?: 'user' | 'system' | 'webhook' | 'cron';
  ip_address?: string;
  created_at: Date;
}

const SubscriptionHistorySchema = new Schema<ISubscriptionHistory>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'TenantSubscription' },
  action: { type: String, required: true, index: true },
  from_plan_id: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  to_plan_id: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  from_status: { type: String },
  to_status: { type: String },
  billing_cycle: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'INR' },
  razorpay_payment_id: { type: String },
  razorpay_order_id: { type: String },
  notes: { type: String },
  metadata: { type: Schema.Types.Mixed },
  performed_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  performed_by_type: { type: String, default: 'system' },
  ip_address: { type: String },
  created_at: { type: Date, default: Date.now }
});

SubscriptionHistorySchema.index({ tenant_id: 1, created_at: -1 });


// ============================================================
// PAYMENT TRANSACTION — Every Razorpay payment attempt
// ============================================================
export interface IPaymentTransaction extends Document {
  tenant_id: mongoose.Types.ObjectId;
  subscription_id?: mongoose.Types.ObjectId;
  invoice_id?: mongoose.Types.ObjectId;
  transaction_type: 'subscription_payment' | 'renewal' | 'upgrade' | 'refund' | 'retry' | 'manual';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  razorpay_refund_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method?: string;
  payment_method_details?: Record<string, any>;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  refund_status?: string;
  plan_id?: mongoose.Types.ObjectId;
  plan_code?: string;
  billing_cycle?: string;
  attempt_count: number;
  notes?: Record<string, any>;
  receipt?: string;
  gateway_response?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'TenantSubscription' },
  invoice_id: { type: Schema.Types.ObjectId, ref: 'SaasInvoice' },
  transaction_type: { type: String, required: true, default: 'subscription_payment' },
  razorpay_order_id: { type: String, index: true },
  razorpay_payment_id: { type: String, sparse: true, index: true },
  razorpay_signature: { type: String },
  razorpay_refund_id: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'pending', index: true },
  payment_method: { type: String },
  payment_method_details: { type: Schema.Types.Mixed },
  error_code: { type: String },
  error_description: { type: String },
  error_source: { type: String },
  error_step: { type: String },
  error_reason: { type: String },
  refund_amount: { type: Number },
  refund_reason: { type: String },
  refund_status: { type: String },
  plan_id: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  plan_code: { type: String },
  billing_cycle: { type: String },
  attempt_count: { type: Number, default: 1 },
  notes: { type: Schema.Types.Mixed },
  receipt: { type: String },
  gateway_response: { type: Schema.Types.Mixed },
  ip_address: { type: String },
  user_agent: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PaymentTransactionSchema.index({ tenant_id: 1, created_at: -1 });
PaymentTransactionSchema.index({ razorpay_order_id: 1, razorpay_payment_id: 1 });


// ============================================================
// PAYMENT WEBHOOK LOG — Raw webhook payloads for audit
// ============================================================
export interface IPaymentWebhookLog extends Document {
  event_type: string;
  razorpay_event_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  tenant_id?: mongoose.Types.ObjectId;
  payload: Record<string, any>;
  headers?: Record<string, any>;
  signature_valid: boolean;
  processed: boolean;
  processing_error?: string;
  ip_address?: string;
  created_at: Date;
}

const PaymentWebhookLogSchema = new Schema<IPaymentWebhookLog>({
  event_type: { type: String, required: true, index: true },
  razorpay_event_id: { type: String },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_subscription_id: { type: String },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  payload: { type: Schema.Types.Mixed, required: true },
  headers: { type: Schema.Types.Mixed },
  signature_valid: { type: Boolean, default: false },
  processed: { type: Boolean, default: false },
  processing_error: { type: String },
  ip_address: { type: String },
  created_at: { type: Date, default: Date.now }
});

PaymentWebhookLogSchema.index({ created_at: -1 });


// ============================================================
// INVOICE — Generated invoices
// ============================================================
export interface ISaasInvoice extends Document {
  tenant_id: mongoose.Types.ObjectId;
  subscription_id?: mongoose.Types.ObjectId;
  payment_transaction_id?: mongoose.Types.ObjectId;
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date;
  billing_period_start?: Date;
  billing_period_end?: Date;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  items: Array<{
    description: string;
    plan_name?: string;
    billing_cycle?: string;
    quantity: number;
    unit_price: number;
    amount: number;
    discount_amount?: number;
    tax_amount?: number;
  }>;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
  billing_name?: string;
  billing_email?: string;
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  gst_number?: string;
  pan_number?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  payment_method?: string;
  paid_at?: Date;
  coupon_id?: mongoose.Types.ObjectId;
  coupon_code?: string;
  coupon_discount?: number;
  pdf_url?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const SaasInvoiceSchema = new Schema<ISaasInvoice>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  subscription_id: { type: Schema.Types.ObjectId, ref: 'TenantSubscription' },
  payment_transaction_id: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  invoice_number: { type: String, required: true, unique: true },
  invoice_date: { type: Date, required: true, default: Date.now },
  due_date: { type: Date },
  billing_period_start: { type: Date },
  billing_period_end: { type: Date },
  status: { type: String, default: 'draft' },
  items: [{
    description: { type: String, required: true },
    plan_name: { type: String },
    billing_cycle: { type: String },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, required: true },
    amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 18 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_due: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  billing_name: { type: String },
  billing_email: { type: String },
  billing_address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'India' }
  },
  gst_number: { type: String },
  pan_number: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_order_id: { type: String },
  payment_method: { type: String },
  paid_at: { type: Date },
  coupon_id: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  coupon_code: { type: String },
  coupon_discount: { type: Number },
  pdf_url: { type: String },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SaasInvoiceSchema.index({ tenant_id: 1, invoice_date: -1 });


// ============================================================
// RENEWAL LOG
// ============================================================
export interface IRenewalLog extends Document {
  tenant_id: mongoose.Types.ObjectId;
  subscription_id: mongoose.Types.ObjectId;
  renewal_type: 'auto' | 'manual' | 'retry';
  status: 'pending' | 'success' | 'failed' | 'skipped';
  attempt_number: number;
  scheduled_date: Date;
  executed_date?: Date;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount?: number;
  error_message?: string;
  next_retry_date?: Date;
  reminder_sent_at?: Date[];
  created_at: Date;
}

const RenewalLogSchema = new Schema<IRenewalLog>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  subscription_id: { type: Schema.Types.ObjectId, required: true, ref: 'TenantSubscription' },
  renewal_type: { type: String, required: true, default: 'auto' },
  status: { type: String, default: 'pending' },
  attempt_number: { type: Number, default: 1 },
  scheduled_date: { type: Date, required: true },
  executed_date: { type: Date },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  amount: { type: Number },
  error_message: { type: String },
  next_retry_date: { type: Date },
  reminder_sent_at: [{ type: Date }],
  created_at: { type: Date, default: Date.now }
});

RenewalLogSchema.index({ tenant_id: 1, scheduled_date: -1 });


// ============================================================
// COUPON
// ============================================================
export interface ICoupon extends Document {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  currency: string;
  applicable_plans?: string[];
  applicable_billing_cycles?: string[];
  min_purchase_amount?: number;
  usage_limit?: number;
  usage_count: number;
  per_tenant_limit: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String },
  discount_type: { type: String, required: true, default: 'percentage' },
  discount_value: { type: Number, required: true },
  max_discount_amount: { type: Number },
  currency: { type: String, default: 'INR' },
  applicable_plans: [{ type: String }],
  applicable_billing_cycles: [{ type: String }],
  min_purchase_amount: { type: Number, default: 0 },
  usage_limit: { type: Number },
  usage_count: { type: Number, default: 0 },
  per_tenant_limit: { type: Number, default: 1 },
  valid_from: { type: Date, required: true },
  valid_until: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

CouponSchema.index({ valid_from: 1, valid_until: 1, is_active: 1 });


// ============================================================
// COUPON USAGE
// ============================================================
export interface ICouponUsage extends Document {
  coupon_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  used_at: Date;
  order_id?: string;
  discount_applied: number;
}

const CouponUsageSchema = new Schema<ICouponUsage>({
  coupon_id: { type: Schema.Types.ObjectId, required: true, ref: 'Coupon', index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  used_at: { type: Date, default: Date.now },
  order_id: { type: String },
  discount_applied: { type: Number, default: 0 }
});

CouponUsageSchema.index({ coupon_id: 1, tenant_id: 1 });


// ============================================================
// Export Models
// ============================================================
export const SubscriptionHistory = mongoose.models.SubscriptionHistory || mongoose.model<ISubscriptionHistory>('SubscriptionHistory', SubscriptionHistorySchema);
export const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
export const PaymentWebhookLog = mongoose.models.PaymentWebhookLog || mongoose.model<IPaymentWebhookLog>('PaymentWebhookLog', PaymentWebhookLogSchema);
export const SaasInvoice = mongoose.models.SaasInvoice || mongoose.model<ISaasInvoice>('SaasInvoice', SaasInvoiceSchema);
export const RenewalLog = mongoose.models.RenewalLog || mongoose.model<IRenewalLog>('RenewalLog', RenewalLogSchema);
export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export const CouponUsage = mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);

/**
 * Initialize subscription system schema — creates indexes, called at server startup
 */
export const initializeSubscriptionSystemSchema = async () => {
  try {
    await SubscriptionHistory.createIndexes();
    await PaymentTransaction.createIndexes();
    await PaymentWebhookLog.createIndexes();
    await SaasInvoice.createIndexes();
    await RenewalLog.createIndexes();
    await Coupon.createIndexes();
    await CouponUsage.createIndexes();
    console.log("✅ Subscription system schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Subscription system schema init warning: ${message}`);
  }
};
