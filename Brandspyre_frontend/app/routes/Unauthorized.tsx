import React from "react";
import { Link, useNavigate } from "react-router";
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { getDefaultDashboardPath } from "src/utils/dashboardPaths";
import { BrandLogo } from "~/components/public/BrandLogo";

export default function Unauthorized() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const dashboardPath = getDefaultDashboardPath(role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" href="/" />
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You do not have the required permissions or module access to view this resource. Contact your organization administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>

          {isLoggedIn ? (
            <Link
              to={dashboardPath}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-xs"
            >
              <LayoutDashboard size={14} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-xs"
            >
              <LogIn size={14} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
