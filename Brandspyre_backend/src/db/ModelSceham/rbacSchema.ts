import mongoose, { Schema, Document } from 'mongoose';

// -------------------------------------------------------------
// 1. Role Schema (Platform, System Templates, Custom Tenant Roles)
// -------------------------------------------------------------
export interface IRole extends Document {
  tenant_id?: mongoose.Types.ObjectId | null; // null for platform / system templates
  name: string;
  code: string;
  role_type: 'platform' | 'system_template' | 'system_tenant' | 'custom_tenant';
  description?: string;
  is_editable: boolean;
  is_deletable: boolean;
  created_at: Date;
  updated_at: Date;
}

export const RoleSchema: Schema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, index: true },
  role_type: { 
    type: String, 
    enum: ['platform', 'system_template', 'system_tenant', 'custom_tenant'], 
    default: 'custom_tenant',
    index: true 
  },
  description: { type: String, default: '' },
  is_editable: { type: Boolean, default: true },
  is_deletable: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

RoleSchema.pre('validate', function(next) {
  const doc = this as any;
  if (!doc.code && doc.name) {
    doc.code = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  next();
});

RoleSchema.index({ tenant_id: 1, code: 1 }, { unique: true, sparse: true });

// -------------------------------------------------------------
// 2. Permission Schema (Modular Dot-Notation Permissions)
// -------------------------------------------------------------
export interface IPermission extends Document {
  module: string; // crm | sales | hr | finance | purchase | inventory | project | report | setting | billing
  resource: string;
  action: string; // read | create | update | delete | approve | export | import | assign | manage
  code: string; // e.g. "sales.order.create"
  description: string;
  created_at: Date;
}

export const PermissionSchema: Schema = new Schema({
  module: { type: String, required: true, index: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

// -------------------------------------------------------------
// 3. RolePermission Schema (Mapping Roles to Permission Codes & Data Scope)
// -------------------------------------------------------------
export interface IRolePermission extends Document {
  role_id: mongoose.Types.ObjectId;
  permission_id: mongoose.Types.ObjectId;
  permission_code: string;
  data_scope: 'own' | 'team' | 'department' | 'branch' | 'organization' | 'platform';
  granted: boolean;
}

export const RolePermissionSchema: Schema = new Schema({
  role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
  permission_id: { type: Schema.Types.ObjectId, ref: 'Permission', required: true, index: true },
  permission_code: { type: String, required: true, index: true },
  data_scope: { 
    type: String, 
    enum: ['own', 'team', 'department', 'branch', 'organization', 'platform'], 
    default: 'organization' 
  },
  granted: { type: Boolean, default: true }
});

RolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

// -------------------------------------------------------------
// 4. UserRoleAssignment Schema (Multi-Role Assignment per Branch & Dept)
// -------------------------------------------------------------
export interface IUserRoleAssignment extends Document {
  user_tenant_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
  branch_id?: mongoose.Types.ObjectId | null;
  department_id?: mongoose.Types.ObjectId | null;
  effective_from: Date;
  effective_to?: Date | null;
  is_active: boolean;
  created_at: Date;
}

export const UserRoleAssignmentSchema: Schema = new Schema({
  user_tenant_id: { type: Schema.Types.ObjectId, ref: 'UserTenant', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo', required: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
  branch_id: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
  department_id: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  effective_from: { type: Date, default: Date.now },
  effective_to: { type: Date, default: null },
  is_active: { type: Boolean, default: true, index: true },
  created_at: { type: Date, default: Date.now }
});

UserRoleAssignmentSchema.index({ user_tenant_id: 1, role_id: 1, branch_id: 1 }, { unique: true });

// -------------------------------------------------------------
// 5. UserPermissionOverride Schema (Per-User Allow/Deny Overrides)
// -------------------------------------------------------------
export interface IUserPermissionOverride extends Document {
  user_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  permission_id: mongoose.Types.ObjectId;
  permission_code: string;
  effect: 'allow' | 'deny';
  data_scope?: 'own' | 'team' | 'department' | 'branch' | 'organization' | 'platform';
  created_at: Date;
}

export const UserPermissionOverrideSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo', required: true, index: true },
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  permission_id: { type: Schema.Types.ObjectId, ref: 'Permission', required: true },
  permission_code: { type: String, required: true, index: true },
  effect: { type: String, enum: ['allow', 'deny'], required: true },
  data_scope: { 
    type: String, 
    enum: ['own', 'team', 'department', 'branch', 'organization', 'platform'], 
    default: 'organization' 
  },
  created_at: { type: Date, default: Date.now }
});

UserPermissionOverrideSchema.index({ user_id: 1, tenant_id: 1, permission_id: 1 }, { unique: true });

// -------------------------------------------------------------
// 6. FeatureFlag Schema (Subscription Feature Flag Controls)
// -------------------------------------------------------------
export interface IFeatureFlag extends Document {
  tenant_id: mongoose.Types.ObjectId;
  module_key: string; // crm | sales | hr | finance | purchase | inventory | project | report | setting | billing
  is_enabled: boolean;
  updated_at: Date;
}

export const FeatureFlagSchema: Schema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  module_key: { type: String, required: true, index: true },
  is_enabled: { type: Boolean, default: true },
  updated_at: { type: Date, default: Date.now }
});

FeatureFlagSchema.index({ tenant_id: 1, module_key: 1 }, { unique: true });

// Exports
export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
export const Permission = mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);
export const RolePermission = mongoose.models.RolePermission || mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
export const UserRoleAssignment = mongoose.models.UserRoleAssignment || mongoose.model<IUserRoleAssignment>('UserRoleAssignment', UserRoleAssignmentSchema);
export const UserPermissionOverride = mongoose.models.UserPermissionOverride || mongoose.model<IUserPermissionOverride>('UserPermissionOverride', UserPermissionOverrideSchema);
export const FeatureFlag = mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
