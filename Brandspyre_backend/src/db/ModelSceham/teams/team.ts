import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  team_id: string;
  team_name: string;
  team_lead: string;
  branchcode?: string;
  is_active?: boolean;
  previous_lead?: string;
  modified_count?: number;
  created_on?: Date;
  updated_on?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

export interface ITeamLeadHistory extends Document {
  team_id: string;
  old_lead?: string;
  new_lead?: string;
  branchcode?: string;
  change_reason?: string;
  status?: string;
  changed_by?: string;
  created_on?: Date;
}

const TeamSchema = new Schema<ITeam>({
  team_id: { type: String, required: true, unique: true },
  team_name: { type: String, required: true },
  team_lead: { type: String, required: true },
  branchcode: { type: String },
  is_active: { type: Boolean, default: true },
  previous_lead: { type: String },
  modified_count: { type: Number, default: 0 },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
TeamSchema.index({ tenant_id: 1, team_id: 1 });

const TeamLeadHistorySchema = new Schema<ITeamLeadHistory>({
  team_id: { type: String, required: true },
  old_lead: { type: String },
  new_lead: { type: String },
  branchcode: { type: String },
  change_reason: { type: String },
  status: { type: String, default: 'changed' },
  changed_by: { type: String },
  created_on: { type: Date, default: Date.now }
});

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
export const TeamLeadHistory = mongoose.model<ITeamLeadHistory>('TeamLeadHistory', TeamLeadHistorySchema);

export const teamsInfo = async () => {
  const msgInfo = `Teams -> Team Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

