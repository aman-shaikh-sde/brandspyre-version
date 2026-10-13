import { Request, Response } from "express";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewMemberInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Member's Info`;
  const { userId: idObj, userRole, tenantId, brcode } = req.user as AuthenticatedUser;
  let { rowId, staff_id, search, dec, page = 1, limit = 25 } = req.query;

  const loginId = staff_id ? staff_id : idObj;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    // Superadmin and master_super_admin can see all team members
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see team members from their specific branch
    else if (userRole === 'admin' && tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } } // For backward compatibility with old team members
      ];
    }
    // Other roles can only see their own branch
    else if (tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }

    if (rowId) filter._id = rowId;
    if (staff_id) filter.staff_id = new RegExp(String(loginId), 'i');
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { status: searchRegex },
        { branchcode: searchRegex }
      ];
    }

    const totalDocuments = await TeamMember.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const members = await TeamMember.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.status(200).json({
      message: `${msgField} Success`,
      data: members,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
