import { Request, Response } from "express";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription } from "../../db/ModelSceham/saasSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { RoleAccess, RoleAccessLog } from "../../db/ModelSceham/roleAccessSchema";
import { permissionsAccess } from "../../controllers/accountSetting/create";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const registerTenant = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Register Tenant";
  
  try {
    const { 
      name,
      domain,
      adminEmail,
      adminPassword,
      subscriptionPlan,
      businessDetails
    } = req.body;

    // Validate required fields
    if (!name || !domain || !adminEmail || !adminPassword || !subscriptionPlan) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if tenant domain already exists
      const domainCheck = await Tenant.findOne({ domain }).session(session);

      if (domainCheck) {
        throw new Error("Domain already exists");
      }

      // Check if admin email already exists
      const emailCheck = await UserInfo.findOne({ email: adminEmail.toLowerCase() }).session(session);
      if (emailCheck) {
        throw new Error("Admin email already exists");
      }

      // Create tenant with active status (auto-approve)
      const newTenant = await Tenant.create([{
        name: name,
        company_name: name,
        domain: domain,
        subscription_plan: subscriptionPlan,
        status: 'active',
        subscription_start_date: new Date(),
        max_users: 10,
        max_storage_mb: 1024,
        created_at: new Date(),
        updated_at: new Date()
      }], { session });

      const tenant = newTenant[0];

      // Hash admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user in UserInfo collection
      const adminUser = await UserInfo.create([{
        firstname: name,
        lastname: 'Admin',
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        tenant_id: newTenant[0]._id,
        staff_id: `STAFF_${Date.now()}`,
        create_datetime: new Date(),
        last_update_datetime: new Date()
      }], { session });

      const adminId = adminUser[0]._id;

      // Create tenant-admin association with active status
      await UserTenant.create([{
        user_id: adminId,
        tenant_id: tenant._id,
        role: 'admin',
        is_active: true,
        joined_at: new Date(),
        created_at: new Date()
      }], { session });

      // Get plan details
      const plan = await SubscriptionPlan.findOne({ plan_code: subscriptionPlan }).session(session);

      if (!plan) {
        throw new Error("Subscription plan not found");
      }

      // Create subscription record (active - auto-approve)
      await TenantSubscription.create([{
        tenant_id: tenant._id,
        plan_id: plan._id,
        subscription_type: 'monthly',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: plan.price_monthly,
        created_at: new Date(),
        updated_at: new Date()
      }], { session });

      // Save business details if provided
      if (businessDetails) {
        // Note: This would require a BusinessDetails model
        // For now, we'll store it in the tenant settings
        await Tenant.findByIdAndUpdate(
          tenant._id,
          {
            settings: {
              ...tenant.settings,
              businessDetails: businessDetails
            },
            updated_at: new Date()
          },
          { session }
        );
      }

      // Create RoleAccess for admin role with full permissions
      const adminRoleAccess = await RoleAccess.create([{
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
      }], { session });

      // Create RoleAccessLog for admin role
      await RoleAccessLog.create([{
        role_id: adminRoleAccess[0]._id,
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
        notes: 'Created during tenant registration',
        changedBy: 'system',
        last_update_datetime: new Date()
      }], { session });

      await session.commitTransaction();

      res.status(201).json({ 
        success: true,
        message: `${msgField} Success - Tenant Activated`,
        data: {
          tenant: {
            id: tenant._id,
            name: tenant.name,
            domain: tenant.domain,
            status: "active"
          },
          admin: {
            email: adminEmail,
            name: name
          },
          subscriptionPlan,
          status: "active"
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const getPendingTenants = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Pending Tenants";
  
  try {
    const { userId, userRole } = req.user as any;

    // Only superadmin can view pending tenants
    if (userRole !== 'superadmin') {
      res.status(403).json({ error: "Access denied: Superadmin only" });
      return;
    }

    const tenants = await Tenant.aggregate([
      {
        $lookup: {
          from: 'usertenants',
          let: { tenantId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$tenant_id', '$$tenantId'] } } },
            {
              $lookup: {
                from: 'userinfo',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' }
          ],
          as: 'user_tenants'
        }
      },
      { $unwind: '$user_tenants' },
      {
        $lookup: {
          from: 'tenantsubscriptions',
          let: { tenantId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$tenant_id', '$$tenantId'] } } }
          ],
          as: 'subscriptions'
        }
      },
      { $unwind: { path: '$subscriptions', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'subscriptions.plan_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { status: 'pending' },
            { 'user_tenants.is_active': false }
          ]
        }
      },
      {
        $project: {
          admin_email: '$user_tenants.user.email',
          admin_name: '$user_tenants.user.firstname',
          plan_name: '$plan.plan_name',
          subscription_status: '$subscriptions.status',
          subscription_amount: '$subscriptions.amount',
          tenant: '$$ROOT'
        }
      },
      { $sort: { 'tenant.created_at': -1 } }
    ]);

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: tenants
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const approveTenant = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Approve Tenant";
  
  try {
    const { userId, userRole } = req.user as any;
    const { tenant_id } = req.body;

    // Only superadmin can approve tenants
    if (userRole !== 'superadmin') {
      res.status(403).json({ error: "Access denied: Superadmin only" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get tenant and admin info
      const tenant = await Tenant.findById(new mongoose.Types.ObjectId(tenant_id)).session(session);

      if (!tenant) {
        throw new Error("Tenant not found");
      }

      // Get user-tenant association
      const userTenant = await UserTenant.findOne({ 
        tenant_id: tenant._id,
        role: 'admin'
      }).session(session);

      if (!userTenant) {
        throw new Error("Admin user not found for this tenant");
      }

      // Activate tenant
      await Tenant.findByIdAndUpdate(
        tenant._id,
        { status: 'active', updated_at: new Date() },
        { session }
      );

      // Activate admin user (assuming UserInfo model exists)
      // Note: This would require the actual UserInfo model
      // For now, we'll activate the user-tenant association
      await UserTenant.findByIdAndUpdate(
        userTenant._id,
        { is_active: true, updated_at: new Date() },
        { session }
      );

      // Activate subscription
      await TenantSubscription.findOneAndUpdate(
        { tenant_id: tenant._id },
        { status: 'active', updated_at: new Date() },
        { session }
      );

      await session.commitTransaction();

      res.status(200).json({ 
        message: `${msgField} Success`,
        data: {
          tenant_id,
          tenant_name: tenant.name,
          admin_email: userTenant.user_id.toString(), // Placeholder - would need actual user email
          status: "approved"
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};
