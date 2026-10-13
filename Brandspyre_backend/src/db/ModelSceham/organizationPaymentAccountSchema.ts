import mongoose, { Schema, Document } from "mongoose";

export type PaymentAccountStatus = 
  | 'NOT_CONFIGURED'
  | 'ONBOARDING'
  | 'PENDING'
  | 'PENDING_KYC'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'DISCONNECTED';

export interface IRazorpayAccountDetails {
  account_id?: string;
  status: PaymentAccountStatus;
  kyc_status?: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  capabilities?: {
    route?: boolean;
    payouts?: boolean;
    transfers?: boolean;
  };
  activated_at?: Date;
  onboarding_url?: string;
  metadata?: Record<string, any>;
}

export interface IStripeAccountDetails {
  account_id?: string;
  status: PaymentAccountStatus;
  onboarding_status?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted?: boolean;
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
    disabled_reason?: string;
  };
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
  activated_at?: Date;
  onboarding_url?: string;
  metadata?: Record<string, any>;
}

export interface IOrganizationPaymentAccount extends Document {
  tenant_id: mongoose.Types.ObjectId;
  default_provider: 'razorpay' | 'stripe';
  provider: 'razorpay' | 'stripe'; // legacy/current active provider
  provider_account_id?: string; // legacy e.g. acc_xxxx
  account_status: PaymentAccountStatus; // overall/default provider status
  onboarding_status: string;
  kyc_status: string;
  business_name: string;
  business_type: 'individual' | 'partnership' | 'proprietorship' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'other';
  legal_name?: string;
  email: string;
  phone?: string;
  country: string;
  currency: string;
  bank_account_status: 'unverified' | 'pending' | 'verified' | 'failed';
  bank_details?: {
    bank_name?: string;
    account_number_masked?: string;
    ifsc_code?: string;
    beneficiary_name?: string;
  };
  gstin?: string;
  pan?: string;
  capabilities?: {
    route?: boolean;
    payouts?: boolean;
    transfers?: boolean;
  };
  payments_enabled: boolean;
  payouts_enabled: boolean;
  activated_at?: Date;
  onboarding_url?: string;
  
  // Multi-provider details
  razorpay?: IRazorpayAccountDetails;
  stripe?: IStripeAccountDetails;

  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const OrganizationPaymentAccountSchema = new Schema<IOrganizationPaymentAccount>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', unique: true, index: true },
  default_provider: { type: String, default: 'razorpay', enum: ['razorpay', 'stripe'] },
  provider: { type: String, required: true, default: 'razorpay', enum: ['razorpay', 'stripe'] },
  provider_account_id: { type: String, index: true },
  account_status: { 
    type: String, 
    required: true, 
    default: 'NOT_CONFIGURED',
    enum: [
      'NOT_CONFIGURED',
      'ONBOARDING',
      'PENDING',
      'PENDING_KYC',
      'PENDING_VERIFICATION',
      'ACTIVE',
      'RESTRICTED',
      'SUSPENDED',
      'REJECTED',
      'DISCONNECTED'
    ],
    index: true 
  },
  onboarding_status: { type: String, default: 'initiated' },
  kyc_status: { type: String, default: 'pending' },
  business_name: { type: String, required: true },
  business_type: { 
    type: String, 
    required: true, 
    default: 'private_limited',
    enum: ['individual', 'partnership', 'proprietorship', 'private_limited', 'public_limited', 'llp', 'trust', 'society', 'other'] 
  },
  legal_name: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  country: { type: String, default: 'IN' },
  currency: { type: String, default: 'INR' },
  bank_account_status: { 
    type: String, 
    default: 'unverified', 
    enum: ['unverified', 'pending', 'verified', 'failed'] 
  },
  bank_details: {
    bank_name: { type: String },
    account_number_masked: { type: String },
    ifsc_code: { type: String },
    beneficiary_name: { type: String }
  },
  gstin: { type: String },
  pan: { type: String },
  capabilities: {
    route: { type: Boolean, default: false },
    payouts: { type: Boolean, default: false },
    transfers: { type: Boolean, default: false }
  },
  payments_enabled: { type: Boolean, default: false },
  payouts_enabled: { type: Boolean, default: false },
  activated_at: { type: Date },
  onboarding_url: { type: String },
  
  razorpay: {
    account_id: { type: String, index: true },
    status: { type: String, default: 'NOT_CONFIGURED' },
    kyc_status: { type: String, default: 'pending' },
    payments_enabled: { type: Boolean, default: false },
    payouts_enabled: { type: Boolean, default: false },
    capabilities: {
      route: { type: Boolean, default: false },
      payouts: { type: Boolean, default: false },
      transfers: { type: Boolean, default: false }
    },
    activated_at: { type: Date },
    onboarding_url: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },

  stripe: {
    account_id: { type: String, index: true },
    status: { type: String, default: 'NOT_CONFIGURED' },
    onboarding_status: { type: String, default: 'pending' },
    charges_enabled: { type: Boolean, default: false },
    payouts_enabled: { type: Boolean, default: false },
    details_submitted: { type: Boolean, default: false },
    requirements: {
      currently_due: [{ type: String }],
      eventually_due: [{ type: String }],
      past_due: [{ type: String }],
      disabled_reason: { type: String }
    },
    capabilities: {
      card_payments: { type: String },
      transfers: { type: String }
    },
    activated_at: { type: Date },
    onboarding_url: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },

  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

OrganizationPaymentAccountSchema.index({ tenant_id: 1, account_status: 1 });

export const OrganizationPaymentAccount = mongoose.models.OrganizationPaymentAccount || 
  mongoose.model<IOrganizationPaymentAccount>('OrganizationPaymentAccount', OrganizationPaymentAccountSchema);

