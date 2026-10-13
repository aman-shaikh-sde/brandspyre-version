import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import {
  Tenant,
  UserTenant,
  TenantSetting,
  FinancialYear,
  NotificationSetting,
  EmailTemplate,
  AuditLog,
  TenantUsage
} from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { Branch, BranchLog, Department, Designation } from '../../db/ModelSceham/branchSchema';
import { RoleAccess, RoleAccessLog } from '../../db/ModelSceham/roleAccessSchema';
import { permissionsAccess } from '../../controllers/accountSetting/create';
import TenantService from './TenantService';
import SubscriptionService from './SubscriptionService';
import OnboardingService from './OnboardingService';
import RBACService from './RBACService';
import FeatureFlagService from './FeatureFlagService';

export interface OrgRegistrationWizardPayload {
  // Step 1: Company Profile
  companyName: string;
  industry?: string;
  companySize?: string;
  slug?: string;

  // Step 2: Regional & Financial Settings
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;

  // Step 3: Admin Details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;

  // Step 4: Subscription Plan & Billing
  subscriptionPlan?: string; // 'trial' | 'standard' | 'premium'
  billingCycle?: 'monthly' | 'yearly';

  // Step 5: Industry Modules & Features Customization
  selectedModules?: string[];
  selectedFeatures?: string[];
}

export class InitializationService {
  /**
   * Complete initialization of an organization and all 14 dependent resources.
   * Uses MongoDB transaction when supported by replica sets, with graceful standalone fallback.
   */
  static async registerOrganizationTransaction(payload: OrgRegistrationWizardPayload) {
    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      console.warn("Mongoose session start failed or standalone MongoDB in use. Running registration without transaction.", err);
      session = null;
    }

    const opts = session ? { session, ordered: true } : { ordered: true };

    try {
      const emailLower = payload.adminEmail.toLowerCase().trim();

      // Check for existing user email
      const userQuery = UserInfo.findOne({ email: emailLower });
      if (session) userQuery.session(session);
      const existingUser = await userQuery;

      if (existingUser) {
        throw new Error(`Email address '${payload.adminEmail}' is already registered.`);
      }

      // Generate Slug & Auto Codes
      const slug = payload.slug || await TenantService.generateSlug(payload.companyName, session || undefined);
      const { tenantCode, branchCode, staffCode, orgUuid } = TenantService.generateIdentifiers();

      // Verification token for email
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

      // 1. Create Tenant
      const [tenant] = await Tenant.create([{
        name: payload.companyName,
        company_name: payload.companyName,
        domain: slug,
        subdomain: slug,
        slug: slug,
        tenant_code: tenantCode,
        uuid: orgUuid,
        industry: payload.industry || 'Other',
        size: payload.companySize || 'small',
        country: payload.country || 'India',
        timezone: payload.timezone || 'Asia/Kolkata',
        currency: payload.currency || 'INR',
        language: payload.language || 'en',
        status: 'active',
        subscription_plan: payload.subscriptionPlan || 'trial',
        subscription_status: 'trial',
        onboarding_status: 'pending',
        is_email_verified: false,
        email_verification_token: emailVerificationToken,
        email_verification_expires: emailVerificationExpires,
        created_at: new Date(),
        updated_at: new Date()
      }], opts);

      // 2. Create Admin User (UserInfo)
      const hashedPassword = await bcrypt.hash(payload.adminPassword, 10);
      const [adminUser] = await UserInfo.create([{
        firstname: payload.adminFirstName,
        lastname: payload.adminLastName,
        email: emailLower,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        tenant_id: tenant._id,
        staff_id: staffCode,
        branchcode: branchCode,
        dateofjoining: new Date(),
        create_datetime: new Date(),
        last_update_datetime: new Date()
      }], opts);

      // Set owner_id on Tenant after admin user is created
      await Tenant.updateOne({ _id: tenant._id }, { owner_id: adminUser._id }, session ? { session } : {});

      // 3. UserTenant Association (with ownership flag)
      const [userTenant] = await UserTenant.create([{
        user_id: adminUser._id,
        tenant_id: tenant._id,
        role: 'admin',
        status: 'active',
        is_owner: true,
        is_active: true,
        default_branch_code: branchCode,
        joined_at: new Date(),
        created_at: new Date()
      }], opts);

      // 4. Default Branch & BranchLog
      const [defaultBranch] = await Branch.create([{
        tenant_id: tenant._id,
        branchcode: branchCode,
        role: 'admin',
        name: 'Headquarters',
        branch_hours: '9 AM - 6 PM',
        location: payload.country || 'India',
        mobile: '0000000000',
        email: emailLower,
        manager_id: staffCode,
        managerName: `${payload.adminFirstName} ${payload.adminLastName}`,
        status: 'active',
        create_datetime: new Date(),
        last_update_datetime: new Date()
      }], opts);

      await BranchLog.create([{
        branch_id: defaultBranch._id,
        branchcode: branchCode,
        role: 'admin',
        name: 'Headquarters',
        location: payload.country || 'India',
        email: emailLower,
        manager_id: staffCode,
        managerName: `${payload.adminFirstName} ${payload.adminLastName}`,
        status: 'active',
        changedBy: 'system',
        last_update_datetime: new Date()
      }], opts);

      // 5. Default Departments (Tenant Isolated)
      await Department.create([
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Administration' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Sales & Marketing' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Engineering & IT' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Human Resources' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Finance & Accounts' }
      ], opts);

      // 6. Default Designations (Tenant Isolated)
      await Designation.create([
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Chief Executive Officer', department: 'Administration' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Department Manager', department: 'Administration' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Team Lead', department: 'Engineering & IT' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Senior Associate', department: 'Sales & Marketing' },
        { tenant_id: tenant._id, branchcode: branchCode, name: 'Junior Executive', department: 'Sales & Marketing' }
      ], opts);

