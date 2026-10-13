import { Request, Response } from "express";
import { UserDocument } from "../../../db/ModelSceham/userDocumentsSchema";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const viewUserDocumentsUploadInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Documents Upload Info`;

  try {
    const { userId, userRole, brcode } = req.user as AuthenticatedUser;
    const { page = 1, limit = 10, search = '', category = '', document_type = '' } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter: any = {};
    if (brcode) filter.branchcode = brcode;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { document_title: searchRegex },
        { description: searchRegex },
      ];
    }

    if (category) filter.category = category;
    if (document_type) filter.document_type = document_type;

    const total = await UserDocument.countDocuments(filter);

    const documents = await UserDocument.find(filter)
      .sort({ upload_date: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const formattedDocs = documents.map((doc: any) => ({ ...doc, id: doc._id }));

    res.status(200).json({
      message: `${msgField} Success`,
      data: formattedDocs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};