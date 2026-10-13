import { Request, Response } from "express";
import { UserSalary, PerformanceReview } from "../../../db/ModelSceham/user/9_salary";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserBankInfo } from "../../../db/ModelSceham/user/3_bankinfo";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewUserSalaryInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Salary Info`;
  const { userId: idObj, userRole, tenantId } = req.user as AuthenticatedUser;
  let { rowId, staff_id, dec, page = 1, limit = 25 } = req.query;

  // SECURITY: Non-platform-admins MUST have a tenant context
  const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin';
  if (!isPlatformAdmin && !tenantId) {
    res.status(401).json({ error: "Tenant context required to access salary information." });
    return;
  }

  const loginId = staff_id ? staff_id : idObj;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    // SECURITY: Always scope salary queries to the authenticated user's tenant
    let filter: any = {};
    if (rowId) filter._id = rowId;
    if (staff_id) filter.staff_id = new RegExp(String(loginId), 'i');

    if (!isPlatformAdmin && tenantId) {
      // Enforce tenant isolation: find staff_ids that belong to this tenant,
      // then restrict salary query to those staff_ids
      const tenantUsers = await UserInfo.find({
        tenant_id: new mongoose.Types.ObjectId(tenantId)
      }).select('staff_id').lean() as any[];

      const tenantStaffIds = tenantUsers.map((u: any) => u.staff_id).filter(Boolean);

      if (staff_id) {
        // Verify the requested staff_id belongs to this tenant
        if (!tenantStaffIds.includes(String(staff_id))) {
          res.status(403).json({ error: "Access denied: employee does not belong to your organization." });
          return;
        }
      } else {
        filter.staff_id = { $in: tenantStaffIds };
      }
    }

    const totalDocuments = await UserSalary.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const salaries = await UserSalary.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const formattedData = await Promise.all(
      salaries.map(async (sm: any) => {
        const user = await UserInfo.findOne({ staff_id: sm.staff_id }).lean() as any;
        const bank = await UserBankInfo.findOne({ staff_id: sm.staff_id }).lean() as any;

        return {
          ...sm,
          id: sm._id,
          name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : sm.staff_id,
          department: user?.department || '',
          dateofjoining: user?.dateofjoining,
          accountholdername: bank?.accountholdername || '',
          accountnumber: bank?.accountnumber || '',
          bankname: bank?.bankname || '',
          bankifsc: bank?.bankifsc || '',
          banklocation: bank?.banklocation || '',
        };
      })
    );

    res.status(200).json({
      message: `${msgField} Success`,
      data: formattedData,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};


export const viewFeedbackInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Feedback Info`;
  let {
    rowId, branchcode, designation, department, reporting_to, team_id,
    staff_id, lead_id, search, dec, page = 1, limit = 25
  } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    if (rowId) filter.performance_id = rowId;
    if (branchcode) filter.branchcode = branchcode;
    if (staff_id) filter.staff_id = staff_id;
    if (designation) filter.designation = designation;
    if (department) filter.department = department;
    if (reporting_to) filter.reporting_to = reporting_to;
    if (team_id) filter.team_id = team_id;
    if (lead_id) filter.lead_id = lead_id;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { review_year: searchRegex },
        { name: searchRegex },
        { team_name: searchRegex },
        { lead_name: searchRegex }
      ];
    }

    const totalDocuments = await PerformanceReview.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const reviews = await PerformanceReview.find(filter)
      .sort({ performance_id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.status(200).json({
      message: `${msgField} Success`,
      data: reviews,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({
      error: `${msgField} Failed`,
      details: message
    });
  }
};