import mongoose, { Schema, Document } from "mongoose";

export interface ICustomField {
  key: string;
  label: string;
  value: string;
}

export interface ITemplate extends Document {
  name: string;
  content: string;
  subject?: string;
  custom_fields?: ICustomField[];
  updated_at?: Date;
}

const TemplateSchema = new Schema<ITemplate>({
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  subject: { type: String },
  custom_fields: { type: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true }
  }], default: [] },
  updated_at: { type: Date, default: Date.now }
});

export const Template = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
