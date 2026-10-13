import { Industry, Module, IndustryModule } from './ModelSceham/industryModuleSchema';
import { BusinessType, BusinessTypeModule } from './ModelSceham/businessTypeSchema';
import { ModulePricing } from './ModelSceham/pricingSchema';

// Module Catalog Definition
export const MODULE_CATALOG = [
  { code: 'CRM', name: 'Sales & CRM', category: 'SALES', base_route: '/leads', is_core: false, sort_order: 1 },
  { code: 'PRODUCTS', name: 'Products & Catalog', category: 'RETAIL', base_route: '/products', is_core: false, sort_order: 2 },
  { code: 'INVENTORY', name: 'Inventory & Warehouse', category: 'RETAIL', base_route: '/inventory', is_core: false, sort_order: 3 },
  { code: 'PURCHASE', name: 'Purchase & Procurement', category: 'RETAIL', base_route: '/purchases', is_core: false, sort_order: 4 },
  { code: 'POS', name: 'Point of Sale', category: 'RETAIL', base_route: '/pos', is_core: false, sort_order: 5 },
  { code: 'PRODUCTION', name: 'Production & Manufacturing', category: 'OPERATIONS', base_route: '/production', is_core: false, sort_order: 6 },
  { code: 'BILLING', name: 'Commercial & B2B Billing', category: 'COMMERCIAL', base_route: '/billing/dashboard', is_core: false, sort_order: 7 },
  { code: 'LEAD_EXCHANGE', name: 'Lead Exchange', category: 'COMMERCIAL', base_route: '/lead-exchange/relationships', is_core: false, sort_order: 8 },
  { code: 'PROJECTS', name: 'Project Management', category: 'PROJECTS', base_route: '/project', is_core: false, sort_order: 9 },
  { code: 'HRMS', name: 'Human Resources', category: 'HRMS', base_route: '/employee', is_core: false, sort_order: 10 },
  { code: 'FINANCE', name: 'Finance & Accounts', category: 'FINANCE', base_route: '/account', is_core: false, sort_order: 11 },
  { code: 'MEETINGS', name: 'Meetings & Calendar', category: 'COLLABORATION', base_route: '/meetings', is_core: false, sort_order: 12 },
  { code: 'AI_ASSISTANT', name: 'AI Assistant', category: 'COLLABORATION', base_route: '/ai-assistant', is_core: false, sort_order: 13 },
  { code: 'ADMINISTRATION', name: 'Administration', category: 'CORE', base_route: '/settings', is_core: true, sort_order: 14 },
  { code: 'EVENT_MANAGEMENT', name: 'Event Management & Ticketing', category: 'COMMERCIAL', base_route: '/event-management', is_core: false, sort_order: 15 }
];

