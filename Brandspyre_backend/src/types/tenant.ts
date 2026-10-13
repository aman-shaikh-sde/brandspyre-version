import { Request, Response } from "express";
import mongoose from "mongoose";

// Extended request interface for tenant authentication
export interface TenantRequest extends Request {
  tenant?: {
    id: any;
    name: string | null;
    domain: string | null;
    subscription_plan: string | null;
    databaseName?: string;
    dbName?: string;
  } | null;
  tenantConnection?: mongoose.Connection;
  userRole?: string;
  subscriptionFeatures?: any;
}

// Extended response interface
export interface TenantResponse extends Response {
  user?: {
    id: number;
    role: string;
    brcode: string;
  };
}

// User role in tenant context
export interface UserTenant {
  user_id: number;
  tenant_id: number;
  role: 'super_admin' | 'admin' | 'hr' | 'manager' | 'employee';
  is_active: boolean;
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Tenant information
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  database_name: string;
  status: 'active' | 'suspended' | 'trial';
  created_at: Date;
  updated_at: Date;
}

// Subscription plan
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  max_users: number;
  max_branches: number;
  features: Record<string, boolean>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tenant subscription
export interface TenantSubscription {
  id: number;
  tenant_id: number;
  subscription_plan_id: number;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  trial_ends_at?: Date;
  billing_cycle: 'monthly' | 'yearly';
  amount_paid: number;
  starts_at: Date;
  ends_at: Date;
  auto_renew: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tenant settings
export interface TenantSetting {
  id: number;
  tenant_id: number;
  setting_key: string;
  setting_value: any;
  created_at: Date;
  updated_at: Date;
}

// Role in tenant
export interface Role {
  id: number;
  tenant_id: number;
  name: string;
  permissions: Record<string, boolean>;
  created_at: Date;
  updated_at: Date;
}
