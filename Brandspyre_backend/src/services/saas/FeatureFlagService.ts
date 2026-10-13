import { FeatureFlag } from '../../db/ModelSceham/rbacSchema';
import { Tenant } from '../../db/ModelSceham/saasSchema';
import mongoose from 'mongoose';

export class FeatureFlagService {
  /**
   * Initialize feature flags for a tenant based on their subscription plan
   */
  static async initializeTenantFlags(tenantId: mongoose.Types.ObjectId | string, planCode: string, session?: mongoose.ClientSession) {
    const opts = session ? { session, upsert: true, new: true } : { upsert: true, new: true };
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    // Module enablement matrix by plan
    const moduleMap: Record<string, string[]> = {
      trial: ['crm', 'sales', 'project', 'hr', 'finance', 'report', 'setting', 'billing'],
      free: ['crm', 'sales', 'project', 'setting', 'billing'],
      basic: ['crm', 'sales', 'project', 'setting', 'billing', 'report'],
      standard: ['crm', 'sales', 'project', 'hr', 'finance', 'report', 'setting', 'billing'],
      professional: ['crm', 'sales', 'project', 'hr', 'finance', 'purchase', 'inventory', 'report', 'setting', 'billing'],
      premium: ['crm', 'sales', 'project', 'hr', 'finance', 'purchase', 'inventory', 'report', 'setting', 'billing'],
      enterprise: ['crm', 'sales', 'project', 'hr', 'finance', 'purchase', 'inventory', 'report', 'setting', 'billing']
    };

    const enabledModules = moduleMap[planCode.toLowerCase()] || moduleMap['trial'];
    const allModules = ['crm', 'sales', 'project', 'hr', 'finance', 'purchase', 'inventory', 'report', 'setting', 'billing'];

    for (const mod of allModules) {
      const isEnabled = enabledModules.includes(mod);
      await FeatureFlag.findOneAndUpdate(
        { tenant_id: tId, module_key: mod },
        { tenant_id: tId, module_key: mod, is_enabled: isEnabled, updated_at: new Date() },
        opts
      );
    }
  }

  /**
   * Check if a module is enabled for a given tenant.
   * Checks OrganizationModule first (new source of truth), falling back to FeatureFlag.
   */
  static async isModuleEnabled(tenantId: mongoose.Types.ObjectId | string, moduleKey: string): Promise<boolean> {
    try {
      const tId = new mongoose.Types.ObjectId(tenantId as string);
      const modUpper = moduleKey.toUpperCase();

      // Check OrganizationModule table
      const { OrganizationModule, Module } = require('../../db/ModelSceham/industryModuleSchema');
      const modDoc = await Module.findOne({ code: modUpper });
      if (modDoc?.is_core) return true;

      const orgMod = await OrganizationModule.findOne({ tenant_id: tId, module_code: modUpper });
      if (orgMod) {
        return orgMod.status === 'active';
      }

      // Legacy fallback
      const flag = await FeatureFlag.findOne({
        tenant_id: tId,
        module_key: moduleKey.toLowerCase()
      });

      if (!flag) {
        // Default to enabled if record not initialized
        return true;
      }

      return flag.is_enabled;
    } catch (error) {
      console.error(`Error checking feature flag for module ${moduleKey}:`, error);
      return true;
    }
  }
}

export default FeatureFlagService;

