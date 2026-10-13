import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const deleteMemberInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete Member's Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const rowId = req.params.id;
  const { userData } = req.body || {};
  const loginId = userData?.staff_id ? userData.staff_id : idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ message: `User with staff_id '${loginId}' not found` });
      return;
    }

    const filter: any = mongoose.Types.ObjectId.isValid(rowId) ? { _id: rowId } : { id: rowId };
    if (userData?.team_id) filter.team_id = userData.team_id;
    if (userData?.branchcode) filter.branchcode = userData.branchcode;

    const deleted = await TeamMember.findOneAndDelete(filter, { session });
    if (!deleted) {
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