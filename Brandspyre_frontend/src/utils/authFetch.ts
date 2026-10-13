import { useAuthStore } from "src/stores/authStore";

export const getAuthHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const state = useAuthStore.getState();
  const token = state.accessToken;
  const tenantId = state.tenantId;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }

  return headers;
};

export const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = getAuthHeaders(init?.headers as Record<string, string> | undefined);
  return fetch(input, {
    ...init,
    headers,
  });
};

export default authFetch;
