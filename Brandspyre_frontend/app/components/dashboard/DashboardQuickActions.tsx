import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Building2,
  Users,
  ShieldCheck,
  Settings,
  CreditCard,
  Target,
  UserPlus,
  CalendarCheck,
  CalendarX2,
  Clock,
  Video,
  ListTodo,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight,
  Sliders,
  Briefcase,
  ExternalLink,
  Crown
} from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import { isPlatformAdminRole } from "src/utils/dashboardPaths";

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  path: string;
  category: "admin" | "operations" | "self" | "platform";
  requiredPermission?: string;
  requiredModule?: string;
  minRoleLevel?: "employee" | "manager" | "admin" | "platform_admin";
  badge?: string;
}

export const QUICK_ACTIONS_REGISTRY: QuickActionItem[] = [
  // Platform Admin specific actions
  {
    id: "platform-orgs",
    label: "Organizations",
    description: "Manage tenant organizations",
    icon: Building2,
    path: "/admin/organizations",
    category: "platform",
    minRoleLevel: "platform_admin",
  },
  {
    id: "platform-modules",
    label: "Module Catalog",
    description: "Pricing and business modules",
    icon: Sliders,
    path: "/admin/module-pricing",
    category: "platform",
    minRoleLevel: "platform_admin",
  },
  {
    id: "platform-plans",
    label: "Subscription Plans",
    description: "Tiers, limits & packaging",
    icon: Crown,
    path: "/admin/plans",
    category: "platform",
    minRoleLevel: "platform_admin",
  },

  // Tenant Admin / Management Administration
  {
    id: "create-branch",
    label: "Create Branch",
    description: "Add new office or branch",
    icon: Building2,
    path: "/branch",
    category: "admin",
    requiredPermission: "branch.create",
    requiredModule: "ORGANIZATION",
    minRoleLevel: "admin",
  },
  {
    id: "roles-permissions",
    label: "Roles & Permissions",
    description: "Manage RBAC access roles",
    icon: ShieldCheck,
    path: "/settings/access-permission/roles",
    category: "admin",
    requiredPermission: "roles.manage",
    minRoleLevel: "admin",
  },
  {
    id: "destinations-designations",
    label: "Designations",
    description: "Staff designations & job titles",
    icon: Briefcase,
    path: "/settings/access-permission/designations",
    category: "admin",
    requiredPermission: "settings.view",
    minRoleLevel: "admin",
    badge: "Destination",
  },
  {
    id: "destination-payouts",
    label: "Payout Destination",
    description: "Stripe & Razorpay accounts",
    icon: CreditCard,
    path: "/settings/payment-account",
    category: "admin",
    requiredPermission: "settings.view",
    minRoleLevel: "admin",
  },
  {
    id: "system-settings",
    label: "System Settings",
    description: "Security and preferences",
    icon: Settings,
    path: "/settings/access-permission/systemsetting",
    category: "admin",
    requiredPermission: "settings.view",
    minRoleLevel: "admin",
  },
  {
    id: "add-employee",
    label: "Add Employee",
    description: "Onboard new staff member",
    icon: UserPlus,
    path: "/employee?create=true",
    category: "admin",
    requiredPermission: "employee.create",
    requiredModule: "HRMS",
    minRoleLevel: "manager",
  },
  {
    id: "subscription-billing",
    label: "Subscription",
    description: "Billing & active licenses",
    icon: CreditCard,
    path: "/settings/billing",
    category: "admin",
    requiredPermission: "billing.view",
    minRoleLevel: "admin",
  },

  // Operations & CRM
  {
    id: "create-lead",
    label: "Create Lead",
    description: "Record new sales prospect",
    icon: Target,
    path: "/leads",
    category: "operations",
    requiredPermission: "lead.create",
    requiredModule: "CRM",
    minRoleLevel: "employee",
  },
  {
    id: "add-client",
    label: "Add Client",
    description: "Register company customer",
    icon: Users,
    path: "/client_add",
    category: "operations",
    requiredPermission: "client.create",
    requiredModule: "CLIENTS",
    minRoleLevel: "employee",
  },
  {
    id: "meetings-hub",
    label: "Meetings",
    description: "Schedule & start rooms",
    icon: Video,
    path: "/meetings",
    category: "operations",
    requiredPermission: "meeting.view",
    requiredModule: "MEETINGS",
    minRoleLevel: "employee",
  },
  {
    id: "tasks-overview",
    label: "Tasks",
    description: "Assigned project deliverables",
    icon: ListTodo,
    path: "/project_tasklist",
    category: "operations",
    requiredPermission: "task.view",
    requiredModule: "PROJECTS",
    minRoleLevel: "employee",
  },

  // Self-Service Employee Actions (Available to all authorized staff)
  {
    id: "my-attendance",
    label: "My Attendance",
    description: "Check in / out logs",
    icon: CalendarCheck,
    path: "/attandance",
    category: "self",
    minRoleLevel: "employee",
  },
  {
    id: "apply-leave",
    label: "Apply Leave",
    description: "Time-off requests",
    icon: CalendarX2,
    path: "/leave",
    category: "self",
    minRoleLevel: "employee",
  },
  {
    id: "my-timesheet",
    label: "My Timesheet",
    description: "Log hours worked",
    icon: Clock,
    path: "/time_sheet",
    category: "self",
    minRoleLevel: "employee",
  },
];

