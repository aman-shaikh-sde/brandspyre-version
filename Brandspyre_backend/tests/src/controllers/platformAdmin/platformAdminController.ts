import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription, AuditLog } from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { Industry, Module, OrganizationModule, OrganizationFeature } from '../../db/ModelSceham/industryModuleSchema';
import { BusinessType, BusinessTypeModule } from '../../db/ModelSceham/businessTypeSchema';
import { ModulePricing, Addon, CustomPackageRequest, PlatformTaxConfig } from '../../db/ModelSceham/pricingSchema';
import { PaymentTransaction, SaasInvoice } from '../../db/ModelSceham/subscriptionSystemSchema';
import SupportTicketService from '../../services/saas/SupportTicketService';
import OrganizationEntitlementService from '../../services/saas/OrganizationEntitlementService';
import PricingService from '../../services/saas/PricingService';
import SubscriptionService from '../../services/saas/SubscriptionService';

export class PlatformAdminController {
  /**
   * 1. MAIN ADMIN DASHBOARD STATS
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      // Organizations
      const [totalOrgs, activeOrgs, trialOrgs, suspendedOrgs, cancelledOrgs, newOrgsThisMonth] = await Promise.all([
        Tenant.countDocuments(),
        Tenant.countDocuments({ $or: [{ subscription_status: 'active' }, { status: 'active' }] }),
        Tenant.countDocuments({ subscription_status: 'trial' }),
        Tenant.countDocuments({ status: 'suspended' }),
        Tenant.countDocuments({ subscription_status: 'cancelled' }),
        Tenant.countDocuments({ created_at: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } })
      ]);

      // Subscriptions & Revenue
      const activeSubs = await TenantSubscription.find({ status: { $in: ['active', 'trial', 'grace'] } }).populate('plan_id');
      
      let mrr = 0;
      activeSubs.forEach((sub: any) => {
        const planPrice = sub.amount || (sub.plan_id as any)?.price_monthly || 0;
        if (sub.subscription_type === 'yearly') {
          mrr += planPrice / 12;
        } else {
          mrr += planPrice;
        }
      });
      const arr = mrr * 12;

      // Modules
      const totalModules = await Module.countDocuments();
      const activeModules = await Module.countDocuments({ is_active: true });

      // Support
      const supportMetrics = await SupportTicketService.getSupportMetrics();

      // Recent Organizations List
      const recentOrganizations = await Tenant.find()
        .sort({ created_at: -1 })
        .limit(6)
        .lean();

      // Recent Activity / Audit Log
      const recentAuditLogs = await AuditLog.find()
        .sort({ created_at: -1 })
        .limit(10)
        .populate('tenant_id', 'company_name name')
        .populate('user_id', 'firstname lastname email');

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalTenants: totalOrgs,
            activeTenants: activeOrgs,
            trialTenants: trialOrgs,
            suspendedTenants: suspendedOrgs,
            cancelledTenants: cancelledOrgs,
            mrr: Math.round(mrr),
            arr: Math.round(arr)
          },
          organizations: {
            total: totalOrgs,
            active: activeOrgs,
            trial: trialOrgs,
            suspended: suspendedOrgs,
            cancelled: cancelledOrgs,
            newThisMonth: newOrgsThisMonth
          },
          subscriptions: {
            activeCount: activeSubs.length,
            mrr: Math.round(mrr),
            arr: Math.round(arr)
          },
          modules: {
            total: totalModules,
            active: activeModules
          },
          openSupportTickets: supportMetrics?.open || 0,
          recentOrganizations,
          auditTrail: recentAuditLogs,
          support: supportMetrics
        }
      });
    } catch (error: any) {
      console.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 2. LIST ORGANIZATIONS WITH FILTERS & PAGINATION
   */
  static async getOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, businessType, page, limit } = req.query;
      const pageNum = page ? Number(page) : 1;
      const limitNum = limit ? Number(limit) : 15;
      const skip = (pageNum - 1) * limitNum;

      const query: any = {};
      if (status) {
        query.$or = [{ status }, { subscription_status: status }];
      }
      if (businessType) {
        query.business_type_code = businessType;
      }
      if (search) {
        query.$or = [
          { company_name: new RegExp(search as string, 'i') },
          { name: new RegExp(search as string, 'i') },
          { tenant_code: new RegExp(search as string, 'i') },
          { domain: new RegExp(search as string, 'i') }
        ];
      }

      const tenants = await Tenant.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const total = await Tenant.countDocuments(query);

      // Enhance with active subscription plan details and counts
      const enrichedTenants = await Promise.all(
        tenants.map(async (t: any) => {
          const sub = await TenantSubscription.findOne({ tenant_id: t._id, status: 'active' }).populate('plan_id');
          const userCount = await UserTenant.countDocuments({ tenant_id: t._id, is_active: true });
          const moduleCount = await OrganizationModule.countDocuments({ tenant_id: t._id, is_enabled: true });

          return {
            ...t,
            subscriptionPlanName: (sub?.plan_id as any)?.plan_name || (sub?.plan_id as any)?.plan_code || t.subscription_plan || 'Starter',
            subscriptionStatus: sub?.status || t.subscription_status || 'active',
            userCount,
            moduleCount,
            mrr: sub?.amount || (sub?.plan_id as any)?.price_monthly || 0
          };
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedTenants,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 3. GET SINGLE ORGANIZATION DETAILS
   */
  static async getOrganizationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findById(id).lean();
      if (!tenant) {
        res.status(404).json({ success: false, error: 'Organization not found' });
        return;
      }

      const [subscription, enabledModules, usersCount, tickets, auditLogs] = await Promise.all([
        TenantSubscription.findOne({ tenant_id: id }).sort({ created_at: -1 }).populate('plan_id'),
        OrganizationModule.find({ tenant_id: id, is_enabled: true }),
        UserTenant.countDocuments({ tenant_id: id }),
        SupportTicketService.getTickets({ tenantId: id, limit: 10 }),
        AuditLog.find({ tenant_id: id }).sort({ created_at: -1 }).limit(10)
      ]);

      res.status(200).json({
        success: true,
        data: {
          organization: tenant,
          subscription,
          enabledModules: enabledModules.map(m => m.module_code),
          usersCount,
          tickets: tickets.tickets,
          auditLogs
        }
      });
    } catch (error: any) {
      console.error('Error fetching organization detail:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 4. UPDATE ORGANIZATION STATUS (SUSPEND/ACTIVATE)
   */
  static async updateOrganizationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, lock_reason } = req.body;

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        {
          status,
          lock_reason: lock_reason || '',
          updated_at: new Date()
        },
        { new: true }
      );

      if (!tenant) {
        res.status(404).json({ success: false, error: 'Organization not found' });
        return;
      }

      await AuditLog.create({
        tenant_id: id,
        user_id: (req as any).user?.userId || null,
        action: 'ORGANIZATION_STATUS_UPDATE',
        entity: 'Tenant',
        entity_id: id,
        details: { status, lock_reason },
        ip: req.ip
      }).catch(() => {});

      res.status(200).json({ success: true, data: tenant });
    } catch (error: any) {
      console.error('Error updating organization status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 5. OVERRIDE ORGANIZATION MODULES
   */
  static async updateOrganizationModules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { moduleCodes } = req.body;

      if (!Array.isArray(moduleCodes)) {
        res.status(400).json({ success: false, error: 'moduleCodes must be an array' });
        return;
      }

      await OrganizationModule.deleteMany({ tenant_id: id });

      const allModules = await Module.find({ code: { $in: moduleCodes } }).lean();
      const moduleMap = new Map(allModules.map(m => [m.code, m._id]));

      const newEntitlements = moduleCodes.map((code: string) => {
        const modId = moduleMap.get(code);
        return {
          tenant_id: id,
          ...(modId ? { module_id: modId } : {}),
          module_code: code,
          status: 'active',
          is_enabled: true,
          source: 'ADMIN_OVERRIDE',
          created_at: new Date()
        };
      });

      await OrganizationModule.insertMany(newEntitlements);

      await AuditLog.create({
        tenant_id: id,
        user_id: (req as any).user?.userId || null,
        action: 'MODULE_ENTITLEMENT_OVERRIDE',
        entity: 'OrganizationModule',
        entity_id: id,
        details: { moduleCodes },
        ip: req.ip
      }).catch(() => {});

      res.status(200).json({ success: true, message: 'Organization module overrides saved successfully' });
    } catch (error: any) {
      console.error('Error updating organization modules:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 6. GET BUSINESS TYPES & MATRIX
   */
  static async getBusinessTypes(req: Request, res: Response): Promise<void> {
    try {
      const bts = await BusinessType.find({ is_active: true }).lean();
      const enriched = await Promise.all(
        bts.map(async (bt: any) => {
          const matrix = await BusinessTypeModule.find({ business_type_code: bt.code });
          const moduleMap: Record<string, string> = {};
          matrix.forEach(m => {
            moduleMap[m.module_code] = m.applicability;
          });
          return {
            ...bt,
            modules: moduleMap
          };
        })
      );
      res.status(200).json({ success: true, data: enriched });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 7. UPDATE BUSINESS TYPE MATRIX
   */
  static async updateBusinessTypeMatrix(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { matrix } = req.body; // e.g. { CRM: 'C', POS: 'O' }

      if (!matrix || typeof matrix !== 'object') {
        res.status(400).json({ success: false, error: 'matrix must be an object' });
        return;
      }

      await BusinessTypeModule.deleteMany({ business_type_code: code });

      const entries = Object.keys(matrix).map(mCode => ({
        business_type_code: code,
        module_code: mCode,
        applicability: matrix[mCode]
      }));

      await BusinessTypeModule.insertMany(entries);
      res.status(200).json({ success: true, message: 'Matrix updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 8. GET MODULE PRICINGS
   */
  static async getModulePricings(req: Request, res: Response): Promise<void> {
    try {
      const pricings = await ModulePricing.find().lean();
      res.status(200).json({ success: true, data: pricings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 9. UPDATE MODULE PRICING
   */
  static async updateModulePricing(req: Request, res: Response): Promise<void> {
    try {
      const { module_code } = req.params;
      const { monthly_price, yearly_price, is_standalone, min_tier } = req.body;

      const pricing = await ModulePricing.findOneAndUpdate(
        { module_code },
        {
          monthly_price,
          yearly_price,
          is_standalone,
          min_tier,
          updated_at: new Date()
        },
        { new: true, upsert: true }
      );

      res.status(200).json({ success: true, data: pricing });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 10. GET SUBSCRIPTION PLANS
   */
  static async getSubscriptionPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await SubscriptionPlan.find().sort({ sort_order: 1, price_monthly: 1 }).lean();
      res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 11. SAVE SUBSCRIPTION PLAN
   */
  static async saveSubscriptionPlan(req: Request, res: Response): Promise<void> {
    try {
      const planData = req.body;
      const planId = req.params.id || planData._id;
      let plan;
      if (planId) {
        plan = await SubscriptionPlan.findByIdAndUpdate(
          planId,
          { ...planData, updated_at: new Date() },
          { new: true }
        );
      } else {
        plan = await SubscriptionPlan.create(planData);
      }
      res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 12. GET ADDONS
   */
  static async getAddons(req: Request, res: Response): Promise<void> {
    try {
      const addons = await Addon.find().sort({ sort_order: 1 }).lean();
      res.status(200).json({ success: true, data: addons });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 13. SAVE ADDON
   */
  static async saveAddon(req: Request, res: Response): Promise<void> {
    try {
      const addonData = req.body;
      const addonId = req.params.id || addonData._id;
      let addon;
      if (addonId) {
        addon = await Addon.findByIdAndUpdate(
          addonId,
          { ...addonData, updated_at: new Date() },
          { new: true }
        );
      } else {
        addon = await Addon.create(addonData);
      }
      res.status(200).json({ success: true, data: addon });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 14. GET CUSTOM PACKAGE REQUESTS
   */
  static async getCustomPackageRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await CustomPackageRequest.find().sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 15. UPDATE CUSTOM PACKAGE REQUEST
   */
  static async updateCustomPackageRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const request = await CustomPackageRequest.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 16. SUBSCRIPTION CALCULATE PRICE DELEGATE
   */
  static async calculatePrice(req: Request, res: Response): Promise<void> {
    try {
      const calculation = await SubscriptionService.calculateSubscriptionPrice(req.body);
      res.status(200).json({ success: true, data: calculation });
    } catch (error: any) {
      console.error('Error calculating subscription price:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default PlatformAdminController;
