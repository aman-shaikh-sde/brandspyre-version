import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Resolves and ensures tenant-isolated recordings directory
const getRecordingsDestination = (req: any): string => {
  const tenantId = req.securityContext?.tenantId || req.user?.tenantId || req.tenant?.id;
  if (!tenantId || tenantId === "shared") {
    throw new Error("Security Error: Upload rejected because tenant context is missing.");
  }
  const sanitizedTenant = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = path.join(path.resolve("uploads"), "tenants", sanitizedTenant, "recordings");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

const storage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      cb(null, getRecordingsDestination(req));
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(12).toString("hex");
    cb(null, `${Date.now()}_${safeRandom}${ext}`);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common video and audio mime types/extensions
  const allowedExts = new Set([".mp4", ".webm", ".wav", ".mp3", ".ogg", ".m4a", ".mpeg"]);
  const allowedMimes = new Set([
    "video/mp4", "video/webm", "video/ogg", "video/mpeg",
    "audio/wav", "audio/wave", "audio/x-wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/m4a", "audio/x-m4a"
  ]);

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // SECURITY: Require BOTH extension AND MIME match (no ext || mime)
  if (allowedExts.has(ext) && allowedMimes.has(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`Security Error: Disallowed recording type (${ext}, ${mime}). Both valid audio/video extension and matching MIME type are strictly required.`));
  }
};

/**
 * Verifies magic bytes signature on disk for audio and video files
 */
export const verifyRecordingMagicBytes = (filePath: string): boolean => {
  if (!fs.existsSync(filePath)) return false;
  const buffer = Buffer.alloc(16);
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    if (bytesRead < 4) return false;

    // MP4 / MOV / M4A: bytes 4-7 are 'ftyp'
    if (bytesRead >= 8 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return true;
    }
    // WebM / MKV: EBML ID 0x1A 0x45 0xDF 0xA3
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      return true;
    }
    // WAV: RIFF....WAVE
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      if (bytesRead >= 12 && buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45) {
        return true;
      }
    }
    // MP3: ID3 or sync frame (0xFF 0xFB / 0xFF 0xF3 / 0xFF 0xF2)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return true;
    }
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
      return true;
    }
    // OGG: OggS (0x4F 0x67 0x67 0x53)
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return true;
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
 * Middleware to validate magic bytes of uploaded recording after Multer disk storage
 */
export const validateRecordingMagicBytesMiddleware = (req: any, res: any, next: any) => {
  const file = req.file;
  if (file && file.path) {
    if (!verifyRecordingMagicBytes(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        message: `Security Error: Recording '${file.originalname}' has invalid content signatures (magic bytes mismatch).`
      });
    }
  }
  next();
};

export const uploadRecordings = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max recording size
});

export default uploadRecordings;
