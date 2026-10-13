import mongoose from 'mongoose';
import {
  Role,
  Permission,
  RolePermission,
  UserRoleAssignment,
  UserPermissionOverride,
  IRole
} from '../../db/ModelSceham/rbacSchema';
import { UserTenant } from '../../db/ModelSceham/saasSchema';
import PermissionRegistry from './PermissionRegistry';

export interface AuthorizationResult {
  granted: boolean;
  data_scope: 'own' | 'team' | 'department' | 'branch' | 'organization' | 'platform';
  reason?: string;
}

export class RBACService {
  /**
   * Seed default system roles and permission mappings for a new tenant
   */
  static async seedTenantSystemRoles(tenantId: mongoose.Types.ObjectId | string, session?: mongoose.ClientSession) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const opts = session ? { session, ordered: true } : { ordered: true };

    const systemRoleTemplates = [
      { code: 'org_owner', name: 'Organization Owner', description: 'Full un-restricted control over the tenant organization.', is_editable: false },
      { code: 'org_admin', name: 'Organization Administrator', description: 'Full operational administration across tenant resources.', is_editable: true },
      { code: 'sales_manager', name: 'Sales Manager', description: 'Manages sales pipelines, leads, campaigns, clients, quotations, and public marketing content.', is_editable: true },
      { code: 'finance_manager', name: 'Finance Manager', description: 'Manages invoices, accounting, payments, and financial reports.', is_editable: true },
      { code: 'hr_manager', name: 'HR Manager', description: 'Manages employees, attendance, leaves, payroll, and HR reports.', is_editable: true },
      { code: 'purchase_manager', name: 'Purchase Manager', description: 'Manages vendors, procurement, and purchase orders.', is_editable: true },
      { code: 'inventory_manager', name: 'Inventory Manager', description: 'Manages stock items, warehouses, and stock transfers.', is_editable: true },
      { code: 'project_manager', name: 'Project Manager', description: 'Manages projects, milestones, tasks, and team timesheets.', is_editable: true },
      { code: 'employee', name: 'Employee', description: 'Self-service user for assigned tasks, timesheets, and leaves.', is_editable: true },
      { code: 'viewer', name: 'Viewer', description: 'Read-only access across enabled tenant modules.', is_editable: true }
    ];

    const createdRoles: Record<string, IRole> = {};

    for (const tmpl of systemRoleTemplates) {
      const [role] = await Role.create([{
        tenant_id: tId,
        name: tmpl.name,
        code: tmpl.code,
        role_type: tmpl.code === 'org_owner' ? 'system_tenant' : 'system_tenant',
        description: tmpl.description,
        is_editable: tmpl.is_editable,
        is_deletable: tmpl.code !== 'org_owner' && tmpl.code !== 'org_admin',
        created_at: new Date(),
        updated_at: new Date()
      }], opts);
      createdRoles[tmpl.code] = role;
    }

    // Map permissions to created roles
    const allPermissions = await Permission.find({}).session(session || null);

