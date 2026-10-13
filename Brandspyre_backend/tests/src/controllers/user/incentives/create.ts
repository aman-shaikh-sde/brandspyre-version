import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserIncentive } from "../../../db/ModelSceham/user/10_incentive";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface UserData {
  staff_id: string;
  incentive?: string | number;
  days?: string;
  remark?: string;
  processondate?: string;
  processtilldate?: string;
  status?: string;
  [key: string]: any;
}

export const createUserIncentivesInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Incentives Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userDatas } = req.body as { userDatas: UserData[] };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      await session.abortTransaction();
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      const loginId = userData.staff_id || String(idObj);

      try {
        const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
        if (!existingUser) {
          failed.push({ user: userDataRaw, error: "User not found" });
          continue;
        }

        if (!userData.staff_id) {
          userData.staff_id = loginId;
        }

        const newInc = await UserIncentive.create([userData], { session });
        created.push(newInc[0]);
      } catch (error) {
        failed.push({
          user: userDataRaw,
          error: (error instanceof Error ? error.message : String(error))
        });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: {
        successCount: created.length,
        failedCount: failed.length,
        created,
        failed
      }
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