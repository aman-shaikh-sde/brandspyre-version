import { Request, Response } from "express";
import { Task, Project } from "../../db/ModelSceham/project/client";
import { Team } from "../../db/ModelSceham/teams/team";

export const getTeamBudgetProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectCode, teamId } = req.query;

    if (!projectCode || !teamId) {
      res.status(400).json({ success: false, message: "projectCode and teamId are required." });
      return;
    }

    const project = await Project.findOne({ project_code: projectCode }).lean() as any;
    if (!project) {
      res.status(404).json({ success: false, message: "Project not found." });
      return;
    }

    const team = await Team.findOne({ team_id: teamId }).lean() as any;
    const tasks = await Task.find({ project_code: projectCode, team_id: teamId }).lean() as any[];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0;
    const budget = parseFloat(project.budget) || 0;
    const budgetShare = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * budget * 100) / 100 : 0;

    res.json({
      success: true,
      project_code: projectCode,
      team_id: teamId,
      data: [{
        team_id: teamId,
        team_name: team?.team_name || teamId,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        completion_percentage: completionPct,
        budget_share: budgetShare,
      }],
    });
  } catch (error: any) {
    console.error("Error in getTeamBudgetProgress:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeamTaskProgress = getTeamBudgetProgress;
