import mongoose, { Schema, Document } from "mongoose";
import { permissionsAccess } from "../../controllers/accountSetting/create";

export interface IRoleAccess extends Document {
  branchcode?: string;
  role?: string;
  project?: Record<string, any>;
  task?: Record<string, any>;
  milestone?: Record<string, any>;
  teamMembers?: Record<string, any>;
  branches?: Record<string, any>;
  invoices?: Record<string, any>;
  campaign?: Record<string, any>;
  leads?: Record<string, any>;
  client?: Record<string, any>;
  followingRecords?: Record<string, any>;
  profile?: Record<string, any>;
  event?: Record<string, any>;
  announcement?: Record<string, any>;
  subscription?: Record<string, any>;
  financial?: Record<string, any>;
  roles?: Record<string, any>;
  tax?: Record<string, any>;
  payment?: Record<string, any>;
  calendar?: Record<string, any>;
  notification?: Record<string, any>;
  reminder?: Record<string, any>;
  reportAnalysis?: Record<string, any>;
  activityLog?: Record<string, any>;
  mom?: Record<string, any>;
  userInfo?: Record<string, any>;
  salary?: Record<string, any>;
  leaveRequest?: Record<string, any>;
  leaveApproved?: Record<string, any>;
  employeeReport?: Record<string, any>;
  document?: Record<string, any>;
  sharedDocument?: Record<string, any>;
  fileUpload?: Record<string, any>;
  dashboard?: Record<string, any>;
  accounts?: Record<string, any>;
  create_datetime?: Date;
  last_update_datetime?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

export interface IRoleAccessLog extends Document {
  role_id: mongoose.Types.ObjectId;
  branchcode?: string;
  role?: string;
  project?: Record<string, any>;
  task?: Record<string, any>;
  milestone?: Record<string, any>;
  teamMembers?: Record<string, any>;
  branches?: Record<string, any>;
  invoices?: Record<string, any>;
  campaign?: Record<string, any>;
  leads?: Record<string, any>;
  client?: Record<string, any>;
  followingRecords?: Record<string, any>;
  profile?: Record<string, any>;
  event?: Record<string, any>;
  announcement?: Record<string, any>;
  subscription?: Record<string, any>;
  financial?: Record<string, any>;
  roles?: Record<string, any>;
  tax?: Record<string, any>;
  payment?: Record<string, any>;
  calendar?: Record<string, any>;
  notification?: Record<string, any>;
  reminder?: Record<string, any>;
  reportAnalysis?: Record<string, any>;
  activityLog?: Record<string, any>;
  mom?: Record<string, any>;
  userInfo?: Record<string, any>;
  salary?: Record<string, any>;
  leaveRequest?: Record<string, any>;
  leaveApproved?: Record<string, any>;
  employeeReport?: Record<string, any>;
  document?: Record<string, any>;
  sharedDocument?: Record<string, any>;
  fileUpload?: Record<string, any>;
  dashboard?: Record<string, any>;
  accounts?: Record<string, any>;
  changedBy?: string;
  notes?: string;
  last_update_datetime?: Date;
}

const RoleAccessSchema = new Schema<IRoleAccess>({
  branchcode: { type: String },
  role: { type: String },
  project: { type: Schema.Types.Mixed },
  task: { type: Schema.Types.Mixed },
  milestone: { type: Schema.Types.Mixed },
  teamMembers: { type: Schema.Types.Mixed },
  branches: { type: Schema.Types.Mixed },
  invoices: { type: Schema.Types.Mixed },
  campaign: { type: Schema.Types.Mixed },
  leads: { type: Schema.Types.Mixed },
  client: { type: Schema.Types.Mixed },
  followingRecords: { type: Schema.Types.Mixed },
  profile: { type: Schema.Types.Mixed },
  event: { type: Schema.Types.Mixed },
  announcement: { type: Schema.Types.Mixed },
  subscription: { type: Schema.Types.Mixed },
  financial: { type: Schema.Types.Mixed },
  roles: { type: Schema.Types.Mixed },
  tax: { type: Schema.Types.Mixed },
  payment: { type: Schema.Types.Mixed },
  calendar: { type: Schema.Types.Mixed },
  notification: { type: Schema.Types.Mixed },
  reminder: { type: Schema.Types.Mixed },
  reportAnalysis: { type: Schema.Types.Mixed },
  activityLog: { type: Schema.Types.Mixed },
  mom: { type: Schema.Types.Mixed },
  userInfo: { type: Schema.Types.Mixed },
  salary: { type: Schema.Types.Mixed },
  leaveRequest: { type: Schema.Types.Mixed },
  leaveApproved: { type: Schema.Types.Mixed },
  employeeReport: { type: Schema.Types.Mixed },
  document: { type: Schema.Types.Mixed },
  sharedDocument: { type: Schema.Types.Mixed },
  fileUpload: { type: Schema.Types.Mixed },
  dashboard: { type: Schema.Types.Mixed },
  accounts: { type: Schema.Types.Mixed },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
RoleAccessSchema.index({ tenant_id: 1, role: 1 });

const RoleAccessLogSchema = new Schema<IRoleAccessLog>({
  role_id: { type: Schema.Types.ObjectId, ref: 'RoleAccess' },
  branchcode: { type: String },
  role: { type: String },
  project: { type: Schema.Types.Mixed },
  task: { type: Schema.Types.Mixed },
  milestone: { type: Schema.Types.Mixed },
  teamMembers: { type: Schema.Types.Mixed },
  branches: { type: Schema.Types.Mixed },
  invoices: { type: Schema.Types.Mixed },
  campaign: { type: Schema.Types.Mixed },
  leads: { type: Schema.Types.Mixed },
  client: { type: Schema.Types.Mixed },
  followingRecords: { type: Schema.Types.Mixed },
  profile: { type: Schema.Types.Mixed },
  event: { type: Schema.Types.Mixed },
  announcement: { type: Schema.Types.Mixed },
  subscription: { type: Schema.Types.Mixed },
  financial: { type: Schema.Types.Mixed },
  roles: { type: Schema.Types.Mixed },
  tax: { type: Schema.Types.Mixed },
  payment: { type: Schema.Types.Mixed },
  calendar: { type: Schema.Types.Mixed },
  notification: { type: Schema.Types.Mixed },
  reminder: { type: Schema.Types.Mixed },
  reportAnalysis: { type: Schema.Types.Mixed },
  activityLog: { type: Schema.Types.Mixed },
  mom: { type: Schema.Types.Mixed },
  userInfo: { type: Schema.Types.Mixed },
  salary: { type: Schema.Types.Mixed },
  leaveRequest: { type: Schema.Types.Mixed },
  leaveApproved: { type: Schema.Types.Mixed },
  employeeReport: { type: Schema.Types.Mixed },
  document: { type: Schema.Types.Mixed },
  sharedDocument: { type: Schema.Types.Mixed },
  fileUpload: { type: Schema.Types.Mixed },
  dashboard: { type: Schema.Types.Mixed },
  accounts: { type: Schema.Types.Mixed },
  changedBy: { type: String },
  notes: { type: String },
  last_update_datetime: { type: Date, default: Date.now }
});

export const RoleAccess = mongoose.models.RoleAccess || mongoose.model<IRoleAccess>('RoleAccess', RoleAccessSchema);
export const RoleAccessLog = mongoose.models.RoleAccessLog || mongoose.model<IRoleAccessLog>('RoleAccessLog', RoleAccessLogSchema);

export const initializeRoleAccess = async () => {
  try {
    const branchcode = "BRCODE_01";
    const role = 'superadmin';

    const existingRoleAccess = await RoleAccess.findOne({
      branchcode: branchcode.toUpperCase(),
      role: role.toLowerCase()
    });

    if (existingRoleAccess) {
      console.log(`✅ RoleAccess already exists for branchcode=${branchcode} and role=${role}`);
      return;
    }

    const newRole = await RoleAccess.create({
      branchcode,
      role,
      project: permissionsAccess.project,
      task: permissionsAccess.task,
      milestone: permissionsAccess.milestone,
      teamMembers: permissionsAccess.teamMembers,
      branches: permissionsAccess.branches,
      invoices: permissionsAccess.invoices,
      campaign: permissionsAccess.campaign,
      leads: permissionsAccess.leads,
      client: permissionsAccess.client,
      followingRecords: permissionsAccess.followingRecords,
      profile: permissionsAccess.profile,
      event: permissionsAccess.event,
      announcement: permissionsAccess.announcement,
      subscription: permissionsAccess.subscription,
      financial: permissionsAccess.financial,
      roles: permissionsAccess.roles,
      tax: permissionsAccess.tax,
      payment: permissionsAccess.payment,
      calendar: permissionsAccess.calendar,
      notification: permissionsAccess.notification,
      reminder: permissionsAccess.reminder,
      reportAnalysis: permissionsAccess.reportAnalysis,
      activityLog: permissionsAccess.activityLog,
      mom: permissionsAccess.mom,
      userInfo: permissionsAccess.userInfo,
      salary: permissionsAccess.salary,
      leaveRequest: permissionsAccess.leaveRequest,
      leaveApproved: permissionsAccess.leaveApproved,
      employeeReport: permissionsAccess.employeeReport,
      document: permissionsAccess.document,
      sharedDocument: permissionsAccess.sharedDocument,
      fileUpload: permissionsAccess.fileUpload
    });

    const notes = 'This was created by system';
    const userId = "superAdmin";

    await RoleAccessLog.create({
      role_id: newRole._id,
      branchcode,
      role,
      project: permissionsAccess.project,
      task: permissionsAccess.task,
      milestone: permissionsAccess.milestone,
      teamMembers: permissionsAccess.teamMembers,
      branches: permissionsAccess.branches,
      invoices: permissionsAccess.invoices,
      campaign: permissionsAccess.campaign,
      leads: permissionsAccess.leads,
      client: permissionsAccess.client,
      followingRecords: permissionsAccess.followingRecords,
      profile: permissionsAccess.profile,
      event: permissionsAccess.event,
      announcement: permissionsAccess.announcement,
      subscription: permissionsAccess.subscription,
      financial: permissionsAccess.financial,
      roles: permissionsAccess.roles,
      tax: permissionsAccess.tax,
      payment: permissionsAccess.payment,
      calendar: permissionsAccess.calendar,
      notification: permissionsAccess.notification,
      reminder: permissionsAccess.reminder,
      reportAnalysis: permissionsAccess.reportAnalysis,
      activityLog: permissionsAccess.activityLog,
      mom: permissionsAccess.mom,
      userInfo: permissionsAccess.userInfo,
      salary: permissionsAccess.salary,
      leaveRequest: permissionsAccess.leaveRequest,
      leaveApproved: permissionsAccess.leaveApproved,
      employeeReport: permissionsAccess.employeeReport,
      document: permissionsAccess.document,
      sharedDocument: permissionsAccess.sharedDocument,
      fileUpload: permissionsAccess.fileUpload,
      notes,
      changedBy: userId
    });

    console.log("✅ SettingRole_Tables checked/RoleAccess successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing RoleAccess tables Message: ${message}`);
    throw new Error(`Error initializing RoleAccess tables Message: ${message}`);
  }
};
