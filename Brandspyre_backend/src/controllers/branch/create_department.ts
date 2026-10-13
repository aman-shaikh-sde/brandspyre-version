import { Request, Response } from "express";
import { Department } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const authUser = req.user as AuthenticatedUser;
  const { branchcode, department } = req.body || {};
  let tenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;

  if (!tenantId && authUser?.userId) {
    try {
      const { UserTenant } = require("../../db/ModelSceham/saasSchema");
      const ut = await UserTenant.findOne({ user_id: authUser.userId, is_active: true });
      if (ut && ut.tenant_id) {
        tenantId = ut.tenant_id.toString();
      }
    } catch (err) {}
  }

  if (!tenantId && authUser?.userId) {
    try {
      const { UserInfo } = require("../../db/ModelSceham/userSchema");
      const userDoc = await UserInfo.findById(authUser.userId);
      if (userDoc && userDoc.tenant_id) {
        tenantId = userDoc.tenant_id.toString();
      }
    } catch (err) {}
  }

  const targetBranch = branchcode || authUser?.brcode;
  if (targetBranch && tenantId && mongoose.Types.ObjectId.isValid(tenantId.toString())) {
    try {
      const { Branch } = require("../../db/ModelSceham/branchSchema");
      const branch = await Branch.findOne({
        branchcode: targetBranch,
        tenant_id: new mongoose.Types.ObjectId(tenantId.toString()),
        status: "active"
      });
      if (!branch) {
        res.status(403).json({ error: "Unauthorized or invalid branch for this organization" });
        return;
      }
    } catch (err) {}
  }

  try {
    if (!department) {
      res.status(400).json({ error: "department is required" });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required to create a department" });
      return;
    }

    const departmentData: any = {
      tenant_id: new mongoose.Types.ObjectId(tenantId.toString()),
      name: department,
      branchcode: targetBranch || undefined
    };

    const created = await Department.create(departmentData);

    res.status(201).json({
      message: "Department created successfully",
      department: created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`createDepartment Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
