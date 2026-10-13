import { Milestone } from "../../db/ModelSceham/project/client";

"use strict";
import { Request, Response } from "express";


export const getMilestoneTypes = async (req: Request, res: Response) => {
  try {
    const milestoneTypes = await Milestone.distinct('milestone_type', { milestone_type: { $ne: null } });
    const statusTypes = await Milestone.distinct('status', { status: { $ne: null } });

    const uniqueMilestoneTypes = Array.from(new Set(milestoneTypes.map((t: any) => typeof t === 'string' ? t.trim() : String(t)))).filter(Boolean);
    const uniqueStatusTypes = Array.from(new Set(statusTypes.map((s: any) => typeof s === 'string' ? s.trim() : String(s)))).filter(Boolean);

    res.json({
      milestone_types: uniqueMilestoneTypes,
      status_types: uniqueStatusTypes
    });
  } catch (error) {
    console.error("Error fetching milestone meta", error);
    res.status(500).json({ error: "Failed to fetch milestone meta" });
  }
};
