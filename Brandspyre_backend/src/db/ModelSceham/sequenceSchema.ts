import mongoose, { Schema, Document } from "mongoose";

export interface ISequence extends Document {
  name: string;
  value: number;
}

const SequenceSchema = new Schema<ISequence>({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 }
});

export const Sequence = mongoose.models.Sequence || mongoose.model<ISequence>("Sequence", SequenceSchema);
