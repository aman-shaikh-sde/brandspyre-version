import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserIncentive } from "../../../db/ModelSceham/user/10_incentive";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const deleteUserIncentivesInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete User Incentives Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const rowId = req.params.id;
  const loginId = req.body?.userData?.staff_id || idObj;

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

    const result = await UserIncentive.findOneAndDelete(filter, { session });
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