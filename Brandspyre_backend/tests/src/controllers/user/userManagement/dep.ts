import { Request, Response } from "express";
import { UserInfo } from "../../../db/ModelSceham/userSchema";

export const getDepartmentByStaffId = async (req: Request, res: Response): Promise<void> => {
  const { staff_id } = req.params;

  if (!staff_id) {
    res.status(400).json({ status: false, message: "Missing staff_id parameter." });
    return;
  }

  try {
    const user = await UserInfo.findOne({ staff_id }, 'department').lean() as any;

    if (!user) {
      res.status(404).json({ status: false, message: "Staff member not found." });
      return;
    }

    res.status(200).json({ status: true, department: user.department });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`getDepartmentByStaffId Error: ${message}`);
    res.status(500).json({ status: false, error: message });
  }
};
