import { Request, Response } from "express";
import { Project, Task } from "../../db/ModelSceham/project/client";
import { Team } from "../../db/ModelSceham/teams/team";

export const getTeamBudgetShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectCode } = req.query;

    if (!projectCode) {
      res.status(400).json({ success: false, message: "projectCode is required" });
      return;
    }

    const project = await Project.findOne({ project_code: projectCode }).lean() as any;
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found" });
      return;
    }

    const projectBudget = parseFloat(project.budget || '0');
    const tasks = await Task.find({ project_code: projectCode }).lean();

    const teamTaskMap = new Map<string, { total: number; completed: number }>();
    tasks.forEach((t: any) => {
      const teamId = t.team_id || 'unassigned';
      if (!teamTaskMap.has(teamId)) {
        teamTaskMap.set(teamId, { total: 0, completed: 0 });
      }
      const stat = teamTaskMap.get(teamId)!;
      stat.total += 1;
      if (t.status === 'completed') {
        stat.completed += 1;
      }
    });

    const teams = await Promise.all(
      Array.from(teamTaskMap.entries()).map(async ([teamId, stat]) => {
        const teamDoc = await Team.findOne({ team_id: teamId }).lean() as any;
        const budgetShare = stat.total > 0 ? parseFloat(((stat.completed / stat.total) * projectBudget).toFixed(2)) : 0;

        return {
          team_id: teamId,
          team_name: teamDoc?.team_name || teamId,
          total_tasks: stat.total,
          completed_tasks: stat.completed,
          budget_share: budgetShare,
        };
      })
    );

    res.json({
      success: true,
      project_code: projectCode,
      teams,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getTeamBudgetShare:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
