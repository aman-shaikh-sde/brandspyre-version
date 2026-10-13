import mongoose from "mongoose";
import { connectDatabase } from "../index";
import { UserInfo } from "../ModelSceham/userSchema";
import { Branch } from "../ModelSceham/branchSchema";
import { RoleAccess } from "../ModelSceham/roleAccessSchema";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription } from "../ModelSceham/saasSchema";
import { Campaign, Lead, Followup } from "../ModelSceham/project/campagin";
import { Team } from "../ModelSceham/teams/team";
import { TeamMember } from "../ModelSceham/teams/teammembers";
import { UserSalary, PerformanceReview } from "../ModelSceham/user/9_salary";
import { LeaveRequest } from "../ModelSceham/user/15_leaverequest";
import { UserAttendance } from "../ModelSceham/user/13_attendance";
import { UserDocument } from "../ModelSceham/userDocumentsSchema";

/**
 * Data Migration Script for Multi-Tenant SaaS Conversion
 * 
 * This script migrates existing single-tenant data to the new multi-tenant structure:
 * 1. Creates a default Tenant record
 * 2. Links all existing data to the default tenant
 * 3. Creates UserTenant relationships
 * 4. Sets up default subscription
 * 5. Updates superadmin to master_super_admin
 */

export const migrateToMultiTenant = async () => {
  console.log("🚀 Starting multi-tenant migration...");

  try {
    await connectDatabase();
    console.log("✅ Database connected");

    // Step 1: Check if default tenant already exists
    let defaultTenant = await Tenant.findOne({ company_name: "Almino Structural Consultancy Pvt Ltd" });

    if (!defaultTenant) {
      console.log("📝 Creating default tenant...");
      defaultTenant = await Tenant.create({
        name: "Default Organization",
        company_name: "Almino Structural Consultancy Pvt Ltd",
        domain: "almino.com",
        status: "active",
        subscription_plan: "premium",
        subscription_status: "active",
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        max_users: 100,
        max_storage_mb: 10240,
        settings: {}
      });
      console.log("✅ Default tenant created:", defaultTenant._id);
    } else {
      console.log("ℹ️ Default tenant already exists:", defaultTenant._id);
    }

    const tenantId = defaultTenant._id;

    // Step 2: Migrate UserInfo
    console.log("📝 Migrating UserInfo...");
    const userResult = await UserInfo.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${userResult.modifiedCount} users to tenant`);

    // Step 3: Migrate Branch
    console.log("📝 Migrating Branch...");
    const branchResult = await Branch.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${branchResult.modifiedCount} branches to tenant`);

    // Step 4: Migrate RoleAccess
    console.log("📝 Migrating RoleAccess...");
    const roleAccessResult = await RoleAccess.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${roleAccessResult.modifiedCount} role access records to tenant`);

    // Step 5: Migrate Campaign
    console.log("📝 Migrating Campaign...");
    const campaignResult = await Campaign.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${campaignResult.modifiedCount} campaigns to tenant`);

    // Step 6: Migrate Lead
    console.log("📝 Migrating Lead...");
    const leadResult = await Lead.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${leadResult.modifiedCount} leads to tenant`);

    // Step 7: Migrate Followup
    console.log("📝 Migrating Followup...");
    const followupResult = await Followup.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${followupResult.modifiedCount} followups to tenant`);

    // Step 8: Migrate Team
    console.log("📝 Migrating Team...");
    const teamResult = await Team.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${teamResult.modifiedCount} teams to tenant`);

    // Step 9: Migrate TeamMember
    console.log("📝 Migrating TeamMember...");
    const teamMemberResult = await TeamMember.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${teamMemberResult.modifiedCount} team members to tenant`);

    // Step 10: Migrate UserSalary
    console.log("📝 Migrating UserSalary...");
    const salaryResult = await UserSalary.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${salaryResult.modifiedCount} salary records to tenant`);

    // Step 11: Migrate LeaveRequest
    console.log("📝 Migrating LeaveRequest...");
    const leaveResult = await LeaveRequest.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${leaveResult.modifiedCount} leave requests to tenant`);

    // Step 12: Migrate UserAttendance
    console.log("📝 Migrating UserAttendance...");
    const attendanceResult = await UserAttendance.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${attendanceResult.modifiedCount} attendance records to tenant`);

    // Step 13: Migrate UserDocument
    console.log("📝 Migrating UserDocument...");
    const documentResult = await UserDocument.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${documentResult.modifiedCount} documents to tenant`);

    // Step 14: Migrate PerformanceReview
    console.log("📝 Migrating PerformanceReview...");
    const performanceResult = await PerformanceReview.updateMany(
      { tenant_id: { $exists: false } },
      { tenant_id: tenantId }
    );
    console.log(`✅ Migrated ${performanceResult.modifiedCount} performance reviews to tenant`);

    // Step 15: Create UserTenant relationships
    console.log("📝 Creating UserTenant relationships...");
    const users = await UserInfo.find({});
    let userTenantCreated = 0;

    for (const user of users) {
      const existing = await UserTenant.findOne({
        user_id: user._id,
        tenant_id: tenantId
      });

      if (!existing) {
        await UserTenant.create({
          user_id: user._id,
          tenant_id: tenantId,
          role: user.role === 'superadmin' ? 'admin' : (user.role || 'user'),
          is_active: user.status === 'active',
          joined_at: user.create_datetime || new Date()
        });
        userTenantCreated++;
      }
    }
    console.log(`✅ Created ${userTenantCreated} UserTenant relationships`);

    // Step 16: Update superadmin to master_super_admin
    console.log("📝 Updating superadmin to master_super_admin...");
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "platformadmin@gmail.com";
    const superAdminUpdate = await UserInfo.updateOne(
      { $or: [{ email: superAdminEmail }, { role: "superadmin" }, { is_master_super_admin: true }] },
      {
        role: "master_super_admin",
        is_master_super_admin: true
      }
    );
    console.log(`✅ Updated superadmin to master_super_admin`);

    // Step 17: Create default subscription
    console.log("📝 Creating default subscription...");
    const existingSubscription = await TenantSubscription.findOne({
      tenant_id: tenantId
    });

    if (!existingSubscription) {
      const premiumPlan = await SubscriptionPlan.findOne({ plan_code: 'premium' });

      if (premiumPlan) {
        await TenantSubscription.create({
          tenant_id: tenantId,
          plan_id: premiumPlan._id,
          subscription_type: 'yearly',
          status: 'active',
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          amount: 0, // Free for migrated organization
          currency: 'INR'
        });
        console.log("✅ Default subscription created");
      } else {
        console.log("⚠️ Premium plan not found, skipping subscription creation");
      }
    } else {
      console.log("ℹ️ Subscription already exists for default tenant");
    }

    console.log("🎉 Multi-tenant migration completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Default Tenant ID: ${tenantId}`);
    console.log(`   - Users migrated: ${userResult.modifiedCount}`);
    console.log(`   - Branches migrated: ${branchResult.modifiedCount}`);
    console.log(`   - RoleAccess migrated: ${roleAccessResult.modifiedCount}`);
    console.log(`   - Campaigns migrated: ${campaignResult.modifiedCount}`);
    console.log(`   - Leads migrated: ${leadResult.modifiedCount}`);
    console.log(`   - Followups migrated: ${followupResult.modifiedCount}`);
    console.log(`   - Teams migrated: ${teamResult.modifiedCount}`);
    console.log(`   - Team members migrated: ${teamMemberResult.modifiedCount}`);
    console.log(`   - Salary records migrated: ${salaryResult.modifiedCount}`);
    console.log(`   - Leave requests migrated: ${leaveResult.modifiedCount}`);
    console.log(`   - Attendance records migrated: ${attendanceResult.modifiedCount}`);
    console.log(`   - Documents migrated: ${documentResult.modifiedCount}`);
    console.log(`   - Performance reviews migrated: ${performanceResult.modifiedCount}`);
    console.log(`   - UserTenant relationships created: ${userTenantCreated}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database disconnected");
  }
};

// Run migration if executed directly
if (require.main === module) {
  migrateToMultiTenant()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}
