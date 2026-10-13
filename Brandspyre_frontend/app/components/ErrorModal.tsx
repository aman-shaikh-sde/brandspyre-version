import React from "react";

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  errors: string[];
  onClose: () => void;
}

/**
 * Error Modal for displaying multiple validation errors.
 * Use when backend returns multiple field errors instead of creating 15 toasts.
 */
const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title = "Unable to Save",
  errors,
  onClose,
}) => {
  if (!isOpen || errors.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="error-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        animation: "errorModalFadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "480px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "errorModalSlideIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3
            id="error-modal-title"
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "8px",
              color: "#9ca3af",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#6b7280",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Please resolve the following issues:
        </p>

        {/* Error List */}
        <ul
          style={{
            margin: "0 0 24px",
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            listStyle: "none",
          }}
        >
          {errors.map((error, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "14px",
                color: "#991b1b",
                fontFamily: "'Inter', sans-serif",
                lineHeight: "1.5",
                marginBottom: index < errors.length - 1 ? "8px" : 0,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: "2px" }}>•</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>

        {/* Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#3b82f6",
              color: "white",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            Understood
          </button>
        </div>
      </div>

      <style>{`
        @keyframes errorModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes errorModalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;
