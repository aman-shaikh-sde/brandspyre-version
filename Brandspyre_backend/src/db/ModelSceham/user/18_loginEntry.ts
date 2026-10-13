import mongoose, { Schema, Document } from "mongoose";

export interface ILogEntry extends Document {
  branchcode?: string;
  staff_id: string;
  date?: string;
  time?: string;
  ip?: string;
  device?: string;
}

const LogEntrySchema = new Schema<ILogEntry>({
  branchcode: { type: String },
  staff_id: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  ip: { type: String },
  device: { type: String }
});

export const LogEntry = mongoose.model<ILogEntry>('LogEntry', LogEntrySchema);

export const userActivityLoginMasterInfo = async () => {
  const msgInfo = `UserInfo -> Loged Report Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};