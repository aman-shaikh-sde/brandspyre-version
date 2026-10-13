import { Request, Response } from "express";
import { Branch, BranchLog } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";
import { settingAccessControl } from "../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

export const editBranch = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode} = req.user as AuthenticatedUser
    let {id} = req.params;
    let {
        branch_hours,
        branchcode,
        role,
        name,
        location,
        mobile,
        email,
        manager_id,
        managername,
        notes,
        status,
        closeReason
      } = req.body;
      const base = "edit";
    const permissions = "branches";
    try {
        if(name) name = name.trim().toLowerCase();
        if(branchcode) branchcode = branchcode.trim().toUpperCase();
        if(location) location = location.trim().toLowerCase();
        if(role) role = role.trim().toLowerCase();
        const hasAccess  = await settingAccessControl({ role: userRole, permissions: permissions, base: base, brcode })
        if (!hasAccess) {
            res.status(403).json({ message: `Access denied: insufficient permission to ${base} ${permissions}.` });
            return ;
        }

        const tenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req.user as any)?.tenantId;
        const isPlatformAdmin = (req as any).securityContext?.isPlatformAdmin;
        const tenantFilter: any = (tenantId && !isPlatformAdmin) ? { tenant_id: new mongoose.Types.ObjectId(tenantId) } : {};

        const existingBranch = await Branch.findOne({ _id: id, ...tenantFilter });
        
        if (!existingBranch) {
            res.status(404).json({ error: "Branch not found or unauthorized" });
            return;
        }

        if(status === "inactive"){
            res.status(400).json({message:"Unable to Inactive this branch"});
            return
        }
         
        const isChanged =
            branch_hours !== existingBranch.branch_hours ||
            branchcode !== existingBranch.branchcode ||
            role !== existingBranch.role ||
            name !== existingBranch.name?.toLowerCase() ||
            location !== existingBranch.location?.toLowerCase() ||
            mobile !== existingBranch.mobile ||
            email !== existingBranch.email ||
            manager_id !== existingBranch.manager_id ||
            managername !== existingBranch.managerName ||
            notes !== existingBranch.notes ||
            status !== existingBranch.status ||
            closeReason !== existingBranch.closeReason 

        if (!isChanged) {
            res.status(200).json({ message: "No changes detected. Nothing updated." });
            return;
        }

        const updateData: any = {
            branch_hours: branch_hours || existingBranch.branch_hours,
            branchcode: branchcode || existingBranch.branchcode,
            role: role || existingBranch.role,
            name: name || existingBranch.name?.toLowerCase(),
            location: location || existingBranch.location?.toLowerCase(),
            mobile: mobile || existingBranch.mobile,
            email: email || existingBranch.email,
            manager_id: manager_id || existingBranch.manager_id,
            managerName: managername || existingBranch.managerName,
            notes: notes || existingBranch.notes,
            status: status || existingBranch.status,
            closeReason: closeReason || existingBranch.closeReason,
            last_update_datetime: new Date()
        };

        await Branch.findOneAndUpdate({ _id: id, ...tenantFilter }, updateData);

        await BranchLog.create({
            branch_id: id,
            branchcode: branchcode || existingBranch.branchcode?.toUpperCase(),
            role: role || existingBranch.role?.toLowerCase(),
            name: name || existingBranch.name?.toLowerCase(),
            branch_hours: branch_hours || existingBranch.branch_hours,
            location: location || existingBranch.location?.toLowerCase(),
            mobile: mobile || existingBranch.mobile,
            email: email || existingBranch.email,
            manager_id: manager_id || existingBranch.manager_id,
            managerName: managername || existingBranch.managerName,
            notes: notes || existingBranch.notes,
            status: status || existingBranch.status,
            closeReason: closeReason || existingBranch.closeReason,
            changedBy: String(userId)
        });

        res.status(201).json({ message: "editBranch Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`editBranch Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}
