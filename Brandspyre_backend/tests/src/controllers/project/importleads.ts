import { Request, Response } from "express";
import { Lead } from "../../db/ModelSceham/project/campagin";
import * as XLSX from "xlsx";
import fs from "fs";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const importLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) {
      res.status(401).json({ error: "Unauthorized: user not found" });
      return;
    }

    const { brcode, tenantId } = user;

    // SECURITY: Tenant context is required for lead import
    const isPlatformAdmin = user.userRole === 'superadmin' || user.userRole === 'master_super_admin';
    if (!isPlatformAdmin && !tenantId) {
      res.status(401).json({ error: "Tenant context required to import leads." });
      return;
    }

    const resolvedTenantId = tenantId
      ? new mongoose.Types.ObjectId(tenantId)
      : undefined;

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
        id,
        branchcode: branchcodeRaw,
        campaign_code,
        lead_date,
        lead_name,
        phone,
        email,
        assignee_id,
        comm_type,
        proj_type,
        status,
        summary,
      } = row;

      if (!id || !lead_name || !phone) {
        skippedRows.push({ ...row, reason: "Missing required fields" });
        continue;
      }

      const branchcode = branchcodeRaw || brcode;

      try {
        const existing = await Lead.findOne({ $or: [{ id }, { lead_id: id }] }).lean();
        if (existing) {
          skippedRows.push({ ...row, reason: "Duplicate ID" });
          continue;
        }

        await Lead.create({
          id,
          lead_id: id,
          branchcode,
          campaign_code: campaign_code || null,
          lead_date: lead_date || null,
          lead_name,
          phone,
          email,
          assignee_id: assignee_id || null,
          comm_type: comm_type || "call",
          proj_type: proj_type || null,
          status: status || "onboarding",
          summary: summary || null,
          // SECURITY: Always stamp the importing tenant's ID
          ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
        });
      } catch (err) {
        skippedRows.push({ ...row, reason: (err as Error).message });
      }
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: "Leads imported successfully",
      skipped: skippedRows.length,
      skippedRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`importLeads Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
