import mongoose from 'mongoose';
import {
  Industry,
  Module,
  Feature,
  IndustryModule,
  IndustryFeature,
  ModuleDependency,
  PlanModuleAllowance
} from './ModelSceham/industryModuleSchema';
import { SubscriptionPlan } from './ModelSceham/saasSchema';

// ============================================================
// INDUSTRY DEFINITIONS
// ============================================================
const INDUSTRIES = [
  { code: 'IT_SOFTWARE', name: 'IT & Software', description: 'Software development, IT services, SaaS companies', icon: 'Monitor', display_modules: 'CRM • Projects • HRMS • Meetings', sort_order: 1 },
  { code: 'RETAIL_SUPERMARKET', name: 'Retail / Supermarket', description: 'Retail stores, supermarkets, chain stores', icon: 'ShoppingCart', display_modules: 'POS • Sales • Inventory • Purchase', sort_order: 2 },
  { code: 'MANUFACTURING', name: 'Manufacturing', description: 'Product manufacturing, assembly, production', icon: 'Factory', display_modules: 'Inventory • Purchase • Production • Sales', sort_order: 3 },
  { code: 'TRADING_DISTRIBUTION', name: 'Trading / Distribution', description: 'Wholesale trading, distribution, import/export', icon: 'Truck', display_modules: 'Sales • Purchase • Inventory • Customers', sort_order: 4 },
  { code: 'PROFESSIONAL_SERVICES', name: 'Professional Services', description: 'Consulting, legal, accounting, architecture firms', icon: 'Briefcase', display_modules: 'CRM • Projects • Billing • HRMS', sort_order: 5 },
  { code: 'CONSTRUCTION', name: 'Construction', description: 'Construction, real estate, infrastructure', icon: 'Building2', display_modules: 'Projects • Billing • HRMS • Finance', sort_order: 6 },
  { code: 'HEALTHCARE', name: 'Healthcare', description: 'Hospitals, clinics, healthcare services', icon: 'Heart', display_modules: 'HRMS • Finance • Inventory • Reports', sort_order: 7 },
  { code: 'EDUCATION', name: 'Education', description: 'Schools, universities, training institutes', icon: 'GraduationCap', display_modules: 'HRMS • Finance • Reports • Meetings', sort_order: 8 },
  { code: 'OTHER', name: 'Other', description: 'Other business types', icon: 'LayoutGrid', display_modules: 'CRM • Projects • HRMS • Finance', sort_order: 99 }
];

