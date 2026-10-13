import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. ENTITY FIELD DEFINITION — Dynamic Field Engine
// ============================================================
export interface IEntityFieldDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  entity_type: string;        // e.g., 'PRODUCT', 'CUSTOMER', 'SUPPLIER', 'SALES_ORDER', 'PURCHASE_ORDER', 'LEADS', 'PROJECTS', 'HRMS'
  field_code: string;         // e.g., 'generic_name', 'mrp', 'sku', 'technology'
  label: string;              // e.g., 'Generic / Salt Name'
  description?: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'json' | 'file';
  input_type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea' | 'autocomplete' | 'file' | 'currency';
  required: boolean;
  visible: boolean;
  editable: boolean;
  sortable: boolean;
  filterable: boolean;
  searchable: boolean;
  default_value?: any;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    message?: string;
  };
  depends_on?: {
    field: string;
    value: any;
  };
  display_order: number;
  section: string;            // e.g., 'Basic Details', 'Medical Information', 'Pricing & Stock'
  icon?: string;
  help_text?: string;
  is_system: boolean;         // System fields vs dynamic custom fields
  is_industry_specific: boolean;
  created_at: Date;
  updated_at: Date;
}

const EntityFieldDefinitionSchema = new Schema<IEntityFieldDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  entity_type: { type: String, required: true, index: true },
  field_code: { type: String, required: true, index: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  data_type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'select', 'multiselect', 'json', 'file'], default: 'string' },
  input_type: { type: String, enum: ['text', 'number', 'select', 'checkbox', 'date', 'textarea', 'autocomplete', 'file', 'currency'], default: 'text' },
  required: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  sortable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: true },
  searchable: { type: Boolean, default: true },
  default_value: { type: Schema.Types.Mixed },
  placeholder: { type: String, default: '' },
  options: [{ label: String, value: Schema.Types.Mixed }],
  validation: {
    min: { type: Number },
    max: { type: Number },
    regex: { type: String },
    message: { type: String }
  },
  depends_on: {
    field: { type: String },
    value: { type: Schema.Types.Mixed }
  },
  display_order: { type: Number, default: 0 },
  section: { type: String, default: 'General' },
  icon: { type: String, default: '' },
  help_text: { type: String, default: '' },
  is_system: { type: Boolean, default: false },
  is_industry_specific: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

EntityFieldDefinitionSchema.index({ scope: 1, industry_code: 1, entity_type: 1, field_code: 1 });
EntityFieldDefinitionSchema.index({ tenant_id: 1, entity_type: 1, field_code: 1 });

// ============================================================
// 2. ENTITY VIEW CONFIGURATION — Form & Table Engines
// ============================================================
export interface IEntityViewConfiguration extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  entity_type: string;
  view_type: 'form' | 'table' | 'filter' | 'search';
  sections: Array<{
    title: string;
    description?: string;
    fields: string[];       // field_codes
    display_order: number;
  }>;
  columns: Array<{
    field_code: string;
    label?: string;
    visible: boolean;
    display_order: number;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  default_sort?: {
    field_code: string;
    direction: 'asc' | 'desc';
  };
  default_filters?: Record<string, any>;
  actions?: Array<{
    code: string;
    label: string;
    icon?: string;
    action_type: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

const EntityViewConfigurationSchema = new Schema<IEntityViewConfiguration>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  entity_type: { type: String, required: true, index: true },
  view_type: { type: String, enum: ['form', 'table', 'filter', 'search'], required: true, index: true },
  sections: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fields: [{ type: String }],
    display_order: { type: Number, default: 0 }
  }],
  columns: [{
    field_code: { type: String, required: true },
    label: { type: String },
    visible: { type: Boolean, default: true },
    display_order: { type: Number, default: 0 },
    width: { type: String },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'left' }
  }],
  default_sort: {
    field_code: { type: String },
    direction: { type: String, enum: ['asc', 'desc'], default: 'asc' }
  },
  default_filters: { type: Schema.Types.Mixed, default: {} },
  actions: [{
    code: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: '' },
    action_type: { type: String, default: 'button' }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 3. WORKFLOW DEFINITION & WORKFLOW STEPS
// ============================================================
export interface IWorkflowDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  entity_type: string;
  workflow_code: string;
  name: string;
  description?: string;
  initial_status: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  entity_type: { type: String, required: true, index: true },
  workflow_code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  initial_status: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export interface IWorkflowStep extends Document {
  workflow_id: mongoose.Types.ObjectId;
  workflow_code: string;
  entity_type: string;
  from_status: string;
  to_status: string;
  action_label: string;
  required_permission?: string;
  validation_rules?: Array<{
    field_code: string;
    rule: 'required' | 'positive' | 'date_future';
    message: string;
  }>;
  sort_order: number;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>({
  workflow_id: { type: Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true, index: true },
  workflow_code: { type: String, required: true, index: true },
  entity_type: { type: String, required: true, index: true },
  from_status: { type: String, required: true },
  to_status: { type: String, required: true },
  action_label: { type: String, required: true },
  required_permission: { type: String, default: '' },
  validation_rules: [{
    field_code: { type: String, required: true },
    rule: { type: String, enum: ['required', 'positive', 'date_future'], required: true },
    message: { type: String, required: true }
  }],
  sort_order: { type: Number, default: 0 }
});

// ============================================================
// 4. STATUS DEFINITION — Dynamic Registry-Driven Statuses
// ============================================================
export interface IStatusDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  entity_type: string;
  code: string;
  label: string;
  color_token: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  icon?: string;
  allowed_transitions: string[];
  sort_order: number;
  is_active: boolean;
}

const StatusDefinitionSchema = new Schema<IStatusDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  entity_type: { type: String, required: true, index: true },
  code: { type: String, required: true, index: true },
  label: { type: String, required: true },
  color_token: { type: String, enum: ['success', 'warning', 'danger', 'info', 'neutral', 'primary'], default: 'neutral' },
  icon: { type: String, default: '' },
  allowed_transitions: [{ type: String }],
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true }
});

