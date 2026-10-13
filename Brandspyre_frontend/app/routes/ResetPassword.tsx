import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { BrandLogo } from "~/components/public/BrandLogo";
import { IoIosArrowRoundForward } from "react-icons/io";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

const FloatingInput = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  showPasswordToggle = false,
  onTogglePassword,
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;
  const shouldFloatLabel = isFocused || hasValue;

  return (
    <div className="relative mt-6">
      <input
        id={id}
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-lg outline-none transition-all duration-200 ${
          disabled
            ? "border-gray-300 text-gray-400 cursor-not-allowed"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 focus:border-red-700 dark:focus:border-red-600 text-gray-900 dark:text-gray-100"
        } ${showPasswordToggle ? "pr-10" : ""}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 px-1 bg-white dark:bg-gray-800 transition-all duration-200 pointer-events-none ${
          shouldFloatLabel
            ? "text-red-700 dark:text-red-500 text-xs -translate-y-6 top-3 font-semibold"
            : "text-gray-500 text-sm top-3.5"
        }`}
      >
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {type === "password" ? <AiFillEye size={20} /> : <AiFillEyeInvisible size={20} />}
        </button>
      )}
    </div>
  );
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Purge any existing session when entering password reset
  useEffect(() => {
    useAuthStore.getState().clearAuthData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const activeToken = tokenFromUrl || token;

    if (!activeToken.trim()) {
      setError("Reset token is required.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/saas/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: activeToken.trim(), newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to reset password.");
      }

      // Explicitly purge all client-side authentication stores and local caches
      useAuthStore.getState().clearAuthData();
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
        sessionStorage.clear();
      }

      notify.success("Password reset successfully! Please sign in with your new password.");
      navigate("/login?reset=success", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 min-h-screen w-full bg-gray-100 dark:bg-gray-900 relative">
      {/* Top Floating Back to Home Button */}
      <div className="absolute top-4 left-4 z-40 sm:top-6 sm:left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-red-700 bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition backdrop-blur-xs group"
        >
          <ArrowLeft size={15} className="text-slate-500 group-hover:text-red-700 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="hidden sm:flex flex-col justify-center items-center p-8 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <BrandLogo size="xl" layout="stacked" />
          </div>
          <h1 className="text-3xl font-extrabold text-red-700 dark:text-red-600 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enterprise SaaS Multi-Tenant Security
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-12 bg-white dark:bg-gray-900">
        <div className="max-w-[400px] w-full mx-auto">
          <div className="text-center mb-6 flex flex-col items-center">
            <BrandLogo size="lg" subtitle="Unified Business OS" layout="stacked" className="mb-4" />
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-red-700 to-red-600 bg-clip-text">
              Set New Password
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter your new account password to complete reset
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            {tokenFromUrl ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Security Token Verified from Email Link</span>
              </div>
            ) : (
              <FloatingInput
                id="resetToken"
                name="token"
                value={token}
                onChange={e => setToken(e.target.value)}
                label="Reset Token"
                required
                disabled={loading}
              />
            )}

            <FloatingInput
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              label="New Password (Min 12 chars)"
              required
              disabled={loading}
              showPasswordToggle
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all font-semibold flex items-center justify-center gap-1"
            >
              {loading ? "Updating..." : "Update Password"} <IoIosArrowRoundForward size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
