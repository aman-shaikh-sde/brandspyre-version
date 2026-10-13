import mongoose, { Schema, Document } from "mongoose";

export interface IUserPromotion extends Document {
  staff_id: string;
  currentlpa?: number;
  requestlpa?: number;
  remarks?: string;
  processondate?: string;
  processtilldate?: string;
  typeofpromotion?: string;
  percentagehike?: string;
  requestbypsn?: string;
  department?: string;
  designation?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

const UserPromotionSchema = new Schema<IUserPromotion>({
  staff_id: { type: String, required: true },
  currentlpa: { type: Number, default: 0 },
  requestlpa: { type: Number, default: 0 },
  remarks: { type: String },
  processondate: { type: String },
  processtilldate: { type: String },
  typeofpromotion: { type: String },
  percentagehike: { type: String },
  requestbypsn: { type: String },
  department: { type: String },
  designation: { type: String },
  status: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const UserPromotion = mongoose.model<IUserPromotion>('UserPromotion', UserPromotionSchema);

export const userPromotionMasterInfo = async () => {
  const msgInfo = `UserInfo -> Promotion Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};