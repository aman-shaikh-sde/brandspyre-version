import { Request, Response } from "express";
import { RoleAccess, RoleAccessLog } from '../../db/ModelSceham/roleAccessSchema';
import mongoose from "mongoose";
import { settingAccessControl } from "./helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

export const deleteSetting = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser & { tenantId?: string };
    let {id} = req.params;
    let {branchcode, notes} = req.body;
    const base = "delete";
    const permissions = "roles";
    try {
        if (!id) {
            res.status(400).json({ error: "Role ID is required." });
            return;
        }
        const hasAccess = await settingAccessControl({ role: userRole, permissions: permissions, base: base, brcode, req });
        if (!hasAccess) {
            res.status(403).json({ message: `Access denied: insufficient permission to ${base} ${permissions}.` });
            return ;
        }

        const deleteFilter: any = { _id: id };
        if (tenantId) {
            deleteFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        } else if (branchcode) {
            deleteFilter.branchcode = branchcode.toUpperCase();
        }

        const roleAccess = await RoleAccess.findOne(deleteFilter);
        if (!roleAccess) {
            res.status(404).json({ error: "Role access not found" });
            return;
        }

        if (roleAccess.role === 'admin' || roleAccess.role === 'superadmin') {
            res.status(400).json({ error: "Default administrative roles (Admin, Superadmin) cannot be deleted." });
            return;
        }

        const roleAccessObj = roleAccess.toObject();
        notes = notes ? `${notes} # Deleted this ${roleAccessObj.role} by ${userId}` : ` Deleted this ${roleAccessObj.role} by ${userId}`;

        // Create log entry
        await RoleAccessLog.create({
            role_id: roleAccess._id,
            branchcode: roleAccessObj.branchcode,
            role: roleAccessObj.role,
            project: roleAccessObj.project,
            task: roleAccessObj.task,
            milestone: roleAccessObj.milestone,
            teamMembers: roleAccessObj.teamMembers,
            branches: roleAccessObj.branches,
            invoices: roleAccessObj.invoices,
            campaign: roleAccessObj.campaign,
            leads: roleAccessObj.leads,
            client: roleAccessObj.client,
            followingRecords: roleAccessObj.followingRecords,
            profile: roleAccessObj.profile,
            event: roleAccessObj.event,
            announcement: roleAccessObj.announcement,
            subscription: roleAccessObj.subscription,
            financial: roleAccessObj.financial,
            roles: roleAccessObj.roles,
            tax: roleAccessObj.tax,
            payment: roleAccessObj.payment,
            calendar: roleAccessObj.calendar,
            notification: roleAccessObj.notification,
            reminder: roleAccessObj.reminder,
            reportAnalysis: roleAccessObj.reportAnalysis,
            activityLog: roleAccessObj.activityLog,
            mom: roleAccessObj.mom,
            userInfo: roleAccessObj.userInfo,
            salary: roleAccessObj.salary,
            leaveRequest: roleAccessObj.leaveRequest,
            leaveApproved: roleAccessObj.leaveApproved,
            employeeReport: roleAccessObj.employeeReport,
            document: roleAccessObj.document,
            sharedDocument: roleAccessObj.sharedDocument,
            fileUpload: roleAccessObj.fileUpload,
            notes: notes,
            changedBy: String(userId)
        });

        const deleted = await RoleAccess.findOneAndDelete(deleteFilter);

        res.status(200).json({ message: "Role deleted successfully.", deleted });
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`deleteSetting Causes Error Message: ${message}`);
        res.status(500).json({ error: message });
    }
}
