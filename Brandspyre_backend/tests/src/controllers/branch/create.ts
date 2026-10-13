import { Request, Response } from "express";
import { Branch, BranchLog } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";
import { settingAccessControl } from "../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
    tenantId?: string;
  }

export const createBranch = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser
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
        closeReason,
      } = req.body;
      const base = "create";
      const permissions = "branches";
    try {
        name = name.trim().toLowerCase();
        role = role.trim().toLowerCase();
        branchcode = branchcode.trim().toUpperCase();
        location = location.trim().toLowerCase();
        const hasAccess  = await settingAccessControl({ role: userRole, permissions: permissions, base: base, brcode, req })
        if (!hasAccess) {
            res.status(403).json({ message: `Access denied: insufficient permission to ${base} ${permissions}.` });
            return ;
        }

        const effectiveTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || tenantId;

        if (role !== "admin") {
            const adminQuery: any = { branchcode, role: 'admin' };
            if (effectiveTenantId) adminQuery.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
            const adminCheck = await Branch.findOne(adminQuery);
            if (!adminCheck) {
                res.status(400).json({
                    error: `Admin role must be created first for branchcode '${branchcode}'.`
                });
                return;
            }
        }

        const existingQuery: any = { 
            name: name, 
            location: location, 
            branchcode: branchcode,
            role: role
        };
        if (effectiveTenantId) existingQuery.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);

        const existingBranch = await Branch.findOne(existingQuery);

        if (existingBranch) {
            res.status(409).json({ error: "Branch with this name and location already exists." });
            return;
        }

        const branchData: any = {
            branch_hours,
            branchcode,
            role,
            name,
            location,
            mobile,
            email,
            manager_id,
            managerName: managername,
            notes: notes || null,
            status: status || 'active',
            closeReason: closeReason || null
        };

        // Add tenant_id
        if (effectiveTenantId) {
            branchData.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
        }

        const newBranch = await Branch.create(branchData);

        await BranchLog.create({
            branch_id: newBranch._id,
            branchcode,
            role,
            name,
            branch_hours,
            location,
            mobile,
            email,
            manager_id,
            managerName: managername,
            notes: notes || null,
            status: status || 'active',
            closeReason: closeReason || null,
            changedBy: String(userId) || "system",
            tenant_id: effectiveTenantId ? new mongoose.Types.ObjectId(effectiveTenantId) : undefined
        });
        
        res.status(201).json({ message: "createBranch Success" }); 
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`createBranch Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}
