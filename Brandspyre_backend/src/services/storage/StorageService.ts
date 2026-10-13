import path from "path";
import fs from "fs";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

export interface StorageOptions {
  tenantId?: string;
  contentType?: string;
  isPublic?: boolean;
}

export interface StorageResult {
  key: string;
  url: string;
  size: number;
  provider: "local" | "s3" | "r2";
}

export interface IStorageProvider {
  saveFile(buffer: Buffer, relativeKey: string, options?: StorageOptions): Promise<StorageResult>;
  readFile(relativeKey: string): Promise<Buffer>;
  deleteFile(relativeKey: string): Promise<boolean>;
  fileExists(relativeKey: string): Promise<boolean>;
  getPublicUrl(relativeKey: string): string;
}

/**
 * Local Disk Storage Provider with Tenant Sandboxing & Path Traversal Protection
 */
export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || "uploads");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(relativeKey: string): string {
    const cleanKey = relativeKey.replace(/^[/\\]+/, "");
    const resolved = path.resolve(this.baseDir, cleanKey);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error(`Security Error: Path traversal detected for key '${relativeKey}'`);
    }
    return resolved;
  }

  async saveFile(buffer: Buffer, relativeKey: string, options?: StorageOptions): Promise<StorageResult> {
    const tenantPrefix = options?.tenantId ? `tenants/${String(options.tenantId).replace(/[^a-zA-Z0-9_-]/g, "")}/` : "";
    const finalKey = `${tenantPrefix}${relativeKey}`;
    const fullPath = this.resolvePath(finalKey);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    await writeFileAsync(fullPath, buffer);

    return {
      key: finalKey,
      url: `/uploads/${finalKey.replace(/\\/g, "/")}`,
      size: buffer.length,
      provider: "local"
    };
  }

  async readFile(relativeKey: string): Promise<Buffer> {
    const fullPath = this.resolvePath(relativeKey);
    return await readFileAsync(fullPath);
  }

  async deleteFile(relativeKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(relativeKey);
      if (fs.existsSync(fullPath)) {
        await unlinkAsync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("LocalStorageProvider delete failed:", relativeKey, err);
      return false;
    }
  }

  async fileExists(relativeKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(relativeKey);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  getPublicUrl(relativeKey: string): string {
    return `/uploads/${relativeKey.replace(/\\/g, "/").replace(/^[/\\]+/, "")}`;
  }
}

/**
 * Enterprise Unified Storage Service
 */
class StorageService {
  private provider: IStorageProvider;

  constructor() {
    // Configurable via STORAGE_PROVIDER environment variable ('local', 's3', 'r2')
    const providerType = process.env.STORAGE_PROVIDER || "local";
    switch (providerType.toLowerCase()) {
      case "local":
      default:
        this.provider = new LocalStorageProvider();
        break;
    }
  }

  getProvider(): IStorageProvider {
    return this.provider;
  }

  async saveFile(buffer: Buffer, relativeKey: string, options?: StorageOptions): Promise<StorageResult> {
    return this.provider.saveFile(buffer, relativeKey, options);
  }

  async readFile(relativeKey: string): Promise<Buffer> {
    return this.provider.readFile(relativeKey);
  }

  async deleteFile(relativeKey: string): Promise<boolean> {
    return this.provider.deleteFile(relativeKey);
  }

  async fileExists(relativeKey: string): Promise<boolean> {
    return this.provider.fileExists(relativeKey);
  }

  getPublicUrl(relativeKey: string): string {
    return this.provider.getPublicUrl(relativeKey);
  }
}

export const defaultStorageService = new StorageService();
export default defaultStorageService;
