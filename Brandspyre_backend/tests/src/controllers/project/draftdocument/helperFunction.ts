import mongoose from 'mongoose';
import { TaskParticipantLog } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";


// 1. Staff-wise Summary Report
export const getStaffSummary = async (req: Request, res: Response): Promise<void> => {
  const { staff_id } = req.params;
  const session = await mongoose.startSession();
  try {
    const result = await (async () => {
        const rows = await TaskParticipantLog.find({ staff_id: staff_id }).session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
    res.status(200).json({ message: "Staff summary fetched", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff summary" });
  } finally {
    session.endSession();
  }
};

// 2. Date-wise Log Report (last X days)
export const getStaffDateLogs = async (req: Request, res: Response): Promise<void> => {
  const { staff_id } = req.params;
  const days = parseInt(req.query.days as string) || 30;
  const session = await mongoose.startSession();
  try {
    const result = await (async () => {
        const rows = await TaskParticipantLog.findOne({ staff_id: staff_id }, 'date(check_in) as log_date sum(duration) as total_minutes').session(session).lean() as any;
        return {
          rows: rows ? [
            {
              ...rows,
              id: rows._id.toString(),
              
            }
          ] : [],
          rowCount: rows ? 1 : 0
        };
      })();
    res.status(200).json({ message: "Staff date-wise logs fetched", data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff logs" });
  } finally {
    session.endSession();
  }
};

// 3. Missing Check-outs
export const getMissingCheckouts = async (req: Request, res: Response): Promise<void> => {
  const { staff_id, date } = req.query;
  const session = await mongoose.startSession();
  try {
    const conditions: string[] = ["check_out IS NULL"];
    const values: any[] = [];

    if (staff_id) {
      conditions.push(`staff_id = $${values.length + 1}`);
      values.push(staff_id);
    }
    if (date) {
      conditions.push(`DATE(check_in) = $${values.length + 1}`);
      values.push(date);
    }

    const query = `SELECT * FROM task_participants_log WHERE ${conditions.join(" AND ")}`;
    const result = await (async () => {
        const rows = await TaskParticipantLog.find({  }).session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
    res.status(200).json({ message: "Missing check-outs fetched", data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch missing check-outs" });
  } finally {
    session.endSession();
  }
};

// 4. Task Attendance Sheet
export const getTaskAttendance = async (req: Request, res: Response): Promise<void> => {
  const { task_id } = req.params;
  const session = await mongoose.startSession();
  try {
    const result = await (async () => {
        const rows = await TaskParticipantLog.find({ task_id: task_id }, 'staff_id check_in check_out duration').session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
    res.status(200).json({ message: "Task attendance fetched", data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task attendance" });
  } finally {
    session.endSession();
  }
};

// 5. Task Utilization Report
export const getTaskUtilization = async (req: Request, res: Response): Promise<void> => {
  const { task_id } = req.params;
  const session = await mongoose.startSession();
  try {
    const result = await (async () => {
        const rows = await TaskParticipantLog.find({ task_id: task_id }).session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
    res.status(200).json({ message: "Task utilization fetched", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task utilization" });
  } finally {
    session.endSession();
  }
};
