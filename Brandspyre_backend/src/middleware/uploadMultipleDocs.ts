import { secureDocumentUpload } from "./secureUpload";

/**
 * Enterprise Secure Multi-Document Upload Middleware
 * Enforces MIME whitelist (PDF, DOC/DOCX, XLS/XLSX, CSV, JPEG, PNG, WEBP),
 * cryptographically random nonces for filenames, tenant directory isolation,
 * and 15MB file limits.
 */
export const uploadMultipleDocs = secureDocumentUpload.array("files", 10);

export default uploadMultipleDocs;
