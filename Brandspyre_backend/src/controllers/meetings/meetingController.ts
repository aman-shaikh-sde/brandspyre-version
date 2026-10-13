import mongoose from 'mongoose';
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { 
  Meeting, 
  MeetingParticipant, 
  MeetingPoll, 
  MeetingPollVote, 
  MeetingNotes, 
  MeetingRecording, 
  MeetingDocument, 
  MeetingInvitation, 
  MeetingOutcome, 
  MeetingChatMessage,
  IMeeting 
} from "../../db/ModelSceham/meetingSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Sequence } from "../../db/ModelSceham/sequenceSchema";
import { Lead } from "../../db/ModelSceham/project/campagin";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import { TenantRelationship } from "../../db/ModelSceham/tenantRelationshipSchema";
import { Tenant, AuditLog } from "../../db/ModelSceham/saasSchema";
import { MeetingAccessService, ResolvedUserContext } from "../../services/meetings/MeetingAccessService";
import { sendNotification } from "../notifications/create";

const getNextMeetingId = async (session?: mongoose.ClientSession): Promise<number> => {
  const seqVal = await Sequence.findOneAndUpdate(
    { name: 'meeting_id_seq' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );
  return seqVal.value;
};

const resolveMeetingDoc = async (meetingParam: string): Promise<any> => {
  if (mongoose.Types.ObjectId.isValid(meetingParam)) {
    return await Meeting.findById(meetingParam);
  }
  const mid = Number(meetingParam);
  if (!isNaN(mid)) {
    return await Meeting.findOne({ $or: [{ meeting_id: mid }, { id: mid }] });
  }
  return await Meeting.findOne({ meeting_link: meetingParam });
};

export class MeetingController {
  /**
   * 1. Create a Canonical Meeting
   */
  static async createMeeting(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        await session.abortTransaction();
        res.status(403).json({ success: false, error: "Access Denied: Unable to resolve authenticated tenant or user." });
        return;
      }

      const {
        title,
        description,
        meeting_type = 'INTERNAL',
        scheduled_start_time,
        scheduled_end_time,
        timezone = 'Asia/Kolkata',
        max_participants = 50,
        is_recording_enabled = false,
        allow_screen_share = true,
        allow_chat = true,
        mute_on_join = false,
        waiting_room_enabled = false,
        partner_tenant_id,
        participant_tenant_ids = [],
        participant_user_ids = [],
        related_lead_id,
        related_shared_lead_id,
        related_client_id,
        related_project_id,
        relationship_id,
        visibility_scope = 'participants_only'
      } = req.body;

      if (!title || !scheduled_start_time) {
        await session.abortTransaction();
        res.status(400).json({ success: false, error: "Title and scheduled start time are required." });
        return;
      }

      const startTime = new Date(scheduled_start_time);
      const endTime = scheduled_end_time 
        ? new Date(scheduled_end_time) 
        : new Date(startTime.getTime() + 3600000); // 1 hour default

      if (endTime <= startTime) {
        await session.abortTransaction();
        res.status(400).json({ success: false, error: "Scheduled end time must be after start time." });
        return;
      }

      // Check Scheduling Conflicts for Host
      const conflictCheck = await MeetingAccessService.validateSchedulingConflicts(
        userContext.psn,
        startTime,
        endTime
      );

      if (conflictCheck.hasConflict) {
        await session.abortTransaction();
        res.status(409).json({ 
          success: false, 
          error: "Scheduling Conflict: You already have a meeting scheduled during this time interval.",
          conflict: conflictCheck.conflictingMeeting 
        });
        return;
      }

      let finalRelationshipId = relationship_id;
      let finalSharedLeadId = related_shared_lead_id;
      const targetPartnerTenant = partner_tenant_id || (participant_tenant_ids.length > 0 ? participant_tenant_ids[0] : null);

      // Validate Inter-Organization Eligibility (STRICT: NO AUTO-CREATION)
      if (meeting_type === 'INTER_ORGANIZATION' && targetPartnerTenant) {
        const interOrgCheck = await MeetingAccessService.validateInterOrgEligibility(
          userContext.tenantId,
          String(targetPartnerTenant),
          related_lead_id,
          related_shared_lead_id
        );

        if (!interOrgCheck.eligible) {
          await session.abortTransaction();
          res.status(403).json({ success: false, error: interOrgCheck.reason });
          return;
        }

        if (interOrgCheck.relationshipId) finalRelationshipId = interOrgCheck.relationshipId;
        if (interOrgCheck.sharedLeadId) finalSharedLeadId = interOrgCheck.sharedLeadId;
      }

      const nextId = await getNextMeetingId(session);
      const meetingLink = uuidv4();
      const meetingPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date();

      const hostTenantObjId = new mongoose.Types.ObjectId(userContext.tenantId);

      const allParticipantTenants: mongoose.Types.ObjectId[] = [];
      if (targetPartnerTenant && mongoose.Types.ObjectId.isValid(String(targetPartnerTenant))) {
        allParticipantTenants.push(new mongoose.Types.ObjectId(String(targetPartnerTenant)));
      }
      for (const pt of participant_tenant_ids) {
        if (mongoose.Types.ObjectId.isValid(String(pt)) && !allParticipantTenants.some(t => t.toString() === String(pt))) {
          allParticipantTenants.push(new mongoose.Types.ObjectId(String(pt)));
        }
      }

      const [newMeeting] = await Meeting.create([{
        meeting_id: nextId,
        tenant_id: hostTenantObjId,
        host_tenant_id: hostTenantObjId,
        host_user_id: userContext.psn,
        meeting_type,
        title,
        description,
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        timezone,
        status: 'SCHEDULED',
        meeting_link: meetingLink,
        meeting_password: meetingPassword,
        max_participants: Number(max_participants) || 50,
        is_recording_enabled: Boolean(is_recording_enabled),
        allow_screen_share: allow_screen_share !== false,
        allow_chat: allow_chat !== false,
        mute_on_join: Boolean(mute_on_join),
        waiting_room_enabled: Boolean(waiting_room_enabled),
        related_lead_id: related_lead_id && mongoose.Types.ObjectId.isValid(related_lead_id) ? new mongoose.Types.ObjectId(related_lead_id) : undefined,
        related_shared_lead_id: finalSharedLeadId,
        related_client_id,
        related_project_id,
        relationship_id: finalRelationshipId,
        participant_tenant_ids: allParticipantTenants,
        participant_user_ids: Array.isArray(participant_user_ids) ? participant_user_ids.map(Number).filter(n => !isNaN(n)) : [],
        visibility_scope,
        created_by: userContext.psn,
        created_at: now,
        updated_at: now
      }], { session });

      // Automatically register Host in MeetingParticipant
      await MeetingParticipant.create([{
        meeting_id: nextId,
        user_id: userContext.psn,
        tenant_id: hostTenantObjId,
        response_status: 'ACCEPTED',
        is_host: true,
        invited_at: now,
        accepted_at: now,
        created_at: now,
        updated_at: now
      }], { session });

      // Create Invitations and Participant stubs for invited users
      if (Array.isArray(participant_user_ids)) {
        for (const pUserId of participant_user_ids) {
          const numPsn = Number(pUserId);
          if (isNaN(numPsn) || numPsn === userContext.psn) continue;

          const pUser = await UserInfo.findOne({
            $or: [
              { psn: numPsn },
              { staff_id: String(pUserId) }
            ]
          }).session(session).lean() as any;

          const inviteeEmail = pUser?.email || `user_${numPsn}@organization.internal`;
          const inviteeTenant = pUser?.tenant_id || hostTenantObjId;

          await MeetingInvitation.create([{
            meeting_id: nextId,
            invitee_user_id: numPsn,
            invitee_email: inviteeEmail,
            invitee_name: pUser?.firstname ? `${pUser.firstname} ${pUser.lastname || ''}`.trim() : `User ${numPsn}`,
            invitee_tenant_id: inviteeTenant,
            invited_by: userContext.psn,
            status: 'PENDING',
            sent_at: now,
            created_at: now,
            updated_at: now
          }], { session });

          await MeetingParticipant.create([{
            meeting_id: nextId,
            user_id: numPsn,
            tenant_id: inviteeTenant,
            response_status: 'PENDING',
            is_host: false,
            invited_at: now,
            created_at: now,
            updated_at: now
          }], { session });

          // Send In-App Notification
          try {
            await sendNotification({
              tenant_id: inviteeTenant.toString(),
              from: userContext.psn.toString(),
              meeting_id: nextId,
              type: 'meeting',
              action: 'MEETING_INVITATION',
              content: `${userContext.userName} invited you to a meeting "${title}" scheduled for ${startTime.toLocaleString()}`,
              recipients: [{
                person_id: numPsn.toString(),
                role_type: 'staff',
                tenant_id: inviteeTenant.toString()
              }]
            });
          } catch (notifErr) {
            // Non-blocking notification failure
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: "Meeting scheduled successfully.",
        data: newMeeting
      });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("[Create Meeting Error]", err);
      res.status(500).json({ success: false, error: err.message || "Failed to create meeting." });
    }
  }

  /**
   * 2. Instant Meeting Creation
   */
  static async createInstantMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied: Unable to resolve authenticated user." });
        return;
      }

      const nextId = await getNextMeetingId();
      const meetingLink = uuidv4();
      const now = new Date();
      const endTime = new Date(now.getTime() + 3600000);
      const hostTenantObjId = new mongoose.Types.ObjectId(userContext.tenantId);

      const meeting = await Meeting.create({
        meeting_id: nextId,
        tenant_id: hostTenantObjId,
        host_tenant_id: hostTenantObjId,
        host_user_id: userContext.psn,
        meeting_type: 'INTERNAL',
        title: req.body.title || `Instant Meeting #${nextId}`,
        description: req.body.description || "Ad-hoc collaboration meeting",
        scheduled_start_time: now,
        scheduled_end_time: endTime,
        actual_start_time: now,
        status: 'IN_PROGRESS',
        meeting_link: meetingLink,
        created_by: userContext.psn,
        created_at: now,
        updated_at: now
      });

      await MeetingParticipant.create({
        meeting_id: nextId,
        user_id: userContext.psn,
        tenant_id: hostTenantObjId,
        response_status: 'ACCEPTED',
        is_host: true,
        join_time: now,
        created_at: now,
        updated_at: now
      });

      res.status(201).json({
        success: true,
        message: "Instant meeting created.",
        data: meeting
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to create instant meeting." });
    }
  }

  /**
   * 3. Get Meetings List (Filtered & Multi-Tenant Authorized)
   */
  static async getMeetings(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied: Unauthorized." });
        return;
      }

      const { status, type, start_date, end_date, related_lead_id, related_project_id, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const userTenantObjId = new mongoose.Types.ObjectId(userContext.tenantId);

      const query: any = {
        $or: [
          { tenant_id: userTenantObjId },
          { host_tenant_id: userTenantObjId },
          { participant_tenant_ids: userTenantObjId },
          { host_user_id: userContext.psn },
          { participant_user_ids: userContext.psn }
        ]
      };

      if (status && status !== 'all') {
        query.status = status;
      }
      if (type && type !== 'all') {
        query.meeting_type = type;
      }
      if (related_lead_id) {
        query.related_lead_id = new mongoose.Types.ObjectId(String(related_lead_id));
      }
      if (related_project_id) {
        query.related_project_id = related_project_id;
      }
      if (start_date || end_date) {
        query.scheduled_start_time = {};
        if (start_date) query.scheduled_start_time.$gte = new Date(String(start_date));
        if (end_date) query.scheduled_start_time.$lte = new Date(String(end_date));
      }

      const [meetings, total] = await Promise.all([
        Meeting.find(query)
          .populate('tenant_id', 'company_name name tenant_code')
          .populate('host_tenant_id', 'company_name name tenant_code')
          .populate('participant_tenant_ids', 'company_name name tenant_code')
          .sort({ scheduled_start_time: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Meeting.countDocuments(query)
      ]);

      // Enrich with host and participant details
      const enriched = await Promise.all(meetings.map(async (m: any) => {
        const [hostUser, participants] = await Promise.all([
          UserInfo.findOne({ psn: m.host_user_id }).lean() as any,
          MeetingParticipant.find({ meeting_id: m.meeting_id }).lean()
        ]);

        return {
          ...m,
          id: m.meeting_id,
          host_name: hostUser?.firstname ? `${hostUser.firstname} ${hostUser.lastname || ''}`.trim() : `Host (${m.host_user_id})`,
          participant_count: participants.length,
          participants
        };
      }));

      res.status(200).json({
        success: true,
        data: enriched,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch meetings." });
    }
  }

  /**
   * 4. Unified Calendar Endpoint (Requirement 30 & 31: Single Source of Truth)
   * GET /api/meetings/calendar
   */
  static async getCalendar(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied: Unauthorized." });
        return;
      }

      const { start_date, end_date, timezone = 'Asia/Kolkata', filter = 'all' } = req.query;
      const userTenantObjId = new mongoose.Types.ObjectId(userContext.tenantId);

      const query: any = {
        $or: [
          { tenant_id: userTenantObjId },
          { host_tenant_id: userTenantObjId },
          { participant_tenant_ids: userTenantObjId },
          { host_user_id: userContext.psn },
          { participant_user_ids: userContext.psn }
        ]
      };

      if (filter === 'my') {
        query.$or = [{ host_user_id: userContext.psn }, { participant_user_ids: userContext.psn }];
      } else if (filter === 'inter_org') {
        query.meeting_type = 'INTER_ORGANIZATION';
      } else if (filter === 'client') {
        query.meeting_type = 'CLIENT';
      } else if (filter === 'project') {
        query.meeting_type = 'PROJECT';
      } else if (filter === 'lead') {
        query.meeting_type = 'LEAD';
      }

      if (start_date || end_date) {
        query.scheduled_start_time = {};
        if (start_date) query.scheduled_start_time.$gte = new Date(String(start_date));
        if (end_date) query.scheduled_start_time.$lte = new Date(String(end_date));
      }

      const meetings = await Meeting.find(query)
        .populate('tenant_id', 'company_name name tenant_code')
        .populate('host_tenant_id', 'company_name name tenant_code')
        .populate('related_lead_id', 'lead_name company_name email phone')
        .sort({ scheduled_start_time: 1 })
        .lean();

      // Normalize into unified calendar event payload
      const calendarEvents = await Promise.all(meetings.map(async (m: any) => {
        const isHost = m.host_user_id === userContext.psn;
        const hostUser = await UserInfo.findOne({ psn: m.host_user_id }).lean() as any;
        const hostName = hostUser?.firstname ? `${hostUser.firstname} ${hostUser.lastname || ''}`.trim() : 'Host';

        // Color coding by type/status
        let color = '#4F46E5'; // Indigo default
        if (m.meeting_type === 'INTER_ORGANIZATION') color = '#0D9488'; // Teal
        else if (m.meeting_type === 'PROJECT') color = '#2563EB'; // Blue
        else if (m.meeting_type === 'LEAD') color = '#D97706'; // Amber
        else if (m.status === 'COMPLETED' || m.status === 'completed') color = '#10B981'; // Emerald
        else if (m.status === 'CANCELLED' || m.status === 'cancelled') color = '#EF4444'; // Rose

        return {
          id: m.meeting_id,
          meeting_id: m.meeting_id,
          title: m.title,
          description: m.description,
          start: m.scheduled_start_time,
          end: m.scheduled_end_time || new Date(new Date(m.scheduled_start_time).getTime() + 3600000),
          meeting_type: m.meeting_type,
          status: m.status,
          host_name: hostName,
          host_user_id: m.host_user_id,
          host_tenant: m.host_tenant_id?.company_name || m.tenant_id?.company_name || 'Organization',
          meeting_link: m.meeting_link ? `/meetings/room/${m.meeting_link}` : `/meetings/room/${m.meeting_id}`,
          related_lead: m.related_lead_id,
          related_project: m.related_project_id,
          color,
          can_edit: isHost,
          can_join: m.status !== 'CANCELLED' && m.status !== 'cancelled'
        };
      }));

      res.status(200).json({
        success: true,
        data: calendarEvents,
        total: calendarEvents.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch calendar events." });
    }
  }

  /**
   * 5. Get Meeting Details by ID
   */
  static async getMeetingById(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const authCheck = await MeetingAccessService.canViewMeeting(meeting, userContext);
      if (!authCheck.authorized) {
        res.status(403).json({ success: false, error: authCheck.reason || "Access Denied." });
        return;
      }

      const [participants, notes, documents, polls, recordings, outcome, hostUser] = await Promise.all([
        MeetingParticipant.find({ meeting_id: meeting.meeting_id }).lean(),
        MeetingNotes.findOne({ meeting_id: meeting.meeting_id }).lean(),
        MeetingDocument.find({ meeting_id: meeting.meeting_id }).lean(),
        MeetingPoll.find({ meeting_id: meeting.meeting_id }).lean(),
        MeetingRecording.find({ meeting_id: meeting.meeting_id }).lean(),
        MeetingOutcome.findOne({ meeting_id: meeting.meeting_id }).lean(),
        UserInfo.findOne({ psn: meeting.host_user_id }).lean() as any
      ]);

      res.status(200).json({
        success: true,
        data: {
          ...meeting.toObject(),
          id: meeting.meeting_id,
          host_name: hostUser?.firstname ? `${hostUser.firstname} ${hostUser.lastname || ''}`.trim() : 'Host',
          is_host: authCheck.isHost,
          participants,
          notes,
          documents,
          polls,
          recordings,
          outcome
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch meeting details." });
    }
  }

  /**
   * 6. Update Meeting
   */
  static async updateMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!MeetingAccessService.isHost(meeting, userContext)) {
        res.status(403).json({ success: false, error: "Only the meeting host can modify meeting parameters." });
        return;
      }

      const { title, description, scheduled_start_time, scheduled_end_time, timezone, max_participants, is_recording_enabled, allow_screen_share, allow_chat } = req.body;

      if (scheduled_start_time || scheduled_end_time) {
        const start = scheduled_start_time ? new Date(scheduled_start_time) : meeting.scheduled_start_time;
        const end = scheduled_end_time ? new Date(scheduled_end_time) : meeting.scheduled_end_time;
        
        if (end <= start) {
          res.status(400).json({ success: false, error: "End time must be after start time." });
          return;
        }

        const conflictCheck = await MeetingAccessService.validateSchedulingConflicts(
          meeting.host_user_id,
          start,
          end,
          meeting.meeting_id
        );

        if (conflictCheck.hasConflict) {
          res.status(409).json({ success: false, error: "Rescheduling conflict detected.", conflict: conflictCheck.conflictingMeeting });
          return;
        }

        meeting.scheduled_start_time = start;
        meeting.scheduled_end_time = end;
      }

      if (title) meeting.title = title;
      if (description !== undefined) meeting.description = description;
      if (timezone) meeting.timezone = timezone;
      if (max_participants) meeting.max_participants = Number(max_participants);
      if (is_recording_enabled !== undefined) meeting.is_recording_enabled = Boolean(is_recording_enabled);
      if (allow_screen_share !== undefined) meeting.allow_screen_share = Boolean(allow_screen_share);
      if (allow_chat !== undefined) meeting.allow_chat = Boolean(allow_chat);

      meeting.updated_at = new Date();
      await meeting.save();

      res.status(200).json({ success: true, message: "Meeting updated successfully.", data: meeting });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to update meeting." });
    }
  }

  /**
   * 7. Cancel Meeting
   */
  static async cancelMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!MeetingAccessService.isHost(meeting, userContext)) {
        res.status(403).json({ success: false, error: "Only the host can cancel this meeting." });
        return;
      }

      meeting.status = 'CANCELLED';
      meeting.updated_at = new Date();
      await meeting.save();

      // Cancel all pending invitations
      await MeetingInvitation.updateMany(
        { meeting_id: meeting.meeting_id },
        { $set: { status: 'CANCELLED', updated_at: new Date() } }
      );

      res.status(200).json({ success: true, message: "Meeting cancelled successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to cancel meeting." });
    }
  }

  /**
   * 8. Delete Meeting
   */
  static async deleteMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!MeetingAccessService.isHost(meeting, userContext)) {
        res.status(403).json({ success: false, error: "Only the host can delete this meeting." });
        return;
      }

      await Promise.all([
        Meeting.deleteOne({ _id: meeting._id }),
        MeetingParticipant.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingInvitation.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingNotes.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingChatMessage.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingPoll.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingPollVote.deleteMany({ meeting_id: meeting.meeting_id }),
        MeetingDocument.deleteMany({ meeting_id: meeting.meeting_id })
      ]);

      res.status(200).json({ success: true, message: "Meeting deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to delete meeting." });
    }
  }

  /**
   * 9. Join Meeting (REST Authorization & Duration Registration)
   */
  static async joinMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const joinAuth = await MeetingAccessService.canJoinMeeting(meeting, userContext);
      if (!joinAuth.authorized) {
        res.status(403).json({ success: false, error: joinAuth.reason || "Unauthorized to join." });
        return;
      }

      const now = new Date();
      await MeetingParticipant.findOneAndUpdate(
        { meeting_id: meeting.meeting_id, user_id: userContext.psn },
        {
          $set: {
            tenant_id: new mongoose.Types.ObjectId(userContext.tenantId),
            response_status: 'ACCEPTED',
            is_host: joinAuth.isHost,
            join_time: now,
            updated_at: now
          },
          $setOnInsert: {
            invited_at: now,
            created_at: now
          }
        },
        { upsert: true, new: true }
      );

      if (meeting.status === 'SCHEDULED' || meeting.status === 'scheduled') {
        meeting.status = 'IN_PROGRESS';
        meeting.actual_start_time = now;
        meeting.updated_at = now;
        await meeting.save();
      }

      res.status(200).json({
        success: true,
        message: "Joined meeting successfully.",
        data: {
          meeting_id: meeting.meeting_id,
          meeting_link: meeting.meeting_link,
          is_host: joinAuth.isHost,
          is_approved: joinAuth.isApproved
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to join meeting." });
    }
  }

  /**
   * 10. Leave Meeting (Calculates Duration)
   */
  static async leaveMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const now = new Date();
      const participant = await MeetingParticipant.findOne({
        meeting_id: meeting.meeting_id,
        user_id: userContext.psn
      }).sort({ join_time: -1 });

      if (participant && participant.join_time) {
        participant.leave_time = now;
        participant.duration_seconds = Math.max(0, Math.round((now.getTime() - participant.join_time.getTime()) / 1000));
        participant.updated_at = now;
        await participant.save();
      }

      res.status(200).json({ success: true, message: "Left meeting successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to leave meeting." });
    }
  }

  /**
   * 11. End Meeting (Host Closes Room & Durations)
   */
  static async endMeeting(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!MeetingAccessService.isHost(meeting, userContext)) {
        res.status(403).json({ success: false, error: "Only the host can end this meeting." });
        return;
      }

      const now = new Date();
      meeting.status = 'COMPLETED';
      meeting.actual_end_time = now;
      meeting.updated_at = now;
      await meeting.save();

      // Close all open participant durations
      const openParticipants = await MeetingParticipant.find({
        meeting_id: meeting.meeting_id,
        leave_time: { $exists: false }
      });

      for (const p of openParticipants) {
        const joinMs = p.join_time ? p.join_time.getTime() : now.getTime();
        p.leave_time = now;
        p.duration_seconds = Math.max(0, Math.round((now.getTime() - joinMs) / 1000));
        p.updated_at = now;
        await p.save();
      }

      res.status(200).json({ success: true, message: "Meeting ended and durations recorded." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to end meeting." });
    }
  }

  /**
   * 12. Invite Participant
   */
  static async inviteParticipant(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const { user_id, email, name } = req.body;
      const numUserId = user_id ? Number(user_id) : undefined;
      const cleanEmail = email ? String(email).trim() : '';

      if (!numUserId && !cleanEmail) {
        res.status(400).json({ success: false, error: "User ID or Email is required for invitation." });
        return;
      }

      const now = new Date();
      let targetTenant = meeting.tenant_id;

      if (numUserId) {
        const pUser = await UserInfo.findOne({
          $or: [{ psn: numUserId }, { staff_id: String(user_id) }]
        }).lean() as any;

        if (pUser && pUser.tenant_id) {
          targetTenant = pUser.tenant_id;
        }

        // Add to MeetingParticipant
        await MeetingParticipant.findOneAndUpdate(
          { meeting_id: meeting.meeting_id, user_id: numUserId },
          {
            $set: {
              tenant_id: targetTenant,
              response_status: 'PENDING',
              invited_at: now,
              updated_at: now
            },
            $setOnInsert: { created_at: now, is_host: false }
          },
          { upsert: true }
        );
      }

      const invitation = await MeetingInvitation.create({
        meeting_id: meeting.meeting_id,
        invitee_user_id: numUserId,
        invitee_email: cleanEmail || `user_${numUserId}@internal`,
        invitee_name: name,
        invitee_tenant_id: targetTenant,
        invited_by: userContext.psn,
        status: 'PENDING',
        sent_at: now,
        created_at: now,
        updated_at: now
      });

      res.status(201).json({ success: true, message: "Invitation sent successfully.", data: invitation });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to invite participant." });
    }
  }

  /**
   * 13. Respond to Invitation (STRICT: Derives user from authenticated JWT)
   */
  static async respondInvitation(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const { response_status } = req.body;
      const statusUpper = String(response_status || '').toUpperCase();

      if (!['ACCEPTED', 'DECLINED', 'MAYBE'].includes(statusUpper)) {
        res.status(400).json({ success: false, error: "response_status must be 'ACCEPTED', 'DECLINED', or 'MAYBE'." });
        return;
      }

      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (meeting.status === 'CANCELLED' || meeting.status === 'cancelled') {
        res.status(400).json({ success: false, error: "Cannot respond to a cancelled meeting." });
        return;
      }

      const now = new Date();

      await Promise.all([
        MeetingInvitation.findOneAndUpdate(
          { meeting_id: meeting.meeting_id, invitee_user_id: userContext.psn },
          {
            $set: {
              status: statusUpper,
              accepted_at: statusUpper === 'ACCEPTED' ? now : undefined,
              declined_at: statusUpper === 'DECLINED' ? now : undefined,
              updated_at: now
            }
          }
        ),
        MeetingParticipant.findOneAndUpdate(
          { meeting_id: meeting.meeting_id, user_id: userContext.psn },
          {
            $set: {
              response_status: statusUpper,
              accepted_at: statusUpper === 'ACCEPTED' ? now : undefined,
              declined_at: statusUpper === 'DECLINED' ? now : undefined,
              updated_at: now
            },
            $setOnInsert: {
              tenant_id: new mongoose.Types.ObjectId(userContext.tenantId),
              is_host: false,
              invited_at: now,
              created_at: now
            }
          },
          { upsert: true }
        )
      ]);

      res.status(200).json({ success: true, message: `Invitation ${statusUpper.toLowerCase()} successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to record response." });
    }
  }

  /**
   * 14. Record Meeting Outcome & Lead Activity
   * POST /api/meetings/:meeting_id/outcome
   */
  static async recordMeetingOutcome(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const { outcome, notes, next_action, next_action_date, lead_id } = req.body;
      if (!outcome) {
        res.status(400).json({ success: false, error: "Meeting outcome is required." });
        return;
      }

      const now = new Date();
      const outcomeDoc = await MeetingOutcome.findOneAndUpdate(
        { meeting_id: meeting.meeting_id },
        {
          $set: {
            lead_id: lead_id || meeting.related_lead_id,
            recorded_by: userContext.psn,
            recorded_by_tenant_id: new mongoose.Types.ObjectId(userContext.tenantId),
            outcome,
            notes,
            next_action,
            next_action_date: next_action_date ? new Date(next_action_date) : undefined,
            updated_at: now
          },
          $setOnInsert: { created_at: now }
        },
        { upsert: true, new: true }
      );

      // If linked to lead, update Lead activity history
      const targetLeadId = lead_id || meeting.related_lead_id;
      if (targetLeadId) {
        try {
          await Lead.findByIdAndUpdate(targetLeadId, {
            $push: {
              activities: {
                action: 'MEETING_OUTCOME_RECORDED',
                notes: `Meeting #${meeting.meeting_id} Outcome: ${outcome}. Notes: ${notes || 'N/A'}`,
                timestamp: now,
                actor: userContext.userName
              }
            }
          });
        } catch (leadErr) {
          // Non-blocking lead activity sync
        }
      }

      res.status(200).json({
        success: true,
        message: "Meeting outcome recorded successfully.",
        data: outcomeDoc
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to record meeting outcome." });
    }
  }

  /**
   * 15. Meeting Notes (Version-Controlled)
   */
  static async getMeetingNotes(req: Request, res: Response): Promise<void> {
    try {
      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const notes = await MeetingNotes.findOne({ meeting_id: meeting.meeting_id }).lean();
      res.status(200).json({ success: true, data: notes || { content: "", notes_version: 1 } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch notes." });
    }
  }

  static async updateMeetingNotes(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const { content, note_type = 'SHARED' } = req.body;
      const updated = await MeetingNotes.findOneAndUpdate(
        { meeting_id: meeting.meeting_id },
        {
          $set: {
            tenant_id: new mongoose.Types.ObjectId(userContext.tenantId),
            note_type,
            content: content || "",
            last_updated_by: userContext.psn,
            updated_at: new Date()
          },
          $inc: { notes_version: 1 }
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ success: true, message: "Notes saved.", data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save notes." });
    }
  }

  /**
   * 16. Documents
   */
  static async getMeetingDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const docs = await MeetingDocument.find({ meeting_id: meeting.meeting_id }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: docs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch documents." });
    }
  }

  static async uploadMeetingDocument(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: "No file uploaded." });
        return;
      }

      const fileUrl = `/uploads/documents/${req.file.filename}`;
      const doc = await MeetingDocument.create({
        meeting_id: meeting.meeting_id,
        tenant_id: new mongoose.Types.ObjectId(userContext.tenantId),
        uploader_user_id: userContext.psn,
        title: req.body.title || req.file.originalname,
        file_url: fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        visibility_scope: req.body.visibility_scope || 'MEETING_SHARED',
        created_at: new Date()
      });

      res.status(201).json({ success: true, message: "Document uploaded.", data: doc });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to upload document." });
    }
  }

  /**
   * 17. Polls
   */
  static async getMeetingPolls(req: Request, res: Response): Promise<void> {
    try {
      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const polls = await MeetingPoll.find({ meeting_id: meeting.meeting_id }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: polls });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch polls." });
    }
  }

  static async createMeetingPoll(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      const { question, options, allow_multiple } = req.body;
      if (!question || !Array.isArray(options) || options.length < 2) {
        res.status(400).json({ success: false, error: "Question and at least 2 options are required." });
        return;
      }

      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const poll = await MeetingPoll.create({
        meeting_id: meeting.meeting_id,
        poll_id: pollId,
        question,
        options: options.map(String),
        votes: {},
        allow_multiple: Boolean(allow_multiple),
        is_active: true,
        created_by: userContext.psn,
        created_at: new Date(),
        updated_at: new Date()
      });

      res.status(201).json({ success: true, message: "Poll created.", data: poll });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to create poll." });
    }
  }

  /**
   * 18. Recordings
   */
  static async getMeetingRecordings(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const query: any = {};
      if (meeting_id) {
        const meeting = await resolveMeetingDoc(meeting_id);
        if (meeting) query.meeting_id = meeting.meeting_id;
      }

      const recordings = await MeetingRecording.find(query).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: recordings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch recordings." });
    }
  }

  static async uploadMeetingRecording(req: Request, res: Response): Promise<void> {
    try {
      const userContext = await MeetingAccessService.resolveUserContext(req.user);
      if (!userContext) {
        res.status(403).json({ success: false, error: "Access Denied." });
        return;
      }

      const { meeting_id } = req.params;
      const meeting = await resolveMeetingDoc(meeting_id);
      if (!meeting) {
        res.status(404).json({ success: false, error: "Meeting not found." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: "No recording file uploaded." });
        return;
      }

      const recordingUrl = `/uploads/recordings/${req.file.filename}`;
      const rec = await MeetingRecording.create({
        meeting_id: meeting.meeting_id,
        recording_url: recordingUrl,
        recording_type: req.file.mimetype,
        file_size: req.file.size,
        duration_seconds: req.body.duration_seconds ? Number(req.body.duration_seconds) : undefined,
        storage_provider: 'local',
        storage_path: req.file.path,
        recorded_by: userContext.psn,
        created_at: new Date(),
        updated_at: new Date()
      });

      meeting.recording_url = recordingUrl;
      meeting.updated_at = new Date();
      await meeting.save();

      res.status(201).json({ success: true, message: "Recording uploaded.", data: rec });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to upload recording." });
    }
  }
}

function numPsn(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export default MeetingController;
