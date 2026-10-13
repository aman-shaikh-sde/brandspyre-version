import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserIncentive } from "../../../db/ModelSceham/user/10_incentive";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const editUserIncentivesInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit User Incentives Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { userData } = req.body;
  const rowId = req.params.id;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const loginId = userData?.staff_id || idObj;
    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();

    if (!existingUser) {
      res.status(409).json({ error: `User not found` });
      await session.abortTransaction();
      return;
    }

    const filter: any = mongoose.Types.ObjectId.isValid(rowId) ? { _id: rowId } : { id: rowId };
    filter.staff_id = loginId;

    const result = await UserIncentive.findOneAndUpdate(
      filter,
      { $set: userData },
      { new: true, session }
    );

    if (!result) {
      res.status(404).json({ message: 'Given row id is not found' });
      await session.abortTransaction();
      return;
    }

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} Success`, result });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};