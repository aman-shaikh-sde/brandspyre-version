import express, { Request, Response } from "express";
import { upload } from "../middleware/upload";
import { validateUploadMagicBytes } from "../middleware/secureUpload";
import { createUserDocumentUploadInfo } from "../controllers/user/documentsUpload/create";
import { viewUserDocumentsUploadInfo } from "../controllers/user/documentsUpload/view";
import { editUserDocumentUploadInfo } from "../controllers/user/documentsUpload/edit";
import { deleteUserDocumentUploadInfo } from "../controllers/user/documentsUpload/delete";
import { UserDocument } from "../db/ModelSceham/userDocumentsSchema";
import fs from "fs";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

import { uploadLimiter } from "../middleware/rateLimiter";
import mongoose from "mongoose";
import path from "path";

const router = express.Router();

router.use(authenticateToken);
router.use(tenantAuth());

router.post("/upload", uploadLimiter, upload.single("file"), validateUploadMagicBytes, createUserDocumentUploadInfo);
router.get("/view", viewUserDocumentsUploadInfo);
router.put("/edit", editUserDocumentUploadInfo);
router.delete("/delete", deleteUserDocumentUploadInfo);

router.get("/download/:documentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { brcode, tenantId, userRole } = (req.user as any) || {};
    
    const docQuery: any = { _id: documentId };
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((userRole || '').toLowerCase());
    if (!isPlatformAdmin) {
      if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
        docQuery.tenant_id = new mongoose.Types.ObjectId(tenantId);
      } else {
        docQuery.branchcode = brcode;
      }
    }

    const document = await UserDocument.findOne(docQuery).lean() as any;
    
    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const resolvedPath = path.resolve(document.file_path);
    const baseUploads = path.resolve("uploads");
    const relative = path.relative(baseUploads, resolvedPath);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: "File not found on server or invalid path" });
      return;
    }
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    if (document.file_size) {
      res.setHeader('Content-Length', document.file_size.toString());
    }
    
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

export default router;
