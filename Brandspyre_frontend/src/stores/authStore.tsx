import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BASE_URL } from "../../app/constants/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  accessToken: string | null;
  isActive: boolean;
  isLoggedIn: boolean;
  permissions: any;
  role: string | null;
  branchcode: string | null;
  staff_id: string | null;
  tenantId: string | null;
  hydrated: boolean;
  onboardingComplete: boolean | null; // null = not yet checked
  authStatus: AuthStatus;
  authInitialized: boolean;
  setAuthData: (data: any) => void;
  clearAuthData: () => void;
  logout: () => Promise<void>;
  setHydrated: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  refreshAuth: (force?: boolean) => Promise<boolean>;
  bootstrapAuth: () => Promise<void>;
}

let activeRefreshPromise: Promise<boolean> | null = null;
let activeBootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      isActive: false,
      isLoggedIn: false,
      permissions: null,
      role: null,
      branchcode: null,
      staff_id: null,
      tenantId: null,
      hydrated: false,
      onboardingComplete: null,
      authStatus: "loading",
      authInitialized: false,

      setAuthData: (data: any) =>
        set({
          accessToken: data.accessToken ?? null,
          isActive: data.isActive ?? false,
          isLoggedIn: true,
          permissions: data.permissions ?? null,
          role: data.role ?? null,
          branchcode: data.branchcode ?? null,
          staff_id: data.staff_id ?? null,
          tenantId: data.tenantId ?? null,
          authStatus: "authenticated",
          authInitialized: true,
        }),

      clearAuthData: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tenantId");
          localStorage.removeItem("tenant_id");
          localStorage.removeItem("x-tenant-id");
          localStorage.removeItem("app_permissions");
          localStorage.removeItem("auth-storage-v2");
          sessionStorage.removeItem("auth-storage-v2");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("tenantId");
        }
        set({
          accessToken: null,
          isActive: false,
          isLoggedIn: false,
          permissions: null,
          role: null,
          branchcode: null,
          staff_id: null,
          tenantId: null,
          onboardingComplete: null,
          authStatus: "unauthenticated",
          authInitialized: true,
        });
      },

      logout: async () => {
        try {
          await fetch(`${BASE_URL}/saas/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
        } catch (e) {}
        get().clearAuthData();
      },

      setHydrated: (value: boolean) => set({ hydrated: value }),

      setOnboardingComplete: (value: boolean) => set({ onboardingComplete: value }),

      refreshAuth: async (force: boolean = false): Promise<boolean> => {
        const state = get();

        // If not logged in, no access token, and not explicitly forcing bootstrap, return false
        if (!state.isLoggedIn && !state.accessToken && !force) {
          set({ authStatus: "unauthenticated", authInitialized: true });
          return false;
        }

        // Return ongoing refresh promise if one is already in flight (mutex)
        if (activeRefreshPromise) {
          return activeRefreshPromise;
        }

        activeRefreshPromise = (async () => {
          try {
            const endpoint = `${BASE_URL}/saas/auth/refresh-token`;
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
              credentials: "include",
            });

            if (!response.ok) {
              if (response.status === 429) {
                console.warn("[AuthStore] Token refresh rate-limited (429). Retaining session state.");
                return false;
              }
              get().clearAuthData();
              return false;
            }

            const data = await response.json();
            const newAccessToken = data.accessToken || data.tokens?.accessToken;

            if (!newAccessToken) {
              get().clearAuthData();
              return false;
            }

            const userData = data.user;

            set({
              accessToken: newAccessToken,
              isLoggedIn: true,
              isActive: true,
              authStatus: "authenticated",
              authInitialized: true,
              ...(userData?.role ? { role: userData.role } : {}),
              ...(userData?.tenantId ? { tenantId: userData.tenantId } : {}),
              ...(userData?.branchcode ? { branchcode: userData.branchcode } : {}),
              ...(userData?.id ? { staff_id: userData.id } : {}),
            });

            return true;
          } catch (err) {
            get().clearAuthData();
            return false;
          } finally {
            activeRefreshPromise = null;
          }
        })();

        return activeRefreshPromise;
      },

      bootstrapAuth: async (): Promise<void> => {
        // Mutex to ensure single execution
        if (activeBootstrapPromise) {
          return activeBootstrapPromise;
        }

        activeBootstrapPromise = (async () => {
          try {
            const state = get();
            // If already fully authenticated with valid memory token
            if (state.accessToken && state.isLoggedIn) {
              set({ authStatus: "authenticated", authInitialized: true });
              return;
            }

            // Attempt silent restoration via HttpOnly refresh cookie
            set({ authStatus: "loading" });
            const success = await get().refreshAuth(true);
            if (!success) {
              set({ authStatus: "unauthenticated", authInitialized: true });
            }
          } catch (e) {
            set({ authStatus: "unauthenticated", authInitialized: true });
          } finally {
            // Keep bootstrap marked as initialized
            set({ authInitialized: true });
          }
        })();

        return activeBootstrapPromise;
      },
    }),

    {
      name: "auth-storage-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Tokens are in-memory only (accessToken) and HttpOnly cookie (refreshToken)
        // Never persist tokens in localStorage
        isActive: state.isActive,
        isLoggedIn: state.isLoggedIn,
        permissions: state.permissions,
        role: state.role,
        branchcode: state.branchcode,
        staff_id: state.staff_id,
        tenantId: state.tenantId,
        onboardingComplete: state.onboardingComplete,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Cross-tab synchronization: clear auth state in other tabs when logged out
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "auth-storage-v2" && !event.newValue) {
      useAuthStore.getState().clearAuthData();
    }
  });
}
