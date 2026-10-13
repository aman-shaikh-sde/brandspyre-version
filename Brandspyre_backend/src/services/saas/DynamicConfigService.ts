import mongoose from 'mongoose';
import {
  EntityFieldDefinition,
  EntityViewConfiguration,
  WorkflowDefinition,
  WorkflowStep,
  StatusDefinition,
  DashboardWidget,
  DashboardDefinition,
  ReportDefinition,
  NavigationDefinition,
  TerminologyDefinition,
  BusinessRule
} from '../../db/ModelSceham/dynamicConfigSchema';
import { Industry, Module, Feature } from '../../db/ModelSceham/industryModuleSchema';
import { Tenant } from '../../db/ModelSceham/saasSchema';
import OrganizationEntitlementService from './OrganizationEntitlementService';

export class DynamicConfigService {
  /**
   * Resolve tenant's industry code
   */
  static async getTenantIndustry(tenantId: string | mongoose.Types.ObjectId): Promise<string> {
    try {
      const tenant: any = await Tenant.findById(tenantId).lean();
      return tenant?.industry || 'OTHER';
    } catch {
      return 'OTHER';
    }
  }

  /**
   * Get merged Entity Field Definitions with Precedence (ORGANIZATION -> INDUSTRY -> PLATFORM)
   */
  static async getEntityFields(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string,
    entityType?: string
  ): Promise<any[]> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const indCode = industryCode || (await this.getTenantIndustry(tenantId));

    const entityUpper = (entityType || '').toUpperCase();
    const entityAliases = (entityUpper === 'CUSTOMER' || entityUpper === 'CLIENT') ? ['CUSTOMER', 'CLIENT'] : [entityUpper];

    const filter: any = {};
    if (entityType) {
      filter.entity_type = { $in: entityAliases };
    }

    // Query platform defaults, industry configs, and org overrides
    const fields = await EntityFieldDefinition.find({
      ...filter,
      $or: [
        { scope: 'PLATFORM' },
        { scope: 'INDUSTRY', industry_code: indCode },
        { scope: 'ORGANIZATION', tenant_id: tId }
      ]
    }).sort({ display_order: 1 }).lean();

    // Map by field_code enforcing precedence (ORGANIZATION > INDUSTRY > PLATFORM)
    const fieldMap = new Map<string, any>();

    for (const f of fields) {
      const key = `${f.entity_type}:${f.field_code}`;
      const existing = fieldMap.get(key);

      if (!existing) {
        fieldMap.set(key, f);
      } else {
        // Higher precedence overrides lower
        const score = (item: any) => (item.scope === 'ORGANIZATION' ? 3 : item.scope === 'INDUSTRY' ? 2 : 1);
        if (score(f) > score(existing)) {
          fieldMap.set(key, { ...existing, ...f });
        }
      }
    }

    return Array.from(fieldMap.values()).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  /**
   * Get Form View Configuration for an Entity
   */
  static async getFormConfig(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string,
    entityType?: string
  ): Promise<any> {
    const fields = await this.getEntityFields(tenantId, industryCode, entityType);
    
    // Group fields into sections
    const sectionsMap = new Map<string, any[]>();
    for (const f of fields) {
      if (!f.visible) continue;
      const sectionName = f.section || 'General Details';
      if (!sectionsMap.has(sectionName)) {
        sectionsMap.set(sectionName, []);
      }
      sectionsMap.get(sectionName)!.push(f);
    }

    const sections = Array.from(sectionsMap.entries()).map(([title, fieldList], idx) => ({
      title,
      display_order: idx + 1,
      fields: fieldList
    }));

    return {
      entity_type: entityType?.toUpperCase(),
      sections,
      fields
    };
  }

  /**
   * Get Table View Configuration for an Entity
   */
  static async getTableConfig(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string,
    entityType?: string
  ): Promise<any> {
    const fields = await this.getEntityFields(tenantId, industryCode, entityType);
    
    const columns = fields
      .filter((f) => f.visible)
      .map((f) => ({
        field_code: f.field_code,
        label: f.label,
        data_type: f.data_type,
        sortable: f.sortable,
        filterable: f.filterable,
        searchable: f.searchable,
        display_order: f.display_order,
        align: ['number', 'currency'].includes(f.input_type) ? 'right' : 'left'
      }));

    return {
      entity_type: entityType?.toUpperCase(),
      columns
    };
  }

  /**
   * Get Terminology Map with Precedence (ORGANIZATION -> INDUSTRY -> PLATFORM)
   */
  static async getTerminologyMap(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string
  ): Promise<Record<string, { label: string; plural_label: string; field_labels?: Record<string, string> }>> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const indCode = industryCode || (await this.getTenantIndustry(tenantId));

    const terms = await TerminologyDefinition.find({
      $or: [
        { scope: 'PLATFORM' },
        { scope: 'INDUSTRY', industry_code: indCode },
        { scope: 'ORGANIZATION', tenant_id: tId }
      ]
    }).lean();

