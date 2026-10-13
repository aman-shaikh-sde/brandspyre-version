import mongoose, { Schema, Document } from "mongoose";

export interface IUserBankInfo extends Document {
  staff_id: string;
  accountholdername?: string;
  accountnumber?: string;
  bankname?: string;
  bankifsc?: string;
  banklocation?: string;
  active?: boolean;
}

const UserBankInfoSchema = new Schema<IUserBankInfo>({
  staff_id: { type: String, required: true },
  accountholdername: { type: String },
  accountnumber: { type: String, unique: true },
  bankname: { type: String },
  bankifsc: { type: String },
  banklocation: { type: String },
  active: { type: Boolean, default: false }
});

export const UserBankInfo = mongoose.model<IUserBankInfo>('UserBankInfo', UserBankInfoSchema);

export const userBankInfo = async () => {
  const msgInfo = `UserInfo -> Bank Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};