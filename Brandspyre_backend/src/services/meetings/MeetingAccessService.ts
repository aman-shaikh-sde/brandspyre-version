import mongoose from "mongoose";
import { Meeting, MeetingParticipant, IMeeting } from "../../db/ModelSceham/meetingSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { UserTenant } from "../../db/ModelSceham/saasSchema";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import { TenantRelationship } from "../../db/ModelSceham/tenantRelationshipSchema";

export interface ResolvedUserContext {
  userId: string;
  psn: number;
  userName: string;
  tenantId: string;
  userRole: string;
  email?: string;
}

export class MeetingAccessService {
  /**
   * 1. Resolve User and Tenant context from authenticated payload or DB
   * STRICT: No fallback to hardcoded tenant '1' or user '1'
   */
  static async resolveUserContext(authPayload: any): Promise<ResolvedUserContext | null> {
    if (!authPayload) return null;

    const rawUserId = authPayload.userId || authPayload.staff_id || authPayload.id || authPayload._id;
    if (!rawUserId) return null;

    const query: any = {
      $or: [
        ...(mongoose.Types.ObjectId.isValid(String(rawUserId)) ? [{ _id: new mongoose.Types.ObjectId(String(rawUserId)) }] : []),
        { staff_id: String(rawUserId) },
        ...(isNaN(Number(rawUserId)) ? [] : [{ psn: Number(rawUserId) }]),
        ...(authPayload.email ? [{ email: authPayload.email }] : [])
      ]
    };

    const userDoc = await UserInfo.findOne(query).lean() as any;
    if (!userDoc) {
      // If user not in UserInfo, check if authPayload already has valid psn and tenantId
      const tokenTenant = authPayload.tenantId || authPayload.tenant_id;
      if (tokenTenant && mongoose.Types.ObjectId.isValid(String(tokenTenant))) {
        return {
          userId: String(rawUserId),
          psn: Number(authPayload.psn || rawUserId || 0),
          userName: authPayload.userName || authPayload.name || "User",
          tenantId: String(tokenTenant),
          userRole: authPayload.userRole || authPayload.role || "user",
          email: authPayload.email
        };
      }
      return null;
    }

    let resolvedTenantId = userDoc.tenant_id ? String(userDoc.tenant_id) : (authPayload.tenantId || authPayload.tenant_id);

    if (!resolvedTenantId || !mongoose.Types.ObjectId.isValid(String(resolvedTenantId))) {
      const userTenant = await UserTenant.findOne({ user_id: userDoc._id, is_active: true }).lean() as any;
      if (userTenant && userTenant.tenant_id) {
        resolvedTenantId = String(userTenant.tenant_id);
      }
    }

    if (!resolvedTenantId || !mongoose.Types.ObjectId.isValid(String(resolvedTenantId))) {
      return null; // Strict: Tenant cannot be resolved
    }

    const fullName = `${userDoc.firstname || ""} ${userDoc.lastname || ""}`.trim() || userDoc.name || authPayload.userName || "User";

    return {
      userId: userDoc.staff_id ? String(userDoc.staff_id) : String(userDoc._id),
      psn: userDoc.psn || Number(rawUserId) || 0,
      userName: fullName,
      tenantId: resolvedTenantId,
      userRole: authPayload.userRole || authPayload.role || userDoc.role || "user",
      email: userDoc.email || authPayload.email
    };
  }

  /**
   * 2. Verify View Access
   */
  static async canViewMeeting(
    meeting: any,
    user: ResolvedUserContext
  ): Promise<{ authorized: boolean; reason?: string; isHost?: boolean }> {
    if (user.userRole === "superadmin" || user.userRole === "Super Admin") {
      return { authorized: true, isHost: true };
    }

    const isHostUser = meeting.host_user_id === user.psn || meeting.created_by === user.psn;
    const meetingTenantStr = String(meeting.tenant_id || meeting.host_tenant_id || "");
    const userTenantStr = String(user.tenantId || "");

    const participantDoc = await MeetingParticipant.findOne({
      meeting_id: meeting.meeting_id || meeting.id,
      user_id: user.psn
    }).lean();

    if (meeting.meeting_type === "INTER_ORGANIZATION") {
      const hostTenantStr = String(meeting.host_tenant_id || meeting.tenant_id || "");
      const isHostTenant = hostTenantStr === userTenantStr;
      const isParticipantTenant = meeting.participant_tenant_ids?.some((pt: any) => String(pt) === userTenantStr);
      const isExplicitParticipant = meeting.participant_user_ids?.includes(user.psn) || Boolean(participantDoc);
      const isOrgAdmin = user.userRole === "admin" && (isHostTenant || isParticipantTenant);

      if (!isHostUser && !isHostTenant && !isParticipantTenant && !isExplicitParticipant && !isOrgAdmin) {
        return { authorized: false, reason: "You do not belong to a participating organization for this meeting" };
      }

      if (meeting.related_lead_id) {
        const shareAccess = await LeadShareAccess.findOne({
          lead_id: meeting.related_lead_id,
          $or: [{ owner_tenant_id: userTenantStr }, { shared_tenant_id: userTenantStr }]
        }).lean() as any;

        if (shareAccess && ["recalled", "rejected", "expired"].includes(shareAccess.share_status)) {
          if (!participantDoc && !isHostUser) {
            return { authorized: false, reason: "Shared lead access has been revoked or expired" };
          }
        }
      }

      return { authorized: true, isHost: isHostUser || (isOrgAdmin && isHostTenant) };
    }

    // INTERNAL, CLIENT, PROJECT, LEAD meetings
    const isSameTenant = meetingTenantStr === userTenantStr;
    const isOrgAdmin = user.userRole === "admin" && isSameTenant;

    if (!isHostUser && !isOrgAdmin && !isSameTenant && !participantDoc) {
      return { authorized: false, reason: "Access Denied: You are not authorized to view this meeting" };
    }

    return { authorized: true, isHost: isHostUser || isOrgAdmin };
  }

