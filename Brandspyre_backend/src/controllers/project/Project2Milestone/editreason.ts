import { Request, Response } from "express";
import { Milestone } from "../../../db/ModelSceham/project/client";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const editmilestoneReason = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Edit Milestone Reason";
  const { userId } = req.user as AuthenticatedUser;
  const { reason } = req.body;
  const milestone_code = req.params.id;

  if (!milestone_code || !reason) {
    res
      .status(400)
      .json({ error: "Missing required fields: milestone_code or reason" });
    return;
  }

  try {
    const result = await Milestone.findOneAndUpdate(
      { milestone_code: milestone_code },
      {
        reason: reason,
        updated_on: new Date()
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ message: "Milestone not found with given code" });
      return;
    }

    res
      .status(200)
      .json({ message: `${msgField} Success`, milestone: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