// ============================================================
// 5. DASHBOARD WIDGET & DASHBOARD DEFINITION
// ============================================================
export interface IDashboardWidget extends Document {
  widget_code: string;
  name: string;
  description?: string;
  module_code: string;
  data_source: string;        // API endpoint URL or identifier
  visualization_type: 'kpi' | 'bar' | 'line' | 'pie' | 'table' | 'list';
  default_config: Record<string, any>;
  is_active: boolean;
}

const DashboardWidgetSchema = new Schema<IDashboardWidget>({
  widget_code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  module_code: { type: String, required: true, index: true },
  data_source: { type: String, required: true },
  visualization_type: { type: String, enum: ['kpi', 'bar', 'line', 'pie', 'table', 'list'], default: 'kpi' },
  default_config: { type: Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true }
});

export interface IDashboardDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  dashboard_code: string;     // e.g. 'MAIN_DASHBOARD', 'RETAIL_POS_DASHBOARD'
  title: string;
  widgets: Array<{
    widget_code: string;
    title?: string;
    grid_span?: number;
    sort_order: number;
    config_override?: Record<string, any>;
  }>;
  created_at: Date;
  updated_at: Date;
}

const DashboardDefinitionSchema = new Schema<IDashboardDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  dashboard_code: { type: String, required: true, index: true },
  title: { type: String, required: true },
  widgets: [{
    widget_code: { type: String, required: true },
    title: { type: String },
    grid_span: { type: Number, default: 1 },
    sort_order: { type: Number, default: 0 },
    config_override: { type: Schema.Types.Mixed, default: {} }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 6. REPORT DEFINITION — Dynamic Report Engine
// ============================================================
export interface IReportDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  report_code: string;
  name: string;
  description?: string;
  module_code: string;
  entity_type: string;
  columns: string[];
  default_filters: Record<string, any>;
  group_by?: string[];
  export_formats: string[];   // e.g. ['csv', 'excel', 'pdf']
  is_active: boolean;
}

const ReportDefinitionSchema = new Schema<IReportDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  report_code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  module_code: { type: String, required: true, index: true },
  entity_type: { type: String, required: true, index: true },
  columns: [{ type: String }],
  default_filters: { type: Schema.Types.Mixed, default: {} },
  group_by: [{ type: String }],
  export_formats: [{ type: String, default: 'csv' }],
  is_active: { type: Boolean, default: true }
});

// ============================================================
// 7. NAVIGATION DEFINITION — Dynamic Navigation Engine
// ============================================================
export interface INavigationDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  nav_groups: Array<{
    group_id: string;
    title: string;
    module_code: string;
    sort_order: number;
    items: Array<{
      item_id: string;
      label: string;
      icon: string;
      route: string;
      module_code: string;
      feature_code?: string;
      permission_code?: string;
      sort_order: number;
    }>;
  }>;
  created_at: Date;
  updated_at: Date;
}

