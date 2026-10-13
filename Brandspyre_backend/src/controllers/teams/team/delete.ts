import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Team } from "../../../db/ModelSceham/teams/team";
import { Request, Response } from "express";


interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode:string;
  }

  interface UserData {
    team_id?: string,
    branchcode?: string,
    
    // ✅ Add this line:
    [key: string]: string | undefined;
  }

export const deleteTeamInfo = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Team Info`;
    const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
    
    let { userData } = req.body as { userData: UserData }
    const loginId = idObj;

    try {
        const session = await mongoose.startSession();

        session.startTransaction();

        // Step 1: Validate user
        const userCheck = await (async () => {
        const rows = await UserInfo.find({ staff_id: loginId }).session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            designation: r.desigantion,
permanentaddress: r.permantaddress
          })),
          rowCount: rows.length
        };
      })();
        if (userCheck.rowCount === 0) {
             res.status(404).json({ message: `User with staff_id '${loginId}' not found`})
             return
        }
        const deleteQuery = `DELETE FROM teams WHERE team_id = $1 AND branchcode = $2 RETURNING *`;
        const result = await (async () => {
      const deleteRes = await Team.deleteMany({ team_id: userData.team_id, branchcode: userData.branchcode }).session(session);
      return { rows: [], rowCount: deleteRes.deletedCount };
    })();
        
        if (result.rowCount === 0) {
            await session.abortTransaction();
            res.status(404).json({ message: 'Given row ID not found or does not belong to this user.' });
            return;
        }
       
        await session.commitTransaction();

        res.status(201).json({ message:  `${msgField} Success `});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error:  `${msgField} Causes Error Message: ${message}` });
    }
}
