import { Request, Response, NextFunction } from "express";
import { Project, Task, Milestone, TaskParticipant } from "../../db/ModelSceham/project/client";

export const getProjectStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchCode, branchcode, project_code, userRole, teamId, staff_id, staffId: queryStaffId } = req.query;
    const staffId = (teamId || staff_id || queryStaffId) as string | undefined;
    const effectiveBranch = (branchCode || branchcode) as string | undefined;

    let projectFilter: any = {};
    let taskFilter: any = {};

    const tenantId = (req as any).effectiveTenantId || (req as any).tenant_id || (req as any).user?.tenant_id;
    if (tenantId) {
      projectFilter.tenant_id = tenantId;
      taskFilter.tenant_id = tenantId;
    }

    if (effectiveBranch && effectiveBranch !== "" && effectiveBranch !== "ALL") {
      projectFilter.branchcode = effectiveBranch;
      taskFilter.branchcode = effectiveBranch;
    }

    if (project_code) {
      projectFilter.project_code = project_code;
      taskFilter.project_code = project_code;
    }

    if (userRole !== "superadmin" && staffId) {
      const milestonesByHandler = await Milestone.find({ handler_by: staffId }).distinct('project_code');
      const tasksByParticipant = await TaskParticipant.find({ staff_id: staffId }).distinct('task_id');
      const tasksByParticipantProjects = await Task.find({ _id: { $in: tasksByParticipant } }).distinct('project_code');

      const accessibleProjectCodes = [...new Set([
        ...milestonesByHandler,
        ...tasksByParticipantProjects
      ])];

      projectFilter.$or = [
        { handler_by: staffId },
        { project_code: { $in: accessibleProjectCodes } }
      ];

      const accessibleMilestoneCodes = await Milestone.find({
        $or: [{ handler_by: staffId }, { project_code: { $in: accessibleProjectCodes } }]
      }).distinct('milestone_code');

      taskFilter.$or = [
        { handler_by: staffId },
        { milestone_code: { $in: accessibleMilestoneCodes } }
      ];
    }

    const totalProjects = await Project.countDocuments(projectFilter);
    const allTasks = await Task.find(taskFilter).lean() as any[];

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'verified-closed').length;
    const incomplete = allTasks.filter(t => t.status === 'inprocess').length;
    const pending = allTasks.filter(t => t.status === 'draft').length;
    const overdue = allTasks.filter(t =>
      t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed'
    ).length;

    const pie = total > 0 ? [
      { label: "Completed", count: completed, percentage: (completed / total) * 100 },
      { label: "Incomplete", count: incomplete, percentage: (incomplete / total) * 100 },
      { label: "Pending", count: pending, percentage: (pending / total) * 100 },
      { label: "Overdue", count: overdue, percentage: (overdue / total) * 100 },
    ] : [];

    const bar = [
      { status: "Completed", count: completed },
      { status: "Incomplete", count: incomplete },
      { status: "Pending", count: pending },
      { status: "Overdue", count: overdue },
    ];

    res.json({
      projects: { total: totalProjects },
      tasks: { total, completed, incomplete, pending, overdue },
      charts: { pie, bar },
    });
  } catch (error: any) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ error: "Failed to fetch project stats", details: error.message });
  }
};
