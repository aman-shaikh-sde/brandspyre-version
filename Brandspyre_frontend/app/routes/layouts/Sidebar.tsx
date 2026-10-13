import { forwardRef, useEffect, useState, useMemo } from "react";
import { cn } from "../../../src/utils/cn";
import { navbarLinks } from "~/constants";
import { NavLink, useLocation } from "react-router-dom";
import { BrandLogo } from "~/components/public/BrandLogo";
import { useSideBar } from "~/store/useSideBar";
import { useAuthStore } from "src/stores/authStore";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import { useOrgWorkspaceStore } from "src/stores/useOrgWorkspaceStore";
import { BASE_URL } from "~/constants/api";
import { isPlatformAdminRole } from "src/utils/roleUtils";

import {
  Home,
  Split,
  Sparkles,
  Briefcase,
  CircleCheckBig,
  UserLock,
  CalendarX2,
  Contact,
  CalendarCheck,
  UsersRound,
  CalendarClock,
  Calculator,
  FileClock,
  MessageCircleWarning,
  Building2,
  Target,
  Users,
  FolderKanban,
  FileText,
  CalendarDays,
  Video,
  Layers,
  Settings,
  Sliders,
  Bot,
  PieChart,
  Package,
  ShoppingCart,
  Monitor,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Factory,
  CreditCard
} from "lucide-react";

