import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  staff_id: string;
  name?: string;
  type?: string;
  field?: string;
  on_date?: string;
  description?: string;
}

const UserDocumentSchema = new Schema<IUserDocument>({
  staff_id: { type: String, required: true },
  name: { type: String },
  type: { type: String },
  field: { type: String },
  on_date: { type: String },
  description: { type: String }
});

export const UserDocument = mongoose.models.UserDocumentUpload || mongoose.model<IUserDocument>('UserDocumentUpload', UserDocumentSchema);

export const userDocumentMasterInfo = async () => {
  const msgInfo = `UserInfo -> Document Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};