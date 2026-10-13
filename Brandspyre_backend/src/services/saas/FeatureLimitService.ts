import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Tenant,
  TenantSubscription,
  SubscriptionPlan,
  TenantUsage
} from '../../db/ModelSceham/saasSchema';
import { Branch } from '../../db/ModelSceham/branchSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';

export type FeatureMetric = 
  | 'users' 
  | 'branches' 
  | 'storage_mb' 
  | 'leads' 
  | 'projects' 
  | 'invoices' 
  | 'employees' 
  | 'customers' 
  | 'products' 
  | 'warehouses' 
  | 'documents' 
  | 'api_calls' 
  | 'quotes' 
  | 'reports'
  | 'active_events'
  | 'tickets_per_event'
  | 'monthly_ticket_sales';

export class FeatureLimitService {
  /**
   * Evaluates if a tenant can consume an additional unit of a given metric.
   */
  static async checkLimit(
    tenantId: string,
    metric: FeatureMetric,
    additional: number = 1
  ): Promise<{ allowed: boolean; current: number; max: number; metric: string; message?: string }> {
    // Fetch subscription & plan
    const sub = await TenantSubscription.findOne({ tenant_id: tenantId, status: { $in: ['active', 'trial', 'grace'] } });
    
    if (!sub) {
      return { allowed: false, current: 0, max: 0, metric, message: 'No active or valid trial subscription found.' };
    }

    let plan = null;
    if (sub.plan_id && mongoose.Types.ObjectId.isValid(sub.plan_id)) {
      plan = await SubscriptionPlan.findById(sub.plan_id);
    } else if (sub.plan_id) {
      plan = await SubscriptionPlan.findOne({ plan_code: sub.plan_id.toString().toLowerCase() });
    }
    if (!plan) {
      return { allowed: false, current: 0, max: 0, metric, message: 'Subscription plan not found.' };
    }

    // Determine current count
    let currentCount = 0;
    const usageDoc = await TenantUsage.findOne({ tenant_id: tenantId, metric_name: metric });
    if (usageDoc) {
      currentCount = usageDoc.metric_value || 0;
    } else {
      // Direct count fallback for key collections
      if (metric === 'users') {
        currentCount = await UserInfo.countDocuments({ tenant_id: tenantId });
      } else if (metric === 'branches') {
        currentCount = await Branch.countDocuments({ tenant_id: tenantId });
      } else if (metric === 'active_events') {
        const { Event } = require('../../db/ModelSceham/eventSchema');
        currentCount = await Event.countDocuments({ tenant_id: tenantId, status: { $nin: ['COMPLETED', 'CANCELLED'] } });
      }
    }

    // Get maximum allowed count from plan
    let maxAllowed = 0;
    switch (metric) {
      case 'users':
        maxAllowed = plan.max_users || 5;
        break;
      case 'branches':
        maxAllowed = plan.max_branches || 1;
        break;
      case 'storage_mb':
        maxAllowed = (plan.max_storage_gb || 1) * 1024;
        break;
      case 'leads':
        maxAllowed = plan.max_leads || 500;
        break;
      case 'projects':
        maxAllowed = plan.max_projects || 20;
        break;
      case 'invoices':
        maxAllowed = plan.max_invoices || 100;
        break;
      case 'employees':
        maxAllowed = plan.max_employees || 10;
        break;
      case 'customers':
        maxAllowed = plan.max_customers || 100;
        break;
      case 'products':
        maxAllowed = plan.max_products || 50;
        break;
      case 'warehouses':
        maxAllowed = plan.max_warehouses || 1;
        break;
      case 'documents':
        maxAllowed = plan.max_documents || 100;
        break;
      case 'api_calls':
        maxAllowed = plan.max_api_calls || 1000;
        break;
      case 'quotes':
        maxAllowed = plan.max_quotes || 50;
        break;
      case 'reports':
        maxAllowed = plan.max_reports || 10;
        break;
      case 'active_events':
        maxAllowed = (plan as any).max_active_events ?? 5;
        break;
      case 'tickets_per_event':
        maxAllowed = (plan as any).max_tickets_per_event ?? 200;
        break;
      case 'monthly_ticket_sales':
        maxAllowed = (plan as any).max_monthly_ticket_sales ?? 500;
        break;
    }

    const allowed = (currentCount + additional) <= maxAllowed;
    return {
      allowed,
      current: currentCount,
      max: maxAllowed,
      metric,
      message: allowed ? undefined : `Feature limit reached for ${metric}. Allowed: ${maxAllowed}, Current: ${currentCount}`
    };
  }

