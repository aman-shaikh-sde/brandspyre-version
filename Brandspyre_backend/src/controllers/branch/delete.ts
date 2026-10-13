import { Request, Response } from "express";
import { Branch, BranchLog } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";
import { settingAccessControl } from "../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

export const deleteBranch = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode} = req.user as AuthenticatedUser
    let {id} = req.params;
    let {closeReason } = req.body;
    const base = "delete";
    const permissions = "branches";
    try {
        const hasAccess  = await settingAccessControl({ role: userRole, permissions: permissions, base: base,brcode })
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
    
        const toggle = existingBranch.status === 'active' ? 'inactive' : 'active';

        const finalCloseReason: string | null = 
            toggle === "inactive"
            ? (closeReason ? `${closeReason} # Branch is inactive by user ${userId}` : `# Branch is inactive by user ${userId}`)
            : (closeReason ? `${closeReason} # Re-activating this branch by user ${userId}` : `# Re-activating this branch by user ${userId}`);
       
        const updatedBranch = await Branch.findOneAndUpdate(
            { _id: id, ...tenantFilter },
            {
                status: toggle,
                closeReason: finalCloseReason,
                last_update_datetime: new Date()
            },
            { new: true }
        );

        await BranchLog.create({
            branch_id: id,
            branchcode: existingBranch.branchcode?.toUpperCase(),
            role: existingBranch.role?.toLowerCase(),
            name: existingBranch.name?.toLowerCase(),
            branch_hours: existingBranch.branch_hours,
            location: existingBranch.location?.toLowerCase(),
            mobile: existingBranch.mobile,
            email: existingBranch.email,
            manager_id: existingBranch.manager_id,
            managerName: existingBranch.managerName,
            notes: existingBranch.notes,
            status: toggle,
            closeReason: finalCloseReason,
            changedBy: String(userId)
        });

        res.status(201).json({ message: `deleteBranch Success ${toggle}`});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`deleteBranch Causes Error Message: ${message}`);
        res.status(500).json({ error: message });
    }
}
