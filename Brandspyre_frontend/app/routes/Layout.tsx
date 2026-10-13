import { useEffect } from "react";
import { Header } from "./layouts/Header";
import { Sidebar } from "./layouts/Sidebar";
import { cn } from "../../src/utils/cn";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useMediaQuery } from "./hooks/use-click-outside";
import { useSideBar } from "~/store/useSideBar";
import { useAuthStore } from "src/stores/authStore";
import { useOrgWorkspaceStore } from "src/stores/useOrgWorkspaceStore";
import SubscriptionBanner from "src/component/SubscriptionBanner";
import { Building2, X } from "lucide-react";

const Layout = () => {
  const isDesktopDevice = useMediaQuery("(min-width:768px)");
  const { isOpen, isMobileOpen, closeMobile } = useSideBar();
  const navigate = useNavigate();
  const location = useLocation();

  const authStatus = useAuthStore((s) => s.authStatus);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  const activeOrgWorkspace = useOrgWorkspaceStore((s) => s.activeOrg);
  const exitWorkspace = useOrgWorkspaceStore((s) => s.exitWorkspace);

  useEffect(() => {
    // Wait for store hydration and session restoration before redirecting
    if (authStatus === "loading" || !hydrated) return;

    if (authStatus === "unauthenticated" || (!isLoggedIn && !accessToken)) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [authStatus, hydrated, isLoggedIn, accessToken, navigate, location.pathname]);

  if (!hydrated || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || (!isLoggedIn && !accessToken)) return null;

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className={cn(
          "transition-[margin] duration-300",
          isOpen ? "md:ml-[70px]" : "md:ml-[240px]"
        )}
      >
        {/* Organization Workspace Banner for Platform Admins */}
        {activeOrgWorkspace && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold shadow-sm z-30 sticky top-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-950" />
              <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                Viewing Organization Workspace
              </span>
              <span className="truncate">
                {activeOrgWorkspace.companyName} ({activeOrgWorkspace.slug || activeOrgWorkspace.tenantId})
              </span>
            </div>
            <button
              onClick={() => {
                exitWorkspace();
                navigate('/admin/organizations');
              }}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Exit Workspace
            </button>
          </div>
        )}

        <SubscriptionBanner />
        <Header />
        <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