// ============================================================
// MODULE DEFINITIONS — Mapped to existing routes/controllers
// ============================================================
const MODULES = [
  // === CORE (cannot be disabled) ===
  { code: 'DASHBOARD', name: 'Dashboard', description: 'Central business dashboard and analytics overview', category: 'CORE', icon: 'Home', base_route: '/', sort_order: 1, is_core: true, is_future: false },
  { code: 'ORGANIZATION', name: 'Organization & Settings', description: 'Branch management, system settings, roles & permissions', category: 'CORE', icon: 'Settings', base_route: '/settings', sort_order: 2, is_core: true, is_future: false },
  { code: 'NOTIFICATIONS', name: 'Notifications', description: 'In-app notifications and alerts', category: 'CORE', icon: 'Bell', base_route: '/notification', sort_order: 3, is_core: true, is_future: false },

  // === CRM ===
  { code: 'CRM', name: 'CRM & Lead Management', description: 'Lead tracking, campaigns, lead conversions and pipeline management', category: 'CRM', icon: 'Target', base_route: '/leads', sort_order: 10, is_core: false, is_future: false },
  { code: 'CLIENTS', name: 'Client Management', description: 'Client database, profiles, and relationship management', category: 'CRM', icon: 'Contact', base_route: '/client', sort_order: 11, is_core: false, is_future: false },

  // === SALES ===
  { code: 'SALES', name: 'Sales & Quotations', description: 'Quotations, sales orders, and sales pipeline', category: 'SALES', icon: 'ShoppingBag', base_route: '/sales', sort_order: 20, is_core: false, is_future: false },

  // === PROJECTS ===
  { code: 'PROJECTS', name: 'Project Management', description: 'Projects, milestones, tasks, and timesheets', category: 'PROJECTS', icon: 'FolderKanban', base_route: '/project', sort_order: 30, is_core: false, is_future: false },

  // === HRMS ===
  { code: 'HRMS', name: 'Human Resources', description: 'Employee management, attendance, leaves, teams, and timesheets', category: 'HRMS', icon: 'Users', base_route: '/employee', sort_order: 40, is_core: false, is_future: false },

  // === FINANCE ===
  { code: 'FINANCE', name: 'Finance & Accounts', description: 'Invoicing, accounts, payments, and financial reports', category: 'FINANCE', icon: 'Calculator', base_route: '/account', sort_order: 50, is_core: false, is_future: false },

  // === COLLABORATION ===
  { code: 'MEETINGS', name: 'Meetings & Calendar', description: 'Video meetings, calendar, events, and minutes of meeting', category: 'COLLABORATION', icon: 'Video', base_route: '/meetings', sort_order: 60, is_core: false, is_future: false },
  { code: 'AI_ASSISTANT', name: 'AI Assistant', description: 'AI-powered business assistant and reports', category: 'COLLABORATION', icon: 'Sparkles', base_route: '/ai-assistant', sort_order: 61, is_core: false, is_future: false },

  // === COMMERCIAL ===
  { code: 'BILLING', name: 'Commercial & B2B Billing', description: 'Master contracts, agreements, billable transactions, and disputes', category: 'COMMERCIAL', icon: 'Briefcase', base_route: '/billing', sort_order: 70, is_core: false, is_future: false },
  { code: 'LEAD_EXCHANGE', name: 'Lead Exchange', description: 'Multi-organization lead sharing, settlements, and commercial relationships', category: 'COMMERCIAL', icon: 'ArrowLeftRight', base_route: '/lead-exchange', sort_order: 71, is_core: false, is_future: false },

  // === DOCUMENTS ===
  { code: 'DOCUMENTS', name: 'Document Templates', description: 'Offer letters, joining letters, certificates, and custom document templates', category: 'DOCUMENTS', icon: 'FileText', base_route: '/settings/document-templates', sort_order: 80, is_core: false, is_future: false },

  // === REPORTS ===
  { code: 'REPORTS', name: 'Reports & Analytics', description: 'Business reports, employee reports, and analytics', category: 'REPORTS', icon: 'PieChart', base_route: '/reportAnaysis', sort_order: 90, is_core: false, is_future: false },

  // === COMMERCE & INVENTORY MODULES ===
  { code: 'PRODUCTS', name: 'Products & Catalog', description: 'Product master catalog, SKUs, barcodes, and variants', category: 'OPERATIONS', icon: 'Package', base_route: '/products', sort_order: 95, is_core: false, is_future: false },
  { code: 'INVENTORY', name: 'Inventory & Warehouse', description: 'Stock management, warehouses, transfers, and barcode tracking', category: 'OPERATIONS', icon: 'Layers', base_route: '/inventory', sort_order: 100, is_core: false, is_future: false },
  { code: 'PURCHASE', name: 'Purchase & Procurement', description: 'Purchase orders, vendor management, and procurement workflow', category: 'OPERATIONS', icon: 'ShoppingCart', base_route: '/purchases', sort_order: 110, is_core: false, is_future: false },
  { code: 'POS', name: 'Point of Sale', description: 'Retail billing, cash management, and POS sessions', category: 'OPERATIONS', icon: 'Monitor', base_route: '/pos', sort_order: 120, is_core: false, is_future: false },
  { code: 'PRODUCTION', name: 'Production & Manufacturing', description: 'Bill of materials, production orders, and work orders', category: 'PRODUCTION', icon: 'Factory', base_route: '/production', sort_order: 130, is_core: false, is_future: false },
];

