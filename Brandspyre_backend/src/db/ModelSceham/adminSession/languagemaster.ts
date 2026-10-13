import mongoose, { Schema, Document } from "mongoose";

export interface ILanguageMaster extends Document {
  branchcode?: string;
  name: string;
}

const LanguageMasterSchema = new Schema<ILanguageMaster>({
  branchcode: { type: String },
  name: { type: String, required: true, unique: true }
});

export const LanguageMaster = mongoose.model<ILanguageMaster>('LanguageMaster', LanguageMasterSchema);

export const adminlanguageMasterInfo = async () => {
  const msgInfo = `Admin Info -> language Master`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};