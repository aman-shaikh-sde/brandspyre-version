import {
  EntityFieldDefinition,
  DashboardWidget,
  DashboardDefinition,
  NavigationDefinition,
  TerminologyDefinition,
  StatusDefinition
} from './ModelSceham/dynamicConfigSchema';

export const seedDynamicConfigData = async () => {
  try {
    // 1. SEED TERMINOLOGY DEFINITIONS
    const terminologies = [
      {
        scope: 'PLATFORM',
        entity_type: 'PRODUCT',
        label: 'Product',
        plural_label: 'Products',
        field_labels: { sku: 'SKU', barcode: 'Barcode', selling_price: 'Selling Price', purchase_price: 'Purchase Price' }
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'MEDICAL_STORE',
        entity_type: 'PRODUCT',
        label: 'Medicine',
        plural_label: 'Medicines',
        field_labels: { sku: 'Batch / Item Code', barcode: 'Barcode / EAN', selling_price: 'MRP / Price', purchase_price: 'Purchase Price' }
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'IT_SOFTWARE',
        entity_type: 'PRODUCT',
        label: 'Service Item',
        plural_label: 'Services & Solutions',
        field_labels: { sku: 'Service Code', barcode: 'Reference ID', selling_price: 'Hourly / Monthly Rate' }
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'MANUFACTURING',
        entity_type: 'PRODUCT',
        label: 'Material',
        plural_label: 'Materials & Components',
        field_labels: { sku: 'Part Code', barcode: 'Lot Tag', selling_price: 'Standard Cost' }
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'RETAIL_SUPERMARKET',
        entity_type: 'PRODUCT',
        label: 'Product',
        plural_label: 'Products & Inventory',
        field_labels: { sku: 'SKU Code', barcode: 'Barcode', selling_price: 'Retail Price' }
      }
    ];

    for (const term of terminologies) {
      const filter: any = { scope: term.scope, entity_type: term.entity_type };
      if (term.industry_code) filter.industry_code = term.industry_code;
      await TerminologyDefinition.findOneAndUpdate(filter, term, { upsert: true, new: true });
    }

    // 2. SEED SYSTEM & INDUSTRY ENTITY FIELD DEFINITIONS
    const productFields = [
      // Standard Product Fields (System)
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'sku', label: 'SKU / Item Code', data_type: 'string', input_type: 'text', required: true, visible: true, editable: true, display_order: 1, section: 'Basic Information', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'name', label: 'Product Name', data_type: 'string', input_type: 'text', required: true, visible: true, editable: true, display_order: 2, section: 'Basic Information', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'barcode', label: 'Barcode / EAN', data_type: 'string', input_type: 'text', required: false, visible: true, editable: true, display_order: 3, section: 'Basic Information', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'purchase_price', label: 'Purchase Price', data_type: 'number', input_type: 'currency', required: false, visible: true, editable: true, display_order: 4, section: 'Pricing & Tax', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'selling_price', label: 'Selling Price / Rate', data_type: 'number', input_type: 'currency', required: true, visible: true, editable: true, display_order: 5, section: 'Pricing & Tax', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'tax_rate', label: 'Tax Rate (%)', data_type: 'number', input_type: 'number', required: false, visible: true, editable: true, display_order: 6, section: 'Pricing & Tax', is_system: true },
      { scope: 'PLATFORM', entity_type: 'PRODUCT', field_code: 'reorder_level', label: 'Reorder Level', data_type: 'number', input_type: 'number', required: false, visible: true, editable: true, display_order: 7, section: 'Inventory Settings', is_system: true },

      // Medical Store Specific Fields
      { scope: 'INDUSTRY', industry_code: 'MEDICAL_STORE', entity_type: 'PRODUCT', field_code: 'generic_name', label: 'Generic / Salt Name', data_type: 'string', input_type: 'text', required: false, visible: true, editable: true, display_order: 10, section: 'Medical Information', is_industry_specific: true },
      { scope: 'INDUSTRY', industry_code: 'MEDICAL_STORE', entity_type: 'PRODUCT', field_code: 'manufacturer', label: 'Manufacturer / Pharma Co.', data_type: 'string', input_type: 'text', required: false, visible: true, editable: true, display_order: 11, section: 'Medical Information', is_industry_specific: true },
      { scope: 'INDUSTRY', industry_code: 'MEDICAL_STORE', entity_type: 'PRODUCT', field_code: 'dosage_form', label: 'Dosage Form (Tablet/Syrup)', data_type: 'select', input_type: 'select', options: [{ label: 'Tablet', value: 'Tablet' }, { label: 'Capsule', value: 'Capsule' }, { label: 'Syrup', value: 'Syrup' }, { label: 'Injection', value: 'Injection' }, { label: 'Ointment', value: 'Ointment' }], required: false, visible: true, editable: true, display_order: 12, section: 'Medical Information', is_industry_specific: true },
      { scope: 'INDUSTRY', industry_code: 'MEDICAL_STORE', entity_type: 'PRODUCT', field_code: 'prescription_required', label: 'Prescription Required (Schedule H)', data_type: 'boolean', input_type: 'checkbox', required: false, visible: true, editable: true, display_order: 13, section: 'Medical Information', is_industry_specific: true },

      // IT & Software Specific Fields
      { scope: 'INDUSTRY', industry_code: 'IT_SOFTWARE', entity_type: 'PRODUCT', field_code: 'service_type', label: 'Service Type', data_type: 'select', input_type: 'select', options: [{ label: 'Software License', value: 'Software License' }, { label: 'SaaS Subscription', value: 'SaaS Subscription' }, { label: 'Consulting', value: 'Consulting' }, { label: 'Managed Support', value: 'Managed Support' }], required: false, visible: true, editable: true, display_order: 10, section: 'IT Service Details', is_industry_specific: true },
      { scope: 'INDUSTRY', industry_code: 'IT_SOFTWARE', entity_type: 'PRODUCT', field_code: 'technology', label: 'Technology Stack', data_type: 'string', input_type: 'text', required: false, visible: true, editable: true, display_order: 11, section: 'IT Service Details', is_industry_specific: true },

      // Manufacturing Specific Fields
      { scope: 'INDUSTRY', industry_code: 'MANUFACTURING', entity_type: 'PRODUCT', field_code: 'material_type', label: 'Material Type', data_type: 'select', input_type: 'select', options: [{ label: 'Raw Material', value: 'Raw Material' }, { label: 'Work In Progress', value: 'WIP' }, { label: 'Finished Product', value: 'Finished Product' }, { label: 'Consumable', value: 'Consumable' }], required: false, visible: true, editable: true, display_order: 10, section: 'Manufacturing Info', is_industry_specific: true },
      { scope: 'INDUSTRY', industry_code: 'MANUFACTURING', entity_type: 'PRODUCT', field_code: 'production_unit', label: 'Production Unit', data_type: 'string', input_type: 'text', required: false, visible: true, editable: true, display_order: 11, section: 'Manufacturing Info', is_industry_specific: true }
    ];

    for (const f of productFields) {
      const filter: any = { scope: f.scope, entity_type: f.entity_type, field_code: f.field_code };
      if ((f as any).industry_code) filter.industry_code = (f as any).industry_code;
      await EntityFieldDefinition.findOneAndUpdate(filter, f, { upsert: true, new: true });
    }

    // 3. SEED DASHBOARD WIDGETS REGISTRY
    const widgets = [
      { widget_code: 'SALES_SUMMARY', name: "Today's Sales Summary", description: 'Total revenue and order count for today', module_code: 'SALES', data_source: '/api/sales/summary', visualization_type: 'kpi' },
      { widget_code: 'LOW_STOCK', name: 'Low Stock Alerts', description: 'Products at or below reorder level', module_code: 'INVENTORY', data_source: '/api/inventory/low-stock', visualization_type: 'table' },
      { widget_code: 'EXPIRING_STOCK', name: 'Expiring Items Alert', description: 'Batch inventory expiring within 30 days', module_code: 'INVENTORY', data_source: '/api/inventory/expiring', visualization_type: 'table' },
      { widget_code: 'REVENUE_SUMMARY', name: 'Revenue Overview', description: 'Monthly sales and revenue chart', module_code: 'FINANCE', data_source: '/api/finance/revenue', visualization_type: 'line' },
      { widget_code: 'PURCHASE_SUMMARY', name: 'Purchase Orders Overview', description: 'Active and pending purchase orders', module_code: 'PURCHASE', data_source: '/api/purchases/summary', visualization_type: 'kpi' },
      { widget_code: 'MANUFACTURING_COST', name: 'Manufacturing Operations', description: 'Active production orders and total manufacturing cost', module_code: 'PRODUCTION', data_source: '/api/production/metrics', visualization_type: 'kpi' },
      { widget_code: 'COMMERCIAL_CONTRACTS', name: 'B2B Commercial Ledger', description: 'Active commercial contracts and billable balances', module_code: 'BILLING', data_source: '/api/billing/contracts', visualization_type: 'kpi' }
    ];

    for (const w of widgets) {
      await DashboardWidget.findOneAndUpdate({ widget_code: w.widget_code }, w, { upsert: true, new: true });
    }

    // 4. SEED PLATFORM & INDUSTRY DASHBOARD DEFINITIONS
    const dashboards = [
      {
        scope: 'PLATFORM',
        dashboard_code: 'MAIN_DASHBOARD',
        title: 'Organization Overview Dashboard',
        widgets: [
          { widget_code: 'SALES_SUMMARY', title: 'Total Sales', grid_span: 1, sort_order: 1 },
          { widget_code: 'PURCHASE_SUMMARY', title: 'Total Purchases', grid_span: 1, sort_order: 2 },
          { widget_code: 'LOW_STOCK', title: 'Low Stock Inventory', grid_span: 2, sort_order: 3 }
        ]
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'MEDICAL_STORE',
        dashboard_code: 'MAIN_DASHBOARD',
        title: 'Pharmacy & Medical Store Dashboard',
        widgets: [
          { widget_code: 'SALES_SUMMARY', title: "Today's Counter Sales", grid_span: 1, sort_order: 1 },
          { widget_code: 'EXPIRING_STOCK', title: 'Expiring Medicines (Next 30 Days)', grid_span: 2, sort_order: 2 },
          { widget_code: 'LOW_STOCK', title: 'Critical Medicine Stock Alerts', grid_span: 2, sort_order: 3 }
        ]
      },
      {
        scope: 'INDUSTRY',
        industry_code: 'MANUFACTURING',
        dashboard_code: 'MAIN_DASHBOARD',
        title: 'Production & Plant Dashboard',
        widgets: [
          { widget_code: 'MANUFACTURING_COST', title: 'Production Operations & Cost', grid_span: 1, sort_order: 1 },
          { widget_code: 'PURCHASE_SUMMARY', title: 'Raw Material Purchases', grid_span: 1, sort_order: 2 },
          { widget_code: 'LOW_STOCK', title: 'Raw Material Inventory Levels', grid_span: 2, sort_order: 3 }
        ]
      }
    ];

    for (const d of dashboards) {
      const filter: any = { scope: d.scope, dashboard_code: d.dashboard_code };
      if (d.industry_code) filter.industry_code = d.industry_code;
      await DashboardDefinition.findOneAndUpdate(filter, d, { upsert: true, new: true });
    }

    // 5. SEED PLATFORM NAVIGATION DEFINITION
    const defaultNav = {
      scope: 'PLATFORM',
      nav_groups: [
        {
          group_id: 'DASHBOARD',
          title: 'DASHBOARD',
          module_code: 'DASHBOARD',
          sort_order: 1,
          items: [
            { item_id: 'dash_home', label: 'Dashboard', icon: 'Home', route: '/', module_code: 'DASHBOARD', sort_order: 1 }
          ]
        },
        {
          group_id: 'CRM',
          title: 'SALES & CRM',
          module_code: 'CRM',
          sort_order: 2,
          items: [
            { item_id: 'crm_campaigns', label: 'Campaigns', icon: 'Target', route: '/campaign', module_code: 'CRM', sort_order: 1 },
            { item_id: 'crm_leads', label: 'Leads', icon: 'Users', route: '/leads', module_code: 'CRM', sort_order: 2 },
            { item_id: 'crm_conversions', label: 'Lead Conversions', icon: 'Split', route: '/leadscovert', module_code: 'CRM', sort_order: 3 },
            { item_id: 'sales_orders', label: 'Sales Orders', icon: 'ShoppingCart', route: '/sales/orders', module_code: 'SALES', sort_order: 4 },
            { item_id: 'sales_invoices', label: 'Sales Invoices', icon: 'FileText', route: '/sales/invoices', module_code: 'SALES', sort_order: 5 },
            { item_id: 'crm_clients', label: 'Clients', icon: 'Contact', route: '/client', module_code: 'CLIENTS', sort_order: 6 },
            { item_id: 'crm_projects', label: 'Projects', icon: 'FolderKanban', route: '/project', module_code: 'PROJECTS', sort_order: 7 }
          ]
        },
        {
          group_id: 'COMMERCE',
          title: 'RETAIL & COMMERCE',
          module_code: 'PRODUCTS',
          sort_order: 3,
          items: [
            { item_id: 'products_catalog', label: 'Products & Catalog', icon: 'Package', route: '/products', module_code: 'PRODUCTS', sort_order: 1 },
            { item_id: 'inventory_stock', label: 'Inventory Stock', icon: 'Layers', route: '/inventory', module_code: 'INVENTORY', sort_order: 2 },
            { item_id: 'purchases_suppliers', label: 'Suppliers', icon: 'UsersRound', route: '/suppliers', module_code: 'PURCHASE', sort_order: 3 },
            { item_id: 'purchases_orders', label: 'Purchases', icon: 'ShoppingCart', route: '/purchases', module_code: 'PURCHASE', sort_order: 4 },
            { item_id: 'pos_terminal', label: 'POS Terminal', icon: 'Monitor', route: '/pos', module_code: 'POS', sort_order: 5 }
          ]
        },
        {
          group_id: 'PRODUCTION',
          title: 'MANUFACTURING & PRODUCTION',
          module_code: 'PRODUCTION',
          sort_order: 4,
          items: [
            { item_id: 'production_workspace', label: 'Production Workspace', icon: 'Factory', route: '/production', module_code: 'PRODUCTION', sort_order: 1 }
          ]
        },
        {
          group_id: 'HRMS',
          title: 'PEOPLE & HRMS',
          module_code: 'HRMS',
          sort_order: 5,
          items: [
            { item_id: 'hrms_employees', label: 'Employees', icon: 'UserLock', route: '/employee', module_code: 'HRMS', sort_order: 1 },
            { item_id: 'hrms_attendance', label: 'Attendance', icon: 'CalendarCheck', route: '/attandance', module_code: 'HRMS', sort_order: 2 },
            { item_id: 'hrms_leaves', label: 'Leaves', icon: 'CalendarX2', route: '/leave', module_code: 'HRMS', sort_order: 3 },
            { item_id: 'hrms_timesheet', label: 'Timesheet', icon: 'CalendarClock', route: '/time_sheet', module_code: 'HRMS', sort_order: 4 },
            { item_id: 'hrms_teams', label: 'Teams', icon: 'UsersRound', route: '/team', module_code: 'HRMS', sort_order: 5 }
          ]
        },
        {
          group_id: 'COLLABORATION',
          title: 'COLLABORATION & AI',
          module_code: 'MEETINGS',
          sort_order: 6,
          items: [
            { item_id: 'collab_meetings', label: 'Meetings', icon: 'Video', route: '/meetings', module_code: 'MEETINGS', sort_order: 1 },
            { item_id: 'collab_calendar', label: 'Calendar', icon: 'CalendarDays', route: '/calendar', module_code: 'MEETINGS', sort_order: 2 },
            { item_id: 'collab_ai', label: 'AI Assistant', icon: 'Sparkles', route: '/ai-assistant', module_code: 'AI_ASSISTANT', sort_order: 3 }
          ]
        },
        {
          group_id: 'ADMINISTRATION',
          title: 'ADMINISTRATION',
          module_code: 'ORGANIZATION',
          sort_order: 7,
          items: [
            { item_id: 'admin_branches', label: 'Branches', icon: 'Building2', route: '/branch', module_code: 'ORGANIZATION', sort_order: 1 },
            { item_id: 'admin_module_settings', label: 'Module & Platform Settings', icon: 'Sliders', route: '/settings/modules', module_code: 'ORGANIZATION', sort_order: 2 }
          ]
        }
      ]
    };

    await NavigationDefinition.findOneAndUpdate({ scope: 'PLATFORM' }, defaultNav, { upsert: true, new: true });

    // 6. SEED STATUS DEFINITIONS FOR SALES & PURCHASES
    const statuses = [
      { scope: 'PLATFORM', entity_type: 'SALES_ORDER', code: 'DRAFT', label: 'Draft', color_token: 'neutral', allowed_transitions: ['CONFIRMED', 'CANCELLED'], sort_order: 1 },
      { scope: 'PLATFORM', entity_type: 'SALES_ORDER', code: 'CONFIRMED', label: 'Confirmed', color_token: 'info', allowed_transitions: ['FULFILLED', 'CANCELLED'], sort_order: 2 },
      { scope: 'PLATFORM', entity_type: 'SALES_ORDER', code: 'FULFILLED', label: 'Fulfilled', color_token: 'success', allowed_transitions: [], sort_order: 3 },
      { scope: 'PLATFORM', entity_type: 'SALES_ORDER', code: 'CANCELLED', label: 'Cancelled', color_token: 'danger', allowed_transitions: [], sort_order: 4 },

      { scope: 'PLATFORM', entity_type: 'PURCHASE_ORDER', code: 'DRAFT', label: 'Draft', color_token: 'neutral', allowed_transitions: ['SUBMITTED', 'CANCELLED'], sort_order: 1 },
      { scope: 'PLATFORM', entity_type: 'PURCHASE_ORDER', code: 'SUBMITTED', label: 'Submitted', color_token: 'warning', allowed_transitions: ['APPROVED', 'CANCELLED'], sort_order: 2 },
      { scope: 'PLATFORM', entity_type: 'PURCHASE_ORDER', code: 'APPROVED', label: 'Approved', color_token: 'info', allowed_transitions: ['RECEIVED', 'CANCELLED'], sort_order: 3 },
      { scope: 'PLATFORM', entity_type: 'PURCHASE_ORDER', code: 'RECEIVED', label: 'Received', color_token: 'success', allowed_transitions: [], sort_order: 4 },
      { scope: 'PLATFORM', entity_type: 'PURCHASE_ORDER', code: 'CANCELLED', label: 'Cancelled', color_token: 'danger', allowed_transitions: [], sort_order: 5 }
    ];

    for (const st of statuses) {
      await StatusDefinition.findOneAndUpdate(
        { scope: st.scope, entity_type: st.entity_type, code: st.code },
        st,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Universal dynamic configuration data seeded successfully.');
  } catch (err) {
    console.error('❌ Error seeding dynamic config data:', err);
  }
};

export default seedDynamicConfigData;
