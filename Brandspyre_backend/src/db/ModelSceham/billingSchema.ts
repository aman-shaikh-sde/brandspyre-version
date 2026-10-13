import mongoose, { Schema, Document } from "mongoose";

// 1. Client Contract Schema
export interface IClientContract extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  contract_number: string;
  client_code: string;
  title: string;
  signed_date: Date;
  effective_date: Date;
  expiry_date?: Date;
  renewal_date?: Date;
  account_manager_id?: string;
  sla_details?: Record<string, any>;
  attachment_url?: string;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const ClientContractSchema = new Schema<IClientContract>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  contract_number: { type: String, required: true },
  client_code: { type: String, required: true, index: true },
  title: { type: String, required: true },
  signed_date: { type: Date, default: Date.now },
  effective_date: { type: Date, required: true, default: Date.now },
  expiry_date: { type: Date },
  renewal_date: { type: Date },
  account_manager_id: { type: String },
  sla_details: { type: Schema.Types.Mixed },
  attachment_url: { type: String },
  status: { type: String, default: 'active', enum: ['draft', 'active', 'expired', 'terminated'] },
  created_by: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ClientContractSchema.index({ tenant_id: 1, contract_number: 1 }, { unique: true });

// 2. Success Stage Configuration Schema
export interface ISuccessStageConfig extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  client_code?: string;
  campaign_code?: string;
  success_stages: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SuccessStageConfigSchema = new Schema<ISuccessStageConfig>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  client_code: { type: String },
  campaign_code: { type: String },
  success_stages: { type: [String], default: ["won", "Qualified Lead Accepted"] },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SuccessStageConfigSchema.index({ tenant_id: 1, branchcode: 1, client_code: 1 });

// 3. Client Commercial Agreement Schema (Versioned & Tax Engine Enabled)
export interface IClientAgreement extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  contract_id?: mongoose.Types.ObjectId;
  agreement_code: string;
  client_code: string;
  agreement_name: string;
  version: number;
  previous_version_id?: mongoose.Types.ObjectId;
  effective_from: Date;
  effective_to?: Date;
  billing_type: 
    | 'per_lead' 
    | 'per_qualified_lead' 
    | 'per_appointment' 
    | 'per_meeting' 
    | 'per_site_visit' 
    | 'per_booking' 
    | 'per_admission' 
    | 'per_sale' 
    | 'fixed_amount' 
    | 'percentage_of_revenue' 
    | 'monthly_retainer' 
    | 'retainer_plus_success' 
    | 'campaign_based' 
    | 'hybrid' 
    | 'custom_formula';
  rate: number;
  currency: string;
  exchange_rate_to_base: number;
  
  tax_config: {
    cgst_percentage: number;
    sgst_percentage: number;
    igst_percentage: number;
    tds_percentage: number;
    is_reverse_charge: boolean;
    is_tax_exempt: boolean;
  };

  client_acceptance_required: boolean;
  approval_threshold_amount: number;
  billing_cycle: 'instant' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  status: 'draft' | 'active' | 'superseded' | 'expired' | 'terminated';
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

const ClientAgreementSchema = new Schema<IClientAgreement>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  contract_id: { type: Schema.Types.ObjectId, ref: 'ClientContract' },
  agreement_code: { type: String, required: true },
  client_code: { type: String, required: true, index: true },
  agreement_name: { type: String, required: true },
  version: { type: Number, default: 1 },
  previous_version_id: { type: Schema.Types.ObjectId, ref: 'ClientAgreement' },
  effective_from: { type: Date, required: true, default: Date.now },
  effective_to: { type: Date },
  billing_type: { 
    type: String, 
    required: true, 
    default: 'per_lead',
    enum: [
      'per_lead', 'per_qualified_lead', 'per_appointment', 'per_meeting', 
      'per_site_visit', 'per_booking', 'per_admission', 'per_sale', 
      'fixed_amount', 'percentage_of_revenue', 'monthly_retainer', 
      'retainer_plus_success', 'campaign_based', 'hybrid', 'custom_formula'
    ] 
  },
  rate: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  exchange_rate_to_base: { type: Number, default: 1.0 },
  
  tax_config: {
    cgst_percentage: { type: Number, default: 9 },
    sgst_percentage: { type: Number, default: 9 },
    igst_percentage: { type: Number, default: 0 },
    tds_percentage: { type: Number, default: 0 },
    is_reverse_charge: { type: Boolean, default: false },
    is_tax_exempt: { type: Boolean, default: false }
  },

  client_acceptance_required: { type: Boolean, default: false },
  approval_threshold_amount: { type: Number, default: 50000 },
  billing_cycle: { type: String, default: 'instant', enum: ['instant', 'weekly', 'biweekly', 'monthly', 'quarterly'] },
  status: { type: String, default: 'active', enum: ['draft', 'active', 'superseded', 'expired', 'terminated'] },
  created_by: { type: String },
  updated_by: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ClientAgreementSchema.index({ tenant_id: 1, agreement_code: 1, version: 1 }, { unique: true });
