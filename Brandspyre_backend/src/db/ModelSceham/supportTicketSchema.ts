import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// SUPPORT TICKET REPLIES
// ============================================================
export interface ISupportTicketReply {
  _id?: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  sender_name: string;
  sender_role: 'customer' | 'admin';
  message: string;
  attachments?: string[];
  is_internal_note?: boolean;
  created_at: Date;
}

const SupportTicketReplySchema = new Schema<ISupportTicketReply>({
  sender_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  sender_name: { type: String, default: 'User' },
  sender_role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  is_internal_note: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// ============================================================
// SUPPORT TICKET
// ============================================================
export interface ISupportTicket extends Document {
  ticket_number: string;     // e.g. 'TICK-10024'
  tenant_id: mongoose.Types.ObjectId;
  created_by: mongoose.Types.ObjectId;
  created_by_name: string;
  created_by_email: string;
  subject: string;
  category: 'BILLING' | 'TECHNICAL' | 'MODULE_REQUEST' | 'ONBOARDING' | 'BUG' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  description: string;
  attachments?: string[];
  assigned_admin?: mongoose.Types.ObjectId;
  assigned_admin_name?: string;
  replies: ISupportTicketReply[];
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  ticket_number: { type: String, required: true, unique: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  created_by: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  created_by_name: { type: String, default: 'Support User' },
  created_by_email: { type: String, default: 'platformadmin@gmail.com' },
  subject: { type: String, required: true },
  category: { type: String, enum: ['BILLING', 'TECHNICAL', 'MODULE_REQUEST', 'ONBOARDING', 'BUG', 'OTHER'], default: 'TECHNICAL', index: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM', index: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  description: { type: String, required: true },
  attachments: [{ type: String }],
  assigned_admin: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  assigned_admin_name: { type: String, default: '' },
  replies: [SupportTicketReplySchema],
  resolved_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SupportTicketSchema.index({ tenant_id: 1, created_at: -1 });

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export const initializeSupportTicketSchema = async () => {
  try {
    await SupportTicket.createIndexes();
    console.log('✅ SupportTicket schema indexes initialized successfully.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ SupportTicket schema init warning: ${message}`);
  }
};