// ============================================================
// FEATURE DEFINITIONS — Granular sub-features per module
// ============================================================
const FEATURES: Array<{ module_code: string; code: string; name: string; description: string; is_default: boolean; is_future: boolean; sort_order: number }> = [
  // CRM Features
  { module_code: 'CRM', code: 'CRM_LEADS', name: 'Lead Management', description: 'Create, track, and manage sales leads', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'CRM', code: 'CRM_CAMPAIGNS', name: 'Campaigns', description: 'Sales and marketing campaign management', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'CRM', code: 'CRM_LEAD_CONVERSION', name: 'Lead Conversion', description: 'Convert leads to clients with tracking', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'CRM', code: 'CRM_LEAD_SCORING', name: 'Lead Scoring', description: 'Automated lead scoring and prioritization', is_default: false, is_future: true, sort_order: 4 },

  // CLIENT Features
  { module_code: 'CLIENTS', code: 'CLIENTS_MANAGEMENT', name: 'Client Database', description: 'Client profiles and contact management', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'CLIENTS', code: 'CLIENTS_NOTES', name: 'Client Notes', description: 'Notes and interaction history per client', is_default: true, is_future: false, sort_order: 2 },

  // PROJECT Features
  { module_code: 'PROJECTS', code: 'PROJECTS_MANAGEMENT', name: 'Project Management', description: 'Create and manage projects with timelines', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'PROJECTS', code: 'PROJECTS_MILESTONES', name: 'Milestones', description: 'Project milestone tracking and payments', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'PROJECTS', code: 'PROJECTS_TASKS', name: 'Task Management', description: 'Task assignment, tracking, and completion', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'PROJECTS', code: 'PROJECTS_TIMESHEETS', name: 'Timesheets', description: 'Employee time tracking per project', is_default: true, is_future: false, sort_order: 4 },

  // HRMS Features
  { module_code: 'HRMS', code: 'HRMS_EMPLOYEES', name: 'Employee Management', description: 'Employee records, profiles, and documents', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'HRMS', code: 'HRMS_ATTENDANCE', name: 'Attendance', description: 'Employee attendance tracking and reports', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'HRMS', code: 'HRMS_LEAVES', name: 'Leave Management', description: 'Leave applications, approvals, and balances', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'HRMS', code: 'HRMS_TEAMS', name: 'Teams', description: 'Team management and organization structure', is_default: true, is_future: false, sort_order: 4 },
  { module_code: 'HRMS', code: 'HRMS_PAYROLL', name: 'Payroll', description: 'Salary structure, payslips, and payroll processing', is_default: false, is_future: false, sort_order: 5 },
  { module_code: 'HRMS', code: 'HRMS_EMPLOYEE_REPORTS', name: 'Employee Reports', description: 'Employee analytics and reporting', is_default: true, is_future: false, sort_order: 6 },

  // FINANCE Features
  { module_code: 'FINANCE', code: 'FINANCE_INVOICES', name: 'Invoicing', description: 'Create, manage, and track invoices', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'FINANCE', code: 'FINANCE_ACCOUNTS', name: 'Accounts Overview', description: 'Chart of accounts and account management', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'FINANCE', code: 'FINANCE_PAYMENTS', name: 'Payment Tracking', description: 'Payment recording and reconciliation', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'FINANCE', code: 'FINANCE_GST', name: 'GST Compliance', description: 'GST calculation, reports, and filing support', is_default: false, is_future: false, sort_order: 4 },

  // MEETINGS Features
  { module_code: 'MEETINGS', code: 'MEETINGS_VIDEO', name: 'Video Meetings', description: 'Host and join video conference meetings', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'MEETINGS', code: 'MEETINGS_CALENDAR', name: 'Calendar', description: 'Event calendar and scheduling', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'MEETINGS', code: 'MEETINGS_MOM', name: 'Minutes of Meeting', description: 'Meeting notes, action items, and follow-ups', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'MEETINGS', code: 'MEETINGS_INTER_ORG', name: 'Inter-Organization Meetings', description: 'Cross-organization meeting invitations', is_default: false, is_future: false, sort_order: 4 },

  // AI Features
  { module_code: 'AI_ASSISTANT', code: 'AI_CHAT', name: 'AI Chat Assistant', description: 'AI-powered business chat assistant', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'AI_ASSISTANT', code: 'AI_REPORTS', name: 'AI Reports', description: 'AI-generated business insights and reports', is_default: true, is_future: false, sort_order: 2 },

  // BILLING Features
  { module_code: 'BILLING', code: 'BILLING_CONTRACTS', name: 'Master Contracts', description: 'B2B contract management', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'BILLING', code: 'BILLING_AGREEMENTS', name: 'Agreements', description: 'Service agreements and SLAs', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'BILLING', code: 'BILLING_TRANSACTIONS', name: 'Billable Transactions', description: 'Transaction ledger and billing events', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'BILLING', code: 'BILLING_DISPUTES', name: 'Dispute Management', description: 'Billing dispute resolution workflow', is_default: false, is_future: false, sort_order: 4 },

  // LEAD EXCHANGE Features
  { module_code: 'LEAD_EXCHANGE', code: 'LEAD_EXCHANGE_RELATIONSHIPS', name: 'Tenant Relationships', description: 'Inter-organization commercial relationships', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'LEAD_EXCHANGE', code: 'LEAD_EXCHANGE_SHARED_LEADS', name: 'Shared Leads', description: 'Cross-organization lead sharing', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'LEAD_EXCHANGE', code: 'LEAD_EXCHANGE_SETTLEMENTS', name: 'Settlement Ledger', description: 'Inter-organization financial settlements', is_default: true, is_future: false, sort_order: 3 },

  // DOCUMENTS Features
  { module_code: 'DOCUMENTS', code: 'DOCUMENTS_TEMPLATES', name: 'Document Templates', description: 'Custom document template builder', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'DOCUMENTS', code: 'DOCUMENTS_OFFER_LETTER', name: 'Offer Letters', description: 'Employee offer letter generation', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'DOCUMENTS', code: 'DOCUMENTS_JOINING_LETTER', name: 'Joining Letters', description: 'Employee joining letter generation', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'DOCUMENTS', code: 'DOCUMENTS_CERTIFICATES', name: 'Certificates', description: 'Experience and completion certificates', is_default: true, is_future: false, sort_order: 4 },

  // REPORTS Features
  { module_code: 'REPORTS', code: 'REPORTS_ANALYTICS', name: 'Business Analytics', description: 'Comprehensive business analytics dashboard', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'REPORTS', code: 'REPORTS_EXPORT', name: 'Report Export', description: 'Export reports to Excel, PDF, and CSV', is_default: true, is_future: false, sort_order: 2 },

  // SALES Features (active)
  { module_code: 'SALES', code: 'SALES_QUOTATIONS', name: 'Quotations', description: 'Sales quotation creation and management', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'SALES', code: 'SALES_ORDERS', name: 'Sales Orders', description: 'Sales order processing and tracking', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'SALES', code: 'SALES_INVOICES', name: 'Sales Invoices', description: 'Invoice generation from sales orders', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'SALES', code: 'SALES_RETURNS', name: 'Sales Returns', description: 'Sales return and credit note management', is_default: false, is_future: false, sort_order: 4 },

  // INVENTORY Features (active)
  { module_code: 'INVENTORY', code: 'INVENTORY_PRODUCTS', name: 'Products', description: 'Product catalog and management', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'INVENTORY', code: 'INVENTORY_WAREHOUSES', name: 'Warehouses', description: 'Multi-warehouse management', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'INVENTORY', code: 'INVENTORY_STOCK', name: 'Stock Management', description: 'Real-time stock levels and tracking', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'INVENTORY', code: 'INVENTORY_STOCK_TRANSFER', name: 'Stock Transfer', description: 'Inter-warehouse stock transfers', is_default: true, is_future: false, sort_order: 4 },
  { module_code: 'INVENTORY', code: 'INVENTORY_BARCODE', name: 'Barcode', description: 'Barcode scanning and label printing', is_default: false, is_future: false, sort_order: 5 },
  { module_code: 'INVENTORY', code: 'INVENTORY_BATCH', name: 'Batch Tracking', description: 'Batch number tracking for products', is_default: false, is_future: false, sort_order: 6 },
  { module_code: 'INVENTORY', code: 'INVENTORY_EXPIRY', name: 'Expiry Tracking', description: 'Product expiry date tracking and alerts', is_default: false, is_future: false, sort_order: 7 },

  // PURCHASE Features (active)
  { module_code: 'PURCHASE', code: 'PURCHASE_VENDORS', name: 'Vendor Management', description: 'Vendor database and profiles', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'PURCHASE', code: 'PURCHASE_ORDERS', name: 'Purchase Orders', description: 'Purchase order creation and approval', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'PURCHASE', code: 'PURCHASE_RETURNS', name: 'Purchase Returns', description: 'Purchase return and debit note management', is_default: false, is_future: false, sort_order: 3 },

  // POS Features (active)
  { module_code: 'POS', code: 'POS_BILLING', name: 'POS Billing', description: 'Point of sale billing interface', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'POS', code: 'POS_SESSION', name: 'POS Sessions', description: 'Cashier session management', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'POS', code: 'POS_CASH_MANAGEMENT', name: 'Cash Management', description: 'Cash drawer and denomination tracking', is_default: true, is_future: false, sort_order: 3 },
  { module_code: 'POS', code: 'POS_RETURNS', name: 'POS Returns', description: 'Returns and exchanges at POS', is_default: false, is_future: false, sort_order: 4 },

  // PRODUCTION Features
  { module_code: 'PRODUCTION', code: 'PRODUCTION_BOM', name: 'Bill of Materials', description: 'Bill of materials definition and management', is_default: true, is_future: false, sort_order: 1 },
  { module_code: 'PRODUCTION', code: 'PRODUCTION_ORDERS', name: 'Production Orders', description: 'Production order creation and tracking', is_default: true, is_future: false, sort_order: 2 },
  { module_code: 'PRODUCTION', code: 'PRODUCTION_WORK_ORDERS', name: 'Work Orders', description: 'Work order management and scheduling', is_default: true, is_future: false, sort_order: 3 },
];

