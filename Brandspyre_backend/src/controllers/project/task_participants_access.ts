import { Request, Response } from "express";
import { RoleAccess } from "../../db/ModelSceham/roleAccessSchema";
import { TaskParticipant } from "../../db/ModelSceham/project/client";

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userRole, milestoneCode } = req.query;

    if (!userId || !userRole || !milestoneCode) {
      res.status(400).json({
        success: false,
        message: "userId, userRole and milestoneCode are required",
      });
      return;
    }

    const roleDoc = await RoleAccess.findOne({ role: (userRole as string).toLowerCase() }).lean() as any;

    let canSeeAll = false;
    if (roleDoc && roleDoc.task) {
      canSeeAll = roleDoc.task.all === true || roleDoc.task.all === "true";
    }

    let filter: any = { milestone_code: milestoneCode };
    if (!canSeeAll) {
      filter.staff_id = userId;
    }

    const participants = await TaskParticipant.find(filter)
      .sort({ added_on: -1 })
      .lean();

    const taskIds = Array.from(new Set(participants.map((p: any) => p.task_id)));
    const allParticipants = await TaskParticipant.find({ task_id: { $in: taskIds } }).lean();

    const taskStatsMap = new Map<string, { total: number; completed: number }>();
    allParticipants.forEach((p: any) => {
      if (!taskStatsMap.has(p.task_id)) {
        taskStatsMap.set(p.task_id, { total: 0, completed: 0 });
      }
      const stat = taskStatsMap.get(p.task_id)!;
      stat.total += 1;
      if (p.status === 'completed' || p.status === 'archived') {
        stat.completed += 1;
      }
    });

    const tasks = participants.map((p: any) => {
      const stat = taskStatsMap.get(p.task_id) || { total: 0, completed: 0 };
      const pct = stat.total > 0 ? parseFloat(((stat.completed / stat.total) * 100).toFixed(2)) : 0;

      return {
        task_id: p.task_id,
        staff_id: p.staff_id,
        participant_status: p.status,
        assigned_at: p.added_on,
        updated_at: p.updated_on,
        milestone_code: p.milestone_code,
        total_participants: stat.total,
        completed_or_archived: stat.completed,
        progress_percentage: pct,
      };
    });

    res.json({
      success: true,
      role: userRole,
      roleFound: !!roleDoc,
      canSeeAll,
      milestoneCode,
      count: tasks.length,
      tasks,
    });

  } catch (error: any) {
    console.error("Error in getUserTasks:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