  /**
   * 3. Verify Join Access (Used by both REST /join and Socket.IO join-meeting)
   */
  static async canJoinMeeting(
    meeting: any,
    user: ResolvedUserContext
  ): Promise<{ authorized: boolean; reason?: string; isHost: boolean; isApproved: boolean }> {
    const statusUpper = String(meeting.status || "").toUpperCase();
    if (statusUpper === "CANCELLED") {
      return { authorized: false, reason: "Meeting has been cancelled", isHost: false, isApproved: false };
    }
    if (statusUpper === "COMPLETED") {
      return { authorized: false, reason: "Meeting has already ended", isHost: false, isApproved: false };
    }

    const viewAuth = await this.canViewMeeting(meeting, user);
    if (!viewAuth.authorized) {
      return { authorized: false, reason: viewAuth.reason || "Unauthorized to join this meeting", isHost: false, isApproved: false };
    }

    const isHost = Boolean(viewAuth.isHost);
    const waitingRoomEnabled = meeting.waiting_room_enabled === true;
    
    // Check if participant is already approved in DB
    const participant = await MeetingParticipant.findOne({
      meeting_id: meeting.meeting_id || meeting.id,
      user_id: user.psn
    }).lean() as any;

    const isApproved = isHost || !waitingRoomEnabled || (participant && participant.response_status === 'ACCEPTED');

    return {
      authorized: true,
      isHost,
      isApproved
    };
  }

  /**
   * 4. Verify Host Authority
   */
  static isHost(meeting: any, user: ResolvedUserContext): boolean {
    if (user.userRole === "superadmin" || user.userRole === "Super Admin") return true;
    return meeting.host_user_id === user.psn || meeting.created_by === user.psn;
  }

  /**
   * 5. Validate Inter-Organization Eligibility (STRICT: NO AUTO-CREATION OF RELATIONSHIPS)
   */
  static async validateInterOrgEligibility(
    hostTenantId: string,
    partnerTenantId: string,
    relatedLeadId?: string,
    relatedSharedLeadId?: string
  ): Promise<{ eligible: boolean; reason?: string; relationshipId?: mongoose.Types.ObjectId; sharedLeadId?: mongoose.Types.ObjectId }> {
    if (!hostTenantId || !partnerTenantId) {
      return { eligible: false, reason: "Both host and partner organization IDs are required for inter-organization meetings." };
    }

    if (hostTenantId === partnerTenantId) {
      return { eligible: true }; // Same organization
    }

    // Check active bilateral TenantRelationship
    const relationship = await TenantRelationship.findOne({
      $or: [
        { initiator_tenant_id: hostTenantId, target_tenant_id: partnerTenantId, status: "active" },
        { initiator_tenant_id: partnerTenantId, target_tenant_id: hostTenantId, status: "active" }
      ]
    }).lean() as any;

    // Check active LeadShareAccess
    let shareQuery: any = {
      $or: [
        { owner_tenant_id: hostTenantId, shared_tenant_id: partnerTenantId, share_status: { $in: ["accepted", "active", "shared", "assigned", "working"] } },
        { owner_tenant_id: partnerTenantId, shared_tenant_id: hostTenantId, share_status: { $in: ["accepted", "active", "shared", "assigned", "working"] } }
      ]
    };

    if (relatedLeadId && mongoose.Types.ObjectId.isValid(relatedLeadId)) {
      shareQuery.lead_id = new mongoose.Types.ObjectId(relatedLeadId);
    }
    if (relatedSharedLeadId && mongoose.Types.ObjectId.isValid(relatedSharedLeadId)) {
      shareQuery._id = new mongoose.Types.ObjectId(relatedSharedLeadId);
    }

    const shareAccess = await LeadShareAccess.findOne(shareQuery).lean() as any;

    if (!relationship && !shareAccess) {
      return {
        eligible: false,
        reason: "Access Denied: No active business relationship or shared lead exists between your organization and the partner organization."
      };
    }

    return {
      eligible: true,
      relationshipId: relationship ? relationship._id : undefined,
      sharedLeadId: shareAccess ? shareAccess._id : undefined
    };
  }

  /**
   * 6. Validate Scheduling Conflicts
   */
  static async validateSchedulingConflicts(
    hostUserId: number,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: number
  ): Promise<{ hasConflict: boolean; conflictingMeeting?: any }> {
    const query: any = {
      host_user_id: hostUserId,
      status: { $in: ["SCHEDULED", "IN_PROGRESS", "scheduled", "in_progress"] },
      scheduled_start_time: { $lt: endTime },
      scheduled_end_time: { $gt: startTime }
    };

    if (excludeMeetingId) {
      query.meeting_id = { $ne: excludeMeetingId };
    }

    const conflict = await Meeting.findOne(query).lean() as any;
    if (conflict) {
      return {
        hasConflict: true,
        conflictingMeeting: {
          meeting_id: conflict.meeting_id,
          title: conflict.title,
          start: conflict.scheduled_start_time,
          end: conflict.scheduled_end_time
        }
      };
    }

    return { hasConflict: false };
  }
}

export default MeetingAccessService;
