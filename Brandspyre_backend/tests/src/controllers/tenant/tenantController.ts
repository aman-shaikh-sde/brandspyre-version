import mongoose from 'mongoose';
import { Tenant, TenantSubscription, SubscriptionPlan, UserTenant } from "../../db/ModelSceham/saasSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Role } from "../../db/ModelSceham/rbacSchema";
import { Branch } from "../../db/ModelSceham/branchSchema";
import { Request, Response } from "express";
import crypto from "crypto";
import { isPlatformAdminRole } from "../../middleware/securityContext";

export class TenantController {
  constructor(private pool?: any) {}

  registerTenant = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
      const { name, domain, adminEmail, adminPassword, subscriptionPlan } = req.body;

      if (!name || !domain || !adminEmail || !adminPassword) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, domain, adminEmail, adminPassword"
        });
      }

      session.startTransaction();

      const existingTenant = await Tenant.findOne({ domain }).session(session).lean();
      if (existingTenant) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: "Domain already exists"
        });
      }

      const [tenant] = await Tenant.create([{
        name,
        domain,
        database_name: `tenant_${domain.replace(/\./g, '_')}`,
        status: 'active'
      }], { session });

      const planCode = subscriptionPlan || 1;
      const plan = await SubscriptionPlan.findOne({ plan_code: planCode }).session(session).lean() as any;

      const ends = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const [subscription] = await TenantSubscription.create([{
        tenant_id: tenant._id.toString(),
        plan_id: plan ? plan._id.toString() : 'default_plan',
        subscription_type: 'monthly',
        status: 'pending',
        start_date: new Date(),
        end_date: ends,
        next_billing_date: ends,
        amount: plan?.price_monthly || 0
      }], { session });

      const hashedPassword = crypto.createHash('sha256').update(adminPassword).digest('hex');
      const [adminUser] = await UserInfo.create([{
        staff_id: `ADMIN_${Date.now()}`,
        firstname: name,
        lastname: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'super_admin',
        branchcode: domain,
        status: 'active'
      }], { session });

      const [userTenant] = await UserTenant.create([{
        user_id: adminUser._id.toString(),
        tenant_id: tenant._id.toString(),
        role: 'admin'
      }], { session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Tenant registered successfully",
        data: {
          tenant,
          subscription,
          admin: adminUser
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error("Error registering tenant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    } finally {
      session.endSession();
    }
  };

  getAllTenants = async (req: Request, res: Response) => {
    try {
      const tenants = await Tenant.find().lean();
      res.json({
        success: true,
        data: tenants
      });
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  getTenantById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      const tenant = await Tenant.findOne(filter).lean();

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found"
        });
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  updateSubscription = async (req: Request, res: Response) => {
    try {
      const { tenantId, subscriptionPlanId } = req.body;

      const updated = await TenantSubscription.findOneAndUpdate(
        { tenant_id: tenantId },
        {
          $set: {
            plan_id: subscriptionPlanId,
            status: 'active',
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: "Subscription updated successfully",
        data: updated
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  createRole = async (req: Request, res: Response) => {
    try {
      const { roleName, code, permissions } = req.body;
      const userRole = (req as any).user?.userRole || (req as any).user?.role;
      const isPlatformAdmin = (req as any).securityContext?.isPlatformAdmin || isPlatformAdminRole(userRole);
      const effectiveTenantId = isPlatformAdmin
        ? (req.body.tenantId || (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req.user as any)?.tenantId)
        : ((req as any).securityContext?.tenantId || (req as any).tenant?.id || (req.user as any)?.tenantId);

      if (!roleName) {
        res.status(400).json({ success: false, message: "roleName is required" });
        return;
      }

      const roleCode = code || roleName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const newRole = await Role.create({
        tenant_id: effectiveTenantId ? new mongoose.Types.ObjectId(effectiveTenantId.toString()) : null,
        name: roleName,
        code: roleCode,
        role_type: 'custom_tenant'
      });

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: newRole
      });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  getTenantRoles = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const roles = await Role.find({ tenant_id: tenantId }).lean();

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  createBranch = async (req: Request, res: Response) => {
    try {
      const { tenantId, branchName, branchCode, location } = req.body;

      const newBranch = await Branch.create({
        tenant_id: tenantId,
        name: branchName,
        branchcode: branchCode,
        location: location || ''
      });

      res.status(201).json({
        success: true,
        message: "Branch created successfully",
        data: newBranch
      });
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  getTenantBranches = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const branches = await Branch.find({ tenant_id: tenantId }).lean();

      res.json({
        success: true,
        data: branches
      });
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  addAdminToTenant = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
      const { tenantId, adminData } = req.body;

      if (!tenantId || !adminData.name || !adminData.email || !adminData.password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: tenantId, name, email, password"
        });
      }

      session.startTransaction();

      const existingUser = await UserInfo.findOne({ email: adminData.email }).session(session).lean();
      if (existingUser) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: "User with this email already exists"
        });
      }

      const hashedPassword = crypto.createHash('sha256').update(adminData.password).digest('hex');
      const [adminUser] = await UserInfo.create([{
        staff_id: `ADMIN_${Date.now()}`,
        firstname: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      }], { session });

      await UserTenant.create([{
        user_id: adminUser._id.toString(),
        tenant_id: tenantId,
        role: 'admin'
      }], { session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Admin added to tenant successfully",
        data: {
          admin: {
            id: adminUser._id,
            name: adminData.name,
            email: adminData.email
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error("Error adding admin to tenant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    } finally {
      session.endSession();
    }
  };

  getTenantAdmins = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;

      const userTenants = await UserTenant.find({ tenant_id: tenantId, role: 'admin' }).lean();
      const userIds = userTenants.map(ut => ut.user_id);

      const users = await UserInfo.find({ _id: { $in: userIds } }).lean();
      const adminList = userTenants.map(ut => {
        const u: any = users.find(user => (user as any)._id.toString() === String(ut.user_id));
        return {
          id: u ? u._id.toString() : ut.user_id,
          name: u ? `${u.firstname || ''} ${u.lastname || ''}`.trim() : '',
          email: u?.email || '',
          joined_at: ut.joined_at,
          role: ut.role
        };
      });

      res.json({
        success: true,
        data: adminList
      });
    } catch (error) {
      console.error("Error fetching tenant admins:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  updateTenantAdmin = async (req: Request, res: Response) => {
    try {
      const { tenantId, adminId } = req.params;
      const { name, email } = req.body;

      let updateFields: any = {};
      if (name) updateFields.firstname = name;
      if (email) updateFields.email = email;

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update"
        });
      }

      await UserInfo.updateOne({ _id: adminId }, { $set: updateFields });
      await UserTenant.updateOne({ user_id: adminId, tenant_id: tenantId }, { $set: { updated_at: new Date() } });

      res.json({
        success: true,
        message: "Admin updated successfully"
      });
    } catch (error) {
      console.error("Error updating tenant admin:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  removeAdminFromTenant = async (req: Request, res: Response) => {
    try {
      const { tenantId, adminId } = req.params;

      await UserTenant.deleteMany({ user_id: adminId, tenant_id: tenantId });

      res.json({
        success: true,
        message: "Admin removed from tenant successfully"
      });
    } catch (error) {
      console.error("Error removing admin from tenant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  suspendTenant = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.body;

      await Tenant.updateOne({ _id: tenantId }, { $set: { status: 'suspended' } });
      await TenantSubscription.updateMany({ tenant_id: tenantId }, { $set: { status: 'cancelled' } });

      res.json({
        success: true,
        message: "Tenant suspended successfully"
      });
    } catch (error) {
      console.error("Error suspending tenant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  approveSubscriptionPlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await TenantSubscription.updateMany(
        { tenant_id: id },
        { $set: { status: 'active', end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
      );
      res.json({
        success: true,
        message: "Subscription plan approved successfully"
      });
    } catch (error) {
      console.error("Error approving subscription:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
}
