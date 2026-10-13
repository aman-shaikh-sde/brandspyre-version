import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  user_id: number;
  branchcode: string;
  document_title: string;
  document_type: string;
  category?: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  upload_date?: Date;
  created_by?: string;
  updated_date?: Date;
  updated_by?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const UserDocumentSchema = new Schema<IUserDocument>({
  user_id: { type: Number, required: true },
  branchcode: { type: String, required: true },
  document_title: { type: String, required: true },
  document_type: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number },
  upload_date: { type: Date, default: Date.now },
  created_by: { type: String },
  updated_date: { type: Date },
  updated_by: { type: String },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

UserDocumentSchema.index({ user_id: 1 });
UserDocumentSchema.index({ branchcode: 1 });
UserDocumentSchema.index({ category: 1 });
UserDocumentSchema.index({ document_type: 1 });
UserDocumentSchema.index({ upload_date: 1 });
// Add compound index for tenant isolation
UserDocumentSchema.index({ tenant_id: 1, user_id: 1 });

export const UserDocument = mongoose.models.UserDocument || mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);

export const initializeUserDocuments = async () => {
  try {
    // Schema is already defined, no initialization needed
    console.log("User documents table initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing user documents table: ${message}`);
    throw new Error(`Error initializing user documents table: ${message}`);
  }
};
