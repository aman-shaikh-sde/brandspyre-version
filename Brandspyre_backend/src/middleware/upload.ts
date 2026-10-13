import { secureDocumentUpload } from "./secureUpload";

/**
 * Standard Secure Document Upload Middleware
 * Enforces MIME whitelist, crypto filenames, tenant isolation, and size limits.
 * Fully backward-compatible drop-in for legacy upload imports.
 */
export const upload = secureDocumentUpload;

export default upload;
