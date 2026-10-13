import { Request, Response, RequestHandler } from "express";
import { Milestone, Task } from "../../db/ModelSceham/project/client";

export const getMilestonesAccess: RequestHandler = async (req, res) => {
  try {
    const { user_id, project_code, userRole } = req.query;

    if (!user_id || !project_code) {
      res.status(400).json({ error: "Missing user_id or project_code" });
      return;
    }

    const tasks = await Task.find({ project_code, $or: [{ handler_by: user_id }, { team_id: { $exists: true } }] }).lean() as any[];
    const milestoneCodes = [...new Set(tasks.map(t => t.milestone_code))];

    const milestones = await Milestone.find({
      project_code,
      milestone_code: { $in: milestoneCodes }
    }).lean();

    res.json({ milestones });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
