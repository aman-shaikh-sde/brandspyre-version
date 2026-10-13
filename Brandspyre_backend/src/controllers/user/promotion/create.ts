import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserPromotion } from "../../../db/ModelSceham/user/11_promotion";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const createUserPromotionInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User's Promotion Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userDatas } = req.body;

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
      try {
        const idParam = userData.staff_id;
        const loginId = idParam ? idParam : idObj;

        const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
        if (!existingUser) {
          failed.push({
            user: userDataRaw,
            error: `User not found`
          });
          continue;
        }

        if (!userData.staff_id) {
          failed.push({
            user: userDataRaw,
            error: `Missing required field: staff_id`
          });
          continue;
        }

        const [createdDoc] = await UserPromotion.create([userData], { session });
        const obj = createdDoc.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);

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

    if (created.length === 0 && failed.length > 0) {
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed.`,
        data: {
          successCount: 0,
          failedCount: failed.length,
          created,
          failed
        }
      });
      return;
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