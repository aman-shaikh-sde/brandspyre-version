import { Request, Response } from "express";
import { ClientModel } from "../../db/ModelSceham/project/client";
import * as XLSX from "xlsx";
import fs from "fs";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const importClients = async (req: Request, res: Response): Promise<void> => {
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

    const skippedRows: any[] = [];

    for (const row of rows) {
      const {
        client_code,
        branchcode: branchcodeRaw,
        campaign_code,
        lead_id,
        client_name,
        company_name,
        primary_phone,
        email,
        office_address,
        website,
        overallcost,
        balance,
        project_count,
        contacts,
        createdby,
        updatedby,
        industry_type,
        comm_type,
        status,
      } = row;

      if (!client_code || !client_name) {
        skippedRows.push(row);
        continue;
      }

      const branchcode = branchcodeRaw || brcode;

      await ClientModel.create({
        client_code,
        branchcode,
        campaign_code: campaign_code || null,
        lead_id: lead_id || null,
        client_name,
        company_name,
        primary_phone,
        email,
        office_address,
        website,
        overallcost: overallcost || 0,
        balance: balance || 0,
        project_count: project_count || 0,
        contacts: contacts || null,
        createdby: createdby || user.userId,
        updatedby: updatedby || null,
        industry_type: industry_type || null,
        comm_type: comm_type || "email",
        status: status || "active",
      });
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: "Clients imported successfully",
      skipped: skippedRows.length,
      skippedRows,
    });
  } catch (error: any) {
    console.error("Import clients error:", error);
    res.status(500).json({ error: error.message });
  }
};