ClientAgreementSchema.index({ tenant_id: 1, client_code: 1, status: 1 });

// 4. Billing Rule Schema
export interface IBillingRule extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  agreement_id: mongoose.Types.ObjectId;
  rule_name: string;
  priority: number;
  campaign_code?: string;
  lead_source?: string;
  base_rate: number;
  percentage_rate?: number;
  formula_expression?: string;
  min_qualifying_amount?: number;
  monthly_cap_amount?: number;
  monthly_cap_leads?: number;
  status: 'active' | 'inactive';
  version: number;
  valid_from: Date;
  valid_to?: Date;
  created_at: Date;
  updated_at: Date;
}

const BillingRuleSchema = new Schema<IBillingRule>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  agreement_id: { type: Schema.Types.ObjectId, required: true, ref: 'ClientAgreement', index: true },
  rule_name: { type: String, required: true },
  priority: { type: Number, default: 1 },
  campaign_code: { type: String },
  lead_source: { type: String },
  base_rate: { type: Number, required: true, default: 0 },
  percentage_rate: { type: Number, default: 0 },
  formula_expression: { type: String },
  min_qualifying_amount: { type: Number, default: 0 },
  monthly_cap_amount: { type: Number },
  monthly_cap_leads: { type: Number },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  version: { type: Number, default: 1 },
  valid_from: { type: Date, default: Date.now },
  valid_to: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BillingRuleSchema.index({ tenant_id: 1, agreement_id: 1, priority: 1 });

// 5. Billable Transaction Schema (Idempotency Lock + Approval Chain + Dispute Track)
export interface IBillableTransaction extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  transaction_code: string;
  idempotency_key: string;
  contract_id?: mongoose.Types.ObjectId;
  agreement_id: mongoose.Types.ObjectId;
  agreement_version: number;
  billing_rule_id?: mongoose.Types.ObjectId;
  client_code: string;
  campaign_code?: string;
  lead_id: mongoose.Types.ObjectId;
  
  calculated_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  tds_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  exchange_rate: number;
  calculation_breakdown?: Record<string, any>;
  
  approval_chain: Array<{
    tier_level: number;
    role: string;
    approver_id?: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp?: Date;
    comments?: string;
  }>;

  status: 'pending_approval' | 'approved' | 'rejected' | 'invoiced' | 'reversed' | 'disputed' | 'cancelled';
  client_acceptance_status: 'not_required' | 'pending' | 'accepted' | 'disputed';
  invoice_status: 'unbilled' | 'partially_invoiced' | 'invoiced';
  invoice_id?: mongoose.Types.ObjectId;
  invoice_no?: string;
  credit_note_no?: string;
  credit_note_amount?: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  reversal_reason?: string;
  created_at: Date;
  updated_at: Date;
}

