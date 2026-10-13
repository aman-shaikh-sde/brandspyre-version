import express, { Request, Response, NextFunction } from "express";
import { upload } from "../middleware/upload";
import { ClientDocument } from "../db/ModelSceham/project/client";
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
  "/upload",
  authMiddleware,
  tenantAuth(),
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { project_id, on_date } = req.body;

    const doc = await ClientDocument.create({
      project_id,
      description: file.filename,
      on_date: on_date || new Date()
    });

    res.status(201).json({
      message: "File uploaded successfully",
      data: doc,
      filename: file.filename,
      path: path.join("uploads/documents", file.filename),
    });
  })
);

export default router;
