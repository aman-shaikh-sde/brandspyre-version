import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  from?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: any;
  participants_id?: any;
  meeting_id?: any;
  document_id?: any;
  message_id?: any;
  type: string;
  action: string;
  content: string;
  isnotify?: boolean;
  created_on?: Date;
}

export interface INotificationRecipient extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  notification_id: mongoose.Types.ObjectId;
  person_id: string;
  role_type: string;
  isread?: boolean;
}

const NotificationSchema = new Schema<INotification>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  from: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Schema.Types.Mixed },
  participants_id: { type: Schema.Types.Mixed },
  meeting_id: { type: Schema.Types.Mixed },
  document_id: { type: Schema.Types.Mixed },
  message_id: { type: Schema.Types.Mixed },
  type: { type: String, required: true },
  action: { type: String, required: true },
  content: { type: String, required: true },
  isnotify: { type: Boolean, default: true },
  created_on: { type: Date, default: Date.now }
});

const NotificationRecipientSchema = new Schema<INotificationRecipient>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  notification_id: { type: Schema.Types.ObjectId, required: true, ref: 'Notification' },
  person_id: { type: String, required: true },
  role_type: { type: String, required: true },
  isread: { type: Boolean, default: false }
});

NotificationSchema.index({ tenant_id: 1, created_on: -1 });
NotificationRecipientSchema.index({ tenant_id: 1, person_id: 1, isread: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationRecipient = mongoose.models.NotificationRecipient || mongoose.model<INotificationRecipient>('NotificationRecipient', NotificationRecipientSchema);

export const notificationInfo = async () => {
  const msgInfo = `Notification -> Notification Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};