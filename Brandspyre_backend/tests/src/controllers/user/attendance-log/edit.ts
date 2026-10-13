import mongoose from 'mongoose';
import { Request, Response } from "express";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserAttendance } from "../../../db/ModelSceham/user/13_attendance";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface UserData {
  staff_id: string,
  branchcode?: string,
  attendance_date?: string,
  status?: string,
  remarks?: string,
  [key: string]: string | undefined;
}

export const editUserAttendanceInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Attendance Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userData } = req.body as { userData: UserData };
  const idParam = userData.staff_id;
  const loginId = idParam ? idParam : idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!existingUser) {
      res.status(409).json({ error: `User not found` });
      await session.abortTransaction();
      return;
    }

    const requiredFields = ['staff_id'];
    const missingFields = requiredFields.filter(
      field => !(userData as Record<string, string | undefined>)[field]
    );
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
      await session.abortTransaction();
      return;
    }

    const attendanceRes = await UserAttendance.findOne({
      staff_id: userData.staff_id,
      branchcode: userData.branchcode,
      attendance_date: userData.attendance_date,
      status: userData.status
    }).session(session).lean();

    if (attendanceRes) {
      res.status(404).json({ message: `Already attendance is marked for this given date ${userData.attendance_date} marked as ${userData.status}` });
      await session.abortTransaction();
      return;
    }

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, staff_id: loginId }
      : { id: Number(req.params.id), staff_id: loginId };

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updateRes = await UserAttendance.findOneAndUpdate(
      filter,
      { $set: cleanUpdateObj(userData) },
      { new: true, session }
    ).lean();

    if (!updateRes) {
      res.status(404).json({ message: 'given row ids is not found' });
      await session.abortTransaction();
      return;
    }

    await session.commitTransaction();
    res.status(201).json({ message: `${msgField} Success`, data: { ...updateRes, id: updateRes._id.toString() } });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};

export const editUserAttendanceLogInfo = async (_req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Attendance Log Info`;
  try {
    res.status(201).json({ message: `${msgField} Success` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};