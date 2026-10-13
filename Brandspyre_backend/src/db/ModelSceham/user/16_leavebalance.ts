import mongoose, { Schema, Document } from "mongoose";

export interface IUserLeaveBalance extends Document {
  staff_id: string;
  year: string;
  leave_type_id?: number;
  total_allocated?: number;
  leaves_taken?: number;
  leaves_remaining?: number;
  last_update_datetime?: Date;
}

const UserLeaveBalanceSchema = new Schema<IUserLeaveBalance>({
  staff_id: { type: String, required: true },
  year: { type: String, required: true },
  leave_type_id: { type: Number },
  total_allocated: { type: Number, default: 0 },
  leaves_taken: { type: Number, default: 0 },
  leaves_remaining: { type: Number, default: 0 },
  last_update_datetime: { type: Date, default: Date.now }
});

UserLeaveBalanceSchema.index({ staff_id: 1, leave_type_id: 1 }, { unique: true });

export const UserLeaveBalance = mongoose.model<IUserLeaveBalance>('UserLeaveBalance', UserLeaveBalanceSchema);

export const userLeaveBalanceMasterInfo = async () => {
  const msgInfo = `UserInfo -> Leave Balance Req Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};