// ============================================================
// MODULE DEPENDENCIES
// ============================================================
const MODULE_DEPENDENCIES = [
  { module_code: 'INVENTORY', required_module_code: 'PRODUCTS' },
  { module_code: 'SALES', required_module_code: 'CLIENTS' },
  { module_code: 'BILLING', required_module_code: 'CLIENTS' },
  { module_code: 'LEAD_EXCHANGE', required_module_code: 'CRM' },
  { module_code: 'POS', required_module_code: 'INVENTORY' },
  { module_code: 'POS', required_module_code: 'SALES' },
  { module_code: 'PRODUCTION', required_module_code: 'INVENTORY' },
  { module_code: 'DOCUMENTS', required_module_code: 'HRMS' },
];

// ============================================================
// INDUSTRY → MODULE RECOMMENDATIONS
// ============================================================
const INDUSTRY_MODULE_MAP: Record<string, string[]> = {
  IT_SOFTWARE: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'FINANCE', 'DOCUMENTS', 'REPORTS'],
  RETAIL_SUPERMARKET: ['SALES', 'INVENTORY', 'POS', 'PURCHASE', 'CLIENTS', 'HRMS', 'FINANCE', 'REPORTS'],
  MANUFACTURING: ['INVENTORY', 'PURCHASE', 'PRODUCTION', 'SALES', 'CLIENTS', 'HRMS', 'FINANCE', 'REPORTS'],
  TRADING_DISTRIBUTION: ['SALES', 'PURCHASE', 'INVENTORY', 'CLIENTS', 'CRM', 'HRMS', 'FINANCE', 'REPORTS'],
  PROFESSIONAL_SERVICES: ['CRM', 'CLIENTS', 'PROJECTS', 'BILLING', 'HRMS', 'MEETINGS', 'FINANCE', 'DOCUMENTS', 'REPORTS'],
  CONSTRUCTION: ['PROJECTS', 'BILLING', 'HRMS', 'FINANCE', 'CLIENTS', 'MEETINGS', 'DOCUMENTS', 'REPORTS'],
  HEALTHCARE: ['HRMS', 'FINANCE', 'INVENTORY', 'CLIENTS', 'MEETINGS', 'REPORTS'],
  EDUCATION: ['HRMS', 'FINANCE', 'MEETINGS', 'REPORTS', 'DOCUMENTS'],
  OTHER: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'REPORTS'],
};