export const DashboardQuickActions: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const userRole = useAuthStore((s) => s.role);
  const storePermissions = useAuthStore((s) => s.permissions);
  const { hasPermission, hasModule } = useOrganizationConfig();

  const isPlatformAdmin = isPlatformAdminRole(userRole);
  const isTenantAdmin = useMemo(() => {
    if (isPlatformAdmin) return true;
    const r = (userRole || "").toLowerCase().trim();
    return ["admin", "tenant_admin", "owner", "superadmin"].includes(r);
  }, [userRole, isPlatformAdmin]);

  const isManager = useMemo(() => {
    if (isTenantAdmin) return true;
    const r = (userRole || "").toLowerCase().trim();
    return ["manager", "supervisor", "lead", "team_lead"].includes(r);
  }, [userRole, isTenantAdmin]);

  // Centralized permission evaluator
  const canAccessAction = (item: QuickActionItem): boolean => {
    // 1. Platform admin action gate
    if (item.minRoleLevel === "platform_admin" && !isPlatformAdmin) {
      return false;
    }

    // Platform admin gets full access to all shortcuts
    if (isPlatformAdmin) {
      return true;
    }

    // Never show platform admin shortcuts to tenant users
    if (item.category === "platform") {
      return false;
    }

    // 2. Module check
    if (item.requiredModule && !hasModule(item.requiredModule)) {
      return false;
    }

    // 3. Role level check
    if (item.minRoleLevel === "admin" && !isTenantAdmin) {
      return false;
    }
    if (item.minRoleLevel === "manager" && !isManager) {
      return false;
    }

    // 4. Fine-grained permission check
    if (item.requiredPermission) {
      // If tenant admin, default to granted unless explicitly denied
      if (isTenantAdmin) return true;

      if (hasPermission(item.requiredPermission)) return true;

      // Check store permissions category/fields
      if (storePermissions) {
        if (Array.isArray(storePermissions)) {
          if (storePermissions.includes(item.requiredPermission) || storePermissions.includes("*")) {
            return true;
          }
        } else if (typeof storePermissions === "object") {
          const [cat, action] = item.requiredPermission.split(".");
          if (storePermissions[cat]) {
            if (storePermissions[cat].all || storePermissions[cat][action] || storePermissions[cat].view) {
              return true;
            }
          }
        }
      }

      return false;
    }

    return true;
  };

  const authorizedActions = useMemo(() => {
    return QUICK_ACTIONS_REGISTRY.filter(canAccessAction);
  }, [userRole, isPlatformAdmin, isTenantAdmin, isManager, storePermissions]);

  const filteredActions = useMemo(() => {
    if (selectedFilter === "all") return authorizedActions;
    return authorizedActions.filter((a) => a.category === selectedFilter);
  }, [authorizedActions, selectedFilter]);

  if (authorizedActions.length === 0) {
    return null;
  }

  const filterTabs = [
    { id: "all", label: "All Shortcuts" },
    ...(isTenantAdmin ? [{ id: "admin", label: "Administration" }] : []),
    { id: "operations", label: "Operations & CRM" },
    { id: "self", label: "My Actions" },
    ...(isPlatformAdmin ? [{ id: "platform", label: "Platform Admin" }] : []),
  ];

  return (
    <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Quick Actions & Shortcuts
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {authorizedActions.length} available
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Frequently accessed administration tools and daily workflow actions
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedFilter === tab.id
                  ? "bg-red-700 text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.path}
              className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition duration-150 hover:shadow-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              aria-label={action.label}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 group-hover:text-red-700 dark:group-hover:text-red-400 group-hover:border-red-200 dark:group-hover:border-red-900/50 transition">
                  <Icon size={16} />
                </div>
                {action.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                    {action.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400 transition truncate">
                  {action.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {action.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-400 group-hover:text-red-700 dark:group-hover:text-red-400 transition">
                <span>Open</span>
                <ChevronRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
