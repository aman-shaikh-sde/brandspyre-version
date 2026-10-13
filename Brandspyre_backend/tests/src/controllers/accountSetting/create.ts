import mongoose from 'mongoose';
import { RoleAccess, RoleAccessLog } from "../../db/ModelSceham/roleAccessSchema";
import { Request, Response } from "express";
import { settingAccessControl } from "./helperFunction";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const permissionsAccess: any = {
  project: basePermission(),
  task: basePermission(),
  milestone: basePermission(),
  teamMembers: basePermission(),
  branches: basePermission(),
  invoices: basePermission(),
  campaign: basePermission(),
  leads: basePermission(),
  client: basePermission(),
  followingRecords: basePermission(),
  profile: basePermission(),
  event: basePermission(),
  announcement: basePermission(),
  subscription: basePermission(),
  financial: basePermission(),
  roles: basePermission(),
  tax: basePermission(),
  payment: basePermission(),
  calendar: basePermission(),
  notification: basePermission(),
  reminder: basePermission(),
  reportAnalysis: basePermission(),
  activityLog: basePermission(),
  mom: basePermission(),
  userInfo: basePermission(),
  salary: basePermission(),
  leaveRequest: basePermission(),
  leaveApproved: basePermission(),
  employeeReport: basePermission(),
  document: basePermission(),
  sharedDocument: basePermission(),
  fileUpload: basePermission(),
  dashboard: basePermission(),
  accounts: basePermission(),
};

function basePermission() {
  return {
    all: true,
    own: false,
    create: true,
    edit: true,
    delete: true,
  };
}

export const createSetting = async (req: Request, res: Response): Promise<void> => {
  const { userId, userRole, brcode, tenantId } = (req as any).user as AuthenticatedUser;
  let { role, branchcode } = req.body;
  
  const session = await mongoose.startSession();
  let notes = `Created new ${role} by ${userId}`;
  const base = 'create';
  const permissions = "roles";
  
  try {
    if (!role) {
      res.status(400).json({ error: "role is required." });
      return;
    }
    role = role.trim();
    // branchcode is optional for tenant admins
    if (branchcode) {
      branchcode = branchcode.toUpperCase();
    }
    
    const hasAccess = await settingAccessControl({ role: userRole, permissions: permissions, base: base, brcode, req });
    if (!hasAccess) {
      res.status(403).json({ message: `Access denied: insufficient permission to ${base} ${permissions}.` });
      return;
    }

    session.startTransaction();

    // Check for existing role by branchcode or tenant_id
    const existingRoleQuery: any = { role: role.toLowerCase() };
    if (tenantId) {
      existingRoleQuery.tenant_id = new mongoose.Types.ObjectId(tenantId);
    } else {
      existingRoleQuery.branchcode = branchcode;
    }

    const existingRole = await RoleAccess.findOne(existingRoleQuery).session(session).lean();
    if (existingRole) {
      res.status(409).json({ error: "Role already exists for this tenant/branch." });
      await session.abortTransaction();
      return;
    }

    const dash = {
      "all": true,
      "own": false,
      "edit": true,
      "create": true,
      "delete": true
    };

    const acc = {
      "all": true,
      "own": false,
      "edit": true,
      "create": true,
      "delete": true
    };

    const roleData: any = {
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
      dashboard: dash,
      accounts: acc
    };

    // Add tenant_id for tenant admins
    if (tenantId) {
      roleData.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const [newRole] = await RoleAccess.create([roleData], { session });

    await RoleAccessLog.create([{
      ...roleData,
      role_id: newRole._id.toString(),
      notes,
      changedBy: String(userId)
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ message: "createSetting Success" }); 
  } catch (error: unknown) { 
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`createSetting Causes Error Message: ${message}`);
    res.status(500).json({ error: message }); 
  } finally {
    session.endSession();
  }
};