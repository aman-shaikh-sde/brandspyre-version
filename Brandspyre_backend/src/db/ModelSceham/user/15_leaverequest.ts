import mongoose, { Schema, Document } from "mongoose";

export interface ILeaveRequest extends Document {
  staff_id: string;
  branchcode?: string;
  leave_type?: string;
  start_date: Date;
  end_date: Date;
  reason?: string;
  status?: string;
  approved_dates?: string[];
  requested_on?: Date;
  approved_by?: string;
  approval_date?: Date;
  remarks?: string;
  is_half_day?: boolean;
  partial_day_type?: string;
  leave_duration_hours?: number;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  staff_id: { type: String, required: true },
  branchcode: { type: String },
  leave_type: { type: String },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, default: 'pending' },
  approved_dates: { type: [String] },
  requested_on: { type: Date, default: Date.now },
  approved_by: { type: String },
  approval_date: { type: Date },
  remarks: { type: String },
  is_half_day: { type: Boolean, default: false },
  partial_day_type: { type: String },
  leave_duration_hours: { type: Number },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
LeaveRequestSchema.index({ tenant_id: 1, staff_id: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

export const userLeaveRequestMasterInfo = async () => {
  const msgInfo = `UserInfo -> Leave Request Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};