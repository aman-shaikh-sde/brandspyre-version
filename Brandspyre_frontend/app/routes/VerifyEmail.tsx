import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BrandLogo } from "~/components/public/BrandLogo";
import { IoIosArrowRoundForward } from "react-icons/io";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided in URL.");
      setLoading(false);
      return;
    }
    verifyToken(token);
  }, [token]);

  const verifyToken = async (tok: string) => {
    try {
      const response = await fetch(`${BASE_URL}/saas/auth/verify-email?token=${encodeURIComponent(tok)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Email verification failed.");
      }
      notify.success("Email verified successfully!");
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl text-center flex flex-col items-center">
        <BrandLogo size="lg" subtitle="Unified Business OS" className="mb-6" />

        {loading ? (
          <div className="py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-700 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Verifying your email address...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-3xl rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your email address has been verified. You can now access all features in your organization workspace.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all font-semibold flex items-center justify-center gap-1 mt-6"
            >
              Sign In Now <IoIosArrowRoundForward size={24} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-3xl rounded-full flex items-center justify-center mx-auto">
              ✕
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="text-xs text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all font-semibold flex items-center justify-center gap-1 mt-6"
            >
              Return to Login <IoIosArrowRoundForward size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
