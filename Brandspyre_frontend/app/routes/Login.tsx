import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "src/services/apiClient";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuthStore } from "src/stores/authStore";
import { isPlatformAdminRole } from "src/utils/roleUtils";
import { getDefaultDashboardPath } from "src/utils/dashboardPaths";
import { BASE_URL } from "~/constants/api";
import { BrandLogo } from "~/components/public/BrandLogo";
import { IoIosArrowRoundForward } from "react-icons/io";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import {
  Loader2,
  Target,
  ShoppingCart,
  Users,
  Factory,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Mail,
  Clock,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<{
    required: boolean;
    challengeId: string;
    maskedEmail: string;
    expiresInSeconds: number;
    resendCooldownSeconds: number;
  } | null>(null);

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [expiryCountdown, setExpiryCountdown] = useState<number>(300);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const authStatus = useAuthStore((state) => state.authStatus);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete);

  const navigate = useNavigate();
  const location = useLocation();
  const BASE_SAAS_URL = `/saas/auth`;

  const searchParams = new URLSearchParams(location.search);
  const isResetSuccess = searchParams.get("reset") === "success";

  // Redirect already authenticated users away from /login
  useEffect(() => {
    // If arriving immediately after a password reset, force purge of any lingering session state
    if (isResetSuccess) {
      useAuthStore.getState().clearAuthData();
      return;
    }

    if (authStatus === "loading") return;

    if (authStatus === "authenticated" || (isLoggedIn && accessToken)) {
      const stateFrom = (location.state as any)?.from;
      const returnTo = searchParams.get("returnTo");
      const target =
        stateFrom && stateFrom.startsWith("/") && !stateFrom.startsWith("//") && stateFrom !== "/login"
          ? stateFrom
          : returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && returnTo !== "/login"
            ? returnTo
            : getDefaultDashboardPath(role);

      navigate(target, { replace: true });
    }
  }, [authStatus, isLoggedIn, accessToken, role, navigate, location, isResetSuccess]);

  // Countdown timer for MFA OTP expiration & resend cooldown
  useEffect(() => {
    if (!mfaChallenge?.required) return;

    const timer = setInterval(() => {
      setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [mfaChallenge?.required]);

  // Focus the first OTP input box when MFA screen opens
  useEffect(() => {
    if (mfaChallenge?.required) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mfaChallenge?.required]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Completes post-authentication routing and state persistence
   * Invoked after successful password login (no MFA) or after successful MFA OTP verification.
   */
  const handlePostAuthSuccess = async (loginData: any) => {
    const { accessToken } = loginData.tokens;
    const role = loginData.user?.role;
    const tenantId = loginData.user?.tenantId;
    const branchcode = loginData.user?.branchcode;

    // Persist initial auth state
    setAuthData({
      accessToken,
      role,
      branchcode,
      staff_id: loginData.user?.id,
      isActive: true,
      permissions: null,
      tenantId,
    });

    if (tenantId) {
      localStorage.setItem("tenant_id", String(tenantId));
    }
    if (loginData.user) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...loginData.user,
          tenant_id: tenantId,
          tenantId: tenantId,
        })
      );
    }

    // Platform Super Admin Redirect Check
    const userRoleStr = (role || loginData.user?.userRole || loginData.user?.role || "").toLowerCase();
    const isPlatformAdmin = isPlatformAdminRole(userRoleStr);

    if (isPlatformAdmin) {
      navigate("/admin/dashboard");
      return;
    }

    // Check workspaces
    try {
      const wsRes = await apiClient.get(`${BASE_SAAS_URL}/workspaces`);
      const workspaces = wsRes.data?.data || [];

      if (workspaces.length > 1) {
        navigate("/select-workspace");
        return;
      }
    } catch (wsErr) {
      console.warn("Workspace check skipped:", wsErr);
    }

    // Check onboarding status
    try {
      const onbRes = await apiClient.get(`/saas/onboarding/status`);
      const onbData = onbRes.data?.data;
      const completion = onbData?.completion_percentage ?? (onbData?.completed ? 100 : 0);
      const complete = completion >= 100;
      setOnboardingComplete(complete);

      if (!complete) {
        navigate("/onboarding");
        return;
      }
    } catch (onbErr) {
      console.warn("Onboarding status check skipped:", onbErr);
      setOnboardingComplete(true);
    }

    setOnboardingComplete(true);
    const stateFrom = (location.state as any)?.from;
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get("returnTo");
    const target =
      stateFrom && stateFrom.startsWith("/") && !stateFrom.startsWith("//") && stateFrom !== "/login"
        ? stateFrom
        : returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && returnTo !== "/login"
          ? returnTo
          : "/dashboard";
    navigate(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loginRes = await apiClient.post(
        `${BASE_SAAS_URL}/login`,
        { email: formData.email, password: formData.password },
        { headers: { "Content-Type": "application/json" } }
      );

      const loginData = loginRes.data;

      // Check if Multi-Factor Authentication is required
      if (loginData.mfaRequired) {
        setMfaChallenge({
          required: true,
          challengeId: loginData.challengeId,
          maskedEmail: loginData.maskedEmail || formData.email,
          expiresInSeconds: loginData.expiresInSeconds || 300,
          resendCooldownSeconds: loginData.resendCooldownSeconds || 60,
        });
        setOtpDigits(["", "", "", "", "", ""]);
        setMfaError(null);
        setResendSuccessMsg(null);
        setResendCooldown(loginData.resendCooldownSeconds || 60);
        setExpiryCountdown(loginData.expiresInSeconds || 300);
        return;
      }

      // Normal login without MFA
      await handlePostAuthSuccess(loginData);
    } catch (err: any) {
      console.error("Login failed:", err);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      const status = err.response?.status;

      if (serverMessage) {
        if (serverMessage.includes("SUBSCRIPTION_EXPIRED") || serverMessage.includes("TRIAL_EXPIRED")) {
          navigate(`/subscription-expired?reason=${encodeURIComponent(serverMessage)}`);
          return;
        }
        if (serverMessage.includes("PAYMENT_PENDING")) {
          navigate("/payment");
          return;
        }
        if (serverMessage.includes("ORGANIZATION_SUSPENDED")) {
          navigate(`/subscription-locked?reason=${encodeURIComponent(serverMessage)}`);
          return;
        }
      }

      if (status === 401) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (status === 403) {
        setError(serverMessage || "Your account has been deactivated or suspended. Please contact support.");
      } else if (status === 429) {
        setError("Too many login attempts. Please wait a few minutes before trying again.");
      } else if (serverMessage) {
        setError(serverMessage);
      } else {
        setError("Unable to connect to the authentication server. Please check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const char = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setMfaError(null);

    // Auto-advance to next input if digit entered
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    setMfaError(null);

    const targetIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length !== 6) {
      setMfaError("Please enter all 6 digits of the verification code.");
      return;
    }
    if (expiryCountdown <= 0) {
      setMfaError("This verification code has expired. Please request a new one.");
      return;
    }

    setMfaError(null);
    setResendSuccessMsg(null);
    setIsVerifyingOtp(true);

    try {
      const response = await apiClient.post(`${BASE_SAAS_URL}/mfa/verify`, {
        challengeId: mfaChallenge?.challengeId,
        otp: enteredOtp,
        device: navigator.userAgent,
      });

      if (response.data.success) {
        await handlePostAuthSuccess(response.data);
      } else {
        setMfaError(response.data.message || "Invalid verification code.");
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      const status = err.response?.status;
      if (status === 410) {
        setMfaError("The verification code has expired. Please request a new one.");
      } else if (status === 429) {
        setMfaError("Too many failed attempts. This challenge has been invalidated. Please request a new code.");
      } else if (serverMessage) {
        setMfaError(serverMessage);
      } else {
        setMfaError("Invalid verification code. Please check and try again.");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;

    setIsResendingOtp(true);
    setMfaError(null);
    setResendSuccessMsg(null);

    try {
      const response = await apiClient.post(`${BASE_SAAS_URL}/mfa/send`, {
        challengeId: mfaChallenge?.challengeId,
        email: formData.email,
      });

      if (response.data.success) {
        setMfaChallenge((prev) =>
          prev
            ? {
                ...prev,
                challengeId: response.data.challengeId || prev.challengeId,
              }
            : null
        );
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(response.data.resendCooldownSeconds || 60);
        setExpiryCountdown(response.data.expiresInSeconds || 300);
        setResendSuccessMsg("A fresh 6-digit code has been sent to your email.");
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      setMfaError(serverMessage || "Unable to resend verification code. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCancelMfa = () => {
    setMfaChallenge(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setMfaError(null);
    setResendSuccessMsg(null);
    setError(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 min-h-screen w-full bg-slate-100 font-sans relative">
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xs">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-red-700 h-12 w-12" />
            <p className="mt-3 text-slate-700 font-bold text-sm">Authenticating...</p>
          </div>
        </div>
      )}

      {/* LEFT HALF — Platform Information & Problems Solved */}
      <div className="hidden sm:flex flex-col justify-center p-8 sm:p-12 bg-slate-100 border-r border-slate-200 pt-16 sm:pt-12">
        <div className="max-w-lg w-full mx-auto space-y-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wider">
              BRANDSPYRE Business Platform
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              All-in-One Operations for Modern Businesses
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              BRANDSPYRE replaces disconnected tools by bringing CRM, Commerce, POS, HRMS, and Manufacturing into one unified cloud solution.
            </p>
          </div>

          {/* Solution Cards */}
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold flex-shrink-0 border border-red-100">
                <Target size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">CRM & Sales Pipelines</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track leads, convert deals, manage client profiles, and automate sales followups.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold flex-shrink-0 border border-red-100">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Retail POS & Inventory</h3>
                <p className="text-xs text-slate-500 mt-0.5">Multi-warehouse stock tracking, fast barcode checkout, purchase orders, and cash register sessions.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold flex-shrink-0 border border-red-100">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">HRMS & Staff Payroll</h3>
                <p className="text-xs text-slate-500 mt-0.5">Employee records, clock-in/out attendance, leave requests, shift tracking, and pay slips.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold flex-shrink-0 border border-red-100">
                <Factory size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Production & Manufacturing</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bill of Materials (BOM), work orders, raw material deduction, and finished goods costing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT HALF — Form Card */}
      <div className="bg-white flex flex-col justify-center items-center p-6 sm:p-12 shadow-sm pt-16 sm:pt-12">
        <div className="max-w-[420px] w-full mx-auto flex flex-col items-center">
          {/* Top Brand Logo */}
          <div className="w-full flex justify-center mb-4">
            <BrandLogo size="xl" subtitle="Unified Business OS" layout="stacked" />
          </div>

          {/* Conditional Rendering: MFA Challenge View vs Login Credentials View */}
          {mfaChallenge?.required ? (
            /* MFA CHALLENGE SCREEN */
            <div className="w-full flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-3 border border-red-100 shadow-xs">
                <ShieldCheck size={28} />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 text-center">
                Two-Step Verification
              </h2>

              <p className="text-xs text-slate-600 text-center mt-1.5 max-w-sm">
                Enter the 6-digit verification code sent to{" "}
                <span className="font-bold text-slate-900">{mfaChallenge.maskedEmail}</span>.
              </p>

              {/* Expiry Countdown Indicator */}
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <Clock size={13} className={expiryCountdown <= 60 ? "text-red-600" : "text-slate-500"} />
                {expiryCountdown > 0 ? (
                  <span>
                    Code expires in{" "}
                    <strong className={expiryCountdown <= 60 ? "text-red-700 font-bold" : "text-slate-900"}>
                      {formatCountdown(expiryCountdown)}
                    </strong>
                  </span>
                ) : (
                  <span className="text-red-700 font-bold">Code expired</span>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="w-full mt-6 space-y-5">
                {/* 6 Separate Digit Boxes */}
                <div className="flex justify-between items-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete="one-time-code"
                      aria-label={`Verification code digit ${index + 1}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={isVerifyingOtp}
                      className="w-12 h-14 text-center text-xl font-extrabold rounded-xl border border-slate-300 focus:border-red-700 focus:ring-2 focus:ring-red-100 focus:bg-white bg-slate-50 text-slate-900 transition outline-none shadow-2xs"
                    />
                  ))}
                </div>

                {/* Status / Error Messages */}
                {mfaError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-center">
                    {mfaError}
                  </div>
                )}

                {resendSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 text-center">
                    {resendSuccessMsg}
                  </div>
                )}

                {/* Verify Submit Button */}
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpDigits.join("").length !== 6 || expiryCountdown <= 0}
                  className={`w-full py-3 text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isVerifyingOtp || otpDigits.join("").length !== 6 || expiryCountdown <= 0
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <IoIosArrowRoundForward size={22} />
                    </>
                  )}
                </button>

                {/* Resend Cooldown Section */}
                <div className="text-center pt-1">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      Resend code in <strong className="text-slate-700 font-bold">{resendCooldown}s</strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendingOtp}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isResendingOtp ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={13} />
                          <span>Resend verification code</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Didn't receive the code? Check your spam/junk folder. Codes are valid for 5 minutes.
                  </p>
                </div>

                {/* Cancel / Return to Login */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleCancelMfa}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>Sign in with a different account</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STANDARD CREDENTIALS LOGIN SCREEN */
            <>
              <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-4">
                Sign In to Workspace
              </h2>

              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5 w-full">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700">
                    User Email <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-red-700 focus:bg-white text-slate-900 text-sm font-semibold transition"
                  />
                </div>

                <div className="space-y-1.5 w-full relative">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700">
                    Password <span className="text-red-700">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-red-700 focus:bg-white text-slate-900 text-sm font-semibold transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                    </button>
                  </div>
                </div>

                {isResetSuccess && !error && (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    <span>Password updated successfully! Please sign in with your new password.</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 animate-pulse">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full mt-6 py-3 text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <span>Sign In</span>
                  <IoIosArrowRoundForward size={24} />
                </button>
              </form>

              {/* Links Footer */}
              <div className="text-center mt-6 space-y-2.5">
                <div>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <p className="text-slate-600 text-xs">
                  Don't have an organization yet?{" "}
                  <Link
                    to="/tenant-registration"
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Register Your Organization
                  </Link>
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Homepage</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

