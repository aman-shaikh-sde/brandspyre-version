import mongoose, { Schema, Document } from "mongoose";

export type BillingModel = 'per_lead' | 'per_qualified' | 'per_sale' | 'rev_share' | 'monthly_retainer' | 'hybrid';
export type SettlementCycle = 'immediate' | 'daily' | 'weekly' | 'monthly' | 'manual';

export interface IB2BSettlementAgreement extends Document {
  agreement_code: string;
  provider_tenant_id: mongoose.Types.ObjectId; // Organization providing leads
  receiver_tenant_id: mongoose.Types.ObjectId; // Organization receiving/converting leads
  relationship_id?: mongoose.Types.ObjectId;
  billing_model: BillingModel;
  settlement_cycle: SettlementCycle;
  requires_approval: boolean;
  rate: number;
  rev_share_percentage?: number;
  monthly_retainer_amount?: number;
  
  // Contractual Success Criteria
  success_stages: string[]; // e.g. ["Fulfilled", "Completed", "Won"]
  success_criteria?: {
    type: 'STATUS' | 'CUSTOM';
    successful_stages: string[];
  };

  commission_rate_override?: number; // Optional custom platform commission override
  cgst_pct: number;
  sgst_pct: number;
  currency: string;
  status: 'draft' | 'active' | 'suspended' | 'terminated';
  created_at: Date;
  updated_at: Date;
}

const B2BSettlementAgreementSchema = new Schema<IB2BSettlementAgreement>({
  agreement_code: { type: String, required: true, unique: true },
  provider_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  relationship_id: { type: Schema.Types.ObjectId, ref: 'TenantRelationship' },
  billing_model: { 
    type: String, 
    required: true, 
    default: 'per_lead',
    enum: ['per_lead', 'per_qualified', 'per_sale', 'rev_share', 'monthly_retainer', 'hybrid'] 
  },
  settlement_cycle: {
    type: String,
    default: 'immediate',
    enum: ['immediate', 'daily', 'weekly', 'monthly', 'manual']
  },
  requires_approval: { type: Boolean, default: false },
  rate: { type: Number, required: true, default: 0 },
  rev_share_percentage: { type: Number, default: 0 },
  monthly_retainer_amount: { type: Number, default: 0 },
  success_stages: [{ type: String }],
  success_criteria: {
    type: { type: String, default: 'STATUS', enum: ['STATUS', 'CUSTOM'] },
    successful_stages: [{ type: String }]
  },
  commission_rate_override: { type: Number },
  cgst_pct: { type: Number, default: 9 },
  sgst_pct: { type: Number, default: 9 },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'active', enum: ['draft', 'active', 'suspended', 'terminated'] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

B2BSettlementAgreementSchema.index({ provider_tenant_id: 1, receiver_tenant_id: 1, status: 1 });

export interface IB2BSettlementTransaction extends Document {
  transaction_code: string;
  agreement_id: mongoose.Types.ObjectId;
  provider_tenant_id: mongoose.Types.ObjectId; // Seller (Lead Provider)
  receiver_tenant_id: mongoose.Types.ObjectId; // Buyer (Lead Consumer / Payer)
  lead_id: mongoose.Types.ObjectId;
  idempotency_key: string; // sha256(agreement_id + provider + receiver + lead + stage)
  stage_reached: string;
  billable_event_type: string;
  
  // Financial breakdown
  base_amount: number;
  tax_amount: number;
  total_amount: number; // Gross amount payable by Receiver
  platform_commission: number; // Brandspyre marketplace fee
  platform_commission_tax: number; // GST on Brandspyre fee
  receiver_net_amount: number; // Net payout entitled to Provider (Gross - Commission - Tax)
  allocated_amount: number; // Partial payment allocated so far
  remaining_amount: number; // Remaining balance to be paid
  allocations?: {
    payment_id: mongoose.Types.ObjectId;
    allocated_amount: number;
    allocation_date: Date;
  }[];
  
  currency: string;
  is_approved: boolean;
  status: 'unbilled' | 'invoiced' | 'payment_pending' | 'paid' | 'settled' | 'disputed' | 'cancelled';
  invoice_id?: mongoose.Types.ObjectId;
  payment_id?: mongoose.Types.ObjectId;
  commission_id?: mongoose.Types.ObjectId;
  dispute_reason?: string;
  created_at: Date;
  updated_at: Date;
}

const B2BSettlementTransactionSchema = new Schema<IB2BSettlementTransaction>({
  transaction_code: { type: String, required: true, unique: true },
  agreement_id: { type: Schema.Types.ObjectId, required: true, ref: 'B2BSettlementAgreement', index: true },
  provider_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  lead_id: { type: Schema.Types.ObjectId, required: true, ref: 'Lead', index: true },
  idempotency_key: { type: String, required: true, unique: true },
  stage_reached: { type: String, required: true },
  billable_event_type: { type: String, default: 'LEAD_FULFILLMENT' },
  
  base_amount: { type: Number, required: true, default: 0 },
  tax_amount: { type: Number, required: true, default: 0 },
  total_amount: { type: Number, required: true, default: 0 },
  platform_commission: { type: Number, required: true, default: 0 },
  platform_commission_tax: { type: Number, required: true, default: 0 },
  receiver_net_amount: { type: Number, required: true, default: 0 },
  allocated_amount: { type: Number, required: true, default: 0 },
  remaining_amount: { type: Number, required: true, default: 0 },
  allocations: [{
    payment_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPayment' },
    allocated_amount: { type: Number, required: true },
    allocation_date: { type: Date, default: Date.now }
  }],
  
  currency: { type: String, default: 'INR' },
  is_approved: { type: Boolean, default: true },
  status: { 
    type: String, 
    default: 'unbilled', 
    enum: ['unbilled', 'invoiced', 'payment_pending', 'paid', 'settled', 'disputed', 'cancelled'],
    index: true
  },
  invoice_id: { type: Schema.Types.ObjectId, ref: 'B2BSettlementInvoice', index: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPayment' },
  commission_id: { type: Schema.Types.ObjectId, ref: 'PlatformCommission' },
  dispute_reason: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

B2BSettlementTransactionSchema.index({ provider_tenant_id: 1, status: 1 });
B2BSettlementTransactionSchema.index({ receiver_tenant_id: 1, status: 1 });
B2BSettlementTransactionSchema.index({ lead_id: 1, agreement_id: 1 });

export interface IB2BSettlementInvoice extends Document {
  invoice_number: string;
  provider_tenant_id: mongoose.Types.ObjectId; // Seller / Billing entity (Entitled to payout)
  receiver_tenant_id: mongoose.Types.ObjectId; // Buyer / Dues entity (Payer)
  transaction_ids: mongoose.Types.ObjectId[];
  
  subtotal: number;
  tax_amount: number;
  total_amount: number; // Total gross payable
  platform_fee_total: number; // Brandspyre commission total
  platform_tax_total: number; // GST on Brandspyre commission
  receiver_amount_total: number; // Net payout to Provider
  paid_amount: number;
  balance_due: number;
  currency: string;
  payment_type: string;
  payment_request_id?: mongoose.Types.ObjectId;
  
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  due_date?: Date;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const B2BSettlementInvoiceSchema = new Schema<IB2BSettlementInvoice>({
  invoice_number: { type: String, required: true, unique: true },
  provider_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  transaction_ids: [{ type: Schema.Types.ObjectId, ref: 'B2BSettlementTransaction' }],
  subtotal: { type: Number, required: true, default: 0 },
  tax_amount: { type: Number, required: true, default: 0 },
  total_amount: { type: Number, required: true, default: 0 },
  platform_fee_total: { type: Number, default: 0 },
  platform_tax_total: { type: Number, default: 0 },
  receiver_amount_total: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_due: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  payment_type: { type: String, default: 'LEAD_MARKETPLACE_SETTLEMENT' },
  payment_request_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPaymentRequest' },
  status: { 
    type: String, 
    default: 'issued', 
    enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'disputed'],
    index: true
  },
  due_date: { type: Date },
  razorpay_order_id: { type: String, index: true },
  razorpay_payment_id: { type: String, index: true },
  paid_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

B2BSettlementInvoiceSchema.index({ provider_tenant_id: 1, status: 1 });
B2BSettlementInvoiceSchema.index({ receiver_tenant_id: 1, status: 1 });

export const B2BSettlementAgreement = mongoose.models.B2BSettlementAgreement || mongoose.model<IB2BSettlementAgreement>("B2BSettlementAgreement", B2BSettlementAgreementSchema);
export const B2BSettlementTransaction = mongoose.models.B2BSettlementTransaction || mongoose.model<IB2BSettlementTransaction>("B2BSettlementTransaction", B2BSettlementTransactionSchema);
export const B2BSettlementInvoice = mongoose.models.B2BSettlementInvoice || mongoose.model<IB2BSettlementInvoice>("B2BSettlementInvoice", B2BSettlementInvoiceSchema);
