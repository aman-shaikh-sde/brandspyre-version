import { Request, Response } from "express";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription, TenantUsage } from "../../db/ModelSceham/saasSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import mongoose from "mongoose";

export const getAllTenants = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get All Tenants";
  
  try {
    const { userId, userRole } = req.user as any;

    // Only master_super_admin can view all tenants
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } }
      ];
    }

    const tenants = await Tenant.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ created_at: -1 })
      .lean();

    const total = await Tenant.countDocuments(filter);

    // Get subscription details for each tenant
    const tenantsWithSubscriptions = await Promise.all(
      tenants.map(async (tenant) => {
        const subscription = await TenantSubscription.findOne({ tenant_id: tenant._id })
          .populate('plan_id')
          .lean();
        
        const userCount = await UserTenant.countDocuments({ 
          tenant_id: tenant._id,
          is_active: true 
        });

        return {
          ...tenant,
          subscription: subscription || null,
          active_users: userCount
        };
      })
    );

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: tenantsWithSubscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const getTenantById = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Tenant By ID";
  
  try {
    const { userId, userRole } = req.user as any;
    const { id } = req.params;

    // Only master_super_admin can view tenant details
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const tenant = await Tenant.findById(id).lean() as any;

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const subscription = await TenantSubscription.findOne({ tenant_id: tenant._id })
      .populate('plan_id')
      .lean();

    const users = await UserTenant.find({ tenant_id: tenant._id })
      .populate('user_id')
      .lean();

    const usage = await TenantUsage.findOne({ tenant_id: tenant._id }).lean();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: {
        tenant,
        subscription,
        users,
        usage
      }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const updateTenantStatus = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Tenant Status";
  
  try {
    const { userId, userRole } = req.user as any;
    const { id } = req.params;
    const { status, reason } = req.body;

    // Only master_super_admin can update tenant status
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const validStatuses = ['active', 'suspended', 'pending', 'terminated'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { 
        status,
        suspension_reason: reason,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: tenant
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const getAllSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get All Subscription Plans";
  
  try {
    const { userId, userRole } = req.user as any;

    // Only master_super_admin can view all subscription plans
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const plans = await SubscriptionPlan.find().sort({ price_monthly: 1 }).lean();

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

export const createSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Subscription Plan";
  
  try {
    const { userId, userRole } = req.user as any;

    // Only master_super_admin can create subscription plans
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const {
      plan_code,
      plan_name,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_projects,
      max_storage_mb,
      features
    } = req.body;

    if (!plan_code || !plan_name || !price_monthly) {
      res.status(400).json({ error: "plan_code, plan_name, and price_monthly are required" });
      return;
    }

    const existingPlan = await SubscriptionPlan.findOne({ plan_code });
    if (existingPlan) {
      res.status(400).json({ error: "Plan code already exists" });
      return;
    }

    const plan = await SubscriptionPlan.create({
      plan_code,
      plan_name,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_projects,
      max_storage_mb,
      features: features || [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: plan
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const updateSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Subscription Plan";
  
  try {
    const { userId, userRole } = req.user as any;
    const { id } = req.params;

    // Only master_super_admin can update subscription plans
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: plan
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const deleteSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Delete Subscription Plan";
  
  try {
    const { userId, userRole } = req.user as any;
    const { id } = req.params;

    // Only master_super_admin can delete subscription plans
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: plan
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get System Stats";
  
  try {
    const { userId, userRole } = req.user as any;

    // Only master_super_admin can view system stats
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const pendingTenants = await Tenant.countDocuments({ status: 'pending' });
    const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });

    const totalUsers = await UserTenant.countDocuments({ is_active: true });
    const totalSubscriptions = await TenantSubscription.countDocuments({ status: 'active' });

    const monthlyRevenue = await TenantSubscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenue = monthlyRevenue[0]?.total || 0;

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          pending: pendingTenants,
          suspended: suspendedTenants
        },
        users: {
          total: totalUsers
        },
        subscriptions: {
          total: totalSubscriptions,
          monthlyRevenue: revenue
        }
      }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const upgradeTenantSubscription = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Upgrade Tenant Subscription";
  
  try {
    const { userId, userRole } = req.user as any;
    const { tenant_id, plan_id } = req.body;

    // Only master_super_admin can upgrade tenant subscriptions
    if (userRole !== 'master_super_admin') {
      res.status(403).json({ error: "Access denied: Master Super Admin only" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenant_id).session(session);
      if (!tenant) {
        throw new Error("Tenant not found");
      }

      let plan = null;
      if (mongoose.Types.ObjectId.isValid(plan_id)) {
        plan = await SubscriptionPlan.findById(plan_id).session(session);
      }
      if (!plan) {
        plan = await SubscriptionPlan.findOne({ plan_code: plan_id.toString().toLowerCase() }).session(session);
      }
      if (!plan) {
        throw new Error("Plan not found");
      }

      // Update tenant subscription
      await TenantSubscription.findOneAndUpdate(
        { tenant_id },
        {
          plan_id: plan._id,
          amount: plan.price_monthly,
          updated_at: new Date()
        },
        { session, new: true }
      );

      // Update tenant limits
      await Tenant.findByIdAndUpdate(
        tenant_id,
        {
          max_users: plan.max_users,
          max_storage_mb: plan.max_storage_mb,
          subscription_plan: plan.plan_code,
          updated_at: new Date()
        },
        { session }
      );

      await session.commitTransaction();

      res.status(200).json({ 
        message: `${msgField} Success`,
        data: {
          tenant_id,
          new_plan: plan.plan_name,
          status: "upgraded"
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
