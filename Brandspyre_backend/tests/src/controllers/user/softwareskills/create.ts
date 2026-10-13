import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserSoftwareSkill } from "../../../db/ModelSceham/user/4_softwareskills";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface UserData {
  staff_id: string;
  software_id?: string | number;
  proficiency: string;
  remark?: string;
  [key: string]: any;
}

export const createUserSoftwareInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's software Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userDatas } = req.body;

  const session = await mongoose.startSession();

  try {
    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    session.startTransaction();
    const created: any[] = [];
    const failed: any[] = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      const loginId = userData.staff_id || idObj;

      try {
        const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
        if (!existingUser) throw new Error(`User not found for staff_id: ${loginId}`);

        const existingSkill = await UserSoftwareSkill.findOne({
          staff_id: loginId,
          software_id: userData.software_id,
          proficiency: userData.proficiency
        }).session(session).lean();

        if (existingSkill) {
          throw new Error("This software with same proficiency already exists for the user.");
        }

        userData.staff_id = loginId;
        const result = await UserSoftwareSkill.create([userData], { session });
        created.push(result[0]);
      } catch (err) {
        failed.push({
          user: userDataRaw,
          error: (err instanceof Error ? err.message : String(err))
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