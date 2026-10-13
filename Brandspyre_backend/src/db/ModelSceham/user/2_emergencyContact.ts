import mongoose, { Schema, Document } from "mongoose";

export interface IUserEmergencyContact extends Document {
  staff_id: string;
  name?: string;
  relation?: string;
  contactno?: string;
  landline?: string;
}

export interface IUserReference extends Document {
  staff_id: string;
  referstaff_id?: string;
  name?: string;
  relation?: string;
  contactno?: string;
  address?: string;
}

const UserEmergencyContactSchema = new Schema<IUserEmergencyContact>({
  staff_id: { type: String, required: true },
  name: { type: String },
  relation: { type: String },
  contactno: { type: String },
  landline: { type: String }
});

const UserReferenceSchema = new Schema<IUserReference>({
  staff_id: { type: String, required: true },
  referstaff_id: { type: String },
  name: { type: String },
  relation: { type: String },
  contactno: { type: String },
  address: { type: String }
});

export const UserEmergencyContact = mongoose.model<IUserEmergencyContact>('UserEmergencyContact', UserEmergencyContactSchema);
export const UserReference = mongoose.model<IUserReference>('UserReference', UserReferenceSchema);

export const userEmergencyContacts = async () => {
  try {
    // Schema is already defined, no initialization needed
    // console.log("UserInfo -> Emergency Contacts successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing UserInfo -> Emergency Contacts Message: ${message}`);
    throw new Error(`Error initializing UserInfo -> Emergency Contacts Message: ${message}`);
  }
};

export const userReferrenceEmployees = async () => {
  try {
    // Schema is already defined, no initialization needed
    // console.log("UserInfo -> Referrence Employees successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing UserInfo -> Referrence Employees Message: ${message}`);
    throw new Error(`Error initializing UserInfo -> Referrence Employees Message: ${message}`);
  }
};
