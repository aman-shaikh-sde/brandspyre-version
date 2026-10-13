import mongoose, { Schema, Document } from "mongoose";

export type AccessLevel = 'read_only' | 'read_update' | 'comment_only';

export interface ILeadSharingRule extends Document {
  relationship_id?: mongoose.Types.ObjectId;
  source_tenant_id: mongoose.Types.ObjectId;
  target_tenant_id: mongoose.Types.ObjectId;
  rule_name: string;
  is_active: boolean;
  lead_source_filter?: string; // e.g. "meta", "website", "all"
  lead_campaign_filter?: string;
  access_level: AccessLevel;
  allow_internal_notes: boolean;
  allow_attachments: boolean;
  allow_audit_visibility: boolean;
  created_at: Date;
  updated_at: Date;
}

const LeadSharingRuleSchema = new Schema<ILeadSharingRule>({
  relationship_id: { type: Schema.Types.ObjectId, ref: 'TenantRelationship' },
  source_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  target_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  rule_name: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  lead_source_filter: { type: String, default: 'all' },
  lead_campaign_filter: { type: String },
  access_level: { 
    type: String, 
    required: true, 
    default: 'read_update',
    enum: ['read_only', 'read_update', 'comment_only'] 
  },
  allow_internal_notes: { type: Boolean, default: true },
  allow_attachments: { type: Boolean, default: true },
  allow_audit_visibility: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

LeadSharingRuleSchema.index({ source_tenant_id: 1, target_tenant_id: 1 });

export const LeadSharingRule = mongoose.model<ILeadSharingRule>("LeadSharingRule", LeadSharingRuleSchema);
