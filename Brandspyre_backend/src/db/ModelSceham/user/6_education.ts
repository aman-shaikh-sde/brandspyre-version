import mongoose, { Schema, Document } from "mongoose";

export interface IUserEducation extends Document {
  staff_id: string;
  degree?: string;
  institute?: string;
  passing?: string;
  start_year?: string;
  end_year?: string;
  percentage?: string;
}

const UserEducationSchema = new Schema<IUserEducation>({
  staff_id: { type: String, required: true },
  degree: { type: String },
  institute: { type: String },
  passing: { type: String },
  start_year: { type: String },
  end_year: { type: String },
  percentage: { type: String }
});

export const UserEducation = mongoose.model<IUserEducation>('UserEducation', UserEducationSchema);

export const userEducatioMasterInfo = async () => {
  const msgInfo = `UserInfo -> Education Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};