      // 7. Default Roles (RoleAccess)
      const [adminRoleAccess] = await RoleAccess.create([{
        role: 'admin',
        tenant_id: tenant._id,
        project: permissionsAccess.project,
        task: permissionsAccess.task,
        milestone: permissionsAccess.milestone,
        teamMembers: permissionsAccess.teamMembers,
        branches: permissionsAccess.branches,
        invoices: permissionsAccess.invoices,
        campaign: permissionsAccess.campaign,
        leads: permissionsAccess.leads,
        client: permissionsAccess.client,
        followingRecords: permissionsAccess.followingRecords,
        profile: permissionsAccess.profile,
        event: permissionsAccess.event,
        announcement: permissionsAccess.announcement,
        subscription: permissionsAccess.subscription,
        financial: permissionsAccess.financial,
        roles: permissionsAccess.roles,
        tax: permissionsAccess.tax,
        payment: permissionsAccess.payment,
        calendar: permissionsAccess.calendar,
        notification: permissionsAccess.notification,
        reminder: permissionsAccess.reminder,
        reportAnalysis: permissionsAccess.reportAnalysis,
        activityLog: permissionsAccess.activityLog,
        mom: permissionsAccess.mom,
        userInfo: permissionsAccess.userInfo,
        salary: permissionsAccess.salary,
        leaveRequest: permissionsAccess.leaveRequest,
        leaveApproved: permissionsAccess.leaveApproved,
        employeeReport: permissionsAccess.employeeReport,
        document: permissionsAccess.document,
        sharedDocument: permissionsAccess.sharedDocument,
        fileUpload: permissionsAccess.fileUpload,
        dashboard: permissionsAccess.dashboard,
        accounts: permissionsAccess.accounts,
        create_datetime: new Date(),
        last_update_datetime: new Date()
      }], opts);

      // 8. Default Permissions Log (RoleAccessLog)
      await RoleAccessLog.create([{
        role_id: adminRoleAccess._id,
        role: 'admin',
        tenant_id: tenant._id,
        project: permissionsAccess.project,
        task: permissionsAccess.task,
        milestone: permissionsAccess.milestone,
        teamMembers: permissionsAccess.teamMembers,
        branches: permissionsAccess.branches,
        invoices: permissionsAccess.invoices,
        campaign: permissionsAccess.campaign,
        leads: permissionsAccess.leads,
        client: permissionsAccess.client,
        followingRecords: permissionsAccess.followingRecords,
        profile: permissionsAccess.profile,
        event: permissionsAccess.event,
        announcement: permissionsAccess.announcement,
        subscription: permissionsAccess.subscription,
        financial: permissionsAccess.financial,
        roles: permissionsAccess.roles,
        tax: permissionsAccess.tax,
        payment: permissionsAccess.payment,
        calendar: permissionsAccess.calendar,
        notification: permissionsAccess.notification,
        reminder: permissionsAccess.reminder,
        reportAnalysis: permissionsAccess.reportAnalysis,
        activityLog: permissionsAccess.activityLog,
        mom: permissionsAccess.mom,
        userInfo: permissionsAccess.userInfo,
        salary: permissionsAccess.salary,
        leaveRequest: permissionsAccess.leaveRequest,
        leaveApproved: permissionsAccess.leaveApproved,
        employeeReport: permissionsAccess.employeeReport,
        document: permissionsAccess.document,
        sharedDocument: permissionsAccess.sharedDocument,
        fileUpload: permissionsAccess.fileUpload,
        dashboard: permissionsAccess.dashboard,
        accounts: permissionsAccess.accounts,
        notes: 'Created during tenant registration wizard',
        changedBy: 'system',
        last_update_datetime: new Date()
      }], opts);

      // 9. Organization Settings
      await TenantSetting.create([
        { tenant_id: tenant._id, setting_key: 'country', setting_value: payload.country || 'India' },
        { tenant_id: tenant._id, setting_key: 'timezone', setting_value: payload.timezone || 'Asia/Kolkata' },
        { tenant_id: tenant._id, setting_key: 'currency', setting_value: payload.currency || 'INR' },
        { tenant_id: tenant._id, setting_key: 'language', setting_value: payload.language || 'en' }
      ], opts);

