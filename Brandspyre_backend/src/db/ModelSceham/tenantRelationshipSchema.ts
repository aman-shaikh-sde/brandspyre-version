import mongoose, { Schema, Document } from "mongoose";

export type RelationshipType = 
  | 'parent'
  | 'child'
  | 'partner'
  | 'franchise'
  | 'vendor'
  | 'distributor'
  | 'broker'
  | 'affiliate'
  | 'custom';

export type RelationshipStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export interface ITenantRelationship extends Document {
  initiator_tenant_id: mongoose.Types.ObjectId;
  target_tenant_id: mongoose.Types.ObjectId;
  relationship_type: RelationshipType;
  custom_type_label?: string;
  status: RelationshipStatus;
  notes?: string;
  established_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TenantRelationshipSchema = new Schema<ITenantRelationship>({
  initiator_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  target_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  relationship_type: { 
    type: String, 
    required: true, 
    enum: ['parent', 'child', 'partner', 'franchise', 'vendor', 'distributor', 'broker', 'affiliate', 'custom'] 
  },
  custom_type_label: { type: String },
  status: { 
    type: String, 
    required: true, 
    default: 'pending', 
    enum: ['pending', 'active', 'suspended', 'terminated'] 
  },
  notes: { type: String },
  established_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

TenantRelationshipSchema.index({ initiator_tenant_id: 1, target_tenant_id: 1 }, { unique: true });

export const TenantRelationship = mongoose.model<ITenantRelationship>("TenantRelationship", TenantRelationshipSchema);
