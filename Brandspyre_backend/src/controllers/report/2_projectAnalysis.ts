import { Request, Response } from "express";
import { totalProject, totalClientsReport } from './subReport/projectAnalysis';
import { getPerTaskSummaryByStaffAndProject } from "./ProjectReports/getPerTaskSummaryByStaffAndProject ";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { getProjectOverview } from './ProjectReports/getProjectOverview';

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const projectAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    await totalProject();
    await totalClientsReport();
    res.status(200).json({ message: "projectAnalysis Success" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`projectAnalysis Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};

export const perTaskSummaryByStaffAndProjects = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Get Task Summary Using Staff_id and Project Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { project_code, staff_id, start_date, end_date } = req.query;

  try {
    const user = await UserInfo.findOne({ staff_id: idObj }).lean();
    if (!user) {
      res.status(404).json({ message: "Logged-in user not found" });
      return;
    }

    if (!project_code || !staff_id) {
      res.status(400).json({ message: "Project code and Staff ID are required" });
      return;
    }

    const project: any = await getPerTaskSummaryByStaffAndProject(staff_id as string, project_code as string, start_date as string, end_date as string);
    if (!project) {
      res.status(404).json({ message: "No project found" });
      return;
    }
    res.status(200).json({ message: `${msgField} Success`, data: project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`projectAnalysis Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};

export const projectOverviewAnalysis = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Get Project OverView Analysis Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { project_code } = req.query;

  try {
    const user = await UserInfo.findOne({ staff_id: idObj }).lean();
    if (!user) {
      res.status(404).json({ message: "Logged-in user not found" });
      return;
    }

    if (!project_code) {
      res.status(400).json({ message: "Project code is required" });
      return;
    }
    const project: any = await getProjectOverview(project_code as string);
    if (!project) {
      res.status(404).json({ message: "No project found" });
      return;
    }
    res.status(200).json({ message: `${msgField} Success`, data: project });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`projectAnalysis Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};