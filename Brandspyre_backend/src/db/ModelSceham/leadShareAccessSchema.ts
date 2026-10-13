import mongoose, { Schema, Document } from "mongoose";

export type ShareLifecycleStatus = 
  | 'shared' 
  | 'accepted' 
  | 'assigned' 
  | 'working' 
  | 'converted' 
  | 'completed' 
  | 'rejected' 
  | 'recalled' 
  | 'expired';

export type MarketplaceSettlementStatus = 
  | 'pending'
  | 'working'
  | 'fulfilled'
  | 'billable'
  | 'settlement_created'
  | 'invoiced'
  | 'payment_pending'
  | 'paid'
  | 'settled'
  | 'refunded'
  | 'disputed';

export interface IShareAuditEntry {
  action: string;
  actor_user_id?: mongoose.Types.ObjectId;
  actor_tenant_id?: mongoose.Types.ObjectId;
  prev_value?: string;
  new_value?: string;
  notes?: string;
  ip_address?: string;
  timestamp: Date;
}

export interface ILeadShareAccess extends Document {
  lead_id: mongoose.Types.ObjectId;
  owner_tenant_id: mongoose.Types.ObjectId;   // Provider Organization
  shared_tenant_id: mongoose.Types.ObjectId;  // Consumer Organization
  rule_id?: mongoose.Types.ObjectId;
  
  // Ownership Model Taxonomy
  creator_user_id?: mongoose.Types.ObjectId;
  owner_user_id?: mongoose.Types.ObjectId;
  processor_user_id?: mongoose.Types.ObjectId; // Assigned employee in Consumer Org
  
  // Permissions & Scopes
  access_level: 'read_only' | 'read_update' | 'comment_only';
  document_permission: 'private' | 'shared' | 'read_only' | 'read_write';
  allow_internal_notes: boolean;
  allow_shared_notes: boolean;
  allow_attachments: boolean;
  allow_audit_visibility: boolean;
  
  // Sharing Policy & Life Cycle
  is_exclusive: boolean;
  share_status: ShareLifecycleStatus;
  marketplace_status: MarketplaceSettlementStatus;
  settlement_transaction_id?: mongoose.Types.ObjectId;
  rejection_reason?: string;
  recall_reason?: string;

  shared_by?: mongoose.Types.ObjectId;
  granted_at: Date;
  expires_at?: Date;
  
  activity_history: IShareAuditEntry[];
}

const LeadShareAccessSchema = new Schema<ILeadShareAccess>({
  lead_id: { type: Schema.Types.ObjectId, required: true, ref: 'Lead', index: true },
  owner_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  shared_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  rule_id: { type: Schema.Types.ObjectId, ref: 'LeadSharingRule' },

  creator_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  owner_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  processor_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },

  access_level: { 
    type: String, 
    required: true, 
    default: 'read_update',
    enum: ['read_only', 'read_update', 'comment_only'] 
  },
  document_permission: {
    type: String,
    default: 'shared',
    enum: ['private', 'shared', 'read_only', 'read_write']
  },
  allow_internal_notes: { type: Boolean, default: false },
  allow_shared_notes: { type: Boolean, default: true },
  allow_attachments: { type: Boolean, default: true },
  allow_audit_visibility: { type: Boolean, default: true },

  is_exclusive: { type: Boolean, default: false },
  share_status: { 
    type: String, 
    default: 'accepted',
    enum: ['shared', 'accepted', 'assigned', 'working', 'converted', 'completed', 'rejected', 'recalled', 'expired'],
    index: true
  },
  marketplace_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'working', 'fulfilled', 'billable', 'settlement_created', 'invoiced', 'payment_pending', 'paid', 'settled', 'refunded', 'disputed'],
    index: true
  },
  settlement_transaction_id: { type: Schema.Types.ObjectId, ref: 'B2BSettlementTransaction' },
  rejection_reason: { type: String },
  recall_reason: { type: String },

  shared_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  granted_at: { type: Date, default: Date.now },
  expires_at: { type: Date },

  activity_history: [{
    action: { type: String, required: true },
    actor_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
    actor_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    prev_value: { type: String },
    new_value: { type: String },
    notes: { type: String },
    ip_address: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
});

LeadShareAccessSchema.index({ lead_id: 1, shared_tenant_id: 1 }, { unique: true });
LeadShareAccessSchema.index({ shared_tenant_id: 1, share_status: 1 });
LeadShareAccessSchema.index({ shared_tenant_id: 1, marketplace_status: 1 });

export const LeadShareAccess = mongoose.models.LeadShareAccess || mongoose.model<ILeadShareAccess>("LeadShareAccess", LeadShareAccessSchema);
