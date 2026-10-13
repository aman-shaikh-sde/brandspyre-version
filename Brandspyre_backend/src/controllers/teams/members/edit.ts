import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Team } from "../../../db/ModelSceham/teams/team";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const editMemberInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Member's Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userData } = req.body || {};
  const rowId = req.params.id;
  const loginId = idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!existingUser) {
      await session.abortTransaction();
      res.status(409).json({ error: `User not found` });
      return;
    }

    if (!userData || !userData.team_id) {
      await session.abortTransaction();
      res.status(400).json({ error: "Missing required field: team_id" });
      return;
    }

    const existingTeam = await Team.findOne({ team_id: userData.team_id }).session(session).lean();
    if (!existingTeam) {
      await session.abortTransaction();
      res.status(404).json({ message: "Team not found" });
      return;
    }

    const filter: any = mongoose.Types.ObjectId.isValid(rowId) ? { _id: rowId } : { id: rowId };

    const updated = await TeamMember.findOneAndUpdate(
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
    res.status(200).json({ message: `${msgField} successfully.`, result: updated });

  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Error in editMemberInfo: ${message}`);
    res.status(500).json({ error: message });
  } finally {
    session.endSession();
  }
};