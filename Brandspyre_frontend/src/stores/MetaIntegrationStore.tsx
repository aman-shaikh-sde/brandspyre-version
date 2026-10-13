import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "src/services/apiClient";

interface MetaIntegrationState {
  isConnected: boolean;
  connectionStatus: string;
  tokenStatus: string;
  connectedBusinesses: any[];
  connectedAdAccounts: any[];
  connectedPages: any[];
  connectedInstagram: any[];
  connectedWhatsApp: any[];
  availableForms: any[];
  enabledForms: any[];
  campaigns: any[];
  adSets: any[];
  ads: any[];
  analyticsData: any;
  syncStats: any;
  syncLogs: any[];
  assetsSummary: any;
  platformAdminHealth: any;
  isLoading: boolean;
  error: string | null;
  metaCredentials: {
    meta_app_id: string;
    meta_app_secret: string;
    meta_api_version: string;
  } | null;

  // Actions
  saveMetaCredentials: (credentials: any) => Promise<void>;
  connectMetaAccount: (credentials?: any) => Promise<any>;
  disconnectMetaAccount: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  syncAssets: () => Promise<void>;
  fetchBusinesses: () => Promise<void>;
  fetchAdAccounts: () => Promise<void>;
  fetchPages: (refresh?: boolean) => Promise<void>;
  fetchInstagram: () => Promise<void>;
  fetchWhatsApp: () => Promise<void>;
  fetchForms: (pageId: string) => Promise<void>;
  toggleForm: (data: any) => Promise<void>;
  updateConfig: (data: any) => Promise<void>;
  fetchCampaigns: (refresh?: boolean) => Promise<void>;
  createCampaign: (data: any) => Promise<any>;
  pauseCampaign: (id: string) => Promise<void>;
  resumeCampaign: (id: string) => Promise<void>;
  syncCampaigns: () => Promise<void>;
  fetchAdSets: (campaignId?: string) => Promise<void>;
  createAdSet: (data: any) => Promise<any>;
  fetchAds: (adSetId?: string, campaignId?: string) => Promise<void>;
  createAd: (data: any) => Promise<any>;
  fetchAnalytics: () => Promise<void>;
  fetchSyncStats: () => Promise<void>;
  fetchSyncLogs: () => Promise<void>;
  fetchPlatformAdminHealth: () => Promise<void>;
  clearError: () => void;
}

