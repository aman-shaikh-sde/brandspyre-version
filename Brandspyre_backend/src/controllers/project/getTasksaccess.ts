import { RequestHandler } from "express";
import { Task } from "../../db/ModelSceham/project/client";
import { RoleAccess } from "../../db/ModelSceham/roleAccessSchema";
import { TeamMember } from "../../db/ModelSceham/teams/teammembers";

import mongoose from "mongoose";

export const getTasksAccess: RequestHandler = async (req, res) => {
  try {
    const authUser = (req as any).user;
    const securityContext = (req as any).securityContext;
    const effectiveTenantId = securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
    const userRole = (authUser?.userRole || authUser?.role || "").toLowerCase();
    const userId = String(authUser?.userId || authUser?.id || authUser?.staff_id || "");

    const { milestone_code, branchcode, priority, type, status } = req.query;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: "Authentication required to access tasks" });
      return;
    }

    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole);

    let filter: any = {};

    // Enforce tenant boundary
    if (!isPlatformAdmin && effectiveTenantId) {
      if (mongoose.Types.ObjectId.isValid(effectiveTenantId)) {
        filter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
      }
    }

    const roleDoc = await RoleAccess.findOne({ role: userRole }).lean() as any;
    let canSeeAll = false;
    let canSeeOwn = false;
    if (roleDoc) {
      const taskAccess = roleDoc.task || {};
      canSeeAll = taskAccess.all === true || taskAccess.all === "true";
      canSeeOwn = taskAccess.own === true || taskAccess.own === "true";
    }

    if (!canSeeAll) {
      if (canSeeOwn) {
        filter.handler_by = userId;
      } else {
        const teamMemberships = await TeamMember.find({ staff_id: userId, status: 'active' }).lean() as any[];
        const teamIds = teamMemberships.map(tm => tm.team_id);
        filter.$or = [
          { handler_by: userId },
          ...(teamIds.length > 0 ? [{ team_id: { $in: teamIds } }] : [])
        ];
      }
    }

    if (branchcode) filter.branchcode = branchcode;
    if (priority) filter.task_priority = priority;
    if (status) filter.status = status;
    if (milestone_code) filter.milestone_code = milestone_code;

    const taskDocs = await Task.find(filter).sort({ start_date: -1 }).lean();

    const tasks = taskDocs.map((r: any) => ({
      project_code: r.project_code,
      task_name: r.task_title,
      branchcode: r.branchcode,
      priority: r.task_priority,
      handler_by: r.handler_by,
      status: r.status,
      start_date: r.start_date,
      end_date: r.end_date,
      milestone_code: r.milestone_code,
      team_id: r.team_id,
      duration_days: r.duration_days,
    }));

    res.json({
      success: true,
      role: userRole,
      roleFound: !!roleDoc,
      filters: { branchcode, priority, status },
      count: tasks.length,
      tasks,
    });
  } catch (error: any) {
    console.error("Error in getTasksAccess:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
