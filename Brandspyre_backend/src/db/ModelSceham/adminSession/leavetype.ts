import mongoose, { Schema, Document } from "mongoose";

export interface ILeaveType extends Document {
  branchcode?: string;
  name: string;
  year?: string;
  description?: string;
  total_days: number;
  status?: string;
  create_datetime?: Date;
  last_update_datetime?: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>({
  branchcode: { type: String },
  name: { type: String, required: true, unique: true },
  year: { type: String },
  description: { type: String },
  total_days: { type: Number, required: true },
  status: { type: String },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now }
});

export const LeaveType = mongoose.model<ILeaveType>('LeaveType', LeaveTypeSchema);

export const adminLeaveTypeMasterInfo = async () => {
  const msgInfo = `Admin Info -> leave_type Master`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};