    for (const p of allPermissions) {
      // 1. Organization Owner gets ALL permissions with 'organization' scope
      await RolePermission.create([{
        role_id: createdRoles['org_owner']._id,
        permission_id: p._id,
        permission_code: p.code,
        data_scope: 'organization',
        granted: true
      }], opts);

      // 2. Organization Admin gets ALL permissions (except setting.roles.manage override if restricted)
      await RolePermission.create([{
        role_id: createdRoles['org_admin']._id,
        permission_id: p._id,
        permission_code: p.code,
        data_scope: 'organization',
        granted: true
      }], opts);

      // 3. Module specific role mappings
      if (p.module === 'sales' || p.module === 'crm' || p.module === 'content') {
        await RolePermission.create([{
          role_id: createdRoles['sales_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      } else if (p.module === 'finance') {
        await RolePermission.create([{
          role_id: createdRoles['finance_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      } else if (p.module === 'hr') {
        await RolePermission.create([{
          role_id: createdRoles['hr_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      } else if (p.module === 'purchase') {
        await RolePermission.create([{
          role_id: createdRoles['purchase_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      } else if (p.module === 'inventory') {
        await RolePermission.create([{
          role_id: createdRoles['inventory_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      } else if (p.module === 'project') {
        await RolePermission.create([{
          role_id: createdRoles['project_manager']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      }

      // Employee gets self-service permissions ('own' scope)
      if (p.action === 'read' || p.code.includes('create') || p.code.includes('leave') || p.code.includes('task') || p.code.includes('timesheet')) {
        await RolePermission.create([{
          role_id: createdRoles['employee']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'own',
          granted: true
        }], opts);
      }

      // Viewer gets read-only permissions ('organization' scope)
      if (p.action === 'read') {
        await RolePermission.create([{
          role_id: createdRoles['viewer']._id,
          permission_id: p._id,
          permission_code: p.code,
          data_scope: 'organization',
          granted: true
        }], opts);
      }
    }

    return createdRoles;
  }

  /**
   * Evaluate if a user has a specific permission within a tenant organization
   */
  static async evaluatePermission(
    userId: mongoose.Types.ObjectId | string,
    tenantId: mongoose.Types.ObjectId | string,
    permissionCode: string
  ): Promise<AuthorizationResult> {
    try {
      const uId = mongoose.Types.ObjectId.isValid(String(userId)) ? new mongoose.Types.ObjectId(String(userId)) : String(userId);
      const tId = mongoose.Types.ObjectId.isValid(String(tenantId)) ? new mongoose.Types.ObjectId(String(tenantId)) : String(tenantId);

      // 1. Check User Specific Permission Overrides first (Highest precedence)
      const isUserObjectId = mongoose.Types.ObjectId.isValid(String(userId));
      const override = isUserObjectId
        ? await UserPermissionOverride.findOne({
            user_id: uId,
            tenant_id: tId,
            permission_code: permissionCode
          })
        : null;

      if (override) {
        if (override.effect === 'deny') {
          return { granted: false, data_scope: 'own', reason: 'User specific deny override in effect' };
        } else {
          return { granted: true, data_scope: override.data_scope || 'organization' };
        }
      }

      // 2. Fetch active UserTenant membership
      const userTenant = await UserTenant.findOne({
        $or: [{ user_id: uId }, { user_id: String(userId) }],
        tenant_id: tId,
        status: 'active'
      });

      if (!userTenant) {
        return { granted: false, data_scope: 'own', reason: 'Active tenant membership not found' };
      }

      // 3. If User is Tenant Owner or Admin, grant full organization scope
      if (userTenant.is_owner || userTenant.role === 'admin' || userTenant.role === 'org_admin') {
        return { granted: true, data_scope: 'organization' };
      }

      // 4. Fetch all active role assignments for the user
      const roleAssignments = await UserRoleAssignment.find({
        user_tenant_id: userTenant._id,
        is_active: true
      });

      const roleIds = roleAssignments.map(ra => ra.role_id);

      if (roleIds.length === 0) {
        // Fallback: check legacy role on UserTenant / UserInfo
        const legacyRoles = await Role.find({
          tenant_id: tId,
          code: { $in: ['org_owner', 'org_admin', 'admin'] }
        });
        if (legacyRoles.length > 0) {
          return { granted: true, data_scope: 'organization' };
        }
        return { granted: false, data_scope: 'own', reason: 'No active roles assigned' };
      }

      // 5. Evaluate matching RolePermissions across all assigned roles
      const matchedRolePermissions = await RolePermission.find({
        role_id: { $in: roleIds },
        permission_code: permissionCode,
        granted: true
      });

      if (matchedRolePermissions.length === 0) {
        return { granted: false, data_scope: 'own', reason: `Permission '${permissionCode}' not granted by any assigned role` };
      }

      // Determine widest data scope among granted roles
      const scopes: Array<AuthorizationResult['data_scope']> = matchedRolePermissions.map(rp => rp.data_scope);
      const scopePrecedence: Array<AuthorizationResult['data_scope']> = ['platform', 'organization', 'branch', 'department', 'team', 'own'];
      const widestScope = scopePrecedence.find(s => scopes.includes(s)) || 'own';

      return { granted: true, data_scope: widestScope };
    } catch (error) {
      console.error(`Error evaluating permission '${permissionCode}':`, error);
      return { granted: false, data_scope: 'own', reason: 'Permission evaluation error' };
    }
  }

  /**
   * Get all granted permission codes for a user within a tenant organization
   */
  static async getUserPermissionCodes(
    userId: mongoose.Types.ObjectId | string,
    tenantId: mongoose.Types.ObjectId | string
  ): Promise<string[]> {
    try {
      const uId = new mongoose.Types.ObjectId(userId as string);
      const tId = new mongoose.Types.ObjectId(tenantId as string);

      const userTenant = await UserTenant.findOne({ user_id: uId, tenant_id: tId, status: 'active' });
      if (!userTenant) return [];

      // Org owner or admin gets all registered permissions
      if (userTenant.is_owner || userTenant.role === 'admin' || userTenant.role === 'org_owner') {
        const allPermissions = await Permission.find({});
        return allPermissions.map(p => p.code);
      }

      const roleAssignments = await UserRoleAssignment.find({ user_tenant_id: userTenant._id, is_active: true });
      const roleIds = roleAssignments.map(ra => ra.role_id);

      const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds }, granted: true });
      const permCodes = new Set(rolePermissions.map(rp => rp.permission_code));

      // Apply overrides
      const overrides = await UserPermissionOverride.find({ user_id: uId, tenant_id: tId });
      for (const ov of overrides) {
        if (ov.effect === 'deny') {
          permCodes.delete(ov.permission_code);
        } else if (ov.effect === 'allow') {
          permCodes.add(ov.permission_code);
        }
      }

      return Array.from(permCodes);
    } catch (err) {
      console.error('Error fetching user permission codes:', err);
      return [];
    }
  }

  /**
   * Assign a role to a user within a tenant
   */
  static async assignRoleToUser(
    userTenantId: mongoose.Types.ObjectId | string,
    roleId: mongoose.Types.ObjectId | string,
    branchId?: mongoose.Types.ObjectId | string,
    departmentId?: mongoose.Types.ObjectId | string,
    session?: mongoose.ClientSession
  ) {
    const utId = new mongoose.Types.ObjectId(userTenantId as string);
    const rId = new mongoose.Types.ObjectId(roleId as string);
    const opts = session ? { session, upsert: true, new: true } : { upsert: true, new: true };

    const queryOpts = session ? { session } : {};
    const userTenant = await UserTenant.findById(utId, null, queryOpts);
    if (!userTenant) throw new Error('UserTenant membership not found');

    const bId = branchId ? new mongoose.Types.ObjectId(branchId as string) : null;
    const dId = departmentId ? new mongoose.Types.ObjectId(departmentId as string) : null;

    return await UserRoleAssignment.findOneAndUpdate(
      { user_tenant_id: utId, role_id: rId, branch_id: bId },
      {
        user_tenant_id: utId,
        user_id: userTenant.user_id,
        tenant_id: userTenant.tenant_id,
        role_id: rId,
        branch_id: bId,
        department_id: dId,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date()
      },
      opts
    );
  }
}

export default RBACService;

