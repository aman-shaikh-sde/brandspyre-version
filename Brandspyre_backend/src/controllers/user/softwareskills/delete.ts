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
  [key: string]: any;
}

export const deleteUserSoftwareInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete User Software Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const rowId = req.params.id;
  let { userData } = req.body as { userData: UserData };
  const loginId = userData?.staff_id || idObj;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!existingUser) {
      await session.abortTransaction();
      res.status(404).json({ error: "User not found" });
      return;
    }

    const filter: any = mongoose.Types.ObjectId.isValid(rowId) ? { _id: rowId } : { id: rowId };
    filter.staff_id = loginId;

    const result = await UserSoftwareSkill.findOneAndDelete(filter, { session });

    if (!result) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Given row ID not found or does not belong to this user.' });
      return;
    }

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} Success` });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};