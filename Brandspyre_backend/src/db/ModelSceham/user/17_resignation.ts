import mongoose, { Schema, Document } from "mongoose";

export interface IResignation extends Document {
  resign_id: string;
  branchcode?: string;
  branch_name?: string;
  department?: string;
  designation?: string;
  team_id?: string;
  team_name?: string;
  team_lead_id?: string;
  team_lead_name?: string;
  staff_id: string;
  staff_name?: string;
  termination_type?: string;
  termination_reason?: string;
  last_working_day: Date;
  reliving_date?: Date;
  exit_notes?: string;
  status?: string;
  created_by?: string;
  approved_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

const ResignationSchema = new Schema<IResignation>({
  resign_id: { type: String, required: true, unique: true },
  branchcode: { type: String },
  branch_name: { type: String },
  department: { type: String },
  designation: { type: String },
  team_id: { type: String },
  team_name: { type: String },
  team_lead_id: { type: String },
  team_lead_name: { type: String },
  staff_id: { type: String, required: true },
  staff_name: { type: String },
  termination_type: { type: String },
  termination_reason: { type: String },
  last_working_day: { type: Date, required: true },
  reliving_date: { type: Date },
  exit_notes: { type: String },
  status: { type: String, default: 'initiated' },
  created_by: { type: String },
  approved_by: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Resignation = mongoose.model<IResignation>('Resignation', ResignationSchema);

export const userResignMasterInfo = async () => {
  const msgInfo = `UserInfo -> Resign_termination Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};