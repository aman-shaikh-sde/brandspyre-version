import { Request, Response } from "express";
import { RoleAccess, RoleAccessLog } from '../../db/ModelSceham/roleAccessSchema';
import mongoose from "mongoose";
import { settingAccessControl } from "./helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
    tenantId?: string;
  }

export const editSetting = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser
    let {id} = req.params;
    let {branchcode, data} = req.body
    const base = 'edit';
    const permissions = "roles";
    try {
        if (!id || !data || typeof data !== "object") {
            res.status(400).json({ error: "Invalid input: roleid and data are required." });
            return
        }
        const hasAccess = await settingAccessControl({ role: userRole, permissions: permissions, base: base, brcode, req })
        if (!hasAccess) {
            res.status(403).json({ message: `Access denied: insufficient permission to ${base} ${permissions}.` });
            return ;
        }

        const keys = Object.keys(data).filter(k => k !== "branchcode");

        if (keys.length === 0) {
            res.status(400).json({ error: "No valid fields provided to update." });
            return;
        }

        const updateData: any = {};
        for (const key of keys) {
            updateData[key] = data[key];
        }
        updateData.last_update_datetime = new Date();

        // Build query for role access update
        const updateQuery: any = { _id: id };
        if (tenantId) {
            updateQuery.tenant_id = new mongoose.Types.ObjectId(tenantId);
        } else {
            updateQuery.branchcode = branchcode;
        }

        const updated = await RoleAccess.findOneAndUpdate(
            updateQuery,
            updateData,
            { new: true }
        );

        if (!updated) {
            res.status(404).json({ error: "No matching roleaccess record found." });
            return
        }

        const up_branchcode = "ASC/RMD";
        const notes = `Edited this ${updated.role} by ${userId}`;

        await RoleAccessLog.create({
            role_id: updated._id,
            branchcode: up_branchcode,
            role: updated.role,
            project: updated.project,
            task: updated.task,
            milestone: updated.milestone,
            teamMembers: updated.teamMembers,
            branches: updated.branches,
            invoices: updated.invoices,
            campaign: updated.campaign,
            leads: updated.leads,
            client: updated.client,
            followingRecords: updated.followingRecords,
            profile: updated.profile,
            event: updated.event,
            announcement: updated.announcement,
            subscription: updated.subscription,
            financial: updated.financial,
            roles: updated.roles,
            tax: updated.tax,
            payment: updated.payment,
            calendar: updated.calendar,
            notification: updated.notification,
            reminder: updated.reminder,
            reportAnalysis: updated.reportAnalysis,
            activityLog: updated.activityLog,
            mom: updated.mom,
            userInfo: updated.userInfo,
            salary: updated.salary,
            leaveRequest: updated.leaveRequest,
            leaveApproved: updated.leaveApproved,
            employeeReport: updated.employeeReport,
            document: updated.document,
            sharedDocument: updated.sharedDocument,
            fileUpload: updated.fileUpload,
            notes: notes,
            changedBy: String(userId),
            dashboard: updated.dashboard,
            accounts: updated.accounts
        });

        // TODO: Update userinfo branchcode when UserInfo model is available
        // await UserInfo.updateMany(
        //   { firstname: { $ne: 'almino' } },
        //   { branchcode: 'ASC/RMD' }
        // );

        res.status(200).json({ message: "Settings updated successfully", updated });
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`editSetting Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}
