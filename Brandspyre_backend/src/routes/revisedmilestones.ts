import express from "express";
import { Milestone } from "../db/ModelSceham/project/client";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

router.get("/revisions", authMiddleware, tenantAuth(), async (req, res) => {
  try {
    const { project_code, milestone_code, start_date, end_date } = req.query;

    let filter: any = { isrevised: true };

    if (project_code) filter.project_code = project_code;
    if (milestone_code) filter.milestone_code = milestone_code;
    if (start_date) filter.start_date = { $gte: new Date(start_date as string) };
    if (end_date) filter.end_date = filter.end_date ? { ...filter.end_date, $lte: new Date(end_date as string) } : { $lte: new Date(end_date as string) };

    const milestones = await Milestone.find(filter)
      .sort({ updated_on: -1 })
      .lean();

    res.json(milestones);

  } catch (err: any) {
    console.error("Error fetching revisions", err);
    res.status(500).json({ message: "Failed to fetch revisions" });
  }
});

export default router;