    const termMap: Record<string, any> = {};

    for (const t of terms) {
      const entityKey = t.entity_type.toUpperCase();
      const existing = termMap[entityKey];

      const score = (item: any) => (item.scope === 'ORGANIZATION' ? 3 : item.scope === 'INDUSTRY' ? 2 : 1);

      if (!existing || score(t) > score(existing)) {
        termMap[entityKey] = t;
      }
    }

    const result: Record<string, { label: string; plural_label: string; field_labels?: Record<string, string> }> = {};
    for (const [k, v] of Object.entries(termMap)) {
      result[k] = {
        label: v.label,
        plural_label: v.plural_label,
        field_labels: v.field_labels || {}
      };
    }

    return result;
  }

  /**
   * Get Navigation Structure with Entitlement & Permission Evaluation
   */
  static async getNavigation(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string
  ): Promise<any[]> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const indCode = industryCode || (await this.getTenantIndustry(tenantId));
    const enabledModules = await OrganizationEntitlementService.getEnabledModules(tId);

    // Fetch navigation definitions
    const navDocs = await NavigationDefinition.find({
      $or: [
        { scope: 'PLATFORM' },
        { scope: 'INDUSTRY', industry_code: indCode },
        { scope: 'ORGANIZATION', tenant_id: tId }
      ]
    }).lean();

    let navDef = navDocs.find((d) => d.scope === 'ORGANIZATION') ||
                 navDocs.find((d) => d.scope === 'INDUSTRY') ||
                 navDocs.find((d) => d.scope === 'PLATFORM');

    if (!navDef || !navDef.nav_groups) return [];

    // Filter nav groups and items against enabled modules
    const filteredGroups = navDef.nav_groups
      .filter((group: any) => group.module_code === 'DASHBOARD' || enabledModules.includes(group.module_code.toUpperCase()))
      .map((group: any) => ({
        ...group,
        items: group.items.filter((item: any) => item.module_code === 'DASHBOARD' || enabledModules.includes(item.module_code.toUpperCase()))
      }))
      .filter((group: any) => group.items.length > 0);

    return filteredGroups;
  }

  /**
   * Get Dashboard Configuration (Widgets layout)
   */
  static async getDashboardConfig(
    tenantId: string | mongoose.Types.ObjectId,
    industryCode?: string
  ): Promise<any> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const indCode = industryCode || (await this.getTenantIndustry(tenantId));
    const enabledModules = await OrganizationEntitlementService.getEnabledModules(tId);

    const dashboards = await DashboardDefinition.find({
      $or: [
        { scope: 'PLATFORM' },
        { scope: 'INDUSTRY', industry_code: indCode },
        { scope: 'ORGANIZATION', tenant_id: tId }
      ]
    }).lean();

    const dbDef = dashboards.find((d) => d.scope === 'ORGANIZATION') ||
                  dashboards.find((d) => d.scope === 'INDUSTRY') ||
                  dashboards.find((d) => d.scope === 'PLATFORM');

    if (!dbDef) return { title: 'Dashboard', widgets: [] };

    // Get active widget registry
    const widgetsRegistry = await DashboardWidget.find({ is_active: true }).lean();
    const widgetMap = new Map(widgetsRegistry.map((w: any) => [w.widget_code, w]));

    // Filter widgets belonging to enabled modules
    const resolvedWidgets = dbDef.widgets
      .map((w: any) => {
        const reg = widgetMap.get(w.widget_code);
        if (!reg) return null;
        if (reg.module_code !== 'DASHBOARD' && !enabledModules.includes(reg.module_code.toUpperCase())) {
          return null;
        }
        return {
          widget_code: w.widget_code,
          title: w.title || reg.name,
          description: reg.description,
          module_code: reg.module_code,
          data_source: reg.data_source,
          visualization_type: reg.visualization_type,
          grid_span: w.grid_span || 1,
          sort_order: w.sort_order,
          config: { ...reg.default_config, ...(w.config_override || {}) }
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return {
      dashboard_code: dbDef.dashboard_code,
      title: dbDef.title,
      widgets: resolvedWidgets
    };
  }

  /**
   * Consolidated Organization Configuration Payload for Frontend
   */
  static async getConsolidatedFullConfig(
    tenantId: string | mongoose.Types.ObjectId,
    userId?: string | mongoose.Types.ObjectId
  ): Promise<any> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const baseConfig = await OrganizationEntitlementService.getOrganizationConfig(tId, userId);
    const industryCode = baseConfig.industry || 'OTHER';

    const [terminology, navigation, dashboard, productFields] = await Promise.all([
      this.getTerminologyMap(tId, industryCode),
      this.getNavigation(tId, industryCode),
      this.getDashboardConfig(tId, industryCode),
      this.getEntityFields(tId, industryCode, 'PRODUCT')
    ]);

    return {
      ...baseConfig,
      terminology,
      navigation,
      dashboard,
      entityConfigs: {
        PRODUCT: productFields
      }
    };
  }
}

export default DynamicConfigService;