  /**
   * Check if a plan allows access to a specific module
   */
  static async checkModuleAccess(
    tenantId: string,
    moduleKey: string
  ): Promise<{ allowed: boolean; module: string; message?: string }> {
    const sub = await TenantSubscription.findOne({ tenant_id: tenantId, status: { $in: ['active', 'trial', 'grace'] } });
    if (!sub) {
      return { allowed: false, module: moduleKey, message: 'Subscription is not active.' };
    }

    let plan = null;
    if (sub.plan_id && mongoose.Types.ObjectId.isValid(sub.plan_id)) {
      plan = await SubscriptionPlan.findById(sub.plan_id);
    } else if (sub.plan_id) {
      plan = await SubscriptionPlan.findOne({ plan_code: sub.plan_id.toString().toLowerCase() });
    }
    if (!plan) {
      return { allowed: false, module: moduleKey, message: 'Subscription plan not found.' };
    }

    // 1. Check if organization has actively enabled this module
    const normKey = moduleKey.toUpperCase();
    try {
      const { OrganizationEntitlementService } = require('./OrganizationEntitlementService');
      const isOrgEnabled = await OrganizationEntitlementService.isModuleEnabled(tenantId, normKey);
      if (isOrgEnabled) {
        return { allowed: true, module: moduleKey };
      }
    } catch (e) {
      // Continue to allowance check
    }

    // 2. Check PlanModuleAllowance for included modules
    try {
      const { PlanModuleAllowance } = require('../../db/ModelSceham/industryModuleSchema');
      const allowance = await PlanModuleAllowance.findOne({
        plan_code: plan.plan_code,
        module_code: normKey,
        is_included: true
      });
      if (allowance) {
        return { allowed: true, module: moduleKey };
      }
    } catch (e) {
      // Continue to legacy check
    }

    // 3. Fallback to legacy plan.modules map
    const modules = plan.modules || {};
    const allowed = (modules as any)[moduleKey] !== false && (modules as any)[moduleKey.toLowerCase()] !== false;

    return {
      allowed,
      module: moduleKey,
      message: allowed ? undefined : `Module '${moduleKey}' is not enabled in your current ${plan.plan_name} plan.`
    };
  }

  /**
   * Increments the recorded usage metric for a tenant.
   */
  static async incrementMetric(
    tenantId: string,
    metric: FeatureMetric,
    count: number = 1,
    session?: mongoose.ClientSession
  ) {
    const query = TenantUsage.findOneAndUpdate(
      { tenant_id: tenantId, metric_name: metric },
      {
        $inc: { metric_value: count },
        $set: { recorded_at: new Date() }
      },
      { upsert: true, new: true }
    );
    if (session) query.session(session);
    return await query;
  }

  /**
   * Express middleware factory for enforcing feature limits on route endpoints.
   */
  static middleware(metric: FeatureMetric) {
    return async (req: any, res: Response, next: NextFunction): Promise<void> => {
      try {
        const tenantId = req.tenant?.id || req.user?.tenantId;
        if (!tenantId) {
          res.status(400).json({ error: 'Tenant context is required for limit check' });
          return;
        }

        const limitResult = await FeatureLimitService.checkLimit(tenantId.toString(), metric, 1);
        if (!limitResult.allowed) {
          res.status(403).json({
            error: limitResult.message,
            metric: limitResult.metric,
            current: limitResult.current,
            max: limitResult.max
          });
          return;
        }

        next();
      } catch (err) {
        console.error('Feature limit middleware error:', err);
        res.status(500).json({ error: 'Internal server error during limit validation' });
      }
    };
  }
}

export default FeatureLimitService;
