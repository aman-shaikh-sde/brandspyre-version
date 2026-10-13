import { Request, Response } from "express";
import { LeaveRequest } from "../../../db/ModelSceham/user/15_leaverequest";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Branch } from "../../../db/ModelSceham/branchSchema";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const viewUserLeaveReqInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Leave Request Info`;

  let {
    req_id,
    staff_id,
    branchcode,
    leave_type,
    search,
    approved_by,
    dec,
    status,
    approval_date,
    start_date,
    end_date,
    is_half_day,
    partial_day_type,
    leave_duration_hours,
    page = 1,
    limit = 25
  } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    if (req_id) filter._id = req_id;
    if (staff_id) filter.staff_id = staff_id;
    if (status) filter.status = status;
    if (branchcode) filter.branchcode = branchcode;
    if (leave_type) filter.leave_type = leave_type;
    if (approved_by) filter.approved_by = approved_by;
    if (is_half_day !== undefined) filter.is_half_day = is_half_day === 'true';
    if (partial_day_type) filter.partial_day_type = partial_day_type;
    if (leave_duration_hours) filter.leave_duration_hours = Number(leave_duration_hours);

    if (start_date || end_date) {
      filter.start_date = {};
      if (start_date) filter.start_date.$gte = new Date(String(start_date));
      if (end_date) filter.start_date.$lte = new Date(String(end_date));
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { leave_type: searchRegex },
        { reason: searchRegex },
      ];
    }

    const totalDocuments = await LeaveRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const requests = await LeaveRequest.find(filter)
      .sort({ requested_on: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const formattedData = await Promise.all(
      requests.map(async (lr: any) => {
        const user = await UserInfo.findOne({ staff_id: lr.staff_id }).lean() as any;
        const mgr = lr.approved_by ? await UserInfo.findOne({ staff_id: lr.approved_by }).lean() as any : null;
        const branch = lr.branchcode ? await Branch.findOne({ branchcode: lr.branchcode }).lean() as any : null;

        return {
          ...lr,
          req_id: lr._id,
          staff_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : lr.staff_id,
          branch_name: branch?.name || '',
          approved_by_name: mgr ? `${mgr.firstname || ''} ${mgr.lastname || ''}`.trim() : '',
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
      balanceDocuments
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
