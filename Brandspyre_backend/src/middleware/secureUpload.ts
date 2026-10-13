import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request } from "express";

const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv"
]);

const ALLOWED_DOCUMENT_EXTS = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"
]);

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const ALLOWED_IMAGE_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".webp"
]);

const ALLOWED_SPREADSHEET_EXTS = new Set([
  ".xls", ".xlsx", ".csv"
]);

const ALLOWED_SPREADSHEET_MIMES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "text/plain"
]);

// Resolves and ensures tenant-isolated directory
const getUploadDestination = (req: Request, subFolder: string = "documents"): string => {
  const tenantId = (req as any).securityContext?.tenantId || (req as any).user?.tenantId || (req as any).tenant?.id;
  if (!tenantId || tenantId === "shared") {
    throw new Error("Security Error: Upload rejected because tenant context is missing.");
  }
  const sanitizedTenant = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "");
  const baseUploads = path.resolve("uploads");
  const targetDir = path.join(baseUploads, "tenants", sanitizedTenant, subFolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
};

// Generates cryptographically secure, unpredictable, collision-resistant filenames
const generateSafeFilename = (originalname: string): string => {
  const ext = path.extname(originalname).toLowerCase();
  const safeRandom = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}_${safeRandom}${ext}`;
};

// Generic storage engine generator
const createDiskStorage = (subFolder: string = "documents"): StorageEngine => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const dest = getUploadDestination(req as Request, subFolder);
        cb(null, dest);
      } catch (err) {
        cb(err as Error, "");
      }
    },
    filename: (req, file, cb) => {
      cb(null, generateSafeFilename(file.originalname));
    }
  });
};

/**
 * Filter for general documents (PDF, Office, CSV)
 */
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_DOCUMENT_EXTS.has(ext) && (ALLOWED_DOCUMENT_MIMES.has(mime) || ALLOWED_IMAGE_MIMES.has(mime))) {
    cb(null, true);
  } else {
    cb(new Error(`Security Error: Disallowed file type (${ext}, ${mime}). Only PDF, Word, Excel, CSV, and images are permitted.`));
  }
};

/**
 * Filter for spreadsheet / CSV batch imports
 */
const spreadsheetFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_SPREADSHEET_EXTS.has(ext) && (ALLOWED_SPREADSHEET_MIMES.has(mime) || mime === "application/octet-stream")) {
    cb(null, true);
  } else {
    cb(new Error(`Security Error: Disallowed import file type (${ext}). Only .xlsx, .xls, and .csv spreadsheets are accepted.`));
  }
};

/**
 * Filter for images only
 */
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_IMAGE_EXTS.has(ext) && ALLOWED_IMAGE_MIMES.has(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`Security Error: Disallowed image type (${ext}). Only JPEG, PNG, and WebP images are permitted.`));
  }
};

export const secureDocumentUpload = multer({
  storage: createDiskStorage("documents"),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 10
  }
});

export const secureSpreadsheetUpload = multer({
  storage: createDiskStorage("imports"),
  fileFilter: spreadsheetFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1
  }
});

export const secureImageUpload = multer({
  storage: createDiskStorage("images"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

/**
 * Verifies magic bytes signature on disk to prevent MIME-type spoofing
 */
export const verifyFileMagicBytes = (filePath: string, expectedExt?: string): boolean => {
  if (!fs.existsSync(filePath)) return false;
  const ext = (expectedExt || path.extname(filePath)).toLowerCase();
  const buffer = Buffer.alloc(16);
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    if (bytesRead < 4) return false;

    // PDF: %PDF
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (ext === ".pdf") return isPdf;

    // PNG: \x89PNG
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (ext === ".png") return isPng;

    // JPEG: \xFF\xD8\xFF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    if (ext === ".jpg" || ext === ".jpeg") return isJpeg;

    // ZIP / DOCX / XLSX: PK\x03\x04
    const isZipBased = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (ext === ".docx" || ext === ".xlsx") return isZipBased;

    // OLE CFB (legacy DOC, XLS): 0xD0, 0xCF, 0x11, 0xE0
    const isOleCfb = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    if (ext === ".doc" || ext === ".xls") return isOleCfb || isZipBased;

    // WebP: RIFF....WEBP
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                   bytesRead >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (ext === ".webp") return isWebp;

    // CSV / Text: UTF-8 BOM or printable ASCII/UTF-8
    const isPrintableText = buffer.subarray(0, bytesRead).every(byte => 
      byte === 0x09 || byte === 0x0A || byte === 0x0D || (byte >= 0x20 && byte <= 0x7E) || byte >= 0x80
    );
    if (ext === ".csv" || ext === ".txt") return isPrintableText;

    // If extension is not specified or unrecognized, match against known file types
    if (!ext) {
      return isPdf || isPng || isJpeg || isZipBased || isOleCfb || isWebp || isPrintableText;
    }

    return false;
  } catch (e) {
    return false;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_) {}
    }
  }
};

/**
 * Middleware to validate magic bytes of uploaded files after Multer disk storage
 */
export const validateUploadMagicBytes = (req: Request, res: any, next: any) => {
  const files: Express.Multer.File[] = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).forEach(fList => files.push(...fList));
    }
  }

  for (const file of files) {
    if (file.path && !verifyFileMagicBytes(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        message: `Security Error: File '${file.originalname}' has invalid content signatures (magic bytes mismatch).`
      });
    }
  }
  next();
};

export const deleteUploadedFileSafely = (filePath: string): boolean => {
  try {
    const resolvedPath = path.resolve(filePath);
    const baseUploads = path.resolve("uploads");
    const relative = path.relative(baseUploads, resolvedPath);

    // Path traversal check: must stay strictly within uploads directory
    if (relative.startsWith("..") || path.isAbsolute(relative) || relative === "") {
      console.warn("Security Alert: Attempted path traversal in file deletion:", filePath);
      return false;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return true;
    }
  } catch (err) {
    console.warn("Failed to delete file safely:", filePath, err);
  }
  return false;
};

export default {
  secureDocumentUpload,
  secureSpreadsheetUpload,
  secureImageUpload,
  deleteUploadedFileSafely,
  verifyFileMagicBytes,
  validateUploadMagicBytes
};
