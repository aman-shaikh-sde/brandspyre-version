import { Request, Response } from "express";
import { TaskParticipantLog } from "../../../db/ModelSceham/project/client";

// 1. Staff-wise Summary Report
export const getStaffSummary = async (req: Request, res: Response): Promise<void> => {
  const { staff_id } = req.params;
  try {
    const result = await TaskParticipantLog.aggregate([
      { $match: { staff_id: staff_id } },
      {
        $group: {
          _id: "$staff_id",
          project_count: { $addToSet: "$project_code" },
          milestone_count: { $addToSet: "$milestone_code" },
          task_count: { $addToSet: "$task_id" },
          total_logs: { $sum: 1 },
          total_duration_minutes: { $sum: { $ifNull: ["$duration", 0] } },
          today_duration_minutes: {
            $sum: {
              $cond: [
                { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$check_in" } }, { $dateToString: { format: "%Y-%m-%d", date: new Date() } }] },
                { $ifNull: ["$duration", 0] },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          project_count: { $size: "$project_count" },
          milestone_count: { $size: "$milestone_count" },
          task_count: { $size: "$task_count" },
          total_logs: 1,
          total_duration_minutes: 1,
          today_duration_minutes: 1
        }
      }
    ]);
    res.status(200).json({ message: "Staff summary fetched", data: result[0] || { project_count: 0, milestone_count: 0, task_count: 0, total_logs: 0, total_duration_minutes: 0, today_duration_minutes: 0 } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff summary" });
  }
};

// 2. Date-wise Log Report (last X days)
export const getStaffDateLogs = async (req: Request, res: Response): Promise<void> => {
  const { staff_id } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await TaskParticipantLog.aggregate([
      { 
        $match: { 
          staff_id: staff_id,
          check_in: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$check_in" } },
          total_minutes: { $sum: { $ifNull: ["$duration", 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: days },
      {
        $project: {
          log_date: "$_id",
          total_minutes: 1,
          _id: 0
        }
      }
    ]);
    res.status(200).json({ message: "Staff date-wise logs fetched", data: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff logs" });
  }
};

// 3. Missing Check-outs
export const getMissingCheckouts = async (req: Request, res: Response): Promise<void> => {
  const { staff_id, date } = req.query;
  try {
    const matchConditions: any = { check_out: null };
    if (staff_id) matchConditions.staff_id = staff_id;
    if (date) {
      const dateObj = new Date(date as string);
      matchConditions.check_in = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999))
      };
    }

    const result = await TaskParticipantLog.find(matchConditions);
    res.status(200).json({ message: "Missing check-outs fetched", data: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch missing check-outs" });
  }
};

// 4. Task Attendance Sheet
export const getTaskAttendance = async (req: Request, res: Response): Promise<void> => {
  const { task_id } = req.params;
  try {
    const result = await TaskParticipantLog.find({ task_id: task_id })
      .select('staff_id check_in check_out duration')
      .sort({ check_in: -1 });
    res.status(200).json({ message: "Task attendance fetched", data: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task attendance" });
  }
};

// 5. Task Utilization Report
export const getTaskUtilization = async (req: Request, res: Response): Promise<void> => {
  const { task_id } = req.params;
  try {
    const result = await TaskParticipantLog.aggregate([
      { $match: { task_id: task_id } },
      {
        $group: {
          _id: "$task_id",
          unique_staff: { $addToSet: "$staff_id" },
          total_logs: { $sum: 1 },
          total_duration_minutes: { $sum: { $ifNull: ["$duration", 0] } },
          open_sessions: {
            $sum: {
              $cond: [{ $eq: ["$check_out", null] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          unique_staff: { $size: "$unique_staff" },
          total_logs: 1,
          total_duration_minutes: 1,
          open_sessions: 1
        }
      }
    ]);
    res.status(200).json({ message: "Task utilization fetched", data: result[0] || { unique_staff: 0, total_logs: 0, total_duration_minutes: 0, open_sessions: 0 } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task utilization" });
  }
};
