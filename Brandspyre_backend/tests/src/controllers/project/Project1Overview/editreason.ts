import { Request, Response } from "express";
import { Project } from "../../../db/ModelSceham/project/client";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const editProjectReason = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = "Edit Project Reason";
  const { userId } = req.user as AuthenticatedUser;
  const { reason } = req.body; // only reason in body
  const project_code = req.params.id; // from route param

  if (!project_code || !reason) {
    res
      .status(400)
      .json({ error: "Missing required fields: project_code or reason" });
    return;
  }

  try {
    const result = await Project.findOneAndUpdate(
      { project_code: project_code },
      {
        reason: reason,
        updated_on: new Date(),
        updatedby: String(userId)
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ message: "Project not found with given code" });
      return;
    }

    res
      .status(200)
      .json({ message: `${msgField} Success`, project: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
