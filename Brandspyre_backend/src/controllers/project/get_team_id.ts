import { TeamMember } from "../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";


export const getTeamByStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staff_id = req.query.staff_id as string | undefined;

    if (!staff_id) {
      res.status(400).json({ error: "staff_id is required" });
      return;
    }

    const result = await (async () => {
        const rows = await TeamMember.findOne({ staff_id: staff_id }, 'team_id').lean() as any;
        return {
          rows: rows ? [
            {
              ...rows,
              id: rows._id.toString(),
              
            }
          ] : [],
          rowCount: rows ? 1 : 0
        };
      })();

    if (result.rowCount === 0) {
      res.status(200).json({ staff_id, team_id: null, message: "Staff not assigned to any team" });
      return;
    }

    res.json({ staff_id, team_id: result.rows[0].team_id });
  } catch (error) {
    console.error("Error fetching team by staff", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
};