      // 10. Financial Year
      const currentYear = new Date().getFullYear();
      await FinancialYear.create([{
        tenant_id: tenant._id,
        year_code: `FY${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        start_date: new Date(currentYear, 3, 1), // April 1
        end_date: new Date(currentYear + 1, 2, 31), // March 31
        is_active: true
      }], opts);

      // 11. Notification Settings
      await NotificationSetting.create([{
        tenant_id: tenant._id,
        email_notifications: true,
        in_app_notifications: true,
        sms_notifications: false
      }], opts);

      // 12. Email Templates
      await EmailTemplate.create([
        {
          tenant_id: tenant._id,
          name: 'welcome',
          subject: `Welcome to ${payload.companyName}!`,
          body_html: `<h1>Welcome to ${payload.companyName}</h1><p>Your Brandspyre CRM workspace is ready.</p>`,
          is_default: true
        },
        {
          tenant_id: tenant._id,
          name: 'verify_email',
          subject: `Verify your email address`,
          body_html: `<p>Please click the link below to verify your email.</p>`,
          is_default: true
        }
      ], opts);

      // 13. Tenant Subscription & Trial Setup
      const subscription = await SubscriptionService.createTrialSubscription(
        tenant._id,
        payload.subscriptionPlan || 'trial',
        payload.billingCycle || 'monthly',
        session || undefined
      );

      // 14. Usage Records, Audit Log & Onboarding Progress
      await TenantUsage.create([
        { tenant_id: tenant._id, metric_name: 'users', metric_value: 1 },
        { tenant_id: tenant._id, metric_name: 'branches', metric_value: 1 },
        { tenant_id: tenant._id, metric_name: 'leads', metric_value: 0 },
        { tenant_id: tenant._id, metric_name: 'projects', metric_value: 0 },
        { tenant_id: tenant._id, metric_name: 'invoices', metric_value: 0 }
      ], opts);

      // 15. Seed Enterprise RBAC System Roles & Assign Org Owner Role
      try {
        const createdRoles = await RBACService.seedTenantSystemRoles(tenant._id, session || undefined);
        if (createdRoles['org_owner']) {
          await RBACService.assignRoleToUser(
            userTenant._id,
            createdRoles['org_owner']._id,
            defaultBranch._id,
            undefined,
            session || undefined
          );
        }
      } catch (rbacErr) {
        console.warn("RBAC seed warning (retrying out of session):", (rbacErr as any)?.message || rbacErr);
        const createdRoles = await RBACService.seedTenantSystemRoles(tenant._id);
        if (createdRoles['org_owner']) {
          await RBACService.assignRoleToUser(
            userTenant._id,
            createdRoles['org_owner']._id,
            defaultBranch._id
          );
        }
      }

      // 16. Initialize Subscription Feature Flags & Organization Module Entitlements
      await FeatureFlagService.initializeTenantFlags(
        tenant._id,
        payload.subscriptionPlan || 'trial',
        session || undefined
      );

      // Determine initial modules for organization (custom selected or industry recommended)
      const OrganizationEntitlementService = require('./OrganizationEntitlementService').default;
      const IndustryRegistryService = require('./IndustryRegistryService').default;

      let modulesToEnable = payload.selectedModules || [];
      if (modulesToEnable.length === 0) {
        const recModules = await IndustryRegistryService.getRecommendedModules(payload.industry || 'OTHER');
        modulesToEnable = recModules.map((m: any) => m.code);
      }

      // Always include full baseline operations & commerce suite
      const baseline = ['DASHBOARD', 'ORGANIZATION', 'NOTIFICATIONS', 'PRODUCTS', 'INVENTORY', 'PURCHASE', 'SALES', 'POS', 'PRODUCTION'];
      modulesToEnable = Array.from(new Set([...modulesToEnable, ...baseline]));

      await OrganizationEntitlementService.enableModules(
        tenant._id,
        modulesToEnable,
        'onboarding',
        adminUser._id,
        session || undefined
      );

      await AuditLog.create([{
        tenant_id: tenant._id,
        user_id: adminUser._id,
        action: 'ORG_REGISTERED',
        entity: 'Tenant',
        details: { companyName: payload.companyName, slug, tenantCode },
        created_at: new Date()
      }], opts);

      const onboarding = await OnboardingService.initializeProgress(tenant._id, session || undefined);

      // Commit transaction if session exists
      if (session) {
        await session.commitTransaction();
      }

      return {
        tenant,
        adminUser: {
          id: adminUser._id,
          email: adminUser.email,
          name: `${adminUser.firstname} ${adminUser.lastname}`,
          staff_id: staffCode
        },
        subscription,
        onboarding,
        emailVerificationToken
      };

    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortErr) {
          console.error("Rollback error:", abortErr);
        }
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }
}

export default InitializationService;
