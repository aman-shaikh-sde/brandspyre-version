import mongoose from 'mongoose';
import { Team } from "../../../db/ModelSceham/teams/team";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const generateNextTeamId = async (prefix: string, session?: any): Promise<string> => {
  if (!prefix) {
    throw new Error("Prefix is required to generate TeamID");
  }

  const latestTeam = await Team.findOne({ branchcode: prefix }, 'team_id')
    .sort({ created_on: -1 })
    .session(session)
    .lean() as any;

  let nextNumber = 1;
  let padLength = 2;

  if (latestTeam && latestTeam.team_id) {
    const parts = latestTeam.team_id.split("/");
    const lastNumStr = parts[parts.length - 1];
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
      padLength = Math.max(2, lastNumStr.length, String(nextNumber).length);
    }
  }

  if (nextNumber >= 100 && padLength < 3) padLength = 3;

  return `${prefix}/TEAM/${String(nextNumber).padStart(padLength, "0")}`;
};

export const createTeamInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create Team Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userDatas } = req.body;

  const session = await mongoose.startSession();

  try {
    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created: any[] = [];
    const failed: any[] = [];

    session.startTransaction();

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };
      const staffId = userData.team_lead || idObj;

      try {
        const userCheck = await UserInfo.findOne({ staff_id: staffId }).session(session).lean();
        if (!userCheck) {
          failed.push({
            user: userDataRaw,
            error: `User with staff_id '${staffId}' not found`
          });
          continue;
        }

        const isvalidTeam = await Team.findOne({ team_name: userData.team_name, branchcode: userData.branchcode }).session(session).lean();
        if (isvalidTeam) {
          res.status(404).json({ message: `Already this team name is available ${userData.team_name} ${userData.branchcode}` });
          await session.abortTransaction();
          return;
        }

        const team_id = await generateNextTeamId(userData.branchcode, session);
        userData.team_id = team_id;

        const [newTeamDoc] = await Team.create([userData], { session });
        const existingTeams = newTeamDoc.toObject() as any;
        existingTeams.id = existingTeams._id.toString();

        await TeamMember.create([{
          team_id: existingTeams.team_id,
          staff_id: existingTeams.team_lead,
          branchcode: existingTeams.branchcode,
          role: 'lead',
          status: 'active'
        }], { session });

        created.push(existingTeams);

      } catch (err) {
        failed.push({
          user: userDataRaw,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    await session.commitTransaction();

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
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ error: `${msgField} failed due to server error: ${message}` });
  } finally {
    session.endSession();
  }
};
