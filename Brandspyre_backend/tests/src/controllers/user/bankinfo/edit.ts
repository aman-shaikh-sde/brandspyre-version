import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserBankInfo } from "../../../db/ModelSceham/user/7_bankinfo";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const editUserBankInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Bank Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userData } = req.body || {};
  const rowId = req.params.id;
  const loginId = userData?.staff_id ? userData.staff_id : idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!user) {
      await session.abortTransaction();
      res.status(409).json({ error: `User not found` });
      return;
    }

    if (!userData || !userData.staff_id) {
      await session.abortTransaction();
      res.status(400).json({ error: "Missing required field: staff_id" });
      return;
    }

    const filter: any = mongoose.Types.ObjectId.isValid(rowId) ? { _id: rowId } : { id: rowId };
    filter.staff_id = loginId;

    const updated = await UserBankInfo.findOneAndUpdate(
      filter,
      { $set: userData },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      res.status(404).json({ message: 'given row ids is not found' });
      return;
    }

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} Success`, result: updated });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};