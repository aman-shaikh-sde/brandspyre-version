import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { LeaveRequest } from "../../../db/ModelSceham/user/15_leaverequest";
import { UserAttendance } from "../../../db/ModelSceham/user/13_attendance";
import { Request, Response } from "express";
import moment from "moment";
import { getTenantFilter } from "../../../utils/tenantScope";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const editUserLeaveReqInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Leave Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { id } = req.params;
  const {
    leave_type,
    start_date,
    end_date,
    reason,
    remarks,
    is_half_day = false,
    partial_day_type,
    leave_duration_hours
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const tenantFilter = getTenantFilter(req);
    const existing = await LeaveRequest.findOne({
      _id: id,
      ...tenantFilter
    }).session(session);
    if (!existing) {
      res.status(404).json({ message: `Leave request not found` });
      await session.abortTransaction();
      return;
    }

    if (existing.status !== 'pending') {
      res.status(400).json({ message: `Only pending leave requests can be edited.` });
      await session.abortTransaction();
      return;
    }

    if (is_half_day && !partial_day_type) {
      res.status(400).json({ error: "Partial day type is required for half-day or hourly leave." });
      await session.abortTransaction();
      return;
    }

    if (partial_day_type === 'hourly' && (!leave_duration_hours || leave_duration_hours <= 0)) {
      res.status(400).json({ error: "Hourly leave must include valid leave_duration_hours." });
      await session.abortTransaction();
      return;
    }

    const staffId = existing.staff_id;

    // Check conflicts
    const start = moment(start_date);
    const end = moment(end_date);
    const conflicts: { date: string, issue: string }[] = [];

    for (let d = moment(start); d.diff(end, 'days') <= 0; d.add(1, 'days')) {
      const dateStr = d.format('YYYY-MM-DD');

      const attCheck = await UserAttendance.findOne({ staff_id: staffId, attendance_date: dateStr }).session(session).lean() as any;
      if (attCheck) {
        const status = attCheck.status;
        if (['present', 'leave'].includes(status)) {
          conflicts.push({ date: dateStr, issue: `Already marked as ${status}` });
        }
      }

      const leaveCheck = await LeaveRequest.findOne({
        staff_id: staffId,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        status: { $in: ['pending', 'approved'] },
        start_date: { $lte: new Date(dateStr) },
        end_date: { $gte: new Date(dateStr) }
      }).session(session).lean();

      if (leaveCheck) {
        conflicts.push({ date: dateStr, issue: `Overlaps with another leave request` });
      }
    }

    if (conflicts.length > 0) {
      const reasons = conflicts.map(c => `${c.date}: ${c.issue}`);
      res.status(400).json({ error: `Cannot edit leave due to conflicts:\n${reasons.join('\n')}` });
      await session.abortTransaction();
      return;
    }

    existing.leave_type = leave_type;
    existing.start_date = new Date(start_date);
    existing.end_date = new Date(end_date);
    existing.reason = reason;
    existing.remarks = remarks || null;
    existing.is_half_day = is_half_day;
    existing.partial_day_type = partial_day_type || null;
    existing.leave_duration_hours = leave_duration_hours || null;
    existing.requested_on = new Date();

    await existing.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} successful`, data: existing });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const editApproveUserLeaveReqInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Approve/Reject Leave";
  const { id } = req.params;
  const { action, remarks, approved_dates, leave_type, partial_day_type, leave_hours } = req.body;
  const { userId: idObj } = req.user as AuthenticatedUser;

  const session = await mongoose.startSession();

  try {
    if (!["approved", "rejected"].includes(action)) {
      res.status(400).json({ message: `Invalid action` });
      return;
    }

    session.startTransaction();

    const leave = await LeaveRequest.findById(id).session(session);
    if (!leave) {
      res.status(404).json({ message: `Leave request not found` });
      await session.abortTransaction();
      return;
    }

    if (leave.status !== "pending") {
      res.status(400).json({ message: `Leave already ${leave.status}` });
      await session.abortTransaction();
      return;
    }

    let finalApprovedDates: string[] = [];
    const skippedDates: string[] = [];

    if (action === "approved") {
      const start = moment(leave.start_date);
      const end = moment(leave.end_date);

      let approvalDates: string[] = [];

      if (Array.isArray(approved_dates) && approved_dates.length > 0) {
        approvalDates = approved_dates;
      } else {
        for (let d = moment(start); d.diff(end, "days") <= 0; d.add(1, "days")) {
          approvalDates.push(d.format("YYYY-MM-DD"));
        }
      }

      for (const date of approvalDates) {
        const attCheck = await UserAttendance.findOne({ staff_id: leave.staff_id, attendance_date: date }).session(session).lean() as any;

        if (attCheck && attCheck.status === "present") {
          skippedDates.push(date);
          continue;
        }

        const computedLeaveType = leave_type || leave.leave_type || "full-day";
        const computedHours =
          computedLeaveType === "hourly" ? leave_hours || 1 :
          computedLeaveType === "half-day" ? 4 : 8;

        const fullRemark = `Approved: ${leave.leave_type}${partial_day_type ? ` (${partial_day_type})` : ""}`;

        await UserAttendance.findOneAndUpdate(
          { staff_id: leave.staff_id, attendance_date: date },
          {
            $set: {
              status: 'leave',
              isleaveapproved: true,
              remarks: fullRemark,
              leave_type: computedLeaveType,
              leave_hours: computedHours,
              last_update_datetime: new Date()
            },
            $setOnInsert: {
              branchcode: leave.branchcode,
              create_datetime: new Date()
            }
          },
          { upsert: true, session, new: true }
        );

        finalApprovedDates.push(date);
      }

      leave.status = action;
      leave.approved_by = String(idObj);
      leave.approval_date = new Date();
      leave.remarks = remarks;
      leave.approved_dates = finalApprovedDates;
    } else {
      leave.status = action;
      leave.approved_by = String(idObj);
      leave.approval_date = new Date();
      leave.remarks = remarks;
    }

    await leave.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: `Leave ${action} successfully`,
      approved_dates: finalApprovedDates,
      skipped_dates: skippedDates
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};
