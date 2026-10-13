import { Request, Response } from "express";
import { UserAttendanceLog } from "../../../db/ModelSceham/user/14_attedance_log";
import mongoose from "mongoose";

export const updateAttendanceLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, check_in, check_out, remarks } = req.body;

    if (!id) {
      res.status(400).json({ message: "Attendance log ID is required" });
      return;
    }

    const updateData: any = { last_update_datetime: new Date() };

    if (check_in) updateData.check_in = new Date(check_in);
    if (check_out) updateData.check_out = new Date(check_out);
    if (remarks !== undefined) updateData.remarks = remarks;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

    const existingLog = await UserAttendanceLog.findOne(filter);
    if (!existingLog) {
      res.status(404).json({ message: "Attendance log not found" });
      return;
    }

    const effectiveCheckIn = updateData.check_in || existingLog.check_in;
    const effectiveCheckOut = updateData.check_out || existingLog.check_out;

    if (effectiveCheckIn && effectiveCheckOut) {
      updateData.duration = Math.max(0, Math.floor((new Date(effectiveCheckOut).getTime() - new Date(effectiveCheckIn).getTime()) / 1000));
    }

    const updatedLog = await UserAttendanceLog.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      message: "Attendance log updated successfully",
      data: updatedLog,
    });
  } catch (err) {
    console.error("Update Attendance Log Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
