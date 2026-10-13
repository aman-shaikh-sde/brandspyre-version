import { Request, Response, RequestHandler } from "express";
import { Milestone, Task } from "../../db/ModelSceham/project/client";

import mongoose from "mongoose";
import { Project } from "../../db/ModelSceham/project/client";

export const getMilestonesAccess: RequestHandler = async (req, res) => {
  try {
    const authUser = (req as any).user;
    const securityContext = (req as any).securityContext;
    const effectiveTenantId = securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
    const authenticatedRole = (authUser?.userRole || authUser?.role || "").toLowerCase();
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(authenticatedRole);
    const isTenantAdmin = ['admin', 'tenant_admin', 'superadmin', 'platform_superadmin', 'master_super_admin'].includes(authenticatedRole);

    const { project_code } = req.query;
    const targetUserId = isTenantAdmin && req.query.user_id 
      ? String(req.query.user_id) 
      : String(authUser?.userId || authUser?.id || authUser?.staff_id || "");

    if (!targetUserId || !project_code) {
      res.status(400).json({ error: "Missing user identification or project_code" });
      return;
    }

    // Verify project belongs to tenant
    if (!isPlatformAdmin && effectiveTenantId) {
      const projQuery: any = { project_code };
      if (mongoose.Types.ObjectId.isValid(effectiveTenantId)) {
        projQuery.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
      }
      const existingProject = await Project.findOne(projQuery).lean();
      if (!existingProject) {
        res.status(404).json({ error: "Project not found or unauthorized" });
        return;
      }
    }

    const tasks = await Task.find({ project_code, $or: [{ handler_by: targetUserId }, { team_id: { $exists: true } }] }).lean() as any[];
    const milestoneCodes = [...new Set(tasks.map(t => t.milestone_code))];

    const milestones = await Milestone.find({
      project_code,
      milestone_code: { $in: milestoneCodes }
    }).lean();

    res.json({ milestones });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
