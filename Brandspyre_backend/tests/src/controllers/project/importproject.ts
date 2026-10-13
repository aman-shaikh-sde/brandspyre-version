import { Request, Response } from "express";
import { Project } from "../../db/ModelSceham/project/client";
import * as XLSX from "xlsx";
import fs from "fs";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const importProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) {
      res.status(401).json({ error: "Unauthorized: user not found" });
      return;
    }

    const { brcode } = user;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      res.status(400).json({ error: "Excel file is empty." });
      return;
    }

    for (const row of rows) {
      const {
        project_code, branchcode: branchcodeRaw, campaign_code, lead_id, client_code,
        title, priority, type, loc, notes, budget, revised_cost, balance,
        paystatus, start_date, end_date, duration_days, handler_by,
        createby, updatedby, revised_count, additional, milestone_count,
        status, overallcost, reason,
      } = row;

      if (!project_code || !client_code || !title) {
        console.warn("Skipping row (missing required fields):", row);
        continue;
      }

      const branchcode = branchcodeRaw || brcode;

      await Project.create({
        project_code, branchcode,
        campaign_code: campaign_code || null,
        lead_id: lead_id || null,
        client_code, title, priority, type, loc, notes,
        budget: budget || 0, revised_cost: revised_cost || 0, balance: balance || 0,
        paystatus: paystatus || "none",
        start_date, end_date,
        duration_days: duration_days || 0,
        handler_by,
        createby: createby || user.userId,
        updatedby: updatedby || null,
        revised_count: revised_count || 0,
        additional: additional || 0,
        milestone_count: milestone_count || 0,
        status: status || "planning",
        overallcost: overallcost || 0,
        reason: reason || null,
      });
    }

    fs.unlinkSync(filePath);
    res.status(201).json({ message: "Projects imported successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`importProjects Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
