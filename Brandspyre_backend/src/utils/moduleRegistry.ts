/**
 * Backend Canonical Module Registry & Normalizer
 * Provides authoritative module code matching for backend authorization and licensing checks.
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
  crm: "CRM",
  client: "CLIENTS",
  clients: "CLIENTS",
  customer: "CLIENTS",
  customers: "CLIENTS",
  lead: "CRM",
  leads: "CRM",
  project: "PROJECTS",
  projects: "PROJECTS",
  task: "PROJECTS",
  tasks: "PROJECTS",
  hrms: "HRMS",
  hr: "HRMS",
  employee: "HRMS",
  employees: "HRMS",
  staff: "HRMS",
  workforce: "HRMS",
  finance: "FINANCE",
  accounts: "FINANCE",
  accounting: "FINANCE",
  sales: "SALES",
  sale: "SALES",
  purchase: "PURCHASE",
  purchases: "PURCHASE",
  procurement: "PURCHASE",
  inventory: "INVENTORY",
  stock: "INVENTORY",
  warehouse: "INVENTORY",
  product: "PRODUCTS",
  products: "PRODUCTS",
  pos: "POS",
  point_of_sale: "POS",
  retail: "POS",
  production: "PRODUCTION",
  billing: "BILLING",
  lead_exchange: "LEAD_EXCHANGE",
  referral: "REFERRALS",
  referrals: "REFERRALS",
  meeting: "MEETINGS",
  meetings: "MEETINGS",
  ai: "AI_ASSISTANT",
  ai_assistant: "AI_ASSISTANT",
  document: "DOCUMENTS",
  documents: "DOCUMENTS",
  report: "REPORTS",
  reports: "REPORTS",
  dashboard: "DASHBOARD",
  organization: "ORGANIZATION",
  platform: "PLATFORM_ADMIN",
  platform_admin: "PLATFORM_ADMIN",
};

export function normalizeModule(rawCode?: string | null): string {
  if (!rawCode) return "";
  const cleaned = rawCode.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (MODULE_ALIASES[cleaned]) {
    return MODULE_ALIASES[cleaned];
  }
  return rawCode.toUpperCase().trim();
}
