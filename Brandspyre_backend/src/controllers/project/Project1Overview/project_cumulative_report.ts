import { Request, Response } from "express";
import { RoleAccess } from "../../../db/ModelSceham/roleAccessSchema";
import { Project, Milestone, Task, TaskParticipant, TaskParticipantLog } from "../../../db/ModelSceham/project/client";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

const toNumber = (v: any) => (v === null || v === undefined ? 0 : Number(v));

export const viewCumulativeReport = async (req: Request, res: Response): Promise<void> => {
  const msg = "View Cumulative Report";
  const { userId: loginId, userRole, brcode } = req.user as AuthenticatedUser;

  let {
    project_code, branchcode, client_code, campaign_code, handler_by,
    team_id, staff_id, status, paystatus, start_date, end_date, overdue,
    search, dec, page = "1", limit = "25"
  } = req.query;

  try {
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.max(1, Math.min(500, parseInt(limit as string, 10) || 25));
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const roleAccessDoc = await RoleAccess.findOne({ branchcode: String(brcode).toUpperCase(), role: String(userRole).toLowerCase() }).lean() as any;
    const roleAccess = roleAccessDoc?.project || { all: false, own: false };

    let filter: any = {};
    if (project_code) filter.project_code = project_code;
    if (branchcode) filter.branchcode = branchcode;
    if (client_code) filter.client_code = client_code;
    if (campaign_code) filter.campaign_code = campaign_code;
    if (handler_by) filter.handler_by = handler_by;
    if (status) filter.status = status;
    if (paystatus) filter.paystatus = paystatus;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { title: searchRegex },
        { project_code: searchRegex },
        { handler_by: searchRegex }
      ];
    }

    if (start_date && end_date) {
      filter.start_date = { $lte: new Date(String(end_date)) };
      filter.end_date = { $gte: new Date(String(start_date)) };
    } else if (start_date) {
      filter.end_date = { $gte: new Date(String(start_date)) };
    } else if (end_date) {
      filter.start_date = { $lte: new Date(String(end_date)) };
    }

    if (overdue) {
      filter.end_date = { $lte: new Date(String(overdue)) };
      filter.status = { $ne: 'completed' };
    }

    if (!roleAccess.all && roleAccess.own) {
      filter.handler_by = loginId;
    }

    const totalDocuments = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const projects = await Project.find(filter)
      .sort({ project_code: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const fetchProjectAggregates = async (projCode: string) => {
      const milestoneDocs = await Milestone.find({ project_code: projCode }).lean();
      const milestone_count = milestoneDocs.length;
      const milestone_total = milestoneDocs.reduce((sum: number, m: any) => sum + (parseFloat(m.total_amount) || 0), 0);

      const taskDocs = await Task.find({ project_code: projCode }).lean();
      const task_total = taskDocs.length;
      const task_completed = taskDocs.filter((t: any) => t.status === 'completed').length;
      const progress_percent = task_total > 0 ? Math.round((task_completed / task_total) * 100) : 0;

      return { milestone_count, milestone_total, task_total, task_completed, progress_percent };
    };

    const fetchTasksForMilestone = async (milestoneCode: string) => {
      const tasks = await Task.find({ milestone_code: milestoneCode }).lean();

      return Promise.all(tasks.map(async (t: any) => {
        const subtaskDocs = await TaskParticipant.find({ task_id: t._id.toString() }).lean();
        const subtaskLogs = await TaskParticipantLog.find({ task_id: t._id.toString() }).lean();

        const logMap = new Map<string, number>();
        subtaskLogs.forEach((log: any) => {
          const key = String(log.participants_id);
          logMap.set(key, (logMap.get(key) || 0) + (log.duration || 0));
        });

        const subtasks = subtaskDocs.map((st: any) => {
          const total_minutes = logMap.get(String(st.participants_id)) || 0;
          const is_completed = st.status === "completed";
          const is_delayed = !is_completed && st.end_date && new Date(st.end_date) < new Date();

          return {
            ...st,
            id: st._id.toString(),
            total_hours_worked: total_minutes / 60,
            is_completed,
            is_delayed
          };
        });

        const is_delayed = t.status !== "completed" && t.end_date && new Date(t.end_date) < new Date();

        return {
          ...t,
          id: t._id.toString(),
          task_status: is_delayed ? "overdue" : t.status,
          is_delayed,
          participants: subtaskDocs,
          subtasks
        };
      }));
    };

    const fetchMilestonesForProject = async (projCode: string) => {
      const milestoneDocs = await Milestone.find({ project_code: projCode }).sort({ start_date: 1 }).limit(50).lean();

      return Promise.all(milestoneDocs.map(async (ms: any) => {
        const tasks = await fetchTasksForMilestone(ms.milestone_code);
        const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === "completed");
        const milestone_status = !allTasksCompleted && ms.end_date && new Date(ms.end_date) < new Date() ? "overdue" : ms.status;

        return {
          ...ms,
          id: ms._id.toString(),
          milestone_status,
          tasks
        };
      }));
    };

    const projectDetails = await Promise.all(projects.map(async (p: any) => {
      const agg = await fetchProjectAggregates(p.project_code);
      const milestonesWithTasks = await fetchMilestonesForProject(p.project_code);

      return {
        ...p,
        id: p._id.toString(),
        aggregates: agg,
        milestones: milestonesWithTasks
      };
    }));

    const allMatchedProjects = await Project.find(filter).lean();
    const overall_summary = {
      projects: allMatchedProjects.length,
      total_budget: allMatchedProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.budget) || 0), 0),
      total_revised_cost: allMatchedProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.revised_cost) || 0), 0),
      total_overall_cost: allMatchedProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.overallcost) || 0), 0)
    };

    const response = {
      meta: {
        filters: { project_code, branchcode, client_code, campaign_code, handler_by, team_id, staff_id, status, paystatus, start_date, end_date, overdue, search },
        page: pageNumber,
        limit: pageLimit,
        totalDocuments,
        totalPages,
        balanceDocuments
      },
      overall_summary,
      projects: projectDetails
    };

    res.status(200).json({ message: `${msg} Success`, data: response });
  } catch (err: any) {
    console.error(`${msg} Error:`, err);
    res.status(500).json({ error: `${msg} Error: ${err.message || String(err)}` });
  }
};
