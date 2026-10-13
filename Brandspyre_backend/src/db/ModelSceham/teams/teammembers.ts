import mongoose, { Schema, Document } from "mongoose";

export interface ITeamMember extends Document {
  team_id: string;
  branchcode: string;
  staff_id: string;
  role?: string;
  joined_on?: Date;
  status?: string;
  updated_on?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  team_id: { type: String, required: true },
  branchcode: { type: String, required: true },
  staff_id: { type: String, required: true },
  role: { type: String, default: 'member' },
  joined_on: { type: Date, default: Date.now },
  status: { type: String, default: 'active' },
  updated_on: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

TeamMemberSchema.index({ team_id: 1, staff_id: 1 }, { unique: true });
// Add compound index for tenant isolation
TeamMemberSchema.index({ tenant_id: 1, team_id: 1 });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);

export const membersInfo = async () => {
  const msgInfo = `Members -> Team Members Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};