// ============================================================
// INDUSTRY → FEATURE RECOMMENDATIONS (non-default features to recommend)
// ============================================================
const INDUSTRY_FEATURE_MAP: Record<string, string[]> = {
  RETAIL_SUPERMARKET: ['INVENTORY_BARCODE', 'INVENTORY_BATCH', 'INVENTORY_EXPIRY', 'POS_RETURNS', 'SALES_RETURNS', 'FINANCE_GST'],
  MANUFACTURING: ['INVENTORY_BATCH', 'INVENTORY_BARCODE', 'PURCHASE_RETURNS', 'SALES_RETURNS', 'FINANCE_GST'],
  TRADING_DISTRIBUTION: ['INVENTORY_BARCODE', 'SALES_RETURNS', 'PURCHASE_RETURNS', 'FINANCE_GST'],
  PROFESSIONAL_SERVICES: ['BILLING_DISPUTES', 'MEETINGS_INTER_ORG', 'FINANCE_GST'],
  CONSTRUCTION: ['BILLING_DISPUTES', 'MEETINGS_INTER_ORG'],
  IT_SOFTWARE: ['MEETINGS_INTER_ORG', 'CRM_LEAD_SCORING'],
  HEALTHCARE: ['INVENTORY_BATCH', 'INVENTORY_EXPIRY'],
  EDUCATION: [],
  OTHER: [],
};

