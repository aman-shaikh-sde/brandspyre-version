import { Request, Response } from "express";
import { LeaveType } from "../../../db/ModelSceham/adminSession/leavetype";

export const viewMasterLeaveTypeInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Master Leave Type Info`;
  let { rowId, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};
    if (rowId) filter._id = rowId;
    if (search) {
      filter.name = new RegExp(String(search), 'i');
    }

    const totalDocuments = await LeaveType.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const docs = await LeaveType.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const data = docs.map((d: any) => ({ ...d, id: d._id.toString() }));

    res.status(200).json({ message: `${msgField} Success`, data, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: message });
  }
};