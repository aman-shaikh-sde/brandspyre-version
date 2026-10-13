import mongoose, { Schema, Document } from "mongoose";

export type ReferralSourceType = 'PLATFORM' | 'ORGANIZATION';

export type ReferralQuality = 'HOT' | 'WARM' | 'COLD';

export type ReferralType = 
  | 'BUSINESS_OPPORTUNITY' 
  | 'SALES_LEAD' 
  | 'PARTNERSHIP' 
  | 'SERVICE_REQUEST' 
  | 'PROJECT_OPPORTUNITY' 
  | 'RESELLER_OPPORTUNITY';

export type CommissionType = 
  | 'FIXED' 
  | 'PERCENTAGE' 
  | 'PER_QUALIFIED' 
  | 'PAY_ON_CONVERSION' 
  | 'REV_SHARE';

export type ReferralVisibility = 
  | 'ALL_VERIFIED_ORGANIZATIONS' 
  | 'SELECTED_ORGANIZATIONS' 
  | 'INDUSTRY_MATCH' 
  | 'LOCATION_MATCH' 
  | 'PARTNER_NETWORK' 
  | 'INVITE_ONLY';

export type ContactUnlockPolicy = 
  | 'IMMEDIATE' 
  | 'AFTER_APPROVAL' 
  | 'AFTER_ACCEPTANCE' 
  | 'AFTER_PAYMENT' 
  | 'MANUAL';

export type ReferralStatus = 
  | 'DRAFT' 
  | 'PUBLISHED' 
  | 'REQUESTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'ASSIGNED' 
  | 'CONTACTED' 
  | 'QUALIFIED' 
  | 'NEGOTIATION' 
  | 'CONVERTED' 
  | 'SETTLED' 
  | 'CLOSED' 
  | 'EXPIRED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'LOST';

export interface IContactInfo {
  name?: string;
  phone?: string;
  email?: string;
  company_name?: string;
  notes?: string;
}

export interface IReferral extends Document {
  referral_code: string;
  lead_id?: mongoose.Types.ObjectId;
  source_type: ReferralSourceType;
  source_tenant_id?: mongoose.Types.ObjectId;
  created_by_user_id: mongoose.Types.ObjectId;
  
  title: string;
  description: string;
  industry: string;
  location: string;
  service_categories: string[];
  
  estimated_deal_value: number;
  currency: string;
  
  lead_quality: ReferralQuality;
  referral_type: ReferralType;
  
  referral_fee: number;
  commission_type: CommissionType;
  commission_value: number;
  
  visibility: ReferralVisibility;
  eligible_tenant_ids?: mongoose.Types.ObjectId[];
  
  requires_approval: boolean;
  max_participants: number;
  
  status: ReferralStatus;
  contact_unlock_policy: ContactUnlockPolicy;
  
  // Sensitive Contact Info (Sanitized on Server Response unless Authorized)
  contact_info: IContactInfo;
  
