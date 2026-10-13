import { RequestHandler } from "express";
import { Project, Task, Milestone } from "../../db/ModelSceham/project/client";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { TeamMember } from "../../db/ModelSceham/teams/teammembers";

export const getProjectsAccess: RequestHandler = async (req, res) => {
  try {
    const { userId, userRole } = req.query;
    const { branchcode, priority, type, payment_status } = req.query;

    if (!userRole) {
      res.status(400).json({ success: false, message: "userRole is required" });
      return;
    }

    let filter: any = {};

    if (String(userRole) === "superadmin") {
      if (branchcode) filter.branchcode = branchcode;
    } else {
      if (!userId) {
        res.status(400).json({ success: false, message: "userId is required for non-superadmin roles" });
        return;
      }
      if (branchcode) {
        filter.branchcode = branchcode;
      } else {
        const user = await UserInfo.findOne({ staff_id: userId }).lean() as any;
        if (user) filter.branchcode = user.branchcode;
      }

      const teamMemberships = await TeamMember.find({ staff_id: userId }).lean() as any[];
      const teamIds = teamMemberships.map(tm => tm.team_id);

      filter.$or = [
        { createby: userId },
        { handler_by: userId },
        ...(teamIds.length > 0 ? [{ team_id: { $in: teamIds } }] : [])
      ];
    }

    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (payment_status) filter.paystatus = payment_status;

    const projects = await Project.find(filter).sort({ start_date: -1 }).lean();

    const projectDetails = await Promise.all(projects.map(async (p: any) => {
      const milestones = await Milestone.find({ project_code: p.project_code }).lean() as any[];
      const milestoneCodes = milestones.map(m => m.milestone_code);

      let total_tasks = 0;
      let completed_tasks = 0;
      if (milestoneCodes.length > 0) {
        const tasks = await Task.find({ milestone_code: { $in: milestoneCodes } }).lean() as any[];
        total_tasks = tasks.length;
        completed_tasks = tasks.filter(t => t.status === 'completed').length;
      }

      return {
        project_code: p.project_code,
        project_name: p.title,
        branchcode: p.branchcode,
        priority: p.priority,
        type: p.type,
        payment_status: p.paystatus,
        created_by: p.createby,
        handler_by: p.handler_by,
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        description: p.notes,
        total_tasks,
        completed_tasks,
        completion_percentage: total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0,
      };
    }));

    res.json({
      success: true,
      role: userRole,
      filters: { branchcode, priority, type, payment_status },
      count: projectDetails.length,
      projects: projectDetails,
    });
  } catch (error: any) {
    console.error("Error in getProjectsAccess:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
