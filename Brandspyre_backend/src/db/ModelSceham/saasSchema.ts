import mongoose, { Schema, Document } from "mongoose";

// Tenant interface
export interface ITenant extends Document {
  name: string;
  domain?: string;
  subdomain?: string;
  company_name: string;
  industry?: string;
  size?: string;
  status?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_start_date?: Date;
  subscription_end_date?: Date;
  max_users?: number;
  max_storage_mb?: number;
  settings?: Record<string, any>;
  // Enterprise fields
  tenant_code?: string;
  uuid?: string;
  slug?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  onboarding_status?: string;
  is_email_verified?: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  owner_id?: mongoose.Types.ObjectId;
  // Billing & Tax
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  gst_number?: string;
  pan_number?: string;
  billing_email?: string;
  billing_name?: string;
  // Account lock
  locked_at?: Date;
  lock_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

// User-tenant relationship interface
export interface IUserTenant extends Document {
  user_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  role?: string;
  status?: string;
  is_owner?: boolean;
  is_active?: boolean;
  default_branch_code?: string;
  invited_by?: mongoose.Types.ObjectId;
  joined_at?: Date;
  created_at?: Date;
}

// Subscription plan interface
export interface ISubscriptionPlan extends Document {
  plan_name: string;
  plan_code: string;
  commercial_category?: 'RETAIL_PACKAGE' | 'BUSINESS_SERVICES_PACKAGE' | string;
  monthly_price_type?: 'FIXED' | 'STARTING_FROM' | 'CUSTOM' | string;
  yearly_price_type?: 'FIXED' | 'STARTING_FROM' | 'CUSTOM' | string;
  users_limit_type?: 'FIXED' | 'UNLIMITED' | 'CUSTOM' | string;
  branches_limit_type?: 'FIXED' | 'UNLIMITED' | 'CUSTOM' | string;
  description?: string;
  badge_label?: string;
  plan_type?: 'free' | 'paid' | 'enterprise';
  sort_order?: number;
  price_monthly?: number;
  price_quarterly?: number;
  price_yearly?: number;
  max_users?: number;
  max_branches?: number;
  max_storage_gb?: number;
  max_leads?: number;
  max_projects?: number;
  max_invoices?: number;
  max_employees?: number;
  max_customers?: number;
  max_products?: number;
  max_warehouses?: number;
  max_documents?: number;
  max_api_calls?: number;
  max_quotes?: number;
  max_reports?: number;
  trial_days?: number;
  grace_period_days?: number;
  included_module_codes?: string[];
  features?: Record<string, any>;
  modules?: {
    crm?: boolean;
    hrms?: boolean;
    payroll?: boolean;
    inventory?: boolean;
    accounting?: boolean;
    support?: boolean;
    analytics?: boolean;
    api_access?: boolean;
    workflow_automation?: boolean;
    custom_branding?: boolean;
    custom_fields?: boolean;
    role_management?: boolean;
    event_management?: boolean;
  };
  max_active_events?: number;
  max_tickets_per_event?: number;
  max_monthly_ticket_sales?: number;
  custom_event_branding?: boolean;
  advanced_event_analytics?: boolean;
  event_team_members?: number;
  is_active?: boolean;
  is_public?: boolean;
  currency?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Tenant subscription interface
export interface ITenantSubscription extends Document {
  tenant_id: mongoose.Types.ObjectId;
  plan_id: mongoose.Types.ObjectId;
  subscription_type?: 'monthly' | 'quarterly' | 'yearly' | 'custom' | string;
  status?: 'trial' | 'active' | 'pending_payment' | 'grace' | 'suspended' | 'cancelled' | 'expired' | string;
  start_date: Date;
  end_date: Date;
  trial_start_date?: Date;
  trial_end_date?: Date;
  auto_renew?: boolean;
  payment_method?: string;
  last_payment_date?: Date;
  next_billing_date?: Date;
  amount?: number;
  // Grace period
  grace_period_days?: number;
  grace_end_date?: Date;
  // Renewal tracking
  renewal_count?: number;
  last_renewal_date?: Date;
  // Cancellation
  cancel_reason?: string;
  cancelled_at?: Date;
  // Scheduled downgrade
  downgrade_scheduled_plan_id?: mongoose.Types.ObjectId;
  downgrade_effective_date?: Date;
  // Razorpay integration fields
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  razorpay_plan_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_status?: string;
  payment_error?: string;
  error_code?: string;
  paid_amount?: number;
  paid_at?: Date;
  currency?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Tenant usage interface
export interface ITenantUsage extends Document {
  tenant_id: mongoose.Types.ObjectId;
  metric_name: string; // e.g. 'users', 'branches', 'storage_mb', 'leads', 'projects', 'invoices'
  metric_value?: number;
  recorded_at?: Date;
  created_at?: Date;
}

// Tenant setting interface
export interface ITenantSetting extends Document {
  tenant_id: mongoose.Types.ObjectId;
  setting_key: string;
  setting_value: any;
  created_at?: Date;
  updated_at?: Date;
}

// Onboarding progress interface
export interface IOnboardingProgress extends Document {
  tenant_id: mongoose.Types.ObjectId;
  email_verified: boolean;
  company_setup: boolean;
  branch_created: boolean;
  team_invited: boolean;
  payment_completed: boolean;
  completion_percentage: number;
  updated_at?: Date;
}

// Email template interface
export interface IEmailTemplate extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  name: string; // e.g. 'welcome', 'verify_email', 'reset_password', 'invoice'
  subject: string;
  body_html: string;
  is_default?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Financial Year interface
export interface IFinancialYear extends Document {
  tenant_id: mongoose.Types.ObjectId;
  year_code: string; // e.g. 'FY2026-27'
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at?: Date;
}

// Notification Setting interface
export interface INotificationSetting extends Document {
  tenant_id: mongoose.Types.ObjectId;
  email_notifications: boolean;
  in_app_notifications: boolean;
  sms_notifications: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Audit Log interface
export interface IAuditLog extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  user_id?: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  details?: Record<string, any>;
  ip?: string;
  created_at?: Date;
}

// Refresh Token interface
export interface IRefreshToken extends Document {
  user_id: mongoose.Types.ObjectId;
  family_id?: string;
  token_hash: string;
  sid?: string;
  expires_at: Date;
  is_revoked: boolean;
  is_used?: boolean;
  used_at?: Date;
  created_at?: Date;
}

// Webhook Event Log interface
export interface IWebhookEventLog extends Document {
  event_id: string;
  provider: string;
  event_type: string;
  status?: string;
  payload?: any;
  created_at?: Date;
}

// Schemas
const TenantSchema = new Schema<ITenant>({
  name: { type: String, required: true },
  domain: { type: String, unique: true, sparse: true },
  subdomain: { type: String, unique: true, sparse: true },
  company_name: { type: String, required: true },
  industry: { type: String },
  size: { type: String, default: 'small' },
  status: { type: String, default: 'active' },
  subscription_plan: { type: String, default: 'free' },
  subscription_status: { type: String, default: 'trial' },
  subscription_start_date: { type: Date },
  subscription_end_date: { type: Date },
  max_users: { type: Number, default: 5 },
  max_storage_mb: { type: Number, default: 1024 },
  settings: { type: Schema.Types.Mixed, default: {} },
  // Enterprise fields
  tenant_code: { type: String, unique: true, sparse: true },
  uuid: { type: String, unique: true, sparse: true },
  slug: { type: String, unique: true, sparse: true },
  country: { type: String, default: 'India' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'INR' },
  language: { type: String, default: 'en' },
  onboarding_status: { type: String, default: 'pending' },
  is_email_verified: { type: Boolean, default: false },
  email_verification_token: { type: String },
  email_verification_expires: { type: Date },
  owner_id: { type: Schema.Types.ObjectId, ref: 'UserInfo', default: null },
  // Billing & Tax
  billing_address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'India' }
  },
  gst_number: { type: String },
  pan_number: { type: String },
  billing_email: { type: String },
  billing_name: { type: String },
  // Account lock
  locked_at: { type: Date },
  lock_reason: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const UserTenantSchema = new Schema<IUserTenant>({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo' },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  is_owner: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  default_branch_code: { type: String, default: '' },
  invited_by: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  joined_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

UserTenantSchema.index({ user_id: 1, tenant_id: 1 }, { unique: true });
UserTenantSchema.index({ tenant_id: 1, is_active: 1 });
UserTenantSchema.index({ user_id: 1, is_active: 1 });

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  plan_name: { type: String, required: true, unique: true },
  plan_code: { type: String, required: true, unique: true },
  commercial_category: { type: String, default: 'RETAIL_PACKAGE', index: true },
  monthly_price_type: { type: String, default: 'FIXED' },
  yearly_price_type: { type: String, default: 'FIXED' },
  users_limit_type: { type: String, default: 'FIXED' },
  branches_limit_type: { type: String, default: 'FIXED' },
  description: { type: String, default: '' },
  badge_label: { type: String, default: '' },
  plan_type: { type: String, default: 'paid' },
  sort_order: { type: Number, default: 0 },
  price_monthly: { type: Number, default: 0 },
  price_quarterly: { type: Number, default: 0 },
  price_yearly: { type: Number, default: 0 },
  max_users: { type: Number, default: 5 },
  max_branches: { type: Number, default: 1 },
  max_storage_gb: { type: Number, default: 1 },
  max_leads: { type: Number, default: 500 },
  max_projects: { type: Number, default: 20 },
  max_invoices: { type: Number, default: 100 },
  max_employees: { type: Number, default: 10 },
  max_customers: { type: Number, default: 100 },
  max_products: { type: Number, default: 50 },
  max_warehouses: { type: Number, default: 1 },
  max_documents: { type: Number, default: 100 },
  max_api_calls: { type: Number, default: 1000 },
  max_quotes: { type: Number, default: 50 },
  max_reports: { type: Number, default: 10 },
  trial_days: { type: Number, default: 14 },
  grace_period_days: { type: Number, default: 7 },
  included_module_codes: [{ type: String }],
  features: { type: Schema.Types.Mixed, default: {} },
  modules: {
    crm: { type: Boolean, default: true },
    hrms: { type: Boolean, default: false },
    payroll: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    accounting: { type: Boolean, default: false },
    support: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    api_access: { type: Boolean, default: false },
    workflow_automation: { type: Boolean, default: false },
    custom_branding: { type: Boolean, default: false },
    custom_fields: { type: Boolean, default: false },
    role_management: { type: Boolean, default: true },
    event_management: { type: Boolean, default: false }
  },
  max_active_events: { type: Number, default: 5 },
  max_tickets_per_event: { type: Number, default: 200 },
  max_monthly_ticket_sales: { type: Number, default: 500 },
  custom_event_branding: { type: Boolean, default: false },
  advanced_event_analytics: { type: Boolean, default: false },
  event_team_members: { type: Number, default: 2 },
  is_active: { type: Boolean, default: true },
  is_public: { type: Boolean, default: true, index: true },
  currency: { type: String, default: 'INR' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const TenantSubscriptionSchema = new Schema<ITenantSubscription>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  plan_id: { type: Schema.Types.ObjectId, required: true, ref: 'SubscriptionPlan' },
  subscription_type: { type: String, default: 'monthly' },
  status: { type: String, default: 'trial' },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  trial_start_date: { type: Date },
  trial_end_date: { type: Date },
  auto_renew: { type: Boolean, default: true },
  payment_method: { type: String },
  last_payment_date: { type: Date },
  next_billing_date: { type: Date },
  amount: { type: Number, default: 0 },
  // Grace period
  grace_period_days: { type: Number, default: 7 },
  grace_end_date: { type: Date },
  // Renewal tracking
  renewal_count: { type: Number, default: 0 },
  last_renewal_date: { type: Date },
  // Cancellation
  cancel_reason: { type: String },
  cancelled_at: { type: Date },
  // Scheduled downgrade
  downgrade_scheduled_plan_id: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  downgrade_effective_date: { type: Date },
  // Razorpay
  razorpay_customer_id: { type: String },
  razorpay_subscription_id: { type: String },
  razorpay_plan_id: { type: String },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  payment_status: { type: String, default: 'pending' },
  payment_error: { type: String },
  error_code: { type: String },
  paid_amount: { type: Number },
  paid_at: { type: Date },
  currency: { type: String, default: 'INR' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

TenantSubscriptionSchema.index({ tenant_id: 1 });
TenantSubscriptionSchema.index({ tenant_id: 1, status: 1 });
TenantSubscriptionSchema.index({ tenant_id: 1, end_date: 1 });

const TenantUsageSchema = new Schema<ITenantUsage>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  metric_name: { type: String, required: true },
  metric_value: { type: Number, default: 0 },
  recorded_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

TenantUsageSchema.index({ tenant_id: 1, metric_name: 1 }, { unique: true });

const TenantSettingSchema = new Schema<ITenantSetting>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  setting_key: { type: String, required: true },
  setting_value: { type: Schema.Types.Mixed, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

TenantSettingSchema.index({ tenant_id: 1, setting_key: 1 }, { unique: true });

const OnboardingProgressSchema = new Schema<IOnboardingProgress>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', unique: true },
  email_verified: { type: Boolean, default: false },
  company_setup: { type: Boolean, default: true },
  branch_created: { type: Boolean, default: true },
  team_invited: { type: Boolean, default: false },
  payment_completed: { type: Boolean, default: false },
  completion_percentage: { type: Number, default: 40 },
  updated_at: { type: Date, default: Date.now }
});

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body_html: { type: String, required: true },
  is_default: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const FinancialYearSchema = new Schema<IFinancialYear>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  year_code: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

const NotificationSettingSchema = new Schema<INotificationSetting>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', unique: true },
  email_notifications: { type: Boolean, default: true },
  in_app_notifications: { type: Boolean, default: true },
  sms_notifications: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const AuditLogSchema = new Schema<IAuditLog>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  created_at: { type: Date, default: Date.now }
});

const RefreshTokenSchema = new Schema<IRefreshToken>({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'UserInfo', index: true },
  family_id: { type: String, index: true },
  token_hash: { type: String, required: true, unique: true, index: true },
  sid: { type: String, index: true },
  expires_at: { type: Date, required: true },
  is_revoked: { type: Boolean, default: false },
  is_used: { type: Boolean, default: false },
  used_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

AuditLogSchema.index({ tenant_id: 1, created_at: -1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ user_id: 1, is_revoked: 1 });
RefreshTokenSchema.index({ token_hash: 1, is_used: 1, is_revoked: 1 });

const WebhookEventLogSchema = new Schema<IWebhookEventLog>({
  event_id: { type: String, required: true, unique: true, index: true },
  provider: { type: String, required: true },
  event_type: { type: String, required: true },
  status: { type: String, default: 'processed' },
  payload: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

// Export models
export const Tenant = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
export const UserTenant = mongoose.models.UserTenant || mongoose.model<IUserTenant>('UserTenant', UserTenantSchema);
export const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
export const TenantSubscription = mongoose.models.TenantSubscription || mongoose.model<ITenantSubscription>('TenantSubscription', TenantSubscriptionSchema);
export const TenantUsage = mongoose.models.TenantUsage || mongoose.model<ITenantUsage>('TenantUsage', TenantUsageSchema);
export const TenantSetting = mongoose.models.TenantSetting || mongoose.model<ITenantSetting>('TenantSetting', TenantSettingSchema);
export const OnboardingProgress = mongoose.models.OnboardingProgress || mongoose.model<IOnboardingProgress>('OnboardingProgress', OnboardingProgressSchema);
export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
export const FinancialYear = mongoose.models.FinancialYear || mongoose.model<IFinancialYear>('FinancialYear', FinancialYearSchema);
export const NotificationSetting = mongoose.models.NotificationSetting || mongoose.model<INotificationSetting>('NotificationSetting', NotificationSettingSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const RefreshToken = mongoose.models.RefreshToken || mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
export const WebhookEventLog = mongoose.models.WebhookEventLog || mongoose.model<IWebhookEventLog>('WebhookEventLog', WebhookEventLogSchema);

export const initializeSaasSchema = async () => {
  try {
    // Insert/update default subscription plans
    const defaultPlans = [
      {
        plan_name: 'Free Trial',
        plan_code: 'trial',
        description: 'Try all features free for 14 days',
        badge_label: 'FREE',
        plan_type: 'free',
        sort_order: 0,
        price_monthly: 0,
        price_quarterly: 0,
        price_yearly: 0,
        max_users: 5,
        max_branches: 1,
        max_storage_gb: 1,
        max_leads: 500,
        max_projects: 10,
        max_invoices: 50,
        max_employees: 10,
        max_customers: 50,
        max_products: 25,
        max_warehouses: 1,
        max_documents: 50,
        max_api_calls: 500,
        max_quotes: 25,
        max_reports: 5,
        trial_days: 14,
        grace_period_days: 3,
        features: { all_features: true, trial: true },
        modules: { crm: true, hrms: true, payroll: true, inventory: true, accounting: true, support: true, analytics: true, api_access: true, workflow_automation: true, custom_branding: false, custom_fields: true, role_management: true }
      },
      {
        plan_name: 'Starter',
        plan_code: 'starter',
        description: 'Ideal for small teams getting started',
        badge_label: 'STARTER',
        plan_type: 'paid',
        sort_order: 1,
        price_monthly: 499,
        price_quarterly: 1347,
        price_yearly: 4990,
        max_users: 10,
        max_branches: 2,
        max_storage_gb: 5,
        max_leads: 1000,
        max_projects: 25,
        max_invoices: 200,
        max_employees: 25,
        max_customers: 200,
        max_products: 100,
        max_warehouses: 1,
        max_documents: 200,
        max_api_calls: 5000,
        max_quotes: 100,
        max_reports: 10,
        trial_days: 14,
        grace_period_days: 5,
        features: { basic_support: true },
        modules: { crm: true, hrms: true, payroll: false, inventory: false, accounting: true, support: false, analytics: false, api_access: false, workflow_automation: false, custom_branding: false, custom_fields: true, role_management: true }
      },
      {
        plan_name: 'Professional',
        plan_code: 'professional',
        description: 'For growing businesses needing more power',
        badge_label: 'POPULAR',
        plan_type: 'paid',
        sort_order: 2,
        price_monthly: 999,
        price_quarterly: 2697,
        price_yearly: 9990,
        max_users: 25,
        max_branches: 5,
        max_storage_gb: 25,
        max_leads: 5000,
        max_projects: 100,
        max_invoices: 1000,
        max_employees: 100,
        max_customers: 1000,
        max_products: 500,
        max_warehouses: 3,
        max_documents: 1000,
        max_api_calls: 25000,
        max_quotes: 500,
        max_reports: 50,
        trial_days: 14,
        grace_period_days: 7,
        features: { priority_support: true, email_support: true },
        modules: { crm: true, hrms: true, payroll: true, inventory: true, accounting: true, support: true, analytics: true, api_access: true, workflow_automation: false, custom_branding: false, custom_fields: true, role_management: true }
      },
      {
        plan_name: 'Business',
        plan_code: 'business',
        description: 'Advanced features for established companies',
        badge_label: 'BEST VALUE',
        plan_type: 'paid',
        sort_order: 3,
        price_monthly: 1999,
        price_quarterly: 5397,
        price_yearly: 19990,
        max_users: 50,
        max_branches: 10,
        max_storage_gb: 50,
        max_leads: 15000,
        max_projects: 250,
        max_invoices: 5000,
        max_employees: 250,
        max_customers: 5000,
        max_products: 2000,
        max_warehouses: 5,
        max_documents: 5000,
        max_api_calls: 100000,
        max_quotes: 2000,
        max_reports: 100,
        trial_days: 14,
        grace_period_days: 7,
        features: { priority_support: true, dedicated_account_manager: true, phone_support: true },
        modules: { crm: true, hrms: true, payroll: true, inventory: true, accounting: true, support: true, analytics: true, api_access: true, workflow_automation: true, custom_branding: true, custom_fields: true, role_management: true }
      },
      {
        plan_name: 'Enterprise',
        plan_code: 'enterprise',
        description: 'Unlimited power for large organizations',
        badge_label: 'ENTERPRISE',
        plan_type: 'enterprise',
        sort_order: 4,
        price_monthly: 4999,
        price_quarterly: 13497,
        price_yearly: 49990,
        max_users: 99999,
        max_branches: 99999,
        max_storage_gb: 200,
        max_leads: 99999,
        max_projects: 99999,
        max_invoices: 99999,
        max_employees: 99999,
        max_customers: 99999,
        max_products: 99999,
        max_warehouses: 99999,
        max_documents: 99999,
        max_api_calls: 999999,
        max_quotes: 99999,
        max_reports: 99999,
        trial_days: 30,
        grace_period_days: 10,
        features: { all_features: true, priority_support: true, dedicated_account_manager: true, sla: true, custom_integrations: true, phone_support: true },
        modules: { crm: true, hrms: true, payroll: true, inventory: true, accounting: true, support: true, analytics: true, api_access: true, workflow_automation: true, custom_branding: true, custom_fields: true, role_management: true }
      }
    ];

    for (const plan of defaultPlans) {
      const exists = await SubscriptionPlan.findOne({ plan_code: plan.plan_code });
      if (!exists) {
        await SubscriptionPlan.create({
          ...plan,
          is_active: true,
          is_public: true,
          currency: 'INR'
        });
      }
    }

    console.log("SaaS enterprise schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing SaaS schema: ${message}`);
  }
};

