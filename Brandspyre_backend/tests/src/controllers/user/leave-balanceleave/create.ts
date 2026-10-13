import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { LeaveRequest } from "../../../db/ModelSceham/user/15_leaverequest";
import { UserAttendance } from "../../../db/ModelSceham/user/13_attendance";
import { Request, Response } from "express";
import moment from "moment";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const createUserLeaveReqInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Leave Request`;
  const { userId: requesterId } = req.user as AuthenticatedUser;

  const {
    staff_id,
    branchcode,
    leave_type,
    start_date,
    end_date,
    reason,
    is_half_day = false,
    partial_day_type,
    leave_duration_hours
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const allowedTypes = ["sick", "casual", "earned"];
    if (!allowedTypes.includes(leave_type)) {
      res.status(400).json({ error: "Please mention the leave_type as: sick, casual, or earned." });
      await session.abortTransaction();
      return;
    }

    if (!start_date || !end_date) {
      res.status(400).json({ error: "Start date and end date are required." });
      await session.abortTransaction();
      return;
    }

    if (is_half_day && !partial_day_type) {
      res.status(400).json({ error: "Partial day type must be specified for half-day or hourly leaves." });
      await session.abortTransaction();
      return;
    }

    if (partial_day_type === 'hourly' && (!leave_duration_hours || leave_duration_hours <= 0)) {
      res.status(400).json({ error: "For hourly leave, please provide valid leave_duration_hours." });
      await session.abortTransaction();
      return;
    }

    const staffId = staff_id || requesterId;

    const userCheck = await UserInfo.findOne({ staff_id: staffId }).session(session).lean();
    if (!userCheck) {
      res.status(404).json({ message: `User with staff_id '${staffId}' not found` });
      await session.abortTransaction();
      return;
    }

    // Conflict Check
    const start = moment(start_date);
    const end = moment(end_date);
    const conflicts: { date: string, type: string, source: string }[] = [];

    for (let d = moment(start); d.diff(end, 'days') <= 0; d.add(1, 'days')) {
      const dateStr = d.format('YYYY-MM-DD');

      // Check attendance
      const att = await UserAttendance.findOne({ staff_id: staffId, attendance_date: dateStr }).session(session).lean() as any;
      if (att) {
        const status = att.status;
        if (['present', 'leave', 'half-leave', 'hour-leave'].includes(status)) {
          conflicts.push({ date: dateStr, type: status, source: 'attendance' });
        }
      }

      // Check overlapping leave request
      const leaveReq = await LeaveRequest.findOne({
        staff_id: staffId,
        status: { $in: ['pending', 'approved'] },
        start_date: { $lte: new Date(dateStr) },
        end_date: { $gte: new Date(dateStr) }
      }).session(session).lean();

      if (leaveReq) {
        conflicts.push({ date: dateStr, type: 'leave-request', source: 'leave_requests' });
      }
    }

    if (conflicts.length > 0) {
      const grouped = conflicts.map(c => `${c.date} [${c.type} from ${c.source}]`);
      res.status(400).json({ error: `Leave conflict on: ${grouped.join(', ')}` });
      await session.abortTransaction();
      return;
    }

    const [insert] = await LeaveRequest.create([{
      staff_id: staffId,
      branchcode,
      leave_type,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      reason,
      is_half_day,
      partial_day_type: partial_day_type || null,
      leave_duration_hours: leave_duration_hours || null
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ message: `${msgField} successful`, data: insert });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ error: `${msgField} failed due to server error: ${message}` });
  } finally {
    session.endSession();
  }
};
