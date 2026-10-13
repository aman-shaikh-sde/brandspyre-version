/**
 * Migration Script: Migrate Legacy RBAC to Enterprise RBAC + PBAC
 * 
 * This script:
 * 1. Syncs the PermissionRegistry into the Permission collection
 * 2. Creates system role templates for each existing tenant
 * 3. Maps existing UserTenant records to UserRoleAssignment entries
 * 4. Sets is_owner on existing tenant admin UserTenant records
 * 5. Creates FeatureFlag entries for each tenant based on their plan
 * 
 * Run with: npx ts-node src/db/migration/migrateToEnterpriseRBAC.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Tenant, UserTenant } from '../ModelSceham/saasSchema';
import { Role, UserRoleAssignment } from '../ModelSceham/rbacSchema';
import PermissionRegistry from '../../services/saas/PermissionRegistry';
import RBACService from '../../services/saas/RBACService';
import FeatureFlagService from '../../services/saas/FeatureFlagService';

async function migrateToEnterpriseRBAC() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/brandspyre_crm';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Step 1: Sync PermissionRegistry
    console.log('\n📋 Step 1: Syncing PermissionRegistry...');
    await PermissionRegistry.sync();

    // Step 2: Process each existing tenant
    const tenants = await Tenant.find({ status: 'active' });
    console.log(`\n🏢 Found ${tenants.length} active tenants to migrate.`);

    for (const tenant of tenants) {
      console.log(`\n--- Processing Tenant: ${tenant.name} (${tenant._id}) ---`);

      // Check if system roles already exist for this tenant
      const existingRoles = await Role.find({ tenant_id: tenant._id, role_type: 'system_tenant' });
      if (existingRoles.length > 0) {
        console.log(`  ⏭ System roles already exist (${existingRoles.length} roles). Skipping role seeding.`);
      } else {
        // Step 2a: Seed system role templates
        console.log('  🔧 Seeding system role templates...');
        await RBACService.seedTenantSystemRoles(tenant._id);
        console.log('  ✅ System roles seeded.');
      }

      // Step 3: Set is_owner on existing admin UserTenant records
      const adminUserTenants = await UserTenant.find({
        tenant_id: tenant._id,
        role: { $in: ['admin', 'owner', 'superadmin'] }
      });

      for (const ut of adminUserTenants) {
        if (!ut.is_owner) {
          await UserTenant.updateOne(
            { _id: ut._id },
            { is_owner: true, status: 'active' }
          );
          console.log(`  ✅ Set is_owner=true for UserTenant ${ut._id}`);
        }

        // Set owner_id on tenant if not set
        if (!tenant.owner_id) {
          await Tenant.updateOne(
            { _id: tenant._id },
            { owner_id: ut.user_id }
          );
          console.log(`  ✅ Set owner_id=${ut.user_id} on Tenant ${tenant._id}`);
        }

        // Step 4: Create UserRoleAssignment if not exists
        const orgOwnerRole = await Role.findOne({ tenant_id: tenant._id, code: 'org_owner' });
        if (orgOwnerRole) {
          const existingAssignment = await UserRoleAssignment.findOne({
            user_tenant_id: ut._id,
            role_id: orgOwnerRole._id
          });

          if (!existingAssignment) {
            await UserRoleAssignment.create({
              user_tenant_id: ut._id,
              user_id: ut.user_id,
              tenant_id: tenant._id,
              role_id: orgOwnerRole._id,
              is_active: true,
              effective_from: new Date(),
              created_at: new Date()
            });
            console.log(`  ✅ Created UserRoleAssignment (org_owner) for user ${ut.user_id}`);
          }
        }
      }

      // Step 5: Migrate non-admin UserTenant records
      const otherUserTenants = await UserTenant.find({
        tenant_id: tenant._id,
        role: { $nin: ['admin', 'owner', 'superadmin'] }
      });

      for (const ut of otherUserTenants) {
        // Update status field
        if (!ut.status) {
          await UserTenant.updateOne({ _id: ut._id }, { status: 'active' });
        }

        // Map legacy role to system role
        const roleMapping: Record<string, string> = {
          'user': 'employee',
          'employee': 'employee',
          'manager': 'sales_manager',
          'hr': 'hr_manager',
          'finance': 'finance_manager',
          'viewer': 'viewer'
        };

        const mappedRoleCode = roleMapping[(ut.role || 'employee').toLowerCase()] || 'employee';
        const targetRole = await Role.findOne({ tenant_id: tenant._id, code: mappedRoleCode });

        if (targetRole) {
          const existingAssignment = await UserRoleAssignment.findOne({
            user_tenant_id: ut._id,
            role_id: targetRole._id
          });

          if (!existingAssignment) {
            await UserRoleAssignment.create({
              user_tenant_id: ut._id,
              user_id: ut.user_id,
              tenant_id: tenant._id,
              role_id: targetRole._id,
              is_active: true,
              effective_from: new Date(),
              created_at: new Date()
            });
            console.log(`  ✅ Assigned role '${mappedRoleCode}' to user ${ut.user_id}`);
          }
        }
      }

      // Step 6: Initialize Feature Flags
      const plan = (tenant.subscription_plan || 'trial').toLowerCase();
      await FeatureFlagService.initializeTenantFlags(tenant._id, plan);
      console.log(`  ✅ Feature flags initialized for plan '${plan}'`);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToEnterpriseRBAC();
