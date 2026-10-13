import { Request, Response } from 'express';
import { Role, Permission, RolePermission, UserRoleAssignment, UserPermissionOverride } from '../../db/ModelSceham/rbacSchema';
import RBACService from '../../services/saas/RBACService';
import PermissionRegistry from '../../services/saas/PermissionRegistry';
import mongoose from 'mongoose';

export class RBACController {
  /**
   * Get all registered permission definitions grouped by module
   */
  static async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await Permission.find({}).sort({ module: 1, code: 1 });
      const modules = PermissionRegistry.getRegisteredModules();

      res.status(200).json({
        success: true,
        count: permissions.length,
        modules,
        permissions
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
    }
  }

  /**
   * Get tenant roles (system templates + custom tenant roles)
   */
  static async getRoles(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;

      let filter: any = {};
      if (req.user?.scope === 'platform') {
        // Platform user sees all roles
        filter = {};
      } else if (tenantId) {
        filter = { tenant_id: new mongoose.Types.ObjectId(tenantId as string) };
      }

      const roles = await Role.find(filter).sort({ role_type: 1, name: 1 }).lean();

      res.status(200).json({
        success: true,
        count: roles.length,
        roles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch roles' });
    }
  }

  /**
   * Create a new custom tenant role with permission mappings
   */
  static async createCustomRole(req: any, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const { name, code, description, permissionCodes, dataScope } = req.body;

      if (!name || !code) {
        res.status(400).json({ success: false, error: 'Role name and code are required' });
        return;
      }

      const tId = new mongoose.Types.ObjectId(tenantId as string);

      const existing = await Role.findOne({ tenant_id: tId, code: code.toLowerCase() });
      if (existing) {
        res.status(400).json({ success: false, error: 'Role code already exists in this tenant' });
        return;
      }

      const role = await Role.create({
        tenant_id: tId,
        name,
        code: code.toLowerCase(),
        role_type: 'custom_tenant',
        description: description || '',
        is_editable: true,
        is_deletable: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Map permission codes if provided
      if (Array.isArray(permissionCodes) && permissionCodes.length > 0) {
        const perms = await Permission.find({ code: { $in: permissionCodes } });
        for (const p of perms) {
          await RolePermission.create({
            role_id: role._id,
            permission_id: p._id,
            permission_code: p.code,
            data_scope: dataScope || 'organization',
            granted: true
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Custom role created successfully',
        role
      });
    } catch (error) {
      console.error('Error creating custom role:', error);
      res.status(500).json({ success: false, error: 'Failed to create role' });
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignUserRole(req: any, res: Response): Promise<void> {
    try {
      const { userTenantId, roleId, branchId, departmentId } = req.body;

      if (!userTenantId || !roleId) {
        res.status(400).json({ success: false, error: 'userTenantId and roleId are required' });
        return;
      }

      const assignment = await RBACService.assignRoleToUser(
        userTenantId,
        roleId,
        branchId,
        departmentId
      );

      res.status(200).json({
        success: true,
        message: 'Role assigned successfully',
        assignment
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ success: false, error: 'Failed to assign role' });
    }
  }
}

export default RBACController;
