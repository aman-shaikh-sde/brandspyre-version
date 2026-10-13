import { Request, Response } from "express";
import { LogEntry } from "../../../db/ModelSceham/user/18_loginEntry";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewLogin = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Login Entry's Info`;
  const { userId, userRole, tenantId } = req.user as AuthenticatedUser;
  let { staff_id, branchcode, search, dec, page = 1, limit = 25 } = req.query;
  const loginId = staff_id ? staff_id : userId;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    // Multi-tenant: Add tenant_id filter for non-superadmin users
    // Admin role with tenant_id should see their tenant's data (both with and without tenant_id for backward compatibility)
    if (userRole !== 'superadmin' && userRole !== 'master_super_admin' && tenantId) {
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } } // For backward compatibility with old login entries
      ];
    }

    if (branchcode) filter.branchcode = new RegExp(String(branchcode), 'i');
    if (staff_id) filter.staff_id = new RegExp(String(loginId), 'i');

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { ip: searchRegex },
        { device: searchRegex },
        { date: searchRegex },
        { time: searchRegex },
      ];
    }

    const totalDocuments = await LogEntry.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const result = await LogEntry.find(filter)
      .sort({ staff_id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.status(200).json({
      status: true,
      message: msgField,
      data: result,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`viewUsers Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};