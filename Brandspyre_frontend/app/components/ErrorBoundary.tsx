import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Global Error Boundary
 * Catches unexpected React rendering errors and shows a friendly fallback UI.
 * Prevents the entire app from crashing and provides recovery actions.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log error to console for easy diagnosis in DevTools
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    window.history.back();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("Branch-storage");
      localStorage.removeItem("employee-storage");
      localStorage.removeItem("role-storage");
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    window.location.reload();
  };

  handleCopyError = () => {
    const errorText = [
      `URL: ${window.location.href}`,
      `Error: ${this.state.error?.name || "Error"}: ${this.state.error?.message || "Unknown error"}`,
      `Stack: ${this.state.error?.stack || "No stack"}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || "No component stack"}`,
    ].join("\n\n");

    navigator.clipboard.writeText(errorText).then(() => {
      alert("Error report copied to clipboard!");
    }).catch(() => {
      // Fallback
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            fontFamily: "'Inter', sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "40px 32px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              border: "1px solid #f3f4f6",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                border: "2px solid #fecaca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "32px",
              }}
            >
              😵
            </div>

            {/* Title */}
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "26px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Oops!
            </h1>

            {/* Subtitle */}
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "15px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Something unexpected happened. Don't worry, your data is safe.
            </p>

            {/* Collapsible Details */}
            {this.state.error && (
              <div style={{ marginBottom: "20px" }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginBottom: "8px",
                  }}
                >
                  {this.state.showDetails ? "Hide Error Details ▲" : "Show Error Details ▼"}
                </button>

                {this.state.showDetails && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "12px 14px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "10px",
                      border: "1px solid #fecaca",
                      textAlign: "left",
                      fontSize: "11px",
                      color: "#991b1b",
                      fontFamily: "monospace",
                      maxHeight: "160px",
                      overflow: "auto",
                      wordBreak: "break-word",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "10px", opacity: 0.85 }}>
                        {this.state.error.stack}
                      </pre>
                    )}
                    <button
                      type="button"
                      onClick={this.handleCopyError}
                      style={{
                        marginTop: "8px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: 600,
                        backgroundColor: "#b91c1c",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Copy Error Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={this.handleGoBack}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                ← Go Back
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                title="Clears cached filter states and reloads"
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                  color: "#4b5563",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Reset Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
