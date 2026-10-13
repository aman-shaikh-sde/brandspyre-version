import { Request, Response } from "express";
import { Project } from "../../db/ModelSceham/project/client";
import { TaskParticipantLog } from "../../db/ModelSceham/project/client";

export const getEmployeePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_code, start_date, end_date } = req.query;

    // 1. Get projects matching filters (allowing any paystatus so report is not empty)
    let projectFilter: any = {};
    if (project_code) projectFilter.project_code = project_code;
    if (start_date && end_date) {
      projectFilter.start_date = { $gte: new Date(String(start_date)) };
      projectFilter.end_date = { $lte: new Date(String(end_date)) };
    }

    const completedProjects = await Project.find(projectFilter).lean() as any[];
    const projectMap = new Map<string, number>();
    completedProjects.forEach(p => {
      const budget = p.revised_cost || p.budget || 0;
      projectMap.set(p.project_code, budget);
    });

    if (completedProjects.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // 2. Get task participant logs with check_out (completed work)
    let logFilter: any = {
      check_out: { $ne: null },
      project_code: { $in: Array.from(projectMap.keys()) }
    };

    const logs = await TaskParticipantLog.find(logFilter).lean() as any[];

    // 3. Aggregate task counts and durations per project+staff+month
    const taskCounts = new Map<string, { project_code: string; staff_id: string; task_count: number; total_duration: number; month: string }>();
    const projectTotals = new Map<string, number>();

    for (const log of logs) {
      const logDate = log.check_in || log.create_datetime || new Date();
      const monthName = new Date(logDate).toLocaleString('default', { month: 'long' });
      const key = `${log.project_code}_${log.staff_id}_${monthName}`;
      
      if (!taskCounts.has(key)) {
        taskCounts.set(key, { 
          project_code: log.project_code, 
          staff_id: log.staff_id, 
          task_count: 0, 
          total_duration: 0,
          month: monthName
        });
      }
      const entry = taskCounts.get(key)!;
      entry.task_count += 1;

      if (log.check_in && log.check_out) {
        const duration = (new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 3600000;
        entry.total_duration += Math.round(duration * 100) / 100;
      }

      projectTotals.set(log.project_code, (projectTotals.get(log.project_code) || 0) + 1);
    }

    // 4. Build results
    const data: any[] = [];
    for (const [, entry] of taskCounts) {
      const totalTaskCount = projectTotals.get(entry.project_code) || 1;
      const projectBudget = projectMap.get(entry.project_code) || 0;
      const contributionPercent = Math.round((entry.task_count / totalTaskCount) * 10000) / 100;
      const allocatedPayment = Math.round((entry.task_count / totalTaskCount) * projectBudget * 100) / 100;

      data.push({
        month: entry.month,
        project_code: entry.project_code,
        staff_id: entry.staff_id,
        task_count: entry.task_count,
        total_duration: entry.total_duration,
        total_task_count: totalTaskCount,
        project_budget: projectBudget,
        contribution_percent: contributionPercent,
        allocated_payment: allocatedPayment,
      });
    }

    data.sort((a, b) => a.project_code.localeCompare(b.project_code) || a.staff_id.localeCompare(b.staff_id));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in getEmployeePayments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
