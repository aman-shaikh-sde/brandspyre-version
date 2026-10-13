import mongoose, { Schema, Document } from "mongoose";

export interface IUserAttendanceLog extends Document {
  staff_id: string;
  attendance_id?: mongoose.Types.ObjectId;
  check_in: Date;
  check_out?: Date;
  duration?: number;
  remarks?: string;
  create_datetime?: Date;
  last_update_datetime?: Date;
}

const UserAttendanceLogSchema = new Schema<IUserAttendanceLog>({
  staff_id: { type: String, required: true },
  attendance_id: { type: Schema.Types.ObjectId, ref: 'UserAttendance' },
  check_in: { type: Date, required: true },
  check_out: { type: Date },
  duration: { type: Number, default: 0 },
  remarks: { type: String },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now }
});

export const UserAttendanceLog = mongoose.model<IUserAttendanceLog>('UserAttendanceLog', UserAttendanceLogSchema);

export const userAttendanceLogMasterInfo = async () => {
  const msgInfo = `UserInfo -> Attendance Log Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};