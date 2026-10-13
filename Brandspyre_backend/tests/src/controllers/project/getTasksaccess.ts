import { RequestHandler } from "express";
import { Task } from "../../db/ModelSceham/project/client";
import { RoleAccess } from "../../db/ModelSceham/roleAccessSchema";
import { TeamMember } from "../../db/ModelSceham/teams/teammembers";

export const getTasksAccess: RequestHandler = async (req, res) => {
  try {
    const { userId, userRole, milestone_code } = req.query;
    const { branchcode, priority, type, status } = req.query;

    if (!userId || !userRole) {
      res.status(400).json({ success: false, message: "userId and userRole are required" });
      return;
    }

    const roleDoc = await RoleAccess.findOne({ role: String(userRole).toLowerCase() }).lean() as any;
    let canSeeAll = false;
    let canSeeOwn = false;
    if (roleDoc) {
      const taskAccess = roleDoc.task || {};
      canSeeAll = taskAccess.all === true || taskAccess.all === "true";
      canSeeOwn = taskAccess.own === true || taskAccess.own === "true";
    }

    let filter: any = {};

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
