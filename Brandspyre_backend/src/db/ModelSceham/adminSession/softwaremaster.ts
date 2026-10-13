import mongoose, { Schema, Document } from "mongoose";

export interface ISoftwareMaster extends Document {
  branchcode?: string;
  name: string;
}

const SoftwareMasterSchema = new Schema<ISoftwareMaster>({
  branchcode: { type: String },
  name: { type: String, required: true, unique: true }
});

export const SoftwareMaster = mongoose.model<ISoftwareMaster>('SoftwareMaster', SoftwareMasterSchema);

export const adminsoftwareMasterInfo = async () => {
  const msgInfo = `Admin Info -> software Master`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};