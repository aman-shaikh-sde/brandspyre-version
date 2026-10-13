import mongoose, { Schema, Document } from "mongoose";

export interface IMasterData extends Document {
  category: string;
  key: string;
  label: string;
  badgeColor?: string;
  icon?: string;
  sortOrder?: number;
  isSystem?: boolean;
  isActive?: boolean;
  branchcode?: string;
  tenant_id?: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

const MasterDataSchema: Schema = new Schema(
  {
    category: { type: String, required: true, index: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    badgeColor: { type: String, default: "gray" },
    icon: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    branchcode: { type: String, index: true },
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant" },
  },
  { timestamps: true }
);

MasterDataSchema.index({ category: 1, key: 1 }, { unique: true });

export const MasterDataModel = mongoose.model<IMasterData>("MasterData", MasterDataSchema);
