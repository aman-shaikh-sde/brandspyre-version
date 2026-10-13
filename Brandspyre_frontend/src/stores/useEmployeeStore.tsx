import { apiClient } from "src/services/apiClient";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_URL } from "~/constants/api";

const useEmployeeStore = create(
  persist(
    (set) => ({
      employee: [],
      roleOptions: [],
      branchEmployee: [],
      branchEmployeeOptions: [],
      allEmployeecodeOptions: [],
      isLoading: false,
      error: null,
      fetchEmployee: async (token?: string) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get(`/users/read?limit=1000`);
          const raw = response?.data;
          const employee: any[] = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.result)
            ? raw.result
            : Array.isArray(raw)
            ? raw
            : [];

          const allEmployeecodeOptions = [
            ...new Set(
              employee
                .filter((emp: any) => emp?.staff_id)
                .map((emp: any) =>
                  JSON.stringify({
                    value: emp.staff_id,
                    label: `${emp.firstname || ""} - ${emp.role || ""}`.trim(),
                  })
                )
            ),
          ].map((str: string) => JSON.parse(str));

          const roleOptions = [
            ...new Set(employee.map((b: any) => b?.role).filter(Boolean)),
          ].map((role: any) => ({
            value: role,
            label: role,
          }));

          set({
            employee,
            roleOptions: [{ value: "", label: "All Roles" }, ...roleOptions],
            isLoading: false,
            allEmployeecodeOptions,
          });
        } catch (error) {
          set({ error, isLoading: false, employee: [], roleOptions: [] });
        }
      },

      fetchBranchEmployee: async (token, branchcode) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get(
            `/users/read?branchcode=${branchcode}&limit=1000`
          );

          console.log("API Response:", response.data); // Debug log

          // Check if data is in response.data.data or response.data.result
          const branchEmployee =
            response.data.data || response.data.result || [];
          console.log("Raw employee data:", branchEmployee); // Debug log

          // Create unique options using Set
          const branchEmployeeOptions = [
            ...new Set(
              branchEmployee.map((employee) =>
                JSON.stringify({
                  value: employee.staff_id,
                  label: `${employee.firstname} - ${employee.role}`,
                })
              )
            ),
          ].map((str) => JSON.parse(str));

          console.log("Processed options:", branchEmployeeOptions); // Debug log

          set({
            branchEmployee,
            branchEmployeeOptions,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error fetching branch employees:", error);
          set({ error, isLoading: false });
        }
      },
    }),
    {
      name: "employee-storage",
    }
  )
);
export default useEmployeeStore;
