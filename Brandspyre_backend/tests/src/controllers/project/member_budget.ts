import { Request, Response } from "express";
import { Task, TaskParticipant, Project } from "../../db/ModelSceham/project/client";
import { UserInfo } from "../../db/ModelSceham/userSchema";

export const getTaskProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectCode } = req.query;

    const tasks = await Task.find(projectCode ? { project_code: projectCode } : {}).lean() as any[];
    const projects = await Project.find(projectCode ? { project_code: projectCode } : {}).lean() as any[];

    const projectBudgetMap = new Map<string, number>();
    projects.forEach((p: any) => projectBudgetMap.set(p.project_code, parseFloat(p.budget) || 0));

    const staffProgress: Map<string, any> = new Map();

    for (const task of tasks) {
      const participants = await TaskParticipant.find({ task_id: task._id.toString() }).lean() as any[];
      for (const tp of participants) {
        const key = `${task.project_code}_${tp.staff_id}`;
        if (!staffProgress.has(key)) {
          staffProgress.set(key, { project_code: task.project_code, staff_id: tp.staff_id, completed: 0, pending: 0, total: 0 });
        }
        const entry = staffProgress.get(key)!;
        entry.total += 1;
        if (task.status === 'completed') entry.completed += 1;
        else entry.pending += 1;
      }
    }

    const results = [];
    for (const [, entry] of staffProgress) {
      const user = await UserInfo.findOne({ staff_id: entry.staff_id }).lean() as any;
      const budget = projectBudgetMap.get(entry.project_code) || 0;
      const completionPct = entry.total > 0 ? (entry.completed / entry.total) * 100 : 0;

      results.push({
        staff_id: entry.staff_id,
        employee_name: user ? `${user.firstname} ${user.lastname}` : entry.staff_id,
        project_code: entry.project_code,
        completed_tasks: entry.completed,
        pending_tasks: entry.pending,
        total_tasks: entry.total,
        completion_percentage: Math.round(completionPct * 100) / 100,
        budget,
        budget_share: Math.round((completionPct / 100) * budget * 100) / 100,
      });
    }

    results.sort((a, b) => b.completion_percentage - a.completion_percentage);

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Error in getTaskProgress:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
