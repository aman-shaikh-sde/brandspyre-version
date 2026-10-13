import crypto from 'crypto';
import mongoose from 'mongoose';
import { Tenant, ITenant } from '../../db/ModelSceham/saasSchema';

export class TenantService {
  /**
   * Generates a clean URL-friendly slug for an organization with collision resolution.
   */
  static async generateSlug(companyName: string, session?: mongoose.ClientSession): Promise<string> {
    const baseSlug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'org';

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = Tenant.findOne({ slug });
      if (session) query.session(session);
      const existing = await query.lean();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Generates unique identification codes for Tenant, Branch, Staff, and UUID.
   */
  static generateIdentifiers() {
    const random6Digits = Math.floor(100000 + Math.random() * 900000);
    const tenantCode = `TNT-${random6Digits}`;
    const branchCode = `BR-${random6Digits}`;
    const staffCode = `EMP-${random6Digits}`;
    const orgUuid = crypto.randomUUID();

    return {
      tenantCode,
      branchCode,
      staffCode,
      orgUuid
    };
  }

  /**
   * Finds a tenant by slug, domain, or ID.
   */
  static async findTenantByIdentifier(identifier: string): Promise<ITenant | null> {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const tenant = await Tenant.findById(identifier);
      if (tenant) return tenant;
    }

    return await Tenant.findOne({
      $or: [
        { slug: identifier.toLowerCase() },
        { domain: identifier.toLowerCase() },
        { tenant_code: identifier.toUpperCase() }
      ]
    });
  }

  /**
   * Updates tenant settings.
   */
  static async updateSettings(tenantId: string, newSettings: Record<string, any>, session?: mongoose.ClientSession) {
    const query = Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          settings: newSettings,
          updated_at: new Date()
        }
      },
      { new: true }
    );

    if (session) query.session(session);
    return await query;
  }
}

export default TenantService;
