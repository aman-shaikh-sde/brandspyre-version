/**
 * Centralized Module Registry and Normalizer
 * Enforces unified uppercase canonical module identifiers across sidebar, quick actions,
 * route guards, permissions, and organization subscription settings.
 */

export const CANONICAL_MODULES = {
  DASHBOARD: "DASHBOARD",
  ORGANIZATION: "ORGANIZATION",
  NOTIFICATIONS: "NOTIFICATIONS",
  CRM: "CRM",
  CLIENTS: "CLIENTS",
  PROJECTS: "PROJECTS",
  HRMS: "HRMS",
  FINANCE: "FINANCE",
  SALES: "SALES",
  PURCHASE: "PURCHASE",
  INVENTORY: "INVENTORY",
  PRODUCTS: "PRODUCTS",
  POS: "POS",
  PRODUCTION: "PRODUCTION",
  BILLING: "BILLING",
  LEAD_EXCHANGE: "LEAD_EXCHANGE",
  REFERRALS: "REFERRALS",
  MEETINGS: "MEETINGS",
  AI_ASSISTANT: "AI_ASSISTANT",
  DOCUMENTS: "DOCUMENTS",
  REPORTS: "REPORTS",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
} as const;

export type CanonicalModuleCode = keyof typeof CANONICAL_MODULES;

const MODULE_ALIASES: Record<string, CanonicalModuleCode> = {
  // CRM & Clients
  crm: "CRM",
  client: "CLIENTS",
  clients: "CLIENTS",
  customer: "CLIENTS",
  customers: "CLIENTS",
  lead: "CRM",
  leads: "CRM",

  // Projects & Tasks
  project: "PROJECTS",
  projects: "PROJECTS",
  task: "PROJECTS",
  tasks: "PROJECTS",

  // HRMS & Employees
  hrms: "HRMS",
  hr: "HRMS",
  employee: "HRMS",
  employees: "HRMS",
  staff: "HRMS",
  workforce: "HRMS",

  // Finance & Accounts
  finance: "FINANCE",
  accounts: "FINANCE",
  accounting: "FINANCE",

  // Sales & Orders
  sales: "SALES",
  sale: "SALES",
  sales_orders: "SALES",
  orders: "SALES",

  // Procurement & Purchases
  purchase: "PURCHASE",
  purchases: "PURCHASE",
  procurement: "PURCHASE",

  // Inventory & Stock
  inventory: "INVENTORY",
  stock: "INVENTORY",
  warehouse: "INVENTORY",

  // Products
  product: "PRODUCTS",
  products: "PRODUCTS",
  catalog: "PRODUCTS",

  // Point of Sale
  pos: "POS",
  point_of_sale: "POS",
  retail: "POS",

  // Production & Manufacturing
  production: "PRODUCTION",
  manufacturing: "PRODUCTION",

  // Billing
  billing: "BILLING",
  commercial_billing: "BILLING",

  // Lead Exchange & Referrals
  lead_exchange: "LEAD_EXCHANGE",
  "lead-exchange": "LEAD_EXCHANGE",
  referral: "REFERRALS",
  referrals: "REFERRALS",
  referral_network: "REFERRALS",

  // Meetings
  meeting: "MEETINGS",
  meetings: "MEETINGS",
  video: "MEETINGS",

  // AI
  ai: "AI_ASSISTANT",
  ai_assistant: "AI_ASSISTANT",
  "ai-assistant": "AI_ASSISTANT",

  // Documents & Templates
  document: "DOCUMENTS",
  documents: "DOCUMENTS",
  templates: "DOCUMENTS",

  // Reports
  report: "REPORTS",
  reports: "REPORTS",
  analytics: "REPORTS",

  // Core & Platform
  dashboard: "DASHBOARD",
  organization: "ORGANIZATION",
  platform: "PLATFORM_ADMIN",
  platform_admin: "PLATFORM_ADMIN",
};

/**
 * Normalizes any module string (e.g. "hrms", "HR", "clients", "CRM")
 * to its canonical uppercase module code.
 */
export function normalizeModule(rawCode?: string | null): string {
  if (!rawCode) return "";
  const cleaned = rawCode.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (MODULE_ALIASES[cleaned]) {
    return MODULE_ALIASES[cleaned];
  }
  return rawCode.toUpperCase().trim();
}

/**
 * Checks if a module is enabled within an array of enabled modules.
 */
export function isModuleEnabled(enabledModules: string[] = [], targetModule: string): boolean {
  if (!targetModule) return true;
  const canonicalTarget = normalizeModule(targetModule);

  // Core modules are always enabled
  if (["DASHBOARD", "ORGANIZATION", "NOTIFICATIONS"].includes(canonicalTarget)) {
    return true;
  }

  const canonicalEnabled = new Set(enabledModules.map(m => normalizeModule(m)));
  return canonicalEnabled.has(canonicalTarget);
}
