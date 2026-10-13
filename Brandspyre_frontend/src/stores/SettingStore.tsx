import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchSettings } from "src/services/settingStore";
import { storeSettings } from "src/services/settingStore";
export interface Permission {
  all: boolean;
  own: boolean;
  edit: boolean;
  create: boolean;
  delete?: boolean;
}
export interface Setting {
  id: number;
  branch_id: number;
  role: string;
  project: Permission;
  task: Permission;
  milestone: Permission;
  teammembers: Permission;
  branches: Permission;
  invoices: Permission;
  campaign: Permission;
  leads: Permission;
  client: Permission;
  followingrecords: Permission;
  profile: Permission;
  event: Permission;
  announcement: Permission;
  subscription: Permission;
  financial: Permission;
  roles: Permission;
  tax: Permission;
  payment: Permission;
  calendar: Permission;
  notification: Permission;
  reminder: Permission;
  reportanalysis: Permission;
  activitylog: Permission;
  mom: Permission;
  userinfo: Permission;
  salary: Permission;
  leaverequest: Permission;
  leaveapproved: Permission;
  employeereport: Permission;
  document: Permission;
  shareddocument: Permission;
  fileupload: Permission;
  create_datetime: string;
  last_update_datetime: string;
}

interface SettingState {
  settings: Setting[] | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  clearSettings: () => void;
  getCurrentRoleSettings: () => Setting | null;
}
export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      settings: null,
      loading: false,
      error: null,

      fetchSettings: async () => {
        set({ loading: true, error: null });
        try {
          const settings = await fetchSettings();
          set({ settings, loading: false });
          storeSettings(settings);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch settings",
            loading: false,
          });
        }
      },
      clearSettings: () => {
        set({ settings: null });
        localStorage.removeItem("app_permissions");
      },
      getCurrentRoleSettings: () => {
        const { settings } = get();
        if (!settings || settings.length === 0) return null;
        return settings[1];
      },
    }),
    {
      name: "setting-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
