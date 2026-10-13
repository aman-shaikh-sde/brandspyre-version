import mongoose, { Schema, Document } from "mongoose";

export interface IUserLanguage extends Document {
  staff_id: string;
  language_id?: number;
  proficiency?: string;
  can_read?: boolean;
  can_write?: boolean;
  can_speak?: boolean;
  remark?: string;
}

const UserLanguageSchema = new Schema<IUserLanguage>({
  staff_id: { type: String, required: true },
  language_id: { type: Number },
  proficiency: { type: String, default: 'beginner' },
  can_read: { type: Boolean },
  can_write: { type: Boolean },
  can_speak: { type: Boolean },
  remark: { type: String }
});

export const UserLanguage = mongoose.model<IUserLanguage>('UserLanguage', UserLanguageSchema);

export const userLanguageMasterInfo = async () => {
  const msgInfo = `UserInfo -> Language Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};