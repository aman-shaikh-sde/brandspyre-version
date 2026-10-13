import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  campaign_code: string;
  branchcode: string;
  campaignname: string;
  campaigntype: string;
  startdate: string;
  enddate: string;
  lead?: number;
  totallead?: number;
  goallead?: number;
  conversationrate?: number;
  status: string;
  summary?: string;
  created_on?: Date;
  updated_on?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

export interface ILead extends Document {
  branchcode: string;
  campaign_code?: string;
  lead_date?: string;
  lead_name?: string;
  phone?: string;
  email?: string;
  assignee_id?: string;
  comm_type: string;
  proj_type: string;
  status: string;
  summary?: string;
  created_on?: Date;
  updated_on?: Date;
  // Meta Lead Integration fields
  meta_lead_id?: string;
  meta_source?: string;
  meta_form_id?: string;
  meta_page_id?: string;
  meta_ad_id?: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_created_at?: Date;
  meta_raw_fields?: Record<string, any>;
  custom_fields?: Record<string, any>;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

export interface IFollowup extends Document {
  branchcode: string;
  campaign_code?: string;
  lead_id?: any;
  next_date?: string;
  status: string;
  notes?: string;
  created_on?: Date;
  updated_on?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const CampaignSchema = new Schema<ICampaign>({
  campaign_code: { type: String, required: true, unique: true },
  branchcode: { type: String, required: true },
  campaignname: { type: String, required: true },
  campaigntype: { type: String, required: true },
  startdate: { type: String, required: true },
  enddate: { type: String, required: true },
  lead: { type: Number, default: 0 },
  totallead: { type: Number, default: 0 },
  goallead: { type: Number, default: 0 },
  conversationrate: { type: Number, default: 0 },
  status: { type: String, required: true },
  summary: { type: String },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound indexes for tenant isolation & query performance
CampaignSchema.index({ tenant_id: 1, campaign_code: 1 });
CampaignSchema.index({ tenant_id: 1, status: 1 });

const LeadSchema = new Schema<ILead>({
  branchcode: { type: String, required: true },
  campaign_code: { type: String },
  lead_date: { type: String },
  lead_name: { type: String },
  phone: { type: String },
  email: { type: String },
  assignee_id: { type: String },
  comm_type: { type: String, required: true },
  proj_type: { type: String, required: true },
  status: { type: String, required: true, default: 'inprogress' },
  summary: { type: String },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  // Meta Lead Integration fields
  meta_lead_id: { type: String },
  meta_source: { type: String },
  meta_form_id: { type: String },
  meta_page_id: { type: String },
  meta_ad_id: { type: String },
  meta_campaign_id: { type: String },
  meta_adset_id: { type: String },
  meta_created_at: { type: Date },
  meta_raw_fields: { type: Schema.Types.Mixed },
  custom_fields: { type: Schema.Types.Mixed },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound indexes for tenant isolation & high-volume query optimization
LeadSchema.index({ tenant_id: 1, branchcode: 1 });
LeadSchema.index({ tenant_id: 1, status: 1 });
LeadSchema.index({ tenant_id: 1, created_on: -1 });
// Strict deduplication protection for Meta Leads per tenant
LeadSchema.index({ tenant_id: 1, meta_lead_id: 1 }, { unique: true, sparse: true });

const FollowupSchema = new Schema<IFollowup>({
  branchcode: { type: String, required: true },
  campaign_code: { type: String },
  lead_id: { type: Schema.Types.Mixed },
  next_date: { type: String },
  status: { type: String, required: true, default: 'inprogress' },
  notes: { type: String },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
FollowupSchema.index({ tenant_id: 1, branchcode: 1 });

export const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export const Followup = mongoose.models.Followup || mongoose.model<IFollowup>('Followup', FollowupSchema);

export const campaginInfo = async () => {
  const msgInfo = `Campaign -> Campaign Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export const leadsInfo = async () => {
  const msgInfo = `Campaign -> Leads Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export const leadsFollowupInfo = async () => {
  const msgInfo = `Campaign -> Leads Followup Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};