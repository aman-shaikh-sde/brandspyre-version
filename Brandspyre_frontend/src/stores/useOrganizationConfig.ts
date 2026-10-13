import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from "src/services/apiClient";
import { normalizeModule } from '../utils/moduleRegistry';

export interface SubscriptionInfo {
  planCode: string;
  planName: string;
  status: string;
  endDate?: string;
}

export interface TerminologyItem {
  label: string;
  plural_label: string;
  field_labels?: Record<string, string>;
}

export interface OrganizationConfigState {
  tenantId: string | null;
  companyName: string | null;
  industry: string | null;
  enabledModules: string[];
  enabledFeatures: string[];
  permissions: string[];
  subscription: SubscriptionInfo | null;
  terminology: Record<string, TerminologyItem>;
  navigation: any[];
  dashboard: { title: string; widgets: any[] } | null;
  entityConfigs: Record<string, any[]>;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConfig: () => Promise<void>;
  hasModule: (moduleCode: string) => boolean;
  hasFeature: (featureCode: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  getTerminology: (entityType: string, defaultLabel?: string) => { label: string; plural_label: string };
  getEntityFields: (entityType: string) => any[];
  invalidate: () => void;
  reset: () => void;
}

export const useOrganizationConfig = create<OrganizationConfigState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      companyName: null,
      industry: null,
      enabledModules: [
        'DASHBOARD',
        'ORGANIZATION',
        'NOTIFICATIONS',
        'CRM',
        'CLIENTS',
        'PROJECTS',
        'HRMS',
        'FINANCE',
        'MEETINGS',
        'AI_ASSISTANT',
        'BILLING',
        'LEAD_EXCHANGE',
        'DOCUMENTS',
        'REPORTS'
      ], // Default full baseline before initial fetch
      enabledFeatures: [],
      permissions: [],
      subscription: null,
      terminology: {},
      navigation: [],
      dashboard: null,
      entityConfigs: {},
      isLoaded: false,
      isLoading: false,
      error: null,

      fetchConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          // Try consolidated dynamic config endpoint first
          let res = await apiClient.get('/config/organization');
          if (!res.data?.success || !res.data?.data) {
            res = await apiClient.get('/organization/config');
          }

          if (res.data?.success && res.data?.data) {
            const d = res.data.data;
            set({
              tenantId: d.tenantId || null,
              companyName: d.companyName || null,
              industry: d.industry || 'OTHER',
              enabledModules: Array.isArray(d.enabledModules) ? d.enabledModules : [],
              enabledFeatures: Array.isArray(d.enabledFeatures) ? d.enabledFeatures : [],
              permissions: Array.isArray(d.permissions) ? d.permissions : [],
              subscription: d.subscription || null,
              terminology: d.terminology || {},
              navigation: Array.isArray(d.navigation) ? d.navigation : [],
              dashboard: d.dashboard || null,
              entityConfigs: d.entityConfigs || {},
              isLoaded: true,
              isLoading: false,
              error: null
            });
          } else {
            set({ isLoading: false, error: 'Invalid config response' });
          }
        } catch (err: any) {
          console.warn('Failed to fetch organization config:', err?.response?.data?.error || err.message);
          set({ isLoading: false, error: err?.response?.data?.error || err.message });
        }
      },

      hasModule: (moduleCode: string): boolean => {
        if (!moduleCode) return true;
        const canonical = normalizeModule(moduleCode);
        // Core modules are always enabled
        if (['DASHBOARD', 'ORGANIZATION', 'NOTIFICATIONS'].includes(canonical)) return true;
        const enabled = get().enabledModules.map(m => normalizeModule(m));
        return enabled.includes(canonical);
      },

      hasFeature: (featureCode: string): boolean => {
        if (!featureCode) return true;
        return get().enabledFeatures.includes(featureCode.toUpperCase());
      },

      hasPermission: (permissionCode: string): boolean => {
        if (!permissionCode) return true;
        const state = get();
        if (state.permissions.includes('*') || state.permissions.includes(permissionCode)) {
          return true;
        }
        return false;
      },

      getTerminology: (entityType: string, defaultLabel?: string): { label: string; plural_label: string } => {
        const entityUpper = entityType.toUpperCase();
        const term = get().terminology[entityUpper];
        if (term && term.label) {
          return { label: term.label, plural_label: term.plural_label || `${term.label}s` };
        }
        const fallback = defaultLabel || entityType;
        return { label: fallback, plural_label: `${fallback}s` };
      },

      getEntityFields: (entityType: string): any[] => {
        const entityUpper = entityType.toUpperCase();
        return get().entityConfigs[entityUpper] || [];
      },

      invalidate: () => {
        set({ isLoaded: false });
        get().fetchConfig();
      },

      reset: () => {
        set({
          tenantId: null,
          companyName: null,
          industry: null,
          enabledModules: [
            'DASHBOARD',
            'ORGANIZATION',
            'NOTIFICATIONS',
            'CRM',
            'CLIENTS',
            'PROJECTS',
            'HRMS',
            'FINANCE',
            'MEETINGS',
            'AI_ASSISTANT',
            'BILLING',
            'LEAD_EXCHANGE',
            'DOCUMENTS',
            'REPORTS'
          ],
          enabledFeatures: [],
          permissions: [],
          subscription: null,
          terminology: {},
          navigation: [],
          dashboard: null,
          entityConfigs: {},
          isLoaded: false,
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'org-config-storage-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tenantId: state.tenantId,
        companyName: state.companyName,
        industry: state.industry,
        enabledModules: state.enabledModules,
        enabledFeatures: state.enabledFeatures,
        subscription: state.subscription,
        isLoaded: state.isLoaded
      })
    }
  )
);

// Helper Hooks
export const useHasModule = (moduleCode: string): boolean => {
  return useOrganizationConfig((state) => state.hasModule(moduleCode));
};

export const useHasFeature = (featureCode: string): boolean => {
  return useOrganizationConfig((state) => state.hasFeature(featureCode));
};

export const useHasPermission = (permissionCode: string): boolean => {
  return useOrganizationConfig((state) => state.hasPermission(permissionCode));
};

export default useOrganizationConfig;
