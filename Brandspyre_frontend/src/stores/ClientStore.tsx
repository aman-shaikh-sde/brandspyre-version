import { apiClient } from "src/services/apiClient";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_URL } from "~/constants/api";

const useClientStore = create(
  persist(
    (set) => ({
      clients: [],
      clientscodeOptions: [],
      isLoading: false,
      error: null,
      fetchClients: async (token) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get(
            `/client/overview/read?limit=1000`
          );
          console.log("responseeeclientzustandd", response);
          const clients = response?.data?.data || [];

          const clientscodeOptions = [
            ...new Set(
              clients.map((client) =>
                JSON.stringify({
                  value: client.client_code,
                  label: client.client_name,
                })
              )
            ),
          ].map((str) => JSON.parse(str));
          console.log("zustandclienttt",clients,clientscodeOptions)
          set({
            clients,
            clientscodeOptions,
          });
        } catch (error) {
          set({ error, isLoading: false });
        }
      },
    }),
    { name: "client-storage" }
  )
);
export default useClientStore;
