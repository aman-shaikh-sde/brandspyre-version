import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Team, TeamLeadHistory } from "../../../db/ModelSceham/teams/team";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface UserData {
  team_id?: string;
  team_name?: string;
  team_lead?: string;
  branchcode?: string;
  is_active?: boolean;
  change_reason?: string;
  [key: string]: any;
}

export const editTeamInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Team Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userData } = req.body as { userData: UserData };
  const loginId = idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userCheck = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!userCheck) {
      await session.abortTransaction();
      res.status(404).json({ error: `Requesting user not found` });
      return;
    }

    if (!userData || !userData.team_id) {
      await session.abortTransaction();
      res.status(400).json({ error: `Missing required field: team_id` });
      return;
    }

    const existingTeam = await Team.findOne({ team_id: userData.team_id }).session(session).lean() as any;
    if (!existingTeam) {
      await session.abortTransaction();
      res.status(404).json({ message: "Team not found" });
      return;
    }

    if (userData.team_name && userData.team_name !== existingTeam.team_name) {
      const duplicateCheck = await Team.findOne({
        team_name: userData.team_name,
        branchcode: userData.branchcode || existingTeam.branchcode,
        team_id: { $ne: userData.team_id }
      }).session(session).lean();

      if (duplicateCheck) {
        await session.abortTransaction();
        res.status(409).json({ message: "Team name already exists in this branch" });
        return;
      }
    }

    if (userData.team_lead && userData.team_lead !== existingTeam.team_lead) {
      const newLeadCheck = await UserInfo.findOne({ staff_id: userData.team_lead }).session(session).lean();
      if (!newLeadCheck) {
        await session.abortTransaction();
        res.status(404).json({ error: `New team lead not found` });
        return;
      }

      const memberCheck = await TeamMember.findOne({
        team_id: existingTeam.team_id,
        staff_id: userData.team_lead
      }).session(session).lean();

      if (!memberCheck) {
        await TeamMember.create([{
          team_id: existingTeam.team_id,
          staff_id: userData.team_lead,
          branchcode: existingTeam.branchcode,
          role: 'lead',
          status: 'active'
        }], { session });
      } else {
        await TeamMember.updateMany(
          { team_id: existingTeam.team_id, staff_id: userData.team_lead },
          { $set: { role: 'lead', status: 'active', updated_on: new Date() } }
        ).session(session);
      }

      await TeamMember.updateMany(
        { team_id: existingTeam.team_id, staff_id: existingTeam.team_lead },
        { $set: { role: 'member' } }
      ).session(session);

      await TeamLeadHistory.create([{
        team_id: existingTeam.team_id,
        old_lead: existingTeam.team_lead,
        new_lead: userData.team_lead,
        branchcode: existingTeam.branchcode,
        change_reason: userData.change_reason || 'Team lead reassignment',
        status: 'completed',
        changed_by: loginId
      }], { session });

      await Team.updateOne(
        { team_id: existingTeam.team_id },
        {
          $inc: { modified_count: 1 },
          $set: { team_lead: userData.team_lead, previous_lead: existingTeam.team_lead, updated_on: new Date() }
        }
      ).session(session);
    }

    const updateObj: any = { updated_on: new Date() };
    const updatableFields = ['team_name', 'branchcode', 'is_active'];
    updatableFields.forEach(field => {
      if (userData[field] !== undefined) {
        updateObj[field] = userData[field];
      }
    });

    const updatedTeam = await Team.findOneAndUpdate(
      { team_id: userData.team_id },
      { $set: updateObj },
      { new: true, session }
    );

    await session.commitTransaction();
    res.status(200).json({
      message: `${msgField} updated successfully`,
      data: updatedTeam
    });

  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error in editTeamInfo: ${message}`);
    res.status(500).json({ error: "Failed to update team information", details: message });
  } finally {
    session.endSession();
  }
};
