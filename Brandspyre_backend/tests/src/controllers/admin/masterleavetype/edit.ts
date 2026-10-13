import { Request, Response } from "express";
import { LeaveType } from "../../../db/ModelSceham/adminSession/leavetype";

export const editMasterLeaveTypeInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, total_days, description, branchcode } = req.body;

  try {
    const updated = await LeaveType.findByIdAndUpdate(id, { $set: { name, total_days, description, branchcode } }, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Leave type not found" });
      return;
    }
    res.status(200).json({ message: "Leave type updated successfully", data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`editMasterLeaveType Error: ${message}`);
    res.status(500).json({ error: message });
  }
};