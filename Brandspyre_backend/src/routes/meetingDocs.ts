import express, { Request, Response, NextFunction } from "express";
import { upload } from "../middleware/upload";
import { ProjectMeeting } from "../db/ModelSceham/project/client";
import path from "path";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

router.post(
  "/upload-meeting-doc",
  authMiddleware,
  tenantAuth(),
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;
    const {
      title,
      comm_type,
      project_code,
      branchcode,
      start_date_time,
      end_date_time,
    } = req.body;

    if (!title || !comm_type) {
      res.status(400).json({ message: "Title and comm_type are required" });
      return;
    }

    if (!file) {
      res.status(400).json({ message: "File is required" });
      return;
    }

    const doc = {
      url: `${req.protocol}://${req.get("host")}/uploads/documents/${file.filename}`,
      type: path.extname(file.originalname).substring(1),
    };

    const result = await ProjectMeeting.create({
      title,
      comm_type,
      project_code: project_code || null,
      branchcode: branchcode || null,
      doc: [doc],
      start_date_time: start_date_time ? new Date(start_date_time) : null,
      end_date_time: end_date_time ? new Date(end_date_time) : null,
    });

    res.status(201).json({
      message: "Meeting/doc uploaded successfully",
      data: result,
    });
  })
);

export default router;
