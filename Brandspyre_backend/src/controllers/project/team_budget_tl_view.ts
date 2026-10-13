import { Request, Response } from "express";
import { Project, Task } from "../../db/ModelSceham/project/client";
import { Team } from "../../db/ModelSceham/teams/team";

export const getTeamBudgetShareById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { teamId, projectCode } = req.query;

    if (!projectCode || !teamId) {
      res.status(400).json({ success: false, message: "projectCode and teamId are required" });
      return;
    }

    const project = await Project.findOne({ project_code: projectCode }).lean() as any;
    if (!project) {
      res.status(404).json({
        success: false,
        message: `No data found for project ${projectCode} and team_id ${teamId}`,
      });
      return;
    }

    const projectBudget = parseFloat(project.budget || '0');
    const tasks = await Task.find({ project_code: projectCode, team_id: teamId }).lean();

    if (tasks.length === 0) {
      res.status(404).json({
        success: false,
        message: `No data found for project ${projectCode} and team_id ${teamId}`,
      });
      return;
    }

    const teamDoc = await Team.findOne({ team_id: teamId }).lean() as any;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const budgetShare = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * projectBudget).toFixed(2)) : 0;

    res.json({
      success: true,
      project_code: projectCode,
      team: {
        team_id: teamId,
        team_name: teamDoc?.team_name || teamId,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        budget_share: budgetShare,
      },
    });
  } catch (error: any) {
    console.error("Error in getTeamBudgetShareById:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
