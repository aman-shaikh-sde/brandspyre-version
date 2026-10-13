import mongoose, { Schema, Document } from "mongoose";

export type MeetingType = 'INTERNAL' | 'INTER_ORGANIZATION' | 'CLIENT' | 'PROJECT' | 'LEAD';
export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'locked';
export type ParticipantResponseStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE' | 'REMOVED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'MAYBE' | 'EXPIRED' | 'CANCELLED';
export type MeetingOutcomeType = 'Completed' | 'No Show' | 'Rescheduled' | 'Cancelled' | 'Follow-up Required' | 'Qualified' | 'Proposal Required' | 'Not Interested' | 'Won' | 'Lost' | 'Follow-up';

export interface IMeeting extends Document {
  meeting_id: number;
  tenant_id: mongoose.Types.ObjectId;
  host_tenant_id?: mongoose.Types.ObjectId;
  host_user_id: number;
  meeting_type: MeetingType;
  title: string;
  description?: string;
  scheduled_start_time: Date;
  scheduled_end_time?: Date;
  timezone?: string;
  actual_start_time?: Date;
  actual_end_time?: Date;
  status: MeetingStatus;
  meeting_link?: string;
  meeting_password?: string;
  max_participants?: number;
  is_recording_enabled?: boolean;
  recording_url?: string;
  allow_screen_share?: boolean;
  allow_chat?: boolean;
  mute_on_join?: boolean;
  waiting_room_enabled?: boolean;
  
  // Relations
  related_lead_id?: mongoose.Types.ObjectId;
  related_shared_lead_id?: mongoose.Types.ObjectId;
  related_client_id?: Schema.Types.Mixed;
  related_project_id?: Schema.Types.Mixed;
  related_project_meeting_id?: number;
  related_milestone_id?: Schema.Types.Mixed;
  related_task_id?: Schema.Types.Mixed;
  relationship_id?: mongoose.Types.ObjectId;
  
