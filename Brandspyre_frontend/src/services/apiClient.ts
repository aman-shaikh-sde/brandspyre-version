import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "../stores/authStore";
import { BASE_URL } from "~/constants/api";
import { notify } from "../../app/services/notificationService";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

import { isPlatformAdminRole } from "../utils/roleUtils";

// Dynamic request interceptor to attach JWT token and tenant context
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token: string | null = null;
    let tenantId: string | null = null;
    let role: string | null = null;

    try {
      const authState = useAuthStore.getState();
      token = authState?.accessToken || null;
      tenantId = authState?.tenantId || null;
      role = authState?.role || null;
    } catch (err) {
      // Zustand store fallback
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only attach x-tenant-id header if user is a platform admin selecting a tenant
    // Normal tenant users derive tenancy authoritatively from their authenticated session
    if (tenantId && isPlatformAdminRole(role)) {
      config.headers["x-tenant-id"] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with mutex queue on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; skipGlobalToast?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints themselves (e.g. login, refresh-token)
    const isAuthEndpoint = originalRequest.url?.includes("/auth/") || originalRequest.url?.includes("/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue the request until active refresh finishes
        return new Promise<any>((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await useAuthStore.getState().refreshAuth();
        if (refreshed) {
          const newToken = useAuthStore.getState().accessToken;
          if (newToken) {
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
        processQueue(new Error("Refresh failed"), null);
        useAuthStore.getState().clearAuthData();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearAuthData();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Centralized error notifications for non-401 requests unless opted out
    if (error.response?.status !== 401 && !originalRequest.skipGlobalToast) {
      try {
        notify.apiError(error);
      } catch (notifyErr) {
        // Safe fallback
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
