import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Professional confirmation dialog for destructive actions.
 * Use for: Delete, Approve, Reject, Archive, Restore.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isLoading) {
      onCancel();
    }
  };

  const variantStyles = {
    danger: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      iconBg: "#fef2f2",
      iconBorder: "#fecaca",
      buttonBg: "#ef4444",
      buttonHover: "#dc2626",
    },
    warning: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      iconBg: "#fffbeb",
      iconBorder: "#fde68a",
      buttonBg: "#f59e0b",
      buttonHover: "#d97706",
    },
    info: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      iconBg: "#eff6ff",
      iconBorder: "#bfdbfe",
      buttonBg: "#3b82f6",
      buttonHover: "#2563eb",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={!isLoading ? onCancel : undefined}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        animation: "confirmFadeIn 0.2s ease-out",
      }}
    >
      <div
        className="confirm-dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "confirmSlideIn 0.2s ease-out",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: style.iconBg,
            border: `1px solid ${style.iconBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          {style.icon}
        </div>

        {/* Title */}
        <h3
          id="confirm-dialog-title"
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          style={{
            margin: "0 0 24px",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: "1.6",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s ease",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: style.buttonBg,
              color: "white",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s ease",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoading && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="31.4"
                  strokeDashoffset="10"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .dark .confirm-dialog-content {
          background-color: #1f2937 !important;
        }
        .dark .confirm-dialog-content h3 {
          color: #f9fafb !important;
        }
        .dark .confirm-dialog-content p {
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