  participant_tenant_ids?: mongoose.Types.ObjectId[];
  participant_user_ids?: number[];
  visibility_scope?: string;
  
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingParticipant extends Document {
  meeting_id: number;
  user_id: number;
  tenant_id?: mongoose.Types.ObjectId | Schema.Types.Mixed;
  response_status: ParticipantResponseStatus;
  is_host: boolean;
  invited_at?: Date;
  accepted_at?: Date;
  declined_at?: Date;
  join_time?: Date;
  leave_time?: Date;
  duration_seconds: number;
  is_muted?: boolean;
  video_enabled?: boolean;
  screen_sharing?: boolean;
  connection_quality?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingInvitation extends Document {
  meeting_id: number;
  invitee_user_id?: number;
  invitee_email: string;
  invitee_name?: string;
  invitee_tenant_id?: mongoose.Types.ObjectId | Schema.Types.Mixed;
  invited_by: number;
  status: InvitationStatus;
  invite_type?: string;
  sent_at: Date;
  accepted_at?: Date;
  declined_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingOutcome extends Document {
  meeting_id: number;
  lead_id?: mongoose.Types.ObjectId;
  recorded_by: number;
  recorded_by_tenant_id?: mongoose.Types.ObjectId;
  outcome: MeetingOutcomeType;
  notes?: string;
  next_action?: string;
  next_action_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingReminder extends Document {
  meeting_id: number;
  user_id: number;
  reminder_time: Date;
  reminder_type: '24_HOURS' | '1_HOUR' | '15_MINUTES';
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  sent_at?: Date;
  created_at: Date;
}

export interface IMeetingRecording extends Document {
  meeting_id: number;
  recording_url: string;
  recording_type?: string;
  file_size?: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  storage_provider?: string;
  storage_path?: string;
  is_processed?: boolean;
  recorded_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingChatMessage extends Document {
  meeting_id: number;
  tenant_id?: mongoose.Types.ObjectId | Schema.Types.Mixed;
  user_id: number;
  sender_user_id: number;
  sender_tenant_id?: mongoose.Types.ObjectId | Schema.Types.Mixed;
  message: string;
  message_type?: string;
  is_private?: boolean;
  recipient_id?: number;
  created_at: Date;
}

export interface IMeetingPoll extends Document {
  meeting_id: number;
  poll_id: string;
  question: string;
  options: string[];
  votes: Record<string, number[]>; // OptionIndex -> array of user_ids
  is_active: boolean;
  allow_multiple?: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface IMeetingPollVote extends Document {
  meeting_id: number;
  poll_id: string;
  user_id: number;
  tenant_id?: mongoose.Types.ObjectId;
  selected_options: number[];
  voted_at: Date;
}

export interface IMeetingNotes extends Document {
  meeting_id: number;
  tenant_id?: mongoose.Types.ObjectId | Schema.Types.Mixed;
  note_type: 'INTERNAL' | 'SHARED' | string;
  content: string;
  notes_version: number;
  last_updated_by: number;
  updated_at: Date;
}

export interface IMeetingDocument extends Document {
  meeting_id: number;
  tenant_id: mongoose.Types.ObjectId | Schema.Types.Mixed;
  uploader_user_id: number;
  title: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  visibility_scope: 'PRIVATE' | 'MEETING_SHARED' | string;
  created_at: Date;
}

export interface IBreakoutRoom extends Document {
  meeting_id: number;
  room_id: string;
  name: string;
  status: 'ACTIVE' | 'CLOSED';
  participants: Array<{ socket_id?: string; user_id: number; user_name?: string }>;
  created_at: Date;
  closed_at?: Date;
}

// ----------------------------------------------------
// MONGOOSE SCHEMAS
// ----------------------------------------------------

const MeetingSchema = new Schema<IMeeting>({
  meeting_id: { type: Number, required: true, unique: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  host_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  host_user_id: { type: Number, required: true, index: true },
  meeting_type: { 
    type: String, 
    required: true, 
    default: 'INTERNAL', 
    enum: ['INTERNAL', 'INTER_ORGANIZATION', 'CLIENT', 'PROJECT', 'LEAD'],
    index: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  scheduled_start_time: { type: Date, required: true, index: true },
  scheduled_end_time: { type: Date, index: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  actual_start_time: { type: Date },
  actual_end_time: { type: Date },
  status: { 
    type: String, 
    required: true, 
    default: 'SCHEDULED',
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'scheduled', 'in_progress', 'completed', 'cancelled', 'locked'],
    index: true 
  },
  meeting_link: { type: String, unique: true, sparse: true, index: true },
  meeting_password: { type: String },
  max_participants: { type: Number, default: 50 },
  is_recording_enabled: { type: Boolean, default: false },
  recording_url: { type: String },
  allow_screen_share: { type: Boolean, default: true },
  allow_chat: { type: Boolean, default: true },
  mute_on_join: { type: Boolean, default: false },
  waiting_room_enabled: { type: Boolean, default: false },
  
  related_lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  related_shared_lead_id: { type: Schema.Types.ObjectId, ref: 'LeadShareAccess', index: true },
  related_client_id: { type: Schema.Types.Mixed, index: true },
  related_project_id: { type: Schema.Types.Mixed, index: true },
  related_project_meeting_id: { type: Number, index: true },
  related_milestone_id: { type: Schema.Types.Mixed },
  related_task_id: { type: Schema.Types.Mixed },
  relationship_id: { type: Schema.Types.ObjectId, ref: 'TenantRelationship', index: true },
  
  participant_tenant_ids: [{ type: Schema.Types.ObjectId, ref: 'Tenant' }],
  participant_user_ids: [{ type: Number }],
  visibility_scope: { type: String, default: 'participants_only' },
  
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
});

const MeetingParticipantSchema = new Schema<IMeetingParticipant>({
  meeting_id: { type: Number, required: true, index: true },
  user_id: { type: Number, required: true, index: true },
  tenant_id: { type: Schema.Types.Mixed, index: true },
  response_status: { 
    type: String, 
    default: 'PENDING', 
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE', 'REMOVED'],
    index: true
  },
  is_host: { type: Boolean, default: false },
  invited_at: { type: Date, default: Date.now },
  accepted_at: { type: Date },
  declined_at: { type: Date },
  join_time: { type: Date },
  leave_time: { type: Date },
  duration_seconds: { type: Number, default: 0 },
  is_muted: { type: Boolean, default: false },
  video_enabled: { type: Boolean, default: true },
  screen_sharing: { type: Boolean, default: false },
  connection_quality: { type: String, default: 'good' },
  ip_address: { type: String },
  user_agent: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MeetingParticipantSchema.index({ meeting_id: 1, user_id: 1 }, { unique: true });

const MeetingInvitationSchema = new Schema<IMeetingInvitation>({
  meeting_id: { type: Number, required: true, index: true },
  invitee_user_id: { type: Number, index: true },
  invitee_email: { type: String, required: true, index: true },
  invitee_name: { type: String },
  invitee_tenant_id: { type: Schema.Types.Mixed, index: true },
  invited_by: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'PENDING', 
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE', 'EXPIRED', 'CANCELLED'],
    index: true 
  },
  invite_type: { type: String, default: 'email' },
  sent_at: { type: Date, default: Date.now },
  accepted_at: { type: Date },
  declined_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MeetingInvitationSchema.index({ meeting_id: 1, invitee_user_id: 1 }, { unique: true, sparse: true });

const MeetingOutcomeSchema = new Schema<IMeetingOutcome>({
  meeting_id: { type: Number, required: true, index: true },
  lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  recorded_by: { type: Number, required: true },
  recorded_by_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  outcome: { 
    type: String, 
    required: true,
    enum: ['Completed', 'No Show', 'Rescheduled', 'Cancelled', 'Follow-up Required', 'Qualified', 'Proposal Required', 'Not Interested', 'Won', 'Lost', 'Follow-up'],
    index: true
  },
  notes: { type: String },
  next_action: { type: String },
  next_action_date: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const MeetingReminderSchema = new Schema<IMeetingReminder>({
  meeting_id: { type: Number, required: true, index: true },
  user_id: { type: Number, required: true, index: true },
  reminder_time: { type: Date, required: true, index: true },
  reminder_type: { type: String, required: true, enum: ['24_HOURS', '1_HOUR', '15_MINUTES'] },
  status: { type: String, default: 'PENDING', enum: ['PENDING', 'SENT', 'CANCELLED'], index: true },
  sent_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

MeetingReminderSchema.index({ meeting_id: 1, user_id: 1, reminder_type: 1 }, { unique: true });

const MeetingRecordingSchema = new Schema<IMeetingRecording>({
  meeting_id: { type: Number, required: true, index: true },
  recording_url: { type: String, required: true },
  recording_type: { type: String, default: 'video' },
  file_size: { type: Number },
  duration_seconds: { type: Number },
  thumbnail_url: { type: String },
  storage_provider: { type: String, default: 'local' },
  storage_path: { type: String },
  is_processed: { type: Boolean, default: false },
  recorded_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const MeetingChatMessageSchema = new Schema<IMeetingChatMessage>({
  meeting_id: { type: Number, required: true, index: true },
  tenant_id: { type: Schema.Types.Mixed },
  user_id: { type: Number, required: true },
  sender_user_id: { type: Number, required: true },
  sender_tenant_id: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  message_type: { type: String, default: 'text' },
  is_private: { type: Boolean, default: false },
  recipient_id: { type: Number },
  created_at: { type: Date, default: Date.now, index: true }
});

const MeetingPollSchema = new Schema<IMeetingPoll>({
  meeting_id: { type: Number, required: true, index: true },
  poll_id: { type: String, required: true, index: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  votes: { type: Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true },
  allow_multiple: { type: Boolean, default: false },
  created_by: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const MeetingPollVoteSchema = new Schema<IMeetingPollVote>({
  meeting_id: { type: Number, required: true, index: true },
  poll_id: { type: String, required: true, index: true },
  user_id: { type: Number, required: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  selected_options: [{ type: Number, required: true }],
  voted_at: { type: Date, default: Date.now }
});

MeetingPollVoteSchema.index({ meeting_id: 1, poll_id: 1, user_id: 1 }, { unique: true });

const MeetingNotesSchema = new Schema<IMeetingNotes>({
  meeting_id: { type: Number, required: true, index: true },
  tenant_id: { type: Schema.Types.Mixed },
  note_type: { type: String, default: 'SHARED', enum: ['INTERNAL', 'SHARED'] },
  content: { type: String, default: "" },
  notes_version: { type: Number, default: 1 },
  last_updated_by: { type: Number, required: true },
  updated_at: { type: Date, default: Date.now }
});

const MeetingDocumentSchema = new Schema<IMeetingDocument>({
  meeting_id: { type: Number, required: true, index: true },
  tenant_id: { type: Schema.Types.Mixed, required: true },
  uploader_user_id: { type: Number, required: true },
  title: { type: String, required: true },
  file_url: { type: String, required: true },
  file_type: { type: String },
  file_size: { type: Number },
  visibility_scope: { type: String, default: 'MEETING_SHARED', enum: ['PRIVATE', 'MEETING_SHARED'] },
  created_at: { type: Date, default: Date.now }
});

const BreakoutRoomSchema = new Schema<IBreakoutRoom>({
  meeting_id: { type: Number, required: true, index: true },
  room_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'CLOSED'] },
  participants: [{
    socket_id: { type: String },
    user_id: { type: Number, required: true },
    user_name: { type: String }
  }],
  created_at: { type: Date, default: Date.now },
  closed_at: { type: Date }
});

// Clear cache if reloading
if (mongoose.models.Meeting) delete (mongoose.models as any).Meeting;
if (mongoose.models.MeetingParticipant) delete (mongoose.models as any).MeetingParticipant;
if (mongoose.models.MeetingInvitation) delete (mongoose.models as any).MeetingInvitation;
if (mongoose.models.MeetingOutcome) delete (mongoose.models as any).MeetingOutcome;
if (mongoose.models.MeetingReminder) delete (mongoose.models as any).MeetingReminder;
if (mongoose.models.MeetingRecording) delete (mongoose.models as any).MeetingRecording;
if (mongoose.models.MeetingChatMessage) delete (mongoose.models as any).MeetingChatMessage;
if (mongoose.models.MeetingPoll) delete (mongoose.models as any).MeetingPoll;
if (mongoose.models.MeetingPollVote) delete (mongoose.models as any).MeetingPollVote;
if (mongoose.models.MeetingNotes) delete (mongoose.models as any).MeetingNotes;
if (mongoose.models.MeetingDocument) delete (mongoose.models as any).MeetingDocument;
if (mongoose.models.BreakoutRoom) delete (mongoose.models as any).BreakoutRoom;

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
export const MeetingParticipant = mongoose.model<IMeetingParticipant>('MeetingParticipant', MeetingParticipantSchema);
export const MeetingInvitation = mongoose.model<IMeetingInvitation>('MeetingInvitation', MeetingInvitationSchema);
export const MeetingOutcome = mongoose.model<IMeetingOutcome>('MeetingOutcome', MeetingOutcomeSchema);
export const MeetingReminder = mongoose.model<IMeetingReminder>('MeetingReminder', MeetingReminderSchema);
export const MeetingRecording = mongoose.model<IMeetingRecording>('MeetingRecording', MeetingRecordingSchema);
export const MeetingChatMessage = mongoose.model<IMeetingChatMessage>('MeetingChatMessage', MeetingChatMessageSchema);
export const MeetingPoll = mongoose.model<IMeetingPoll>('MeetingPoll', MeetingPollSchema);
export const MeetingPollVote = mongoose.model<IMeetingPollVote>('MeetingPollVote', MeetingPollVoteSchema);
export const MeetingNotes = mongoose.model<IMeetingNotes>('MeetingNotes', MeetingNotesSchema);
export const MeetingDocument = mongoose.model<IMeetingDocument>('MeetingDocument', MeetingDocumentSchema);
export const BreakoutRoom = mongoose.model<IBreakoutRoom>('BreakoutRoom', BreakoutRoomSchema);

/**
 * Startup Migration: Converts legacy non-ObjectId tenants and migrates legacy ProjectMeeting records
 */
export const initializeMeetingSchema = async () => {
  try {
    const { Tenant } = require("./saasSchema");
    const { UserInfo } = require("./userSchema");
    const { ProjectMeeting } = require("./project/client");

    const firstActiveTenant = await Tenant.findOne({ status: "active" }).lean();

    // 1. Fix any string/number tenant IDs in Meeting collection (use raw collection to bypass Mongoose ObjectId schema casting)
    const legacyMeetings = await Meeting.collection.find({
      $or: [
        { tenant_id: { $type: "number" } },
        { tenant_id: "1" },
        { host_tenant_id: { $type: "number" } },
        { host_tenant_id: "1" }
      ]
    }).toArray();

    if (legacyMeetings.length > 0) {
      for (const m of legacyMeetings) {
        let validTenantObjId: mongoose.Types.ObjectId | null = null;
        const hostUser = await UserInfo.findOne({ psn: m.host_user_id }).lean();
        if (hostUser && hostUser.tenant_id && mongoose.Types.ObjectId.isValid(hostUser.tenant_id.toString())) {
          validTenantObjId = new mongoose.Types.ObjectId(hostUser.tenant_id.toString());
        } else if (firstActiveTenant) {
          validTenantObjId = firstActiveTenant._id as mongoose.Types.ObjectId;
        }

        if (validTenantObjId) {
          await Meeting.collection.updateOne(
            { _id: m._id },
            {
              $set: {
                tenant_id: validTenantObjId,
                host_tenant_id: validTenantObjId
              }
            }
          );
        }
      }
      console.log(`Migrated ${legacyMeetings.length} legacy meeting records to strict ObjectId tenant references.`);
    }

    // 2. Safely sync/migrate legacy ProjectMeeting records into canonical Meeting collection
    if (ProjectMeeting) {
      const legacyProjectMeets = await ProjectMeeting.find({}).lean();
      let migratedCount = 0;

      for (const pm of legacyProjectMeets) {
        const mid = pm.meet_id || pm.id;
        if (!mid) continue;

        const existingCanonical = await Meeting.findOne({
          $or: [
            { meeting_id: mid },
            { related_project_meeting_id: mid }
          ]
        }).lean();

        if (!existingCanonical && pm.title) {
          let tId = firstActiveTenant ? firstActiveTenant._id : new mongoose.Types.ObjectId();
          if (pm.tenant_id && mongoose.Types.ObjectId.isValid(String(pm.tenant_id))) {
            tId = new mongoose.Types.ObjectId(String(pm.tenant_id));
          }

          const hostPsn = pm.host_user_id || (isNaN(Number(pm.createby)) ? 1 : Number(pm.createby));

          await Meeting.create({
            meeting_id: mid,
            tenant_id: tId,
            host_tenant_id: tId,
            host_user_id: hostPsn,
            meeting_type: 'PROJECT',
            title: pm.title || 'Project Meeting',
            description: pm.notes || pm.desc || '',
            scheduled_start_time: pm.start_date_time || pm.date || new Date(),
            scheduled_end_time: pm.end_date_time || new Date(Date.now() + 3600000),
            status: pm.status === 'completed' ? 'COMPLETED' : (pm.status === 'cancelled' ? 'CANCELLED' : 'SCHEDULED'),
            meeting_link: pm.meet_link || `meet-${mid}`,
            related_project_id: pm.project_code || pm.project_id,
            related_project_meeting_id: mid,
            related_milestone_id: pm.milestone_id,
            related_task_id: pm.task_id,
            created_by: hostPsn,
            created_at: pm.created_on || new Date(),
            updated_at: pm.updated_on || new Date()
          });
          migratedCount++;
        }
      }

      if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} legacy ProjectMeeting records into canonical Meeting collection.`);
      }
    }

    console.log("Meeting schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing meeting schema: ${message}`);
  }
};