export const Sidebar = forwardRef<HTMLDivElement>((props, ref) => {
  const { isOpen, isMobileOpen, closeMobile } = useSideBar();
  const [allowedLinks, setAllowedLinks] = useState<typeof navbarLinks>([]);
  const [hydrated, setHydrated] = useState(false);
  const location = useLocation();

  const UserRole = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.accessToken);

  const { fetchConfig, hasModule } = useOrganizationConfig();
  const activeOrgWorkspace = useOrgWorkspaceStore((state) => state.activeOrg);

  const isPlatformAdmin = useMemo(() => {
    return isPlatformAdminRole(UserRole);
  }, [UserRole]);

  // Collapsible category open/close state persisted in localStorage
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("nxt_sidebar_groups");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      fetchConfig();
    }
  }, [hydrated, token, fetchConfig]);

  // Explicit Platform Admin Navigation Structure (Clean & Minimal)
  const platformAdminNavigation = useMemo(() => {
    return [
      {
        title: "PLATFORM",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Dashboard", icon: Home, path: "/admin/dashboard", moduleCode: "PLATFORM_ADMIN" },
          { label: "Organizations", icon: Building2, path: "/admin/organizations", moduleCode: "PLATFORM_ADMIN" },
          { label: "Business Types & Matrix", icon: Layers, path: "/admin/business-types", moduleCode: "PLATFORM_ADMIN" },
          { label: "Module Catalog", icon: Sliders, path: "/admin/module-pricing", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "COMMERCIAL",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Subscription Plans", icon: Package, path: "/admin/plans", moduleCode: "PLATFORM_ADMIN" },
          { label: "Add-ons & Pricing", icon: Calculator, path: "/admin/module-pricing", moduleCode: "PLATFORM_ADMIN" },
          { label: "Custom Package Requests", icon: Sliders, path: "/admin/plans", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "EVENTS & COMMERCE",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Events & Settlements", icon: CalendarDays, path: "/admin/events", moduleCode: "PLATFORM_ADMIN" },
          { label: "Marketplace Moderation", icon: ShoppingCart, path: "/admin/marketplace", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "REFERRAL NETWORK",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Global Marketplace", icon: Split, path: "/admin/referrals", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "CUSTOMER SUCCESS",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Customer Support", icon: MessageCircleWarning, path: "/admin/support", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "WEBSITE & CMS",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Blog & Articles", icon: FileText, path: "/content/blog", moduleCode: "PLATFORM_ADMIN" },
          { label: "Case Studies & Quotes", icon: Sparkles, path: "/content/testimonials", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
      {
        title: "SECURITY & SYSTEM",
        moduleCode: "PLATFORM_ADMIN",
        links: [
          { label: "Audit Logs", icon: FileClock, path: "/admin/dashboard", moduleCode: "PLATFORM_ADMIN" },
          { label: "Platform Settings", icon: Settings, path: "/settings", moduleCode: "PLATFORM_ADMIN" },
        ],
      },
    ];
  }, []);

  // Standard Organization Business Navigation Structure
  const organizationNavigation = useMemo(() => {
    const dashGroup = {
      title: "DASHBOARD",
      moduleCode: "DASHBOARD",
      links: [
        { label: "Dashboard", icon: Home, path: "/dashboard", moduleCode: "DASHBOARD" }
      ],
    };

    const crmGroup = {
      title: "SALES & CRM",
      moduleCode: "CRM",
      links: [
        { label: "Campaigns", icon: Target, path: "/campaign", moduleCode: "CRM" },
        { label: "Leads", icon: Users, path: "/leads", moduleCode: "CRM" },
        { label: "Lead Conversions", icon: Split, path: "/leadscovert", moduleCode: "CRM" },
        { label: "Sales Orders", icon: ShoppingCart, path: "/sales/orders", moduleCode: "SALES" },
        { label: "Sales Invoices", icon: FileText, path: "/sales/invoices", moduleCode: "SALES" },
        { label: "Sales Returns", icon: ArrowRightLeft, path: "/sales/returns", moduleCode: "SALES" },
        { label: "Clients", icon: Contact, path: "/clients", moduleCode: "CLIENTS" },
        { label: "Projects", icon: FolderKanban, path: "/project", moduleCode: "PROJECTS" },
        { label: "Project Tasks", icon: Layers, path: "/project_tasklist", moduleCode: "PROJECTS" },
      ],
    };

    const contentGroup = {
      title: "WEBSITE & CMS",
      moduleCode: "PLATFORM_ADMIN",
      links: [
        { label: "Blog & Articles", icon: FileText, path: "/content/blog", moduleCode: "PLATFORM_ADMIN" },
        { label: "Case Studies & Quotes", icon: Sparkles, path: "/content/testimonials", moduleCode: "PLATFORM_ADMIN" },
      ],
    };

    const commercialGroup = {
      title: "COMMERCIAL & B2B",
      moduleCode: "BILLING",
      links: [
        { label: "Commercial Dashboard", icon: Calculator, path: "/billing/dashboard", moduleCode: "BILLING" },
        { label: "Direct Payments", icon: CreditCard, path: "/payments", moduleCode: "BILLING" },
        { label: "Master Contracts", icon: Briefcase, path: "/billing/contracts", moduleCode: "BILLING" },
        { label: "Agreements", icon: FileText, path: "/billing/agreements", moduleCode: "BILLING" },
        { label: "Billable Ledger", icon: CircleCheckBig, path: "/billing/transactions", moduleCode: "BILLING" },
        { label: "Lead Exchange", icon: Split, path: "/lead-exchange/relationships", moduleCode: "LEAD_EXCHANGE" },
        { label: "Shared Leads", icon: UsersRound, path: "/lead-exchange/shared-leads", moduleCode: "LEAD_EXCHANGE" },
        { label: "Settlement Ledger", icon: Calculator, path: "/lead-exchange/settlements", moduleCode: "LEAD_EXCHANGE" },
      ],
    };

    const referralGroup = {
      title: "REFERRAL MARKETPLACE",
      moduleCode: "LEAD_EXCHANGE",
      links: [
        { label: "Opportunity Marketplace", icon: Split, path: "/referrals/marketplace", moduleCode: "LEAD_EXCHANGE" },
        { label: "My Published Referrals", icon: FileText, path: "/referrals/my", moduleCode: "LEAD_EXCHANGE" },
        { label: "Received Referrals", icon: UsersRound, path: "/referrals/received", moduleCode: "LEAD_EXCHANGE" },
        { label: "Partner Network", icon: Building2, path: "/referrals/partners", moduleCode: "LEAD_EXCHANGE" },
        { label: "Commission Ledger", icon: Calculator, path: "/referrals/settlements", moduleCode: "LEAD_EXCHANGE" },
      ],
    };

    const hrmsGroup = {
      title: "PEOPLE & HRMS",
      moduleCode: "HRMS",
      links: [
        { label: "Employees", icon: UserLock, path: "/employee", moduleCode: "HRMS" },
        { label: "Attendance", icon: CalendarCheck, path: "/attandance", moduleCode: "HRMS" },
        { label: "Leaves", icon: CalendarX2, path: "/leave", moduleCode: "HRMS" },
        { label: "Timesheet", icon: CalendarClock, path: "/time_sheet", moduleCode: "HRMS" },
        { label: "Teams", icon: UsersRound, path: "/team", moduleCode: "HRMS" },
        { label: "Employee Report", icon: Contact, path: "/employee_report", moduleCode: "HRMS" },
      ],
    };

    const collabGroup = {
      title: "COLLABORATION & AI",
      moduleCode: "MEETINGS",
      links: [
        { label: "Meetings", icon: Video, path: "/meetings", moduleCode: "MEETINGS" },
        { label: "Calendar", icon: CalendarDays, path: "/calendar", moduleCode: "MEETINGS" },
        { label: "Events & MOM", icon: FileText, path: "/events", moduleCode: "MEETINGS" },
        { label: "AI Assistant", icon: Sparkles, path: "/ai-assistant", moduleCode: "AI_ASSISTANT", badge: "Soon" },
        { label: "AI Reports", icon: Bot, path: "/ai-report", moduleCode: "AI_ASSISTANT", badge: "Soon" },
        { label: "Notifications", icon: MessageCircleWarning, path: "/notification", moduleCode: "NOTIFICATIONS" },
        { label: "Active Logs", icon: FileClock, path: "/active_log", moduleCode: "NOTIFICATIONS" },
      ],
    };

    const financeGroup = {
      title: "FINANCE & ACCOUNTS",
      moduleCode: "FINANCE",
      links: [
        { label: "B2B Payments", icon: CreditCard, path: "/payments", moduleCode: "FINANCE" },
        { label: "Accounts Overview", icon: Calculator, path: "/account", moduleCode: "FINANCE" },
        { label: "Report Analysis", icon: PieChart, path: "/reportAnaysis", moduleCode: "REPORTS" },
      ],
    };

    const adminGroup = {
      title: "ADMINISTRATION",
      moduleCode: "ORGANIZATION",
      links: [
        { label: "Payment Account", icon: CreditCard, path: "/settings/payment-account", moduleCode: "ORGANIZATION" },
        { label: "System Settings", icon: Settings, path: "/settings", moduleCode: "PLATFORM_ADMIN" },
        { label: "Module Settings", icon: Sliders, path: "/settings/modules", moduleCode: "PLATFORM_ADMIN" },
        { label: "Branches", icon: Building2, path: "/branch", moduleCode: "ORGANIZATION" },
        { label: "Support Portal", icon: MessageCircleWarning, path: "/support", moduleCode: "ORGANIZATION" },
      ],
    };

    const operationsGroup = {
      title: "RETAIL & COMMERCE",
      moduleCode: "PRODUCTS",
      links: [
        { label: "Products & Catalog", icon: Package, path: "/products", moduleCode: "PRODUCTS" },
        { label: "Inventory Stock", icon: Layers, path: "/inventory", moduleCode: "INVENTORY" },
        { label: "Marketplace Listings", icon: Sparkles, path: "/marketplace/seller", moduleCode: "PRODUCTS" },
        { label: "Suppliers", icon: UsersRound, path: "/suppliers", moduleCode: "PURCHASE" },
        { label: "Purchases", icon: ShoppingCart, path: "/purchases", moduleCode: "PURCHASE" },
        { label: "POS Terminal", icon: Monitor, path: "/pos", moduleCode: "POS" },
      ],
    };

    const productionGroup = {
      title: "MANUFACTURING & PRODUCTION",
      moduleCode: "PRODUCTION",
      links: [
        { label: "Production Workspace", icon: Factory, path: "/production", moduleCode: "PRODUCTION" },
      ],
    };

    const eventsGroup = {
      title: "EVENT MANAGEMENT",
      moduleCode: "EVENT_MANAGEMENT",
      links: [
        { label: "Overview", icon: Home, path: "/event-management/dashboard", moduleCode: "EVENT_MANAGEMENT" },
        { label: "Events", icon: CalendarDays, path: "/event-management/events", moduleCode: "EVENT_MANAGEMENT" },
        { label: "Create Event", icon: Sparkles, path: "/event-management/events/create", moduleCode: "EVENT_MANAGEMENT" },
        { label: "Orders", icon: ShoppingCart, path: "/event-management/orders", moduleCode: "EVENT_MANAGEMENT" },
        { label: "Attendees", icon: Users, path: "/event-management/attendees", moduleCode: "EVENT_MANAGEMENT" },
        { label: "QR Check-in", icon: CircleCheckBig, path: "/event-management/checkin", moduleCode: "EVENT_MANAGEMENT" },
        { label: "Settlements", icon: Calculator, path: "/event-management/settlements", moduleCode: "EVENT_MANAGEMENT" },
      ],
    };

    return [
      dashGroup,
      eventsGroup,
      crmGroup,
      referralGroup,
      operationsGroup,
      productionGroup,
      commercialGroup,
      hrmsGroup,
      collabGroup,
      financeGroup,
      adminGroup,
    ];
  }, []);

  // Determine active navigation mode
  const activeNavGroups = useMemo(() => {
    // If Platform Admin and NOT inside an Organization Workspace -> render Platform Admin Navigation
    if (isPlatformAdmin && !activeOrgWorkspace) {
      return platformAdminNavigation;
    }

    // Otherwise render Organization Navigation filtered by module entitlement
    return organizationNavigation
      .map((group) => {
        const filteredLinks = group.links.filter((link) => {
          if (isPlatformAdmin) return true;
          if (link.moduleCode === 'DASHBOARD' || link.moduleCode === 'ORGANIZATION') return true;
          return hasModule(link.moduleCode);
        });
        return { ...group, links: filteredLinks };
      })
      .filter((group) => group.links.length > 0);
  }, [isPlatformAdmin, activeOrgWorkspace, platformAdminNavigation, organizationNavigation, hasModule]);

  // Helper to test active route matching
  const isRouteActive = (linkPath: string, currentPath: string) => {
    if (linkPath === "/") return currentPath === "/";
    return currentPath === linkPath || currentPath.startsWith(linkPath + "/");
  };

  // Auto-expand group containing current active route
  useEffect(() => {
    const currentPath = location.pathname;
    activeNavGroups.forEach((group) => {
      if (group.title !== "DASHBOARD" && group.title !== "PLATFORM") {
        const hasActiveChild = group.links.some((l) => isRouteActive(l.path, currentPath));
        if (hasActiveChild) {
          setExpandedGroups((prev) => {
            if (prev[group.title] === true) return prev;
            const next = { ...prev, [group.title]: true };
            try {
              localStorage.setItem("nxt_sidebar_groups", JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        }
      }
    });
  }, [location.pathname, activeNavGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem("nxt_sidebar_groups", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  if (!hydrated) return null;

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[100] flex h-full flex-col overflow-x-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 shadow-2xs",
        isOpen ? "md:w-[70px] md:items-center" : "md:w-[245px]",
        isMobileOpen ? "max-md:left-0 max-md:w-[260px]" : "max-md:-left-full"
      )}
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <BrandLogo size="sm" showText={!isOpen} href="/" />
        </div>
      </div>

      {/* Navigation Group Items */}
      <div
        className="flex w-full flex-col gap-y-3 overflow-y-auto overflow-x-hidden p-3 flex-1"
        style={{ scrollbarWidth: "thin", msOverflowStyle: "auto" }}
      >
        {activeNavGroups.map((group) => {
          const isDirectGroup = group.title === "DASHBOARD";
          const isExpanded = isDirectGroup || !!expandedGroups[group.title];
          const hasActiveChild = group.links.some((l) => isRouteActive(l.path, location.pathname));

          // Collapsed Icon-Only Sidebar Mode
          if (isOpen) {
            return (
              <nav key={group.title} className="flex flex-col gap-y-1 items-center w-full">
                {!isDirectGroup && (
                  <div className="w-7 h-[1px] bg-slate-200 dark:bg-slate-800 my-1" title={group.title} />
                )}
                {group.links.map((link) => (
                  <NavLink
                    key={`${link.label}-${link.path}`}
                    to={link.path}
                    onClick={closeMobile}
                    title={(link as any).badge ? `${link.label} (${(link as any).badge})` : link.label}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center justify-center w-[42px] h-[36px] rounded-xl text-xs font-semibold transition-all duration-150 group",
                        isActive
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-extrabold border-l-3 border-red-600 dark:border-red-500 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                      )
                    }
                  >
                    <link.icon size={18} className="flex-shrink-0 transition-transform group-hover:scale-105" />
                    {(link as any).badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                    )}
                  </NavLink>
                ))}
              </nav>
            );
          }

          // Full Collapsible Group Mode
          return (
            <nav key={group.title} className="flex flex-col gap-y-1">
              {/* Dashboard Direct Links */}
              {isDirectGroup ? (
                group.links.map((link) => (
                  <NavLink
                    key={`${link.label}-${link.path}`}
                    to={link.path}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 group",
                        isActive
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-extrabold border-l-3 border-red-600 dark:border-red-500 shadow-2xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                      )
                    }
                  >
                    <link.icon size={17} className="flex-shrink-0 transition-transform group-hover:scale-105" />
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                ))
              ) : (
                /* Category Group Header with Accordion Toggle */
                <>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors select-none group/hdr cursor-pointer",
                      hasActiveChild
                        ? "text-slate-900 dark:text-slate-100 font-black"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <span className="truncate">{group.title}</span>
                    {isExpanded ? (
                      <ChevronDown size={14} className="flex-shrink-0 text-slate-400 group-hover/hdr:text-slate-600 dark:group-hover/hdr:text-slate-300 transition-transform" />
                    ) : (
                      <ChevronRight size={14} className="flex-shrink-0 text-slate-400 group-hover/hdr:text-slate-600 dark:group-hover/hdr:text-slate-300 transition-transform" />
                    )}
                  </button>

                  {/* Expandable Child Navigation Links */}
                  {isExpanded && (
                    <div className="flex flex-col gap-y-0.5 pl-2 transition-all duration-200 ease-in-out">
                      {group.links.map((link) => (
                        <NavLink
                          key={`${link.label}-${link.path}`}
                          to={link.path}
                          onClick={closeMobile}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group/item",
                              isActive
                                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold border-l-3 border-red-600 dark:border-red-500 shadow-2xs"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                            )
                          }
                        >
                          <link.icon size={16} className="flex-shrink-0 transition-transform group-hover/item:scale-105" />
                          <span className="truncate">{link.label}</span>
                          {(link as any).badge && (
                            <span className="ml-auto text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 to-red-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                              {(link as any).badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </nav>
          );
        })}
      </div>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;
