import { Tenant, AuditLog } from './ModelSceham/saasSchema';
import OrganizationEntitlementService from '../services/saas/OrganizationEntitlementService';
import seedIndustryModuleData from './seedData';
import { initializeIndustryModuleSchema } from './ModelSceham/industryModuleSchema';

export async function migrateExistingOrganizations(): Promise<void> {
  try {
    console.log('🔄 Starting zero-disruption organization entitlement migration...');

    // 1. Initialize schema & seed data
    await initializeIndustryModuleSchema();
    await seedIndustryModuleData();

    // 2. Find all active tenants
    const tenants = await Tenant.find({});
    console.log(`📋 Found ${tenants.length} organization tenant(s) to process.`);

    let migratedCount = 0;

    for (const tenant of tenants) {
      const tenantIdStr = tenant._id.toString();

      // Ensure industry is populated
      if (!tenant.industry || tenant.industry.trim() === '') {
        tenant.industry = 'OTHER';
        await tenant.save();
      }

      // Sync entitlement records from existing FeatureFlags / defaults
      await OrganizationEntitlementService.syncFromFeatureFlags(tenantIdStr);

      await AuditLog.create([{
        tenant_id: tenant._id,
        action: 'MIGRATED_ENTITLEMENTS',
        entity: 'Tenant',
        details: { message: 'Organization modules & features successfully migrated from FeatureFlags' },
        created_at: new Date()
      }]);

      migratedCount++;
    }

    console.log(`✅ Zero-disruption entitlement migration complete for ${migratedCount} organization(s).`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Migration error: ${message}`);
  }
}

export default migrateExistingOrganizations;
