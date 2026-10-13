import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  recipient: string;
  subject: string;
  event_type: string;
  reference_id?: string;
  idempotency_key?: string;
  status: 'sent' | 'failed' | 'skipped';
  error_message?: string;
  provider: string;
  message_id?: string;
  sent_at: Date;
  created_at: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  recipient: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  event_type: { type: String, required: true, index: true },
  reference_id: { type: String, index: true },
  idempotency_key: { type: String, index: true, unique: true, sparse: true },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent', index: true },
  error_message: { type: String },
  provider: { type: String, default: 'zoho_smtp' },
  message_id: { type: String },
  sent_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

EmailLogSchema.index({ tenant_id: 1, event_type: 1, created_at: -1 });

export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
export default EmailLog;
