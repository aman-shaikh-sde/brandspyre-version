import mongoose, { Schema, Document } from "mongoose";

export interface IUserIncentive extends Document {
  staff_id: string;
  incentive?: number;
  days?: string;
  remark?: string;
  processondate?: string;
  processtilldate?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

const UserIncentiveSchema = new Schema<IUserIncentive>({
  staff_id: { type: String, required: true },
  incentive: { type: Number },
  days: { type: String },
  remark: { type: String },
  processondate: { type: String },
  processtilldate: { type: String },
  status: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const UserIncentive = mongoose.model<IUserIncentive>('UserIncentive', UserIncentiveSchema);

export const userIncentiveMasterInfo = async () => {
  const msgInfo = `UserInfo -> Incentive Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};