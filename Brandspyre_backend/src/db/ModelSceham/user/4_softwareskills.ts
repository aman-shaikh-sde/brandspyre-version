import mongoose, { Schema, Document } from "mongoose";

export interface IUserSoftwareSkill extends Document {
  staff_id: string;
  software_id?: number;
  proficiency?: string;
  remark?: string;
}

const UserSoftwareSkillSchema = new Schema<IUserSoftwareSkill>({
  staff_id: { type: String, required: true },
  software_id: { type: Number },
  proficiency: { type: String },
  remark: { type: String }
});

export const UserSoftwareSkill = mongoose.model<IUserSoftwareSkill>('UserSoftwareSkill', UserSoftwareSkillSchema);

export const userSoftwareMasterInfo = async () => {
  const msgInfo = `UserInfo -> Software Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};