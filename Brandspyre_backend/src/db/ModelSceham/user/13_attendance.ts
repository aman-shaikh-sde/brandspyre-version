import mongoose, { Schema, Document } from "mongoose";

export interface IUserAttendance extends Document {
  staff_id: string;
  branchcode?: string;
  attendance_date: string;
  status: string;
  isleaveapproved?: boolean;
  remarks?: string;
  leave_type?: string;
  leave_hours?: number;
  create_datetime?: Date;
  last_update_datetime?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const UserAttendanceSchema = new Schema<IUserAttendance>({
  staff_id: { type: String, required: true },
  branchcode: { type: String },
  attendance_date: { type: String, required: true },
  status: { type: String, required: true },
  isleaveapproved: { type: Boolean, default: false },
  remarks: { type: String },
  leave_type: { type: String },
  leave_hours: { type: Number },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

UserAttendanceSchema.index({ staff_id: 1, attendance_date: 1 }, { unique: true });
// Add compound index for tenant isolation
UserAttendanceSchema.index({ tenant_id: 1, staff_id: 1 });

export const UserAttendance = mongoose.model<IUserAttendance>('UserAttendance', UserAttendanceSchema);

export const userAttendanceMasterInfo = async () => {
  const msgInfo = `UserInfo -> Attendance Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};