const NavigationDefinitionSchema = new Schema<INavigationDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  nav_groups: [{
    group_id: { type: String, required: true },
    title: { type: String, required: true },
    module_code: { type: String, required: true },
    sort_order: { type: Number, default: 0 },
    items: [{
      item_id: { type: String, required: true },
      label: { type: String, required: true },
      icon: { type: String, default: 'FileText' },
      route: { type: String, required: true },
      module_code: { type: String, required: true },
      feature_code: { type: String },
      permission_code: { type: String },
      sort_order: { type: Number, default: 0 }
    }]
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 8. TERMINOLOGY DEFINITION — Dynamic Terminology Dictionary
// ============================================================
export interface ITerminologyDefinition extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  entity_type: string;        // e.g. 'PRODUCT', 'CUSTOMER', 'SUPPLIER', 'PURCHASE', 'SALES'
  label: string;              // e.g. 'Medicine' (for MEDICAL_STORE), 'Material' (for MANUFACTURING), 'Product' (for RETAIL)
  plural_label: string;       // e.g. 'Medicines', 'Materials', 'Products'
  field_labels?: Record<string, string>; // e.g. { sku: "Batch Code", vendor: "Manufacturer" }
  created_at: Date;
  updated_at: Date;
}

const TerminologyDefinitionSchema = new Schema<ITerminologyDefinition>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  entity_type: { type: String, required: true, index: true },
  label: { type: String, required: true },
  plural_label: { type: String, required: true },
  field_labels: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================
// 9. BUSINESS RULE ENGINE DEFINITION
// ============================================================
export interface IBusinessRule extends Document {
  scope: 'PLATFORM' | 'INDUSTRY' | 'ORGANIZATION';
  tenant_id?: mongoose.Types.ObjectId;
  industry_code?: string;
  rule_code: string;
  name: string;
  entity_type: string;
  condition: Record<string, any>;
  action: Record<string, any>;
  error_message?: string;
  is_active: boolean;
}

const BusinessRuleSchema = new Schema<IBusinessRule>({
  scope: { type: String, enum: ['PLATFORM', 'INDUSTRY', 'ORGANIZATION'], default: 'PLATFORM', index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true, sparse: true },
  industry_code: { type: String, index: true },
  rule_code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  entity_type: { type: String, required: true, index: true },
  condition: { type: Schema.Types.Mixed, required: true },
  action: { type: Schema.Types.Mixed, required: true },
  error_message: { type: String, default: '' },
  is_active: { type: Boolean, default: true }
});

// ============================================================
// MODEL EXPORTS
// ============================================================
export const EntityFieldDefinition = mongoose.models.EntityFieldDefinition || mongoose.model<IEntityFieldDefinition>('EntityFieldDefinition', EntityFieldDefinitionSchema);
export const EntityViewConfiguration = mongoose.models.EntityViewConfiguration || mongoose.model<IEntityViewConfiguration>('EntityViewConfiguration', EntityViewConfigurationSchema);
export const WorkflowDefinition = mongoose.models.WorkflowDefinition || mongoose.model<IWorkflowDefinition>('WorkflowDefinition', WorkflowDefinitionSchema);
export const WorkflowStep = mongoose.models.WorkflowStep || mongoose.model<IWorkflowStep>('WorkflowStep', WorkflowStepSchema);
export const StatusDefinition = mongoose.models.StatusDefinition || mongoose.model<IStatusDefinition>('StatusDefinition', StatusDefinitionSchema);
export const DashboardWidget = mongoose.models.DashboardWidget || mongoose.model<IDashboardWidget>('DashboardWidget', DashboardWidgetSchema);
export const DashboardDefinition = mongoose.models.DashboardDefinition || mongoose.model<IDashboardDefinition>('DashboardDefinition', DashboardDefinitionSchema);
export const ReportDefinition = mongoose.models.ReportDefinition || mongoose.model<IReportDefinition>('ReportDefinition', ReportDefinitionSchema);
export const NavigationDefinition = mongoose.models.NavigationDefinition || mongoose.model<INavigationDefinition>('NavigationDefinition', NavigationDefinitionSchema);
export const TerminologyDefinition = mongoose.models.TerminologyDefinition || mongoose.model<ITerminologyDefinition>('TerminologyDefinition', TerminologyDefinitionSchema);
export const BusinessRule = mongoose.models.BusinessRule || mongoose.model<IBusinessRule>('BusinessRule', BusinessRuleSchema);

export const initializeDynamicConfigSchema = async () => {
  try {
    await EntityFieldDefinition.createIndexes();
    await EntityViewConfiguration.createIndexes();
    await WorkflowDefinition.createIndexes();
    await WorkflowStep.createIndexes();
    await StatusDefinition.createIndexes();
    await DashboardWidget.createIndexes();
    await DashboardDefinition.createIndexes();
    await ReportDefinition.createIndexes();
    await NavigationDefinition.createIndexes();
    await TerminologyDefinition.createIndexes();
    await BusinessRule.createIndexes();
    console.log('✅ Dynamic Configuration schema indexes initialized.');
  } catch (err) {
    console.error('❌ Error initializing dynamic config schema:', err);
  }
};