const useMetaIntegrationStore = create<MetaIntegrationState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      connectionStatus: "disconnected",
      tokenStatus: "valid",
      connectedBusinesses: [],
      connectedAdAccounts: [],
      connectedPages: [],
      connectedInstagram: [],
      connectedWhatsApp: [],
      availableForms: [],
      enabledForms: [],
      campaigns: [],
      adSets: [],
      ads: [],
      analyticsData: null,
      syncStats: null,
      syncLogs: [],
      assetsSummary: null,
      platformAdminHealth: null,
      isLoading: false,
      error: null,
      metaCredentials: null,

      saveMetaCredentials: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/config", credentials);
          set({ metaCredentials: credentials, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to save credentials";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      connectMetaAccount: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post("/meta/oauth/connect", credentials || {});
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to connect";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      disconnectMetaAccount: async () => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/disconnect", {});
          set({
            isConnected: false,
            connectionStatus: "disconnected",
            tokenStatus: "valid",
            connectedBusinesses: [],
            connectedAdAccounts: [],
            connectedPages: [],
            connectedInstagram: [],
            connectedWhatsApp: [],
            availableForms: [],
            enabledForms: [],
            campaigns: [],
            adSets: [],
            ads: [],
            analyticsData: null,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to disconnect";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchConfig: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/config");
          const config = response.data?.data || {};

          set({
            isConnected: !!config.is_connected,
            connectionStatus: config.connection_status || "disconnected",
            tokenStatus: config.token_status || "valid",
            enabledForms: Array.isArray(config.enabled_forms) ? config.enabled_forms : [],
            assetsSummary: config.assets_summary || null,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to fetch config";
          set({ error: message, isLoading: false });
        }
      },

      syncAssets: async () => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/sync/assets", {});
          const { fetchPages, fetchBusinesses, fetchAdAccounts, fetchInstagram, fetchWhatsApp, fetchConfig } = get();
          await Promise.all([
            fetchPages(),
            fetchBusinesses(),
            fetchAdAccounts(),
            fetchInstagram(),
            fetchWhatsApp(),
            fetchConfig(),
          ]);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to sync assets";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchBusinesses: async () => {
        try {
          const response = await apiClient.get("/meta/businesses");
          set({ connectedBusinesses: Array.isArray(response.data?.data) ? response.data.data : [] });
        } catch (error: any) {
          console.warn("fetchBusinesses notice:", error.message);
        }
      },

      fetchAdAccounts: async () => {
        try {
          const response = await apiClient.get("/meta/ad-accounts");
          set({ connectedAdAccounts: Array.isArray(response.data?.data) ? response.data.data : [] });
        } catch (error: any) {
          console.warn("fetchAdAccounts notice:", error.message);
        }
      },

      fetchPages: async (refresh = false) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/pages", { params: { refresh: refresh ? "true" : undefined } });
          set({ connectedPages: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to fetch pages";
          set({ error: message, isLoading: false });
        }
      },

      fetchInstagram: async () => {
        try {
          const response = await apiClient.get("/meta/instagram");
          set({ connectedInstagram: Array.isArray(response.data?.data) ? response.data.data : [] });
        } catch (error: any) {
          console.warn("fetchInstagram notice:", error.message);
        }
      },

      fetchWhatsApp: async () => {
        try {
          const response = await apiClient.get("/meta/whatsapp");
          set({ connectedWhatsApp: Array.isArray(response.data?.data) ? response.data.data : [] });
        } catch (error: any) {
          console.warn("fetchWhatsApp notice:", error.message);
        }
      },

      fetchForms: async (pageId: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/forms", { params: { pageId } });
          set({ availableForms: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to fetch forms";
          set({ error: message, isLoading: false });
        }
      },

      toggleForm: async (data: any) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/forms/toggle", data);
          if (data.pageId) {
            const { fetchForms } = get();
            await fetchForms(data.pageId);
          }
          const { fetchConfig } = get();
          await fetchConfig();
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to update form";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      updateConfig: async (data: any) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/config", data);
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to update config";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchCampaigns: async (refresh = false) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/campaigns", {
            params: { refresh: refresh ? "true" : undefined },
          });
          set({ campaigns: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to fetch campaigns";
          set({ error: message, isLoading: false });
        }
      },

      createCampaign: async (data: any) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post("/meta/campaigns", data);
          const { fetchCampaigns } = get();
          await fetchCampaigns();
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to create campaign";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      pauseCampaign: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post(`/meta/campaigns/${id}/pause`, {});
          const { fetchCampaigns } = get();
          await fetchCampaigns();
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to pause campaign";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      resumeCampaign: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post(`/meta/campaigns/${id}/resume`, {});
          const { fetchCampaigns } = get();
          await fetchCampaigns();
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to resume campaign";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      syncCampaigns: async () => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post("/meta/campaigns/sync", {});
          const { fetchCampaigns } = get();
          await fetchCampaigns();
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to sync campaigns";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchAdSets: async (campaignId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/ad-sets", { params: { campaign_id: campaignId } });
          set({ adSets: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          console.warn("fetchAdSets notice:", error.message);
          set({ isLoading: false });
        }
      },

      createAdSet: async (data: any) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post("/meta/ad-sets", data);
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to create ad set";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchAds: async (adSetId, campaignId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/ads", {
            params: { ad_set_id: adSetId, campaign_id: campaignId },
          });
          set({ ads: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          console.warn("fetchAds notice:", error.message);
          set({ isLoading: false });
        }
      },

      createAd: async (data: any) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.post("/meta/ads", data);
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || "Failed to create ad";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      fetchAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/analytics");
          set({ analyticsData: response.data?.data || null, isLoading: false });
        } catch (error: any) {
          console.warn("fetchAnalytics notice:", error.message);
          set({ isLoading: false });
        }
      },

      fetchSyncStats: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/sync/stats");
          set({ syncStats: response.data?.data || null, isLoading: false });
        } catch (error: any) {
          console.warn("fetchSyncStats notice:", error.message);
          set({ isLoading: false });
        }
      },

      fetchSyncLogs: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/sync/logs", { params: { limit: 50 } });
          set({ syncLogs: Array.isArray(response.data?.data) ? response.data.data : [], isLoading: false });
        } catch (error: any) {
          console.warn("fetchSyncLogs notice:", error.message);
          set({ isLoading: false });
        }
      },

      fetchPlatformAdminHealth: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get("/meta/admin/health");
          set({ platformAdminHealth: response.data?.data || null, isLoading: false });
        } catch (error: any) {
          console.warn("fetchPlatformAdminHealth notice:", error.message);
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "meta-integration-storage",
      partialize: (state) => ({
        isConnected: state.isConnected,
        connectionStatus: state.connectionStatus,
      }),
    }
  )
);

export default useMetaIntegrationStore;
