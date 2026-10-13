import { Request, Response } from "express";
import { LeaveType } from "../../../db/ModelSceham/adminSession/leavetype";

export const createMasterLeaveTypeInfo = async (req: Request, res: Response): Promise<void> => {
  const { name, total_days, description, branchcode } = req.body;

  try {
    if (!name || total_days === undefined) {
      res.status(400).json({ error: "Name and total_days are required" });
      return;
    }

    const created = await LeaveType.create({ name, total_days, description, branchcode });
    res.status(201).json({ message: "Leave type created successfully", data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`createMasterLeaveType Error: ${message}`);
    res.status(500).json({ error: message });
  }
};