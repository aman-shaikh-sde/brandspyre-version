import { Request, Response } from "express";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription } from "../../db/ModelSceham/saasSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const createTenant = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Tenant";
  
  try {
    const { userId, userRole, brcode } = req.user as AuthenticatedUser;
    const { 
      tenant_name, 
      tenant_domain, 
      subdomain, 
      company_name, 
      industry, 
      size,
      subscription_plan 
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create tenant
      const newTenant = await Tenant.create([{
        name: tenant_name,
        domain: tenant_domain,
        subdomain: subdomain,
        company_name: company_name,
        industry: industry,
        size: size || 'small',
        subscription_plan: subscription_plan || 'basic',
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        max_users: 10,
        max_storage_mb: 1024
      }], { session });

      const tenant = newTenant[0];

      // Add user as tenant admin
      await UserTenant.create([{
        user_id: userId,
        tenant_id: tenant._id,
        role: 'admin',
        invited_by: userId
      }], { session });

      // Get plan details
      const plan = await SubscriptionPlan.findOne({ plan_code: subscription_plan || 'basic' }).session(session);

      if (!plan) {
        throw new Error("Subscription plan not found");
      }

      // Create subscription record
      await TenantSubscription.create([{
        tenant_id: tenant._id,
        plan_id: plan._id,
        subscription_type: 'monthly',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: plan.price_monthly
      }], { session });

      await session.commitTransaction();

      res.status(201).json({ 
        message: `${msgField} Success`,
        data: tenant
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

export const getTenantInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Tenant Info";
  
  try {
    const { userId, userRole, brcode } = req.user as AuthenticatedUser;
    const { tenant_id } = req.query;

    // Build query
    const query: any = { 'user_tenants.user_id': userId };
    if (tenant_id) {
      query._id = new mongoose.Types.ObjectId(tenant_id as string);
    }

    // Get tenant info with user's role
    const tenants = await Tenant.aggregate([
      {
        $lookup: {
          from: 'usertenants',
          let: { tenantId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$tenant_id', '$$tenantId'] }, user_id: userId } },
            { $sort: { joined_at: -1 } }
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
            { $match: { $expr: { $eq: ['$tenant_id', '$$tenantId'] }, status: 'active' } }
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
        $project: {
          'user_role': '$user_tenants.role',
          'plan_name': '$plan.plan_name',
          'features': '$plan.features',
          'subscription_status': '$subscriptions.status',
          'subscription_end_date': '$subscriptions.end_date',
          'max_users': '$plan.max_users',
          'max_storage_gb': '$plan.max_storage_gb',
          tenant: '$$ROOT'
        }
      }
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

export const updateTenantSettings = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Tenant Settings";
  
  try {
    const { userId, userRole, brcode } = req.user as AuthenticatedUser;
    const { tenant_id, settings } = req.body;

    // Check if user is admin for this tenant
    const userTenant = await UserTenant.findOne({
      user_id: userId,
      tenant_id: new mongoose.Types.ObjectId(tenant_id),
      role: 'admin'
    });

    if (!userTenant) {
      res.status(403).json({ error: "Access denied: admin rights required" });
      return;
    }

    // Update tenant settings
    const result = await Tenant.findByIdAndUpdate(
      new mongoose.Types.ObjectId(tenant_id),
      { 
        settings: settings,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: result
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Subscription Plans";
  
  try {
    const plans = await SubscriptionPlan.find({ is_active: true }).sort({ price_monthly: 1 });

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: plans
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Upgrade Subscription";
  
  try {
    const { userId, userRole, brcode } = req.user as AuthenticatedUser;
    const { tenant_id, new_plan_code } = req.body;

    // Check if user is admin for this tenant
    const userTenant = await UserTenant.findOne({
      user_id: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
      tenant_id: new mongoose.Types.ObjectId(tenant_id),
      role: 'admin'
    });

    if (!userTenant) {
      res.status(403).json({ error: "Access denied: admin rights required" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get new plan details
      const newPlan = await SubscriptionPlan.findOne({ 
        plan_code: new_plan_code, 
        is_active: true 
      }).session(session);

      if (!newPlan) {
        throw new Error("Plan not found");
      }

      // Update tenant subscription
      const subscription = await TenantSubscription.findOneAndUpdate(
        { tenant_id: new mongoose.Types.ObjectId(tenant_id) },
        {
          plan_id: newPlan._id,
          status: 'active',
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: newPlan.price_monthly,
          updated_at: new Date()
        },
        { new: true, session }
      );

      // Update tenant info
      const tenant = await Tenant.findByIdAndUpdate(
        new mongoose.Types.ObjectId(tenant_id),
        {
          subscription_plan: new_plan_code,
          max_users: newPlan.max_users,
          max_storage_mb: (newPlan.max_storage_gb || 1) * 1024,
          updated_at: new Date()
        },
        { new: true, session }
      );

      await session.commitTransaction();

      res.status(200).json({ 
        message: `${msgField} Success`,
        data: { plan: newPlan, tenant_id }
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
