import { Request, Response } from "express";
import { Department } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authUser = req.user as any;
  const effectiveTenantId = (req as any).tenant?.id || authUser?.tenantId;

  try {
    let filter: any = { _id: id };
    if (authUser?.userRole !== 'superadmin' && authUser?.userRole !== 'master_super_admin' && (req as any).dataScope !== 'platform') {
      if (!effectiveTenantId) {
        res.status(400).json({ error: "Tenant context is required" });
        return;
      }
      filter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId.toString());
    }

    const deleted = await Department.findOneAndDelete(filter);

    if (!deleted) {
      res.status(404).json({ error: "Department not found or unauthorized" });
      return;
    }

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deleteDepartment Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
