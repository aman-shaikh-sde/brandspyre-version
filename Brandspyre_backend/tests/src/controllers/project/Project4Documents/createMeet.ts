import { Request, Response, NextFunction } from "express";
import path from "path";
import { ProjectMeeting } from "../../../db/ModelSceham/project/client";

interface DocEntry {
  url: string;
  type: string;
}

interface AuthenticatedUser {
  userId: number;
  userRole?: string;
  brcode?: string;
}

type AuthRequest = Request & {
  user?: AuthenticatedUser;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
};

export const createMeetingOrDocs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const createdby = user?.userId;

    if (!createdby) {
      return void res.status(401).json({ error: "Unauthorized" });
    }

    const {
      title,
      notes,
      comm_type = "doc",
      project_code,
      branchcode,
      client_code,
      campaign_code,
      milestone_code,
      task_id,
      participants_id,
      category,
      field,
      status = "active",
      doc_status = "none",
    } = req.body;

    const files = Array.isArray(req.files) ? req.files : [];
    const docArray: DocEntry[] = files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/documents/${file.filename}`,
      type: path.extname(file.originalname).substring(1),
    }));

    const created = await ProjectMeeting.create({
      branchcode: branchcode || null,
      campaign_code: campaign_code || null,
      client_code: client_code || null,
      project_code: project_code || null,
      milestone_code: milestone_code || null,
      task_id: task_id || null,
      participants_id: participants_id || null,
      title,
      notes: notes || null,
      comm_type,
      status,
      doc_status,
      category: category || null,
      field: field || null,
      doc: docArray,
      createdby
    });

    const obj = created.toObject() as any;
    obj.id = obj._id.toString();

    res.status(201).json({
      message: "Files uploaded and meeting/doc created successfully",
      data: obj,
    });
  } catch (error) {
    console.error("createMeetingOrDocs error:", error);
    next(error);
  }
};