  expires_at?: Date;
  published_at?: Date;
  closed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ReferralSchema = new Schema<IReferral>({
  referral_code: { type: String, required: true, unique: true, index: true },
  lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  source_type: { type: String, required: true, enum: ['PLATFORM', 'ORGANIZATION'], default: 'ORGANIZATION', index: true },
  source_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  created_by_user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  industry: { type: String, required: true, index: true },
  location: { type: String, required: true, index: true },
  service_categories: [{ type: String }],
  
  estimated_deal_value: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  
  lead_quality: { type: String, default: 'HOT', enum: ['HOT', 'WARM', 'COLD'] },
  referral_type: { 
    type: String, 
    default: 'BUSINESS_OPPORTUNITY', 
    enum: ['BUSINESS_OPPORTUNITY', 'SALES_LEAD', 'PARTNERSHIP', 'SERVICE_REQUEST', 'PROJECT_OPPORTUNITY', 'RESELLER_OPPORTUNITY'] 
  },
  
  referral_fee: { type: Number, default: 0 },
  commission_type: { 
    type: String, 
    default: 'FIXED', 
    enum: ['FIXED', 'PERCENTAGE', 'PER_QUALIFIED', 'PAY_ON_CONVERSION', 'REV_SHARE'] 
  },
  commission_value: { type: Number, default: 0 },
  
  visibility: { 
    type: String, 
    default: 'ALL_VERIFIED_ORGANIZATIONS', 
    enum: ['ALL_VERIFIED_ORGANIZATIONS', 'SELECTED_ORGANIZATIONS', 'INDUSTRY_MATCH', 'LOCATION_MATCH', 'PARTNER_NETWORK', 'INVITE_ONLY'],
    index: true 
  },
  eligible_tenant_ids: [{ type: Schema.Types.ObjectId, ref: 'Tenant' }],
  
  requires_approval: { type: Boolean, default: true },
  max_participants: { type: Number, default: 1 },
  
  status: { 
    type: String, 
    default: 'PUBLISHED', 
    enum: ['DRAFT', 'PUBLISHED', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'SETTLED', 'CLOSED', 'EXPIRED', 'REJECTED', 'CANCELLED', 'LOST'],
    index: true 
  },
  contact_unlock_policy: { 
    type: String, 
    default: 'AFTER_APPROVAL', 
    enum: ['IMMEDIATE', 'AFTER_APPROVAL', 'AFTER_ACCEPTANCE', 'AFTER_PAYMENT', 'MANUAL'] 
  },
  
  contact_info: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    company_name: { type: String },
    notes: { type: String }
  },
  
  expires_at: { type: Date, index: true },
  published_at: { type: Date, default: Date.now },
  closed_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ReferralSchema.index({ source_tenant_id: 1, status: 1 });
ReferralSchema.index({ visibility: 1, status: 1 });

// ============================================================
// REFERRAL REQUEST SCHEMA
// ============================================================
export type ReferralRequestStatus = 
  | 'REQUESTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export interface IReferralRequest extends Document {
  referral_id: mongoose.Types.ObjectId;
  requesting_tenant_id: mongoose.Types.ObjectId;
  requesting_user_id: mongoose.Types.ObjectId;
  
  status: ReferralRequestStatus;
  message?: string;
  proposed_terms?: string;
  rejection_reason?: string;
  
  requested_at: Date;
  approved_at?: Date;
  rejected_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ReferralRequestSchema = new Schema<IReferralRequest>({
  referral_id: { type: Schema.Types.ObjectId, required: true, ref: 'Referral', index: true },
  requesting_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  requesting_user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  
  status: { 
    type: String, 
    default: 'REQUESTED', 
    enum: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
    index: true 
  },
  message: { type: String },
  proposed_terms: { type: String },
  rejection_reason: { type: String },
  
  requested_at: { type: Date, default: Date.now },
  approved_at: { type: Date },
  rejected_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ReferralRequestSchema.index({ referral_id: 1, requesting_tenant_id: 1 }, { unique: true });

// ============================================================
// REFERRAL PARTICIPANT SCHEMA (Access & Processor Assignment)
// ============================================================
export interface IReferralParticipant extends Document {
  referral_id: mongoose.Types.ObjectId;
  owner_tenant_id?: mongoose.Types.ObjectId;
  receiver_tenant_id: mongoose.Types.ObjectId;
  
  owner_user_id?: mongoose.Types.ObjectId;
  processor_user_id?: mongoose.Types.ObjectId;
  
  access_level: 'READ' | 'MANAGE' | 'FULL';
  contact_access: boolean;
  document_access: boolean;
  
  status: 'ACTIVE' | 'REVOKED' | 'COMPLETED';
  accepted_at: Date;
  completed_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

const ReferralParticipantSchema = new Schema<IReferralParticipant>({
  referral_id: { type: Schema.Types.ObjectId, required: true, ref: 'Referral', index: true },
  owner_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  
  owner_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  processor_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  
  access_level: { type: String, default: 'MANAGE', enum: ['READ', 'MANAGE', 'FULL'] },
  contact_access: { type: Boolean, default: true },
  document_access: { type: Boolean, default: true },
  
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'REVOKED', 'COMPLETED'] },
  accepted_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ReferralParticipantSchema.index({ referral_id: 1, receiver_tenant_id: 1 }, { unique: true });

// ============================================================
// REFERRAL ACTIVITY / AUDIT LOG SCHEMA
// ============================================================
export interface IReferralActivity extends Document {
  referral_id: mongoose.Types.ObjectId;
  action: string;
  actor_user_id?: mongoose.Types.ObjectId;
  actor_tenant_id?: mongoose.Types.ObjectId;
  actor_name?: string;
  prev_status?: string;
  new_status?: string;
  details?: string;
  created_at: Date;
}

const ReferralActivitySchema = new Schema<IReferralActivity>({
  referral_id: { type: Schema.Types.ObjectId, required: true, ref: 'Referral', index: true },
  action: { type: String, required: true },
  actor_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  actor_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  actor_name: { type: String },
  prev_status: { type: String },
  new_status: { type: String },
  details: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Referral = mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
export const ReferralRequest = mongoose.models.ReferralRequest || mongoose.model<IReferralRequest>("ReferralRequest", ReferralRequestSchema);
export const ReferralParticipant = mongoose.models.ReferralParticipant || mongoose.model<IReferralParticipant>("ReferralParticipant", ReferralParticipantSchema);
export const ReferralActivity = mongoose.models.ReferralActivity || mongoose.model<IReferralActivity>("ReferralActivity", ReferralActivitySchema);
