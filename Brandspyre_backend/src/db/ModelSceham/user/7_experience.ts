import mongoose, { Schema, Document } from "mongoose";

export interface IUserExperience extends Document {
  staff_id: string;
  companyname?: string;
  designation?: string;
  lastsalary?: string;
  start_year?: string;
  end_year?: string;
  reason?: string;
}

const UserExperienceSchema = new Schema<IUserExperience>({
  staff_id: { type: String, required: true },
  companyname: { type: String },
  designation: { type: String },
  lastsalary: { type: String },
  start_year: { type: String },
  end_year: { type: String },
  reason: { type: String }
});

export const UserExperience = mongoose.model<IUserExperience>('UserExperience', UserExperienceSchema);

export const userExperienceMasterInfo = async () => {
  const msgInfo = `UserInfo -> Experience Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};