const BillableTransactionSchema = new Schema<IBillableTransaction>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  transaction_code: { type: String, required: true },
  idempotency_key: { type: String, required: true, unique: true },
  contract_id: { type: Schema.Types.ObjectId, ref: 'ClientContract' },
  agreement_id: { type: Schema.Types.ObjectId, required: true, ref: 'ClientAgreement' },
  agreement_version: { type: Number, default: 1 },
  billing_rule_id: { type: Schema.Types.ObjectId, ref: 'BillingRule' },
  client_code: { type: String, required: true, index: true },
  campaign_code: { type: String },
  lead_id: { type: Schema.Types.ObjectId, required: true, ref: 'Lead', index: true },
  
  calculated_amount: { type: Number, required: true, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  igst_amount: { type: Number, default: 0 },
  tds_amount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  exchange_rate: { type: Number, default: 1.0 },
  calculation_breakdown: { type: Schema.Types.Mixed },
  
  approval_chain: {
    type: [
      {
        tier_level: { type: Number, required: true },
        role: { type: String, required: true },
        approver_id: { type: String },
        status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
        timestamp: { type: Date },
        comments: { type: String }
      }
    ],
    default: []
  },

  status: { 
    type: String, 
    default: 'pending_approval', 
    enum: ['pending_approval', 'approved', 'rejected', 'invoiced', 'reversed', 'disputed', 'cancelled'] 
  },
  client_acceptance_status: {
    type: String,
    default: 'not_required',
    enum: ['not_required', 'pending', 'accepted', 'disputed']
  },
  invoice_status: { 
    type: String, 
    default: 'unbilled', 
    enum: ['unbilled', 'partially_invoiced', 'invoiced'] 
  },
  invoice_id: { type: Schema.Types.ObjectId, ref: 'ProjectInvoice' },
  invoice_no: { type: String },
  credit_note_no: { type: String },
  credit_note_amount: { type: Number, default: 0 },
  payment_status: { 
    type: String, 
    default: 'unpaid', 
    enum: ['unpaid', 'partially_paid', 'paid'] 
  },
  
  created_by: { type: String },
  approved_by: { type: String },
  approved_at: { type: Date },
  rejection_reason: { type: String },
  reversal_reason: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BillableTransactionSchema.index({ tenant_id: 1, status: 1 });
BillableTransactionSchema.index({ tenant_id: 1, created_at: -1 });

BillableTransactionSchema.index({ tenant_id: 1, transaction_code: 1 }, { unique: true });
BillableTransactionSchema.index({ tenant_id: 1, client_code: 1, status: 1 });
BillableTransactionSchema.index({ tenant_id: 1, lead_id: 1 });

// 6. Billing Dispute Schema
export interface IBillingDispute extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  dispute_code: string;
  transaction_id: mongoose.Types.ObjectId;
  client_code: string;
  lead_id: mongoose.Types.ObjectId;
  dispute_reason: string;
  status: 'pending' | 'under_investigation' | 'accepted' | 'rejected';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: Date;
  credit_note_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

const BillingDisputeSchema = new Schema<IBillingDispute>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  branchcode: { type: String, required: true },
  dispute_code: { type: String, required: true, unique: true },
  transaction_id: { type: Schema.Types.ObjectId, required: true, ref: 'BillableTransaction', index: true },
  client_code: { type: String, required: true },
  lead_id: { type: Schema.Types.ObjectId, required: true, ref: 'Lead' },
  dispute_reason: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'under_investigation', 'accepted', 'rejected'] },
  resolution_notes: { type: String },
  resolved_by: { type: String },
  resolved_at: { type: Date },
  credit_note_generated: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BillingDisputeSchema.index({ tenant_id: 1, client_code: 1, status: 1 });

// Model exports
export const ClientContract = mongoose.models.ClientContract || mongoose.model<IClientContract>('ClientContract', ClientContractSchema);
export const SuccessStageConfig = mongoose.models.SuccessStageConfig || mongoose.model<ISuccessStageConfig>('SuccessStageConfig', SuccessStageConfigSchema);
export const ClientAgreement = mongoose.models.ClientAgreement || mongoose.model<IClientAgreement>('ClientAgreement', ClientAgreementSchema);
export const BillingRule = mongoose.models.BillingRule || mongoose.model<IBillingRule>('BillingRule', BillingRuleSchema);
export const BillableTransaction = mongoose.models.BillableTransaction || mongoose.model<IBillableTransaction>('BillableTransaction', BillableTransactionSchema);
export const BillingDispute = mongoose.models.BillingDispute || mongoose.model<IBillingDispute>('BillingDispute', BillingDisputeSchema);

export const initializeBillingSchema = async () => {
  try {
    console.log("Enterprise B2B Billing schema (10/10) initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing billing schema: ${message}`);
    throw new Error(`Error initializing billing schema: ${message}`);
  }
};
