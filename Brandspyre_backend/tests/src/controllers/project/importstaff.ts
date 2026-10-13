import { Request, Response } from "express";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import * as XLSX from "xlsx";
import fs from "fs";
import { encryptPassword } from './helperfunction';

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

function excelDateToJSDate(serial: any): string | null {
  if (!serial) return null;
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  if (typeof serial === "string") {
    const trimmed = serial.trim();
    const parts = trimmed.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let [a, b, c] = parts.map((p) => p.padStart(2, "0"));
      if (c.length === 4) return `${c}-${b}-${a}`;
      if (a.length === 4) return `${a}-${b}-${c}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  }
  return null;
}

function cleanPhone(phone: any): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

function cleanText(text: any): string | null {
  if (text === undefined || text === null) return null;
  const t = String(text).trim();
  return t.length > 0 ? t : null;
}

export const importEmployees = async (req: Request, res: Response): Promise<void> => {
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
    let importedCount = 0;

    for (const row of rows) {
      try {
        const staff_id = cleanText(row.staff_id);
        const branchcode = cleanText(row.branchcode) || brcode;
        const role = cleanText(row.role) || "employee";
        const firstname = cleanText(row.firstname);
        const lastname = cleanText(row.lastname);
        const dob = excelDateToJSDate(row.dob);
        const gender = cleanText(row.gender);
        const marital = cleanText(row.marital);
        const bloodgroup = cleanText(row.bloodgroup);
        const phonenumber = cleanPhone(row.phonenumber);
        const alternumber = cleanPhone(row.alternumber);
        const email = cleanText(row.email);

        let rawPassword = cleanText(row.password);
        let password: string | null = null;
        if (rawPassword) {
          password = await encryptPassword(rawPassword);
        }

        const permanentaddress = cleanText(row.permanentaddress);
        const presentaddress = cleanText(row.presentaddress);
        const department = cleanText(row.department);
        const designation = cleanText(row.designation);
        const pannumber = cleanText(row.pannumber);
        const aadharnumber = cleanText(row.aadharnumber);
        const profileurl = cleanText(row.profileurl);
        const dateofjoining = excelDateToJSDate(row.dateofjoining);
        const relivingdate = excelDateToJSDate(row.relivingdate);
        const status = cleanText(row.status) || "active";
        const notes = cleanText(row.notes);

        if (!staff_id || !firstname || !email) {
          skippedRows.push({ row, reason: "Missing essential fields" });
          continue;
        }

        const existing = await UserInfo.findOne({ $or: [{ staff_id }, { email }] }).lean();
        if (existing) {
          skippedRows.push({
            row,
            reason: `Duplicate found (staff_id or email already exists)`,
          });
          continue;
        }

        await UserInfo.create({
          staff_id, branchcode, role, firstname, lastname,
          dob, gender, marital, bloodgroup,
          phonenumber, alternumber, email, password,
          permanentaddress, presentaddress,
          department, designation, pannumber, aadharnumber, profileurl,
          dateofjoining, relivingdate, status, notes,
        });

        importedCount++;
      } catch (rowError) {
        skippedRows.push({
          row,
          reason: (rowError as Error).message || "Unknown row error",
        });
      }
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `Employees imported successfully`,
      imported: importedCount,
      skipped: skippedRows.length,
      skippedRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`importEmployees Error: ${message}`);
    res.status(500).json({ error: message });
  }
};
