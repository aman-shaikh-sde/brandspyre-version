import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserAttendanceLog } from "../../../db/ModelSceham/user/user_attendance_log";
import { UserAttendance } from "../../../db/ModelSceham/user/13_attendance";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const createUserAttendanceInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Attendance Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  
  let userDatas = req.body.userDatas;
  if (!userDatas) {
    if (Array.isArray(req.body)) {
      userDatas = req.body;
    } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      userDatas = [req.body];
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      const idParam = userData.staff_id;
      const loginId = idParam ? idParam : idObj;

      try {
        const queryConditions: any[] = [{ staff_id: loginId }, { email: loginId }];
        if (loginId && mongoose.Types.ObjectId.isValid(loginId)) {
          queryConditions.push({ _id: new mongoose.Types.ObjectId(loginId) });
        }

        const existingUser = (await UserInfo.findOne({ $or: queryConditions }).session(session).lean()) as any;
        if (!existingUser) {
          failed.push({ user: userDataRaw, error: `User not found` });
          continue;
        }

        const resolvedStaffId = existingUser.staff_id || existingUser._id.toString();
        userData.staff_id = resolvedStaffId;

        const requiredFields = ['staff_id', 'attendance_date', 'status'];
        const missingFields = requiredFields.filter(field => !(userData as Record<string, any>)[field]);
        if (missingFields.length > 0) {
          failed.push({ user: userDataRaw, error: `Missing required fields: ${missingFields.join(', ')}` });
          continue;
        }

        const query = { staff_id: loginId, attendance_date: userData.attendance_date };
        const update = {
          branchcode: userData.branchcode,
          status: userData.status,
          remarks: userData.remarks,
          last_update_datetime: new Date()
        };

        const doc = await UserAttendance.findOneAndUpdate(
          query,
          {
            $set: update,
            $setOnInsert: { create_datetime: new Date() }
          },
          { upsert: true, session, new: true }
        ).lean() as any;

        const obj = { ...doc, id: doc._id.toString() };
        created.push(obj);
      } catch (error) {
        failed.push({ user: userDataRaw, error: (error instanceof Error ? error.message : String(error)) });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    if (created.length === 0 && failed.length > 0) {
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed.`,
        data: { successCount: 0, failedCount: failed.length, created, failed }
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: { successCount: created.length, failedCount: failed.length, created, failed }
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};

export const createUserAttendanceLogInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Attendance Log Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;

  let userDatas = req.body.userDatas;
  if (!userDatas) {
    if (Array.isArray(req.body)) {
      userDatas = req.body;
    } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      userDatas = [req.body];
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      const idParam = userData.staff_id;
      const loginId = idParam ? idParam : idObj;

      try {
        const queryConditions: any[] = [{ staff_id: loginId }, { email: loginId }];
        if (loginId && mongoose.Types.ObjectId.isValid(loginId)) {
          queryConditions.push({ _id: new mongoose.Types.ObjectId(loginId) });
        }

        const existingUser = (await UserInfo.findOne({ $or: queryConditions }).session(session).lean()) as any;
        if (!existingUser) {
          failed.push({ user: userDataRaw, error: `User not found` });
          continue;
        }

        const resolvedStaffId = existingUser.staff_id || existingUser._id.toString();
        userData.staff_id = resolvedStaffId;

        const requiredFields = ['staff_id'];
        const missingFields = requiredFields.filter(field => !(userData as Record<string, any>)[field]);
        if (missingFields.length > 0) {
          failed.push({ user: userDataRaw, error: `Missing required fields: ${missingFields.join(', ')}` });
          continue;
        }

        let docObj: any;
        const targetId = userData.id || userData._id;

        let existingLog: any = null;
        if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
          existingLog = await UserAttendanceLog.findById(targetId).session(session);
        }
        if (!existingLog && userData.check_out) {
          existingLog = await UserAttendanceLog.findOne({ staff_id: resolvedStaffId, check_out: { $exists: false } }).sort({ create_datetime: -1 }).session(session);
          if (!existingLog) {
            existingLog = await UserAttendanceLog.findOne({ staff_id: resolvedStaffId, check_out: null }).sort({ create_datetime: -1 }).session(session);
          }
        }

        if (existingLog) {
          existingLog.check_out = userData.check_out ? new Date(userData.check_out) : new Date();
          if (existingLog.check_in) {
            const diffMs = new Date(existingLog.check_out).getTime() - new Date(existingLog.check_in).getTime();
            existingLog.duration = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
          }
          existingLog.last_update_datetime = new Date();
          await existingLog.save({ session });
          docObj = existingLog.toObject();
          docObj.id = existingLog._id.toString();
        } else {
          if (!userData.check_in) {
            userData.check_in = new Date();
          }
          const [createdDoc] = await UserAttendanceLog.create([userData], { session });
          docObj = createdDoc.toObject() as any;
          docObj.id = docObj._id.toString();
        }

        if (docObj) {
          created.push(docObj);
        } else {
          failed.push({ user: userDataRaw, error: `Attendance log record not found for checkout` });
        }
      } catch (error) {
        failed.push({ user: userDataRaw, error: (error instanceof Error ? error.message : String(error)) });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    if (created.length === 0 && failed.length > 0) {
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed.`,
        data: { successCount: 0, failedCount: failed.length, created, failed }
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: { successCount: created.length, failedCount: failed.length, created, failed }
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};