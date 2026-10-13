import { Request, Response } from "express";
import { LeaveType } from "../../../db/ModelSceham/adminSession/leavetype";

export const deleteMasterLeaveTypeInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const deleted = await LeaveType.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Leave type not found" });
      return;
    }
    res.status(200).json({ message: "Leave type deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deleteMasterLeaveType Error: ${message}`);
    res.status(500).json({ error: message });
  }
};