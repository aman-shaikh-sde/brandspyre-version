

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { UserInfo } from '../ModelSceham/userSchema';
import { Tenant, UserTenant } from '../ModelSceham/saasSchema';
import { Branch } from '../ModelSceham/branchSchema';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';

async function run() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI / DATABASE_URL not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Get all users
  const allUsers = await UserInfo.find({}).lean() as any[];
  console.log(`📋 Total users found: ${allUsers.length}`);

  // Get all existing UserTenant records
  const existingUTs = await UserTenant.find({}).lean() as any[];
  const existingUserTenantSet = new Set(
    existingUTs.map((ut: any) => `${ut.user_id.toString()}_${ut.tenant_id.toString()}`)
  );
  console.log(`📋 Existing UserTenant records: ${existingUTs.length}`);

  // Build a branchcode -> tenant_id map from the Branch collection
  const branches = await Branch.find({}).lean() as any[];
  const branchToTenant = new Map<string, string>();
  for (const branch of branches) {
    if (branch.branchcode && branch.tenant_id) {
      branchToTenant.set(branch.branchcode, branch.tenant_id.toString());
    }
  }
  console.log(`📋 Branch-to-tenant mappings: ${branchToTenant.size}`);

  // Get all tenants for fallback
  const tenants = await Tenant.find({ status: 'active' }).lean() as any[];
  const fallbackTenantId = tenants.length === 1 ? tenants[0]._id.toString() : null;
  if (fallbackTenantId) {
    console.log(`📋 Single active tenant found (fallback): ${fallbackTenantId}`);
  }

  let created = 0;
  let skipped = 0;
  let noTenant = 0;

  for (const user of allUsers) {
    const userId = user._id.toString();

    // Skip platform superadmins
    const role = (user.role || '').toLowerCase();
    if (['superadmin', 'platform_superadmin', 'master_super_admin', 'platform_admin', 'super admin'].includes(role)) {
      skipped++;
      continue;
    }

    // Resolve tenant_id for this user
    let tenantId: string | null = null;

    // 1. Check if user already has tenant_id field
    if (user.tenant_id) {
      tenantId = user.tenant_id.toString();
    }

    // 2. Try resolving from branchcode -> Branch -> tenant_id
    if (!tenantId && user.branchcode) {
      tenantId = branchToTenant.get(user.branchcode) || null;
    }

    // 3. Fallback to single tenant if only one exists
    if (!tenantId && fallbackTenantId) {
      tenantId = fallbackTenantId;
    }

    if (!tenantId) {
      console.warn(`  ⚠️  No tenant found for user: ${user.email || userId} (branchcode: ${user.branchcode || 'none'})`);
      noTenant++;
      continue;
    }

    // Check if UserTenant already exists
    const key = `${userId}_${tenantId}`;
    if (existingUserTenantSet.has(key)) {
      skipped++;
      continue;
    }

    // Create UserTenant record
    try {
      await UserTenant.create({
        user_id: new mongoose.Types.ObjectId(userId),
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        role: user.role || 'employee',
        status: 'active',
        is_owner: role === 'admin',
        is_active: true,
        default_branch_code: user.branchcode || '',
        joined_at: user.create_datetime || new Date(),
      });

      // Also update tenant_id on user doc if missing
      if (!user.tenant_id) {
        await UserInfo.updateOne(
          { _id: user._id },
          { $set: { tenant_id: new mongoose.Types.ObjectId(tenantId) } }
        );
      }

      console.log(`  ✅ Created UserTenant for: ${user.email || userId} -> tenant ${tenantId}`);
      created++;
    } catch (err: any) {
      if (err.code === 11000) {
        // Duplicate key — already exists (race condition safe)
        skipped++;
      } else {
        console.error(`  ❌ Error creating UserTenant for ${user.email || userId}:`, err.message);
      }
    }
  }

  console.log('\n========================================');
  console.log(`✅ Migration complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (already existed or superadmin): ${skipped}`);
  console.log(`   No tenant resolved: ${noTenant}`);
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
