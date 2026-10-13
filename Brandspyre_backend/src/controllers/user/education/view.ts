import { Request, Response } from "express";
import { UserEducation } from "../../../db/ModelSceham/user/6_education";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const viewUserEducationsInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Educations Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { rowId, staff_id, search, dec, page = 1, limit = 25 } = req.query;

  const loginId = staff_id ? staff_id : idObj;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};
    if (rowId) filter._id = rowId;
    if (staff_id) filter.staff_id = new RegExp(String(loginId), 'i');

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { institute: searchRegex },
        { degree: searchRegex },
        { passing: searchRegex },
        { percentage: searchRegex },
      ];
    }

    const totalDocuments = await UserEducation.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const result = await UserEducation.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const formattedData = result.map((r: any) => ({ ...r, id: r._id }));

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