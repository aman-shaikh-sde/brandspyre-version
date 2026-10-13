import { Request, Response } from "express";
import { Campaign } from "../../../db/ModelSceham/project/campagin";
import * as XLSX from "xlsx";
import fs from "fs";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

const parseExcelDate = (dateVal: string | number): Date | null => {
  if (typeof dateVal === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + (dateVal + 1) * 24 * 60 * 60 * 1000);
  } else if (typeof dateVal === "string") {
    const parts = dateVal.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }
    return new Date(dateVal);
  }
  return null;
};

export const importCampaigns = async (req: Request, res: Response): Promise<void> => {
  const { brcode } = req.user as AuthenticatedUser;

  try {
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
      res.status(400).json({ error: "Excel file is empty." });
      return;
    }

    const branchCodeCounters: Record<string, number> = {};

    for (const row of rows) {
      const {
        Branch,
        "Campaign Name": campaignname,
        "Campaign Type": campaigntype,
        "Start Date": startdate,
        "End Date": enddate,
        Lead: lead,
        "Total Lead": totallead,
        "Goal Lead": goallead,
        "Conversion Rate": conversationrate,
        Status: status,
        Summary: summary,
      } = row;

      const branchcode = Branch || brcode;

      if (!branchCodeCounters[branchcode]) {
        const lastCampaign = await Campaign.findOne({ branchcode })
          .sort({ created_on: -1 })
          .lean() as any;

        let nextNumber = 1;
        if (lastCampaign && lastCampaign.campaign_code) {
          const parts = lastCampaign.campaign_code.split("/");
          const lastNumber = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
        branchCodeCounters[branchcode] = nextNumber;
      }

      const paddedNumber = String(branchCodeCounters[branchcode]).padStart(2, "0");
      const campaign_code = `${branchcode}/CAMP/${paddedNumber}`;
      branchCodeCounters[branchcode]++;

      await Campaign.create({
        campaign_code,
        branchcode,
        campaignname,
        campaigntype,
        startdate: parseExcelDate(startdate),
        enddate: parseExcelDate(enddate),
        lead,
        totallead,
        goallead,
        conversationrate,
        status: status || "active",
        summary: summary || null,
      });
    }

    fs.unlinkSync(filePath);

    res.status(201).json({ message: "Campaigns imported successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`importCampaigns Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
