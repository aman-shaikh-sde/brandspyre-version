import { Request, Response } from "express";
import { Milestone } from "../../db/ModelSceham/project/client";

export const revisedProjects = async (req: Request, res: Response) => {
  try {
    const {
      project_code,
      milestone_code,
      start_date,
      end_date,
      status,
      paystatus,
      branchcode,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * pageSize;

    let filter: any = { isrevised: true };

    if (project_code) filter.project_code = project_code;
    if (milestone_code) filter.milestone_code = milestone_code;
    if (status) filter.status = status;
    if (paystatus) filter.paystatus = paystatus;
    if (branchcode) filter.branchcode = branchcode;

    if (start_date && end_date) {
      filter.start_date = { $gte: new Date(start_date as string) };
      filter.end_date = { $lte: new Date(end_date as string) };
    }

    const totalCount = await Milestone.countDocuments(filter);
    const revisions = await Milestone.find(filter)
      .sort({ updated_on: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.json({
      count: totalCount,
      page: pageNum,
      limit: pageSize,
      revisions,
    });
  } catch (error) {
    console.error("Error fetching revised projects", error);
    res.status(500).json({ error: "Failed to fetch revised projects" });
  }
};