// ============================================================
// PLAN → MODULE ALLOWANCES (migrated from SubscriptionPlan.modules{})
// ============================================================
const PLAN_MODULE_MAP: Record<string, string[]> = {
  trial: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'LEAD_EXCHANGE', 'DOCUMENTS', 'REPORTS', 'EVENT_MANAGEMENT'],
  starter: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'REPORTS'],
  professional: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'LEAD_EXCHANGE', 'DOCUMENTS', 'REPORTS', 'SALES', 'INVENTORY', 'PURCHASE', 'EVENT_MANAGEMENT'],
  business: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'LEAD_EXCHANGE', 'DOCUMENTS', 'REPORTS', 'SALES', 'INVENTORY', 'PURCHASE', 'POS', 'PRODUCTION', 'EVENT_MANAGEMENT'],
  enterprise: ['CRM', 'CLIENTS', 'PROJECTS', 'HRMS', 'FINANCE', 'MEETINGS', 'AI_ASSISTANT', 'BILLING', 'LEAD_EXCHANGE', 'DOCUMENTS', 'REPORTS', 'SALES', 'INVENTORY', 'PURCHASE', 'POS', 'PRODUCTION', 'EVENT_MANAGEMENT'],
};

// ============================================================
// SEED ORCHESTRATOR
// ============================================================
export async function seedIndustryModuleData(): Promise<void> {
  try {
    console.log('🔄 Seeding industry, module, feature, and dependency data...');

    // --- 1. Industries ---
    const industryDocs: Record<string, any> = {};
    for (const ind of INDUSTRIES) {
      const doc = await Industry.findOneAndUpdate(
        { code: ind.code },
        { ...ind, updated_at: new Date() },
        { upsert: true, new: true }
      );
      industryDocs[ind.code] = doc;
    }
    console.log(`  ✅ ${INDUSTRIES.length} industries seeded.`);

    // --- 2. Modules ---
    const moduleDocs: Record<string, any> = {};
    for (const mod of MODULES) {
      const doc = await Module.findOneAndUpdate(
        { code: mod.code },
        { ...mod, updated_at: new Date() },
        { upsert: true, new: true }
      );
      moduleDocs[mod.code] = doc;
    }
    console.log(`  ✅ ${MODULES.length} modules seeded.`);

    // --- 3. Features ---
    let featureCount = 0;
    const featureDocs: Record<string, any> = {};
    for (const feat of FEATURES) {
      const moduleDoc = moduleDocs[feat.module_code];
      if (!moduleDoc) {
        console.warn(`  ⚠️ Module '${feat.module_code}' not found for feature '${feat.code}', skipping.`);
        continue;
      }
      const doc = await Feature.findOneAndUpdate(
        { code: feat.code },
        {
          module_id: moduleDoc._id,
          module_code: feat.module_code,
          code: feat.code,
          name: feat.name,
          description: feat.description,
          is_default: feat.is_default,
          is_future: feat.is_future,
          sort_order: feat.sort_order,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );
      featureDocs[feat.code] = doc;
      featureCount++;
    }
    console.log(`  ✅ ${featureCount} features seeded.`);

    // --- 4. Industry → Module Recommendations ---
    let imCount = 0;
    for (const [industryCode, moduleCodes] of Object.entries(INDUSTRY_MODULE_MAP)) {
      const industryDoc = industryDocs[industryCode];
      if (!industryDoc) continue;
      for (let i = 0; i < moduleCodes.length; i++) {
        const moduleDoc = moduleDocs[moduleCodes[i]];
        if (!moduleDoc) continue;
        await IndustryModule.findOneAndUpdate(
          { industry_code: industryCode, module_code: moduleCodes[i] },
          {
            industry_id: industryDoc._id,
            industry_code: industryCode,
            module_id: moduleDoc._id,
            module_code: moduleCodes[i],
            is_recommended: true,
            sort_order: i
          },
          { upsert: true, new: true }
        );
        imCount++;
      }
    }
    console.log(`  ✅ ${imCount} industry-module recommendations seeded.`);

    // --- 5. Industry → Feature Recommendations ---
    let ifCount = 0;
    for (const [industryCode, featureCodes] of Object.entries(INDUSTRY_FEATURE_MAP)) {
      const industryDoc = industryDocs[industryCode];
      if (!industryDoc) continue;
      for (const featureCode of featureCodes) {
        const featureDoc = featureDocs[featureCode];
        if (!featureDoc) continue;
        await IndustryFeature.findOneAndUpdate(
          { industry_code: industryCode, feature_code: featureCode },
          {
            industry_id: industryDoc._id,
            industry_code: industryCode,
            feature_id: featureDoc._id,
            feature_code: featureCode,
            is_recommended: true
          },
          { upsert: true, new: true }
        );
        ifCount++;
      }
    }
    console.log(`  ✅ ${ifCount} industry-feature recommendations seeded.`);

    // --- 6. Module Dependencies ---
    let depCount = 0;
    for (const dep of MODULE_DEPENDENCIES) {
      const moduleDoc = moduleDocs[dep.module_code];
      const requiredDoc = moduleDocs[dep.required_module_code];
      if (!moduleDoc || !requiredDoc) continue;
      await ModuleDependency.findOneAndUpdate(
        { module_code: dep.module_code, required_module_code: dep.required_module_code },
        {
          module_id: moduleDoc._id,
          module_code: dep.module_code,
          required_module_id: requiredDoc._id,
          required_module_code: dep.required_module_code
        },
        { upsert: true, new: true }
      );
      depCount++;
    }
    console.log(`  ✅ ${depCount} module dependencies seeded.`);

    // --- 7. Plan → Module Allowances ---
    let planCount = 0;
    const existingPlans = await SubscriptionPlan.find({ is_active: true });
    for (const plan of existingPlans) {
      const allowedModules = PLAN_MODULE_MAP[plan.plan_code] || PLAN_MODULE_MAP['trial'];
      // Always include CORE modules
      const allAllowed = [...new Set([...allowedModules, 'DASHBOARD', 'ORGANIZATION', 'NOTIFICATIONS'])];
      for (const moduleCode of allAllowed) {
        const moduleDoc = moduleDocs[moduleCode];
        if (!moduleDoc) continue;
        await PlanModuleAllowance.findOneAndUpdate(
          { plan_code: plan.plan_code, module_code: moduleCode },
          {
            plan_id: plan._id,
            plan_code: plan.plan_code,
            module_id: moduleDoc._id,
            module_code: moduleCode,
            is_included: true
          },
          { upsert: true, new: true }
        );
        planCount++;
      }
    }
    console.log(`  ✅ ${planCount} plan-module allowances seeded.`);

    console.log('✅ Industry & Module seed data complete.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error seeding industry/module data: ${message}`);
  }
}

export default seedIndustryModuleData;
