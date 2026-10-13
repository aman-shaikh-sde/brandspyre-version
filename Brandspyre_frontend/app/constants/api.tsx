export const BASE_URL = (() => {
  const rawUrl = import.meta.env.VITE_API_URL;
  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim() !== "") {
    return rawUrl.trim().replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:3000/api";
  }
  const errorMsg = "CRITICAL CONFIGURATION ERROR: VITE_API_URL environment variable is missing. Production frontend cannot connect to backend.";
  console.error(`[Brandspyre Config] ⚠️ ${errorMsg}`);
  return "";
})();

export const SOCKET_URL = (() => {
  const rawSocket = import.meta.env.VITE_SOCKET_URL;
  if (rawSocket && typeof rawSocket === "string" && rawSocket.trim() !== "") {
    return rawSocket.trim().replace(/\/+$/, "");
  }
  // Fallback to BASE_URL stripped of /api
  return BASE_URL.replace(/\/api\/?$/, "");
})();


// Legacy toast exports kept for backwards compatibility (deprecated)
// These are no longer used - notifications go through notificationService
export const toastposition = "top-right";
export const toastStyle = {
  style: {
    border: "1px solid #e5e7eb",
    padding: "14px 18px",
    maxWidth: "420px",
    borderRadius: "12px",
    color: "#374151",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
  },
  iconTheme: {
    primary: "#ef4444",
    secondary: "#fff",
  },
  className: "dark:bg-[#333] dark:text-white",
};