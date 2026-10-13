import { create } from "zustand";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";

export interface MasterItem {
  _id: string;
  category: string;
  key: string;
  label: string;
  badgeColor?: string;
  icon?: string;
  sortOrder?: number;
  isSystem?: boolean;
  isActive?: boolean;
}

interface MasterState {
  mastersByCategory: Record<string, MasterItem[]>;
  categories: string[];
  isLoading: boolean;
  error: string | null;
  fetchMasters: (token: string, category?: string) => Promise<void>;
  fetchCategories: (token: string) => Promise<void>;
  getOptions: (category: string) => { value: string; label: string; badgeColor?: string; icon?: string }[];
}

export const useMasterStore = create<MasterState>((set, get) => ({
  mastersByCategory: {},
  categories: [],
  isLoading: false,
  error: null,

  fetchMasters: async (token: string, category?: string) => {
    try {
      set({ isLoading: true, error: null });
      const url = category
        ? `/masters?category=${encodeURIComponent(category)}`
        : `/masters`;

      const response = await apiClient.get(url);

      if (response.data && response.data.data) {
        const items: MasterItem[] = response.data.data;
        const grouped: Record<string, MasterItem[]> = { ...get().mastersByCategory };

        items.forEach((item) => {
          if (!grouped[item.category]) {
            grouped[item.category] = [];
          }
          if (!grouped[item.category].some((i) => i.key === item.key)) {
            grouped[item.category].push(item);
          }
        });

        set({ mastersByCategory: grouped, isLoading: false });
      }
    } catch (err: any) {
      console.error("Error fetching master data:", err);
      set({ error: err.message || "Failed to load master data", isLoading: false });
    }
  },

  fetchCategories: async (token: string) => {
    try {
      const response = await apiClient.get(`/masters/categories`);
      if (response.data && response.data.data) {
        set({ categories: response.data.data });
      }
    } catch (err) {
      console.error("Error fetching master categories:", err);
    }
  },

  getOptions: (category: string) => {
    const items = get().mastersByCategory[category] || [];
    return items
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        value: item.key,
        label: item.label,
        badgeColor: item.badgeColor,
        icon: item.icon,
      }));
  },
}));
