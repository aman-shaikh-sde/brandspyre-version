import mongoose from 'mongoose';
import {
  OrganizationModule,
  OrganizationFeature,
  Module,
  Feature,
  PlanModuleAllowance,
  ModuleDependency
} from '../../db/ModelSceham/industryModuleSchema';
import { Tenant, TenantSubscription, SubscriptionPlan, AuditLog } from '../../db/ModelSceham/saasSchema';
import { FeatureFlag } from '../../db/ModelSceham/rbacSchema';
import ModuleRegistryService from './ModuleRegistryService';
import RBACService from './RBACService';

export class OrganizationEntitlementService {
  /**
   * Get all active/enabled modules for a tenant
   */
  static async getEnabledModules(tenantId: string | mongoose.Types.ObjectId): Promise<string[]> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const orgModules = await OrganizationModule.find({ tenant_id: tId, status: 'active' });
    
    // Core modules are always enabled
    const coreModules = await Module.find({ is_core: true, is_active: true });
    const coreCodes = coreModules.map((m) => m.code);
    
    const activeCodes = orgModules.map((m) => m.module_code);
    return Array.from(new Set([...coreCodes, ...activeCodes]));
  }

  /**
   * Get all active/enabled features for a tenant
   */
  static async getEnabledFeatures(tenantId: string | mongoose.Types.ObjectId): Promise<string[]> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    
    // Enabled features must belong to enabled modules
    const enabledModules = await this.getEnabledModules(tenantId);
    
    const orgFeatures = await OrganizationFeature.find({
      tenant_id: tId,
      module_code: { $in: enabledModules },
      status: 'active'
    });

    return orgFeatures.map((f) => f.feature_code);
  }

  /**
   * Check if a module is enabled for a tenant
   */
  static async isModuleEnabled(tenantId: string | mongoose.Types.ObjectId, moduleCode: string): Promise<boolean> {
    const codeUpper = moduleCode.toUpperCase();
    
    // Core modules are always enabled
    const modDoc = await Module.findOne({ code: codeUpper });
    if (modDoc?.is_core) return true;

    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const orgModule = await OrganizationModule.findOne({
      tenant_id: tId,
      module_code: codeUpper,
      status: 'active'
    });

    if (orgModule) return true;

    // Backward compatibility fallback to FeatureFlag table
    const legacyFlag = await FeatureFlag.findOne({
      tenant_id: tId,
      module_key: moduleCode.toLowerCase()
    });

    if (legacyFlag) {
      return legacyFlag.is_enabled;
    }

    return false;
  }

  /**
   * Check if a feature is enabled for a tenant
   */
  static async isFeatureEnabled(tenantId: string | mongoose.Types.ObjectId, featureCode: string): Promise<boolean> {
    const codeUpper = featureCode.toUpperCase();
    const featDoc = await Feature.findOne({ code: codeUpper });
    if (!featDoc) return false;

    // Parent module must be enabled
    const moduleEnabled = await this.isModuleEnabled(tenantId, featDoc.module_code);
    if (!moduleEnabled) return false;

    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const orgFeature = await OrganizationFeature.findOne({
      tenant_id: tId,
      feature_code: codeUpper,
      status: 'active'
    });

    if (orgFeature) return true;

    // Fall back to default state of feature if not explicitly customized
    return featDoc.is_default;
  }

  /**
   * Enable a list of modules for a tenant, validating subscription plan allowances and dependencies
   */
  static async enableModules(
    tenantId: string | mongoose.Types.ObjectId,
    moduleCodes: string[],
    source: 'onboarding' | 'admin' | 'subscription' | 'migration' | 'system' = 'admin',
    userId?: string | mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<{ success: boolean; enabledModules: string[]; message?: string }> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const uId = userId ? new mongoose.Types.ObjectId(userId as string) : undefined;

    // 1. Resolve with required module dependencies
    const fullModuleList = await ModuleRegistryService.resolveWithDependencies(moduleCodes);

    // 2. Validate against Subscription Plan Allowances
    const activeSub = await TenantSubscription.findOne({ tenant_id: tId, status: { $in: ['active', 'trial', 'grace'] } });
    if (activeSub) {
      let plan = null;
      if (activeSub.plan_id && mongoose.Types.ObjectId.isValid(activeSub.plan_id)) {
        plan = await SubscriptionPlan.findById(activeSub.plan_id);
      } else if (activeSub.plan_id) {
        plan = await SubscriptionPlan.findOne({ plan_code: activeSub.plan_id.toString().toLowerCase() });
      }
      if (plan) {
        const allowedInPlan = await PlanModuleAllowance.find({ plan_code: plan.plan_code, is_included: true });
        const allowedCodes = new Set(allowedInPlan.map((p) => p.module_code));

        // Core modules are always allowed in every subscription plan
        const coreDocs = await Module.find({ is_core: true });
        const coreCodes = new Set([
          ...coreDocs.map((c) => c.code),
          'DASHBOARD',
          'ORGANIZATION',
          'NOTIFICATIONS',
          'ADMINISTRATION'
        ]);

        const disallowed = fullModuleList.filter((mCode) => {
          if (coreCodes.has(mCode)) return false;
          return !allowedCodes.has(mCode);
        });

        if (disallowed.length > 0) {
          return {
            success: false,
            enabledModules: [],
            message: `Modules [${disallowed.join(', ')}] are not included in your organization's ${plan.plan_name} subscription plan.`
          };
        }
      }
    }

    // 3. Upsert OrganizationModule entries & sync compatibility layer (FeatureFlag)
    for (const modCode of fullModuleList) {
      const modDoc = await Module.findOne({ code: modCode });
      if (!modDoc) continue;

      await OrganizationModule.findOneAndUpdate(
        { tenant_id: tId, module_code: modCode },
        {
          tenant_id: tId,
          module_id: modDoc._id,
          module_code: modCode,
          status: 'active',
          source,
          enabled_at: new Date(),
          enabled_by: uId,
          updated_at: new Date()
        },
        { upsert: true, new: true, session }
      );

      // Compatibility Sync -> FeatureFlag
      await FeatureFlag.findOneAndUpdate(
        { tenant_id: tId, module_key: modCode.toLowerCase() },
        { tenant_id: tId, module_key: modCode.toLowerCase(), is_enabled: true, updated_at: new Date() },
        { upsert: true, new: true, session }
      );

      // Enable default features for this module if not already set
      const defaultFeatures = await Feature.find({ module_code: modCode, is_default: true, is_active: true });
      for (const feat of defaultFeatures) {
        await OrganizationFeature.findOneAndUpdate(
          { tenant_id: tId, feature_code: feat.code },
          {
            tenant_id: tId,
            feature_id: feat._id,
            feature_code: feat.code,
            module_code: modCode,
            status: 'active',
            source,
            enabled_at: new Date(),
            enabled_by: uId,
            updated_at: new Date()
          },
          { upsert: true, new: true, session }
        );
      }
    }

    // Audit Log
    await AuditLog.create([{
      tenant_id: tId,
      user_id: uId,
      action: 'MODULES_ENABLED',
      entity: 'OrganizationModule',
      details: { modules: fullModuleList, source },
      created_at: new Date()
    }], session ? { session } : {});

    const currentEnabled = await this.getEnabledModules(tId);
    return { success: true, enabledModules: currentEnabled };
  }

  /**
   * Disable a module for a tenant (validating that no dependent active modules rely on it)
   */
  static async disableModule(
    tenantId: string | mongoose.Types.ObjectId,
    moduleCode: string,
    userId?: string | mongoose.Types.ObjectId
  ): Promise<{ success: boolean; message?: string }> {
    const codeUpper = moduleCode.toUpperCase();
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const uId = userId ? new mongoose.Types.ObjectId(userId as string) : undefined;

    // Core modules cannot be disabled
    const modDoc = await Module.findOne({ code: codeUpper });
    if (modDoc?.is_core) {
      return { success: false, message: `Core module '${codeUpper}' cannot be disabled.` };
    }

    // Check if other currently enabled modules depend on this module
    const enabledModules = await this.getEnabledModules(tId);
    const dependentActiveModules: string[] = [];

    for (const activeCode of enabledModules) {
      if (activeCode === codeUpper) continue;
      const deps = await ModuleRegistryService.getModuleDependencies(activeCode);
      if (deps.includes(codeUpper)) {
        dependentActiveModules.push(activeCode);
      }
    }

    if (dependentActiveModules.length > 0) {
      return {
        success: false,
        message: `Cannot disable '${codeUpper}' because active module(s) [${dependentActiveModules.join(', ')}] depend on it.`
      };
    }

    // Disable OrganizationModule
    await OrganizationModule.findOneAndUpdate(
      { tenant_id: tId, module_code: codeUpper },
      {
        status: 'inactive',
        disabled_at: new Date(),
        updated_at: new Date()
      }
    );

    // Sync FeatureFlag compatibility layer
    await FeatureFlag.findOneAndUpdate(
      { tenant_id: tId, module_key: codeUpper.toLowerCase() },
      { is_enabled: false, updated_at: new Date() }
    );

    // Disable child OrganizationFeatures
    await OrganizationFeature.updateMany(
      { tenant_id: tId, module_code: codeUpper },
      { status: 'inactive', disabled_at: new Date(), updated_at: new Date() }
    );

    // Audit Log
    await AuditLog.create([{
      tenant_id: tId,
      user_id: uId,
      action: 'MODULE_DISABLED',
      entity: 'OrganizationModule',
      details: { module: codeUpper },
      created_at: new Date()
    }]);

    return { success: true };
  }

  /**
   * Toggle a specific feature for a tenant
   */
  static async setFeatureStatus(
    tenantId: string | mongoose.Types.ObjectId,
    featureCode: string,
    enabled: boolean,
    userId?: string | mongoose.Types.ObjectId
  ): Promise<{ success: boolean; message?: string }> {
    const codeUpper = featureCode.toUpperCase();
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const uId = userId ? new mongoose.Types.ObjectId(userId as string) : undefined;

    const featDoc = await Feature.findOne({ code: codeUpper });
    if (!featDoc) {
      return { success: false, message: `Feature '${codeUpper}' not found.` };
    }

    const isModEnabled = await this.isModuleEnabled(tId, featDoc.module_code);
    if (!isModEnabled && enabled) {
      return { success: false, message: `Parent module '${featDoc.module_code}' must be enabled before enabling feature '${codeUpper}'.` };
    }

    await OrganizationFeature.findOneAndUpdate(
      { tenant_id: tId, feature_code: codeUpper },
      {
        tenant_id: tId,
        feature_id: featDoc._id,
        feature_code: codeUpper,
        module_code: featDoc.module_code,
        status: enabled ? 'active' : 'inactive',
        enabled_at: enabled ? new Date() : undefined,
        disabled_at: enabled ? undefined : new Date(),
        enabled_by: uId,
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    await AuditLog.create([{
      tenant_id: tId,
      user_id: uId,
      action: enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
      entity: 'OrganizationFeature',
      details: { feature: codeUpper, module: featDoc.module_code },
      created_at: new Date()
    }]);

    return { success: true };
  }

  /**
   * Get full consolidated organization configuration for front-end consumption
   */
  static async getOrganizationConfig(tenantId: string | mongoose.Types.ObjectId, userId?: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const tenant = await Tenant.findById(tId);

    const enabledModules = await this.getEnabledModules(tId);
    const enabledFeatures = await this.getEnabledFeatures(tId);

    let permissions: string[] = [];
    if (userId) {
      permissions = await RBACService.getUserPermissionCodes(userId.toString(), tId.toString());
    }

    const subscription = await TenantSubscription.findOne({ tenant_id: tId, status: { $in: ['active', 'trial', 'grace'] } })
      .populate('plan_id');

    return {
      tenantId: tId.toString(),
      companyName: tenant?.company_name || tenant?.name || '',
      industry: tenant?.industry || 'OTHER',
      enabledModules,
      enabledFeatures,
      permissions,
      subscription: subscription ? {
        planCode: (subscription.plan_id as any)?.plan_code || 'trial',
        planName: (subscription.plan_id as any)?.plan_name || 'Free Trial',
        status: subscription.status,
        endDate: subscription.end_date
      } : null
    };
  }

  /**
   * Migration helper: Sync existing FeatureFlags to OrganizationModule table
   */
  static async syncFromFeatureFlags(tenantId: string | mongoose.Types.ObjectId): Promise<void> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const flags = await FeatureFlag.find({ tenant_id: tId, is_enabled: true });

    const modulesToEnable: string[] = [];

    for (const flag of flags) {
      const codeUpper = flag.module_key.toUpperCase();
      const modDoc = await Module.findOne({ code: codeUpper });
      if (modDoc) {
        modulesToEnable.push(codeUpper);
      }
    }

    // Default fallback: enable full standard multi-industry module suite
    const fullBaseline = [
      'DASHBOARD', 'ORGANIZATION', 'NOTIFICATIONS', 'CRM', 'CLIENTS', 'PROJECTS',
      'HRMS', 'FINANCE', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'LEAD_EXCHANGE',
      'DOCUMENTS', 'REPORTS', 'PRODUCTS', 'INVENTORY', 'PURCHASE', 'SALES', 'POS', 'PRODUCTION'
    ];

    const finalModules = Array.from(new Set([...modulesToEnable, ...fullBaseline]));

    await this.enableModules(tId, finalModules, 'migration');
  }
}

export default OrganizationEntitlementService;
