import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useAuthStore } from "src/stores/authStore";
import { getDefaultDashboardPath, getDashboardLabel } from "src/utils/dashboardPaths";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Events", href: "/explore-events" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const authStatus = useAuthStore((s) => s.authStatus);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);

  const isUserAuthenticated = authStatus === "authenticated" || Boolean(isLoggedIn && accessToken);
  const isAuthLoading = authStatus === "loading" && !isUserAuthenticated;
  const dashboardPath = getDefaultDashboardPath(role);
  const dashboardLabel = getDashboardLabel(role);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/explore-events") {
      return location.pathname.startsWith("/explore-events") || location.pathname.startsWith("/tickets");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Identity */}
          <div className="flex items-center gap-8">
            <BrandLogo size="md" href="/" />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "text-red-700 dark:text-red-500 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthLoading ? (
              <div className="flex items-center gap-2" aria-hidden="true">
                <div className="h-8 w-16 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ) : isUserAuthenticated ? (
              <Link
                to={dashboardPath}
                aria-label={`Go to ${dashboardLabel}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <LayoutDashboard size={14} aria-hidden="true" />
                <span>{dashboardLabel}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  aria-label="Login to your account"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition focus:ring-2 focus:ring-red-500 rounded-md"
                >
                  <LogIn size={14} aria-hidden="true" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/tenant-registration"
                  aria-label="Get started with Brandspyre"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-xs focus:ring-2 focus:ring-red-500"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-6 space-y-4">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition ${
                    active
                      ? "text-red-700 dark:text-red-500 bg-red-50 dark:bg-red-950/30 font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            {isAuthLoading ? (
              <div className="w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
            ) : isUserAuthenticated ? (
              <Link
                to={dashboardPath}
                aria-label={`Go to ${dashboardLabel}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-xs"
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                <span>{dashboardLabel}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/tenant-registration"
                  aria-label="Get started with Brandspyre"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  aria-label="Login to your account"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                >
                  <LogIn size={14} aria-hidden="true" />
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
