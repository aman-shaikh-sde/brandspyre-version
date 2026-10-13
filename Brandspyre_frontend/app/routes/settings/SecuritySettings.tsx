import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { PageHeader } from "src/component/ui/PageHeader";
import { Modal } from "src/component/Modal";
import {
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";

interface MfaStatusData {
  mfaEnabled: boolean;
  mfaEmail?: string;
  maskedEmail?: string;
  isMandatory: boolean;
  mfaVerifiedAt?: string | null;
}

export default function SecuritySettings() {
  const [statusLoading, setStatusLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState<MfaStatusData | null>(null);

  // Enable Modal State
  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const [enableStep, setEnableStep] = useState<"init" | "verify">("init");
  const [enableLoading, setEnableLoading] = useState(false);
  const [enableChallengeId, setEnableChallengeId] = useState<string | null>(null);
  const [enableMaskedEmail, setEnableMaskedEmail] = useState<string>("");
  const [enableOtpDigits, setEnableOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [enableCooldown, setEnableCooldown] = useState(0);
  const [enableExpiry, setEnableExpiry] = useState(300);
  const [enableError, setEnableError] = useState<string | null>(null);

  // Disable Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disableStep, setDisableStep] = useState<"password" | "verify">("password");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableChallengeId, setDisableChallengeId] = useState<string | null>(null);
  const [disableMaskedEmail, setDisableMaskedEmail] = useState<string>("");
  const [disableOtpDigits, setDisableOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [disableCooldown, setDisableCooldown] = useState(0);
  const [disableExpiry, setDisableExpiry] = useState(300);
  const [disableError, setDisableError] = useState<string | null>(null);

  const enableOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const disableOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch current MFA status
  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await apiClient.get("/saas/auth/mfa/status");
      if (res.data?.success && res.data?.data) {
        setMfaStatus(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch MFA status:", err);
      notify.error("Unable to load security settings.");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Cooldown & Expiry Timers
  useEffect(() => {
    if (!isEnableModalOpen && !isDisableModalOpen) return;
    const interval = setInterval(() => {
      setEnableCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setEnableExpiry((prev) => (prev > 0 ? prev - 1 : 0));
      setDisableCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setDisableExpiry((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isEnableModalOpen, isDisableModalOpen]);

  // Focus first input on verification step
  useEffect(() => {
    if (enableStep === "verify") {
      setTimeout(() => enableOtpRefs.current[0]?.focus(), 150);
    }
  }, [enableStep]);

  useEffect(() => {
    if (disableStep === "verify") {
      setTimeout(() => disableOtpRefs.current[0]?.focus(), 150);
    }
  }, [disableStep]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Enable Flow ---
  const handleOpenEnableModal = () => {
    setEnableStep("init");
    setEnableOtpDigits(["", "", "", "", "", ""]);
    setEnableError(null);
    setIsEnableModalOpen(true);
  };

  const handleSendEnableOtp = async () => {
    try {
      setEnableLoading(true);
      setEnableError(null);
      const res = await apiClient.post("/saas/auth/mfa/enable");
      if (res.data?.success) {
        setEnableChallengeId(res.data.challengeId);
        setEnableMaskedEmail(res.data.maskedEmail || "");
        setEnableCooldown(res.data.resendCooldownSeconds || 60);
        setEnableExpiry(res.data.expiresInSeconds || 300);
        setEnableStep("verify");
        notify.success("Verification code sent to your email.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to initiate MFA setup.";
      setEnableError(msg);
      notify.error(msg);
    } finally {
      setEnableLoading(false);
    }
  };

  const handleVerifyEnableOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = enableOtpDigits.join("");
    if (entered.length !== 6) {
      setEnableError("Please enter all 6 digits.");
      return;
    }

    try {
      setEnableLoading(true);
      setEnableError(null);
      const res = await apiClient.post("/saas/auth/mfa/verify", {
        challengeId: enableChallengeId,
        otp: entered,
      });

      if (res.data?.success) {
        notify.success("Multi-Factor Authentication enabled successfully!");
        setIsEnableModalOpen(false);
        await fetchStatus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Invalid verification code.";
      setEnableError(msg);
    } finally {
      setEnableLoading(false);
    }
  };

  // --- Disable Flow ---
  const handleOpenDisableModal = () => {
    setDisableStep("password");
    setDisablePassword("");
    setDisableOtpDigits(["", "", "", "", "", ""]);
    setDisableError(null);
    setIsDisableModalOpen(true);
  };

  const handleVerifyPasswordForDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError("Please enter your current account password.");
      return;
    }

    try {
      setDisableLoading(true);
      setDisableError(null);
      const res = await apiClient.post("/saas/auth/mfa/disable", {
        password: disablePassword,
      });

      if (res.data?.success) {
        setDisableChallengeId(res.data.challengeId);
        setDisableMaskedEmail(res.data.maskedEmail || "");
        setDisableCooldown(res.data.resendCooldownSeconds || 60);
        setDisableExpiry(res.data.expiresInSeconds || 300);
        setDisableStep("verify");
        notify.success("Verification code sent to confirm disabling MFA.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Password verification failed.";
      setDisableError(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  const handleVerifyDisableOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = disableOtpDigits.join("");
    if (entered.length !== 6) {
      setDisableError("Please enter all 6 digits.");
      return;
    }

    try {
      setDisableLoading(true);
      setDisableError(null);
      const res = await apiClient.post("/saas/auth/mfa/verify", {
        challengeId: disableChallengeId,
        otp: entered,
      });

      if (res.data?.success) {
        notify.success("Multi-Factor Authentication has been disabled.");
        setIsDisableModalOpen(false);
        await fetchStatus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Invalid verification code.";
      setDisableError(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  // Generic 6-box OTP handlers helper
  const makeOtpHandlers = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    clearErr: () => void
  ) => {
    return {
      handleChange: (index: number, val: string) => {
        const cleaned = val.replace(/\D/g, "");
        if (!cleaned && val !== "") return;
        const char = cleaned.slice(-1);
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        clearErr();
        if (char && index < 5) {
          refs.current[index + 1]?.focus();
        }
      },
      handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
          if (!digits[index] && index > 0) {
            const next = [...digits];
            next[index - 1] = "";
            setDigits(next);
            refs.current[index - 1]?.focus();
          } else {
            const next = [...digits];
            next[index] = "";
            setDigits(next);
          }
        } else if (e.key === "ArrowLeft" && index > 0) {
          refs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
          refs.current[index + 1]?.focus();
        }
      },
      handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const next = [...digits];
        for (let i = 0; i < 6; i++) {
          next[i] = pasted[i] || "";
        }
        setDigits(next);
        clearErr();
        const targetIdx = Math.min(pasted.length, 5);
        refs.current[targetIdx]?.focus();
      },
    };
  };

  const enableHandlers = makeOtpHandlers(
    enableOtpDigits,
    setEnableOtpDigits,
    enableOtpRefs,
    () => setEnableError(null)
  );

  const disableHandlers = makeOtpHandlers(
    disableOtpDigits,
    setDisableOtpDigits,
    disableOtpRefs,
    () => setDisableError(null)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Security & Multi-Factor Authentication"
        description="Strengthen your workspace and account defense with Email One-Time Password (OTP) verification."
        breadcrumbs={[
          { label: "Settings", path: "/settings" },
          { label: "Security & MFA" },
        ]}
      />

      {statusLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Loader2 className="animate-spin text-red-600 h-8 w-8" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Checking security status...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main MFA Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    mfaStatus?.mfaEnabled
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {mfaStatus?.mfaEnabled ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Email Two-Step Verification
                    </h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        mfaStatus?.mfaEnabled
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {mfaStatus?.mfaEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Every sign-in requires a unique 6-digit numeric verification code sent to your registered email
                    address in addition to your password.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3">
                {mfaStatus?.mfaEnabled ? (
                  mfaStatus?.isMandatory ? (
                    <div className="text-right">
                      <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                        Mandatory For Your Role
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenDisableModal}
                      className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Disable MFA
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleOpenEnableModal}
                    className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    <span>Enable Two-Factor Authentication</span>
                  </button>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered MFA Email</h4>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {mfaStatus?.maskedEmail || mfaStatus?.mfaEmail || "Not configured"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verification codes are sent directly to this mailbox.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Status & Policy</h4>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {mfaStatus?.isMandatory ? "Strict Enforcement (Admin Role)" : "Standard Enforcement"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {mfaStatus?.mfaVerifiedAt
                      ? `Active since ${new Date(mfaStatus.mfaVerifiedAt).toLocaleDateString()}`
                      : "MFA not yet activated"}
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory Policy Banner */}
            {mfaStatus?.isMandatory && (
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed font-medium">
                  <strong>Organization Security Standard:</strong> Multi-Factor Authentication is permanently
                  mandated for Platform Administrators, Tenant Owners, and Finance Admins to safeguard client data,
                  tenant configuration, and payment workflows.
                </p>
              </div>
            )}
          </div>

          {/* Security Features Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              How Brandspyre Protects Your Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-xs mb-2.5">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">HMAC SHA-256 Hashing</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verification codes are never stored in plaintext and are securely hashed with a runtime pepper.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-xs mb-2.5">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Brute-Force Attack Guard</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  A strict 5-attempt threshold per challenge automatically burns and invalidates compromised OTPs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-xs mb-2.5">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">High-Risk Action Step-Up</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sensitive actions like payouts, role changes, and subscription edits enforce fresh MFA verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENABLE MFA MODAL */}
      <Modal
        isOpen={isEnableModalOpen}
        onClose={() => !enableLoading && setIsEnableModalOpen(false)}
        title="Enable Multi-Factor Authentication"
        maxWidth="md"
      >
        {enableStep === "init" ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <Mail className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                We will send a 6-digit confirmation code to your registered email to verify mailbox ownership before
                activating MFA.
              </p>
            </div>

            {enableError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {enableError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEnableModalOpen(false)}
                disabled={enableLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEnableOtp}
                disabled={enableLoading}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {enableLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail size={15} />}
                <span>Send Verification Code</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyEnableOtp} className="space-y-5 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Enter the 6-digit code sent to <strong className="text-slate-900 dark:text-white">{enableMaskedEmail}</strong>
            </p>

            <div className="flex justify-between items-center gap-2">
              {enableOtpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    enableOtpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(e) => enableHandlers.handleChange(index, e.target.value)}
                  onKeyDown={(e) => enableHandlers.handleKeyDown(index, e)}
                  onPaste={enableHandlers.handlePaste}
                  disabled={enableLoading}
                  className="w-11 h-13 text-center text-xl font-extrabold rounded-xl border border-slate-300 dark:border-slate-600 focus:border-red-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition outline-none"
                />
              ))}
            </div>

            {enableError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-center">
                {enableError}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Expires in {formatTime(enableExpiry)}</span>
              {enableCooldown > 0 ? (
                <span>Resend in {enableCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendEnableOtp}
                  disabled={enableLoading}
                  className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Resend code
                </button>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEnableModalOpen(false)}
                disabled={enableLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={enableLoading || enableOtpDigits.join("").length !== 6 || enableExpiry <= 0}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {enableLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck size={16} />}
                <span>Verify & Activate MFA</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DISABLE MFA MODAL */}
      <Modal
        isOpen={isDisableModalOpen}
        onClose={() => !disableLoading && setIsDisableModalOpen(false)}
        title="Disable Multi-Factor Authentication"
        maxWidth="md"
      >
        {disableStep === "password" ? (
          <form onSubmit={handleVerifyPasswordForDisable} className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                Disabling MFA reduces account security. For your protection, you must verify your current account
                password and email OTP.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Current Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                disabled={disableLoading}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-red-700"
              />
            </div>

            {disableError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {disableError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDisableModalOpen(false)}
                disabled={disableLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disableLoading || !disablePassword}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {disableLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Lock size={15} />}
                <span>Confirm & Send OTP</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyDisableOtp} className="space-y-5 py-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Enter the 6-digit confirmation code sent to{" "}
              <strong className="text-slate-900 dark:text-white">{disableMaskedEmail}</strong>
            </p>

            <div className="flex justify-between items-center gap-2">
              {disableOtpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    disableOtpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(e) => disableHandlers.handleChange(index, e.target.value)}
                  onKeyDown={(e) => disableHandlers.handleKeyDown(index, e)}
                  onPaste={disableHandlers.handlePaste}
                  disabled={disableLoading}
                  className="w-11 h-13 text-center text-xl font-extrabold rounded-xl border border-slate-300 dark:border-slate-600 focus:border-red-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition outline-none"
                />
              ))}
            </div>

            {disableError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-center">
                {disableError}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Expires in {formatTime(disableExpiry)}</span>
              {disableCooldown > 0 ? (
                <span>Resend in {disableCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setDisableLoading(true);
                    try {
                      const res = await apiClient.post("/saas/auth/mfa/send", {
                        challengeId: disableChallengeId,
                      });
                      if (res.data?.success) {
                        setDisableChallengeId(res.data.challengeId);
                        setDisableCooldown(60);
                        setDisableExpiry(300);
                        notify.success("New code sent.");
                      }
                    } catch (err: any) {
                      notify.error("Failed to resend code.");
                    } finally {
                      setDisableLoading(false);
                    }
                  }}
                  disabled={disableLoading}
                  className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Resend code
                </button>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDisableModalOpen(false)}
                disabled={disableLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disableLoading || disableOtpDigits.join("").length !== 6 || disableExpiry <= 0}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {disableLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldAlert size={16} />}
                <span>Confirm & Disable MFA</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
