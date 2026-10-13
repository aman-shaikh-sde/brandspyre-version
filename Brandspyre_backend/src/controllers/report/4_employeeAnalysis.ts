import { Request, Response } from "express";
import { getStaffReportSummary } from "./userReports/getStaffReportSummary";
import { UserInfo } from "../../db/ModelSceham/userSchema";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const employeeAnalysis = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Get Task Summary Using Staff_id and Project Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { staff_id, start_date, end_date } = req.query;

  try {
    const user = await UserInfo.findOne({ staff_id: idObj }).lean();
    if (!user) {
      res.status(404).json({ message: "Logged-in user not found" });
      return;
    }

    if (!staff_id) {
      res.status(400).json({ message: "Staff ID is required" });
      return;
    }

    const users: any = await getStaffReportSummary(staff_id as string, start_date as string, end_date as string);
    if (!users) {
      res.status(404).json({ message: "No users found" });
      return;
    }
    res.status(200).json({ message: `${msgField} Success`, data: users });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Employee Analysis Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};