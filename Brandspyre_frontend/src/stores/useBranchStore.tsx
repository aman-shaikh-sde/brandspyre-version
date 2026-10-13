import { apiClient } from "src/services/apiClient";
import { Code } from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_URL } from "~/constants/api";

const useBranchStore = create(
  persist(
    (set) => ({
      branches: [],
      managerOptions: [],
      branchCodeOptions: [],
      roleOptions: [],
      isLoading: false,
      error: null,

      fetchBranches: async (token?: string) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get(`/branch/read`);

          const rawData = response?.data;
          const branches: any[] = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.data)
            ? rawData.data
            : [];

          const managerOptions = [
            ...new Set(branches.map((b: any) => b?.manager_id).filter(Boolean)),
          ].map((id) => ({
            value: id,
            label: id,
          }));

          const branchCodeOptions = [
            ...new Set(branches.map((b: any) => b?.branchcode).filter(Boolean)),
          ].map((code) => ({
            value: code,
            label: code,
          }));

          const roleOptions = [
            ...new Set(branches.map((r: any) => r?.role).filter(Boolean)),
          ].map((role) => ({
            value: role,
            label: role,
          }));

          set({
            branches,
            managerOptions: [
              { value: "", label: "All Managers" },
              ...managerOptions,
            ],
            branchCodeOptions: [
              { value: "", label: "All Branch Codes" },
              ...branchCodeOptions,
            ],
            roleOptions: [{ value: "", label: "All Role" }, ...roleOptions],
            isLoading: false,
          });
        } catch (error) {
          set({ error, isLoading: false, branches: [], branchCodeOptions: [], roleOptions: [] });
        }
      },
    }),
    {
      name: "Branch-storage",
    }
  )
);

export default useBranchStore;