// Business Types Matrix Definition from Business_Platform_Module_Matrix.xlsx
export const BUSINESS_TYPE_MATRIX = [
  {
    code: 'IT_SOFTWARE',
    name: 'IT / Software Company',
    industry_code: 'TECHNOLOGY',
    industry_name: 'Technology',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: '-', POS: '-', PRODUCTION: '-', BILLING: 'R', LEAD_EXCHANGE: 'O', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'IT_SERVICES',
    name: 'IT Services / System Integrator',
    industry_code: 'TECHNOLOGY',
    industry_name: 'Technology',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: 'O', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'DIGITAL_MARKETING',
    name: 'Digital Marketing Agency',
    industry_code: 'PROFESSIONAL_SERVICES',
    industry_name: 'Professional Services',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: '-', POS: '-', PRODUCTION: '-', BILLING: 'R', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'CONSULTING',
    name: 'Consulting Company',
    industry_code: 'PROFESSIONAL_SERVICES',
    industry_name: 'Professional Services',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: '-', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'CONSTRUCTION',
    name: 'Construction Company',
    industry_code: 'CONSTRUCTION',
    industry_name: 'Construction',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'O', PURCHASE: 'R', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'REAL_ESTATE',
    name: 'Real Estate Company',
    industry_code: 'REAL_ESTATE',
    industry_name: 'Real Estate',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'O', PURCHASE: 'R', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'MANUFACTURING',
    name: 'Manufacturing Company',
    industry_code: 'MANUFACTURING',
    industry_name: 'Manufacturing',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: '-', PRODUCTION: 'C', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'R', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'WHOLESALE_DISTRIBUTOR',
    name: 'Wholesale Distributor',
    industry_code: 'DISTRIBUTION',
    industry_name: 'Distribution',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'SUPERMARKET_GROCERY',
    name: 'Supermarket / Grocery Store',
    industry_code: 'RETAIL',
    industry_name: 'Retail',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'O', LEAD_EXCHANGE: '-', PROJECTS: '-', HRMS: 'C', FINANCE: 'C', MEETINGS: 'O', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'GENERAL_RETAIL',
    name: 'General Retail Store',
    industry_code: 'RETAIL',
    industry_name: 'Retail',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'O', LEAD_EXCHANGE: '-', PROJECTS: '-', HRMS: 'C', FINANCE: 'C', MEETINGS: 'O', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'TEXTILE_GARMENT',
    name: 'Textile / Garment Business',
    industry_code: 'TEXTILE_APPAREL',
    industry_name: 'Textile & Apparel',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'O', PRODUCTION: 'C', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'ELECTRONICS_MOBILE',
    name: 'Electronics / Mobile Store',
    industry_code: 'RETAIL',
    industry_name: 'Retail',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'O', LEAD_EXCHANGE: '-', PROJECTS: '-', HRMS: 'C', FINANCE: 'C', MEETINGS: 'O', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'AUTOMOBILE_DEALER',
    name: 'Automobile Dealer / Spare Parts',
    industry_code: 'AUTOMOTIVE',
    industry_name: 'Automotive',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'O', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'PHARMACY_RETAIL',
    name: 'Pharmacy / Medical Retail',
    industry_code: 'HEALTHCARE_RETAIL',
    industry_name: 'Healthcare Retail',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'O', LEAD_EXCHANGE: '-', PROJECTS: '-', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'RESTAURANT_CAFE',
    name: 'Restaurant / Cafe Chain',
    industry_code: 'FOOD_HOSPITALITY',
    industry_name: 'Food & Hospitality',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'O', LEAD_EXCHANGE: '-', PROJECTS: '-', HRMS: 'C', FINANCE: 'C', MEETINGS: 'O', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'LOGISTICS_TRANSPORT',
    name: 'Logistics / Transport Company',
    industry_code: 'LOGISTICS',
    industry_name: 'Logistics',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'C', PURCHASE: 'C', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'COURIER_DELIVERY',
    name: 'Courier / Delivery Company',
    industry_code: 'LOGISTICS',
    industry_name: 'Logistics',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'C', PURCHASE: 'C', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'EDUCATION_INSTITUTE',
    name: 'Education / Training Institute',
    industry_code: 'EDUCATION',
    industry_name: 'Education',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: 'O', POS: '-', PRODUCTION: '-', BILLING: 'R', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'STAFFING_RECRUITMENT',
    name: 'Staffing / Recruitment Agency',
    industry_code: 'HR_SERVICES',
    industry_name: 'HR Services',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: '-', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'TRAVEL_TOUR',
    name: 'Travel / Tour Operator',
    industry_code: 'TRAVEL_HOSPITALITY',
    industry_name: 'Travel & Hospitality',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'O', PURCHASE: 'R', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'EVENT_MANAGEMENT',
    name: 'Event Management Company',
    industry_code: 'EVENTS',
    industry_name: 'Events',
    modules: {
      CRM: 'C', PRODUCTS: 'O', INVENTORY: 'O', PURCHASE: 'R', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'PROFESSIONAL_SERVICES',
    name: 'Professional Services Firm',
    industry_code: 'PROFESSIONAL_SERVICES',
    industry_name: 'Professional Services',
    modules: {
      CRM: 'C', PRODUCTS: '-', INVENTORY: '-', PURCHASE: '-', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'C', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'B2B_TRADING',
    name: 'B2B Trading Company',
    industry_code: 'B2B_COMMERCE',
    industry_name: 'B2B Commerce',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: '-', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'C', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'FRANCHISE_BUSINESS',
    name: 'Franchise Business',
    industry_code: 'MULTI_LOCATION_RETAIL',
    industry_name: 'Multi-location Retail',
    modules: {
      CRM: 'C', PRODUCTS: 'C', INVENTORY: 'C', PURCHASE: 'C', POS: 'C', PRODUCTION: '-', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  },
  {
    code: 'MULTI_BRANCH',
    name: 'Multi-Branch Business',
    industry_code: 'MULTI_LOCATION',
    industry_name: 'Multi-location',
    modules: {
      CRM: 'C', PRODUCTS: 'R', INVENTORY: 'C', PURCHASE: 'C', POS: 'R', PRODUCTION: 'O', BILLING: 'C', LEAD_EXCHANGE: 'R', PROJECTS: 'O', HRMS: 'C', FINANCE: 'C', MEETINGS: 'C', AI_ASSISTANT: 'R', ADMINISTRATION: 'C'
    }
  }
];

export const seedExcelMatrixData = async () => {
  try {
    console.log('🌱 Seeding Excel Business Platform Module Matrix...');

    // 1. Seed Modules
    for (const m of MODULE_CATALOG) {
      await Module.findOneAndUpdate(
        { code: m.code },
        {
          code: m.code,
          name: m.name,
          category: m.category,
          base_route: m.base_route,
          is_core: m.is_core,
          sort_order: m.sort_order,
          is_active: true,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      // Default module add-on pricing configuration
      await ModulePricing.findOneAndUpdate(
        { module_code: m.code },
        {
          module_code: m.code,
          module_name: m.name,
          monthly_price: m.is_core ? 0 : 299,
          yearly_price: m.is_core ? 0 : 2990,
          currency: 'INR',
          is_active: true,
          is_addon_available: !m.is_core,
          display_order: m.sort_order,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // 2. Extract & Seed Industries
    const industryMap = new Map<string, string>();
    BUSINESS_TYPE_MATRIX.forEach((bt) => {
      industryMap.set(bt.industry_code, bt.industry_name);
    });

    let indOrder = 1;
    for (const [indCode, indName] of industryMap.entries()) {
      await Industry.findOneAndUpdate(
        { code: indCode },
        {
          code: indCode,
          name: indName,
          sort_order: indOrder++,
          is_active: true,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // 3. Seed Business Types & Matrix
    let btOrder = 1;
    for (const bt of BUSINESS_TYPE_MATRIX) {
      const btDoc = await BusinessType.findOneAndUpdate(
        { code: bt.code },
        {
          code: bt.code,
          name: bt.name,
          industry_code: bt.industry_code,
          industry_name: bt.industry_name,
          sort_order: btOrder++,
          is_active: true,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      for (const [modCode, app] of Object.entries(bt.modules)) {
        await BusinessTypeModule.findOneAndUpdate(
          { business_type_code: bt.code, module_code: modCode },
          {
            business_type_code: bt.code,
            module_code: modCode,
            applicability: app as 'C' | 'R' | 'O' | '-',
            updated_at: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('✅ Excel Business Platform Module Matrix seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding Excel matrix data:', error);
  }
};
