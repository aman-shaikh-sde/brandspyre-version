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

export const createMemberInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create Member's Info`;
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
      const staffId = userData.staff_id || idObj;

      try {
        const userCheck = await UserInfo.findOne({ staff_id: staffId }).session(session).lean();
        if (!userCheck) {
          failed.push({
            user: userDataRaw,
            error: `User with staff_id '${staffId}' not found`
          });
          continue;
        }

        const isvalidTeam = await Team.findOne({ team_id: userData.team_id, branchcode: userData.branchcode }).session(session).lean();
        if (!isvalidTeam) {
          res.status(404).json({ message: `Team is Not Found ${userData.team_id} ${userData.branchcode}` });
          await session.abortTransaction();
          return;
        }

        const isalreadyMember = await TeamMember.findOne({ team_id: userData.team_id, staff_id: userData.staff_id }).session(session).lean();
        if (isalreadyMember) {
          res.status(404).json({ message: `User is already in this Team Member ${userData.team_id} ${userData.staff_id}` });
          await session.abortTransaction();
          return;
        }

        const [createdDoc] = await TeamMember.create([userData], { session });
        const obj = createdDoc.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);

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
