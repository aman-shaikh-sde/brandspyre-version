/**
 * Enterprise Notification Service
 * 
 * Centralized notification management with:
 * - Deduplication (same message within 3s window)
 * - Queue management (max 2 visible at a time)
 * - Rate limiting (max 5 per 10s window)
 * - User-friendly HTTP error messages
 * - Backend message priority
 */
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  /** Duration in ms before auto-dismiss. Defaults based on type. */
  duration?: number;
  /** Unique ID to prevent duplicates manually */
  id?: string;
  /** Skip deduplication check */
  force?: boolean;
}

// ─── HTTP Status → User-Friendly Messages ───────────────────────────────────
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please review the entered information.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "Requested data could not be found.",
  409: "This record already exists.",
  422: "Validation failed. Please correct the highlighted fields.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again later.",
  502: "Server is temporarily unavailable. Please try again later.",
  503: "Service is under maintenance. Please try again shortly.",
  504: "Server is taking too long to respond. Please try again.",
};

// ─── Default Durations ───────────────────────────────────────────────────────
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 3000,
  error: 7000,
  warning: 5000,
  info: 4000,
};

// ─── Notification Service ────────────────────────────────────────────────────
class NotificationService {
  private recentMessages: Map<string, number> = new Map();
  private messageCount: number[] = [];
  private readonly DEDUP_WINDOW = 3000; // 3 seconds
  private readonly RATE_LIMIT = 5;
  private readonly RATE_WINDOW = 10000; // 10 seconds
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodically clean stale dedup entries
    if (typeof window !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW) {
        this.recentMessages.delete(key);
      }
    }
    this.messageCount = this.messageCount.filter(
      (t) => now - t < this.RATE_WINDOW
    );
  }

  /**
   * Generate a hash key for deduplication
   */
  private getMessageKey(message: string, type: NotificationType): string {
    return `${type}::${message.toLowerCase().trim()}`;
  }

  /**
   * Check if message is a duplicate (same content + type within dedup window)
   */
  private isDuplicate(message: string, type: NotificationType): boolean {
    const key = this.getMessageKey(message, type);
    const lastShown = this.recentMessages.get(key);
    if (lastShown && Date.now() - lastShown < this.DEDUP_WINDOW) {
      return true;
    }
    return false;
  }

  /**
   * Check rate limit
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    this.messageCount = this.messageCount.filter(
      (t) => now - t < this.RATE_WINDOW
    );
    return this.messageCount.length >= this.RATE_LIMIT;
  }

  /**
   * Record that a message was shown
   */
  private recordMessage(message: string, type: NotificationType) {
    const key = this.getMessageKey(message, type);
    this.recentMessages.set(key, Date.now());
    this.messageCount.push(Date.now());
  }

  /**
   * Core notification method
   */
  private notify(
    type: NotificationType,
    message: string,
    options: NotificationOptions = {}
  ): string | undefined {
    // SSR guard
    if (typeof window === "undefined") return undefined;

    // Skip empty messages
    if (!message || message.trim().length === 0) return undefined;

    // Deduplication check
    if (!options.force && this.isDuplicate(message, type)) {
      return undefined;
    }

    // Rate limiting check
    if (!options.force && this.isRateLimited()) {
      return undefined;
    }

    // Record the message
    this.recordMessage(message, type);

    const duration = options.duration || DEFAULT_DURATIONS[type];
    const toastId = options.id || undefined;

    // Use react-hot-toast as rendering engine with custom styling
    const toastOptions = {
      id: toastId,
      duration,
      position: "top-right" as const,
      style: {
        maxWidth: "420px",
        padding: "14px 18px",
        borderRadius: "12px",
        fontSize: "14px",
        lineHeight: "1.5",
        fontFamily: "'Inter', sans-serif",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        border: "1px solid",
        backdropFilter: "blur(8px)",
      },
    };

    switch (type) {
      case "success":
        return toast.success(message, {
          ...toastOptions,
          style: {
            ...toastOptions.style,
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
            color: "#166534",
          },
          iconTheme: { primary: "#22c55e", secondary: "#fff" },
        });

      case "error":
        return toast.error(message, {
          ...toastOptions,
          style: {
            ...toastOptions.style,
            background: "#fef2f2",
            borderColor: "#fecaca",
            color: "#991b1b",
          },
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
        });

      case "warning":
        return toast(message, {
          ...toastOptions,
          icon: "⚠️",
          style: {
            ...toastOptions.style,
            background: "#fffbeb",
            borderColor: "#fde68a",
            color: "#92400e",
          },
        });

      case "info":
        return toast(message, {
          ...toastOptions,
          icon: "ℹ️",
          style: {
            ...toastOptions.style,
            background: "#eff6ff",
            borderColor: "#bfdbfe",
            color: "#1e40af",
          },
        });
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  success(message: string, options?: NotificationOptions) {
    return this.notify("success", message, options);
  }

  error(message: string, options?: NotificationOptions) {
    return this.notify("error", message, options);
  }

  warning(message: string, options?: NotificationOptions) {
    return this.notify("warning", message, options);
  }

  info(message: string, options?: NotificationOptions) {
    return this.notify("info", message, options);
  }

  /**
   * Handle API errors with user-friendly messages.
   * Backend message takes priority over generic HTTP status messages.
   */
  apiError(error: any, fallbackMessage?: string): string | undefined {
    // Network error
    if (!error.response && error.message) {
      if (
        error.message.includes("Network Error") ||
        error.message.includes("ERR_NETWORK")
      ) {
        return this.error(
          "Unable to connect to the server. Check your internet connection."
        );
      }
      if (
        error.message.includes("timeout") ||
        error.code === "ECONNABORTED"
      ) {
        return this.error(
          "Server is taking too long to respond. Please try again."
        );
      }
    }

    const status = error.response?.status;
    const data = error.response?.data;

    // Backend message takes priority
    const backendMessage = data?.message || data?.error;
    if (backendMessage && typeof backendMessage === "string") {
      return this.error(backendMessage);
    }

    // Multiple validation errors → join them
    if (data?.errors && Array.isArray(data.errors)) {
      const messages = data.errors
        .map((e: any) => (typeof e === "string" ? e : e.message || e.msg))
        .filter(Boolean);
      if (messages.length > 0) {
        return this.error(messages.join("\n• "));
      }
    }

    // HTTP status code mapping
    if (status && HTTP_ERROR_MESSAGES[status]) {
      return this.error(HTTP_ERROR_MESSAGES[status]);
    }

    // Fallback
    return this.error(
      fallbackMessage || "An unexpected error occurred. Please try again."
    );
  }

  /**
   * Form validation summary toast.
   * Shows a single summary instead of per-field toasts.
   */
  formError(message?: string) {
    return this.warning(
      message || "Please correct the highlighted fields before submitting."
    );
  }

  /**
   * Dismiss all current notifications
   */
  dismissAll() {
    toast.dismiss();
  }

  /**
   * Dismiss a specific notification by ID
   */
  dismiss(id: string) {
    toast.dismiss(id);
  }
}

// Singleton instance
export const notify = new NotificationService();

// Default export for convenience
export default notify;
