import { RoleAccess } from '../../db/ModelSceham/roleAccessSchema';

type AccessControlParams = {
    role: string;
    permissions: string;
    brcode: string;
    base: 'all' | 'own' | 'create' | 'edit' | 'delete';
    userId?: number;
    resourceId?: number;
    req?: any;
  };

  export const settingAccessControl = async ({role, permissions, base, brcode, userId, resourceId, req}: AccessControlParams): Promise<boolean> => {
    try {
        const allowedPermissions = new Set([
            'project', 'task', 'milestone', 'teamMembers', 'branches',
            'invoices', 'campaign', 'leads', 'client', 'followingRecords',
            'profile', 'event', 'announcement', 'subscription', 'financial',
            'roles', 'tax', 'payment', 'calendar', 'notification', 'reminder',
            'reportAnalysis', 'activityLog', 'mom', 'userInfo', 'salary',
            'leaveRequest', 'leaveApproved', 'employeeReport', 'document',
            'sharedDocument', 'fileUpload','dashboard', 'accounts', 'tenant'
          ]);
      
          if (!allowedPermissions.has(permissions)) {
            console.error(`Invalid permission category: ${permissions}`);
            return false;
          }

      const normalizedRole = (role || '').toLowerCase();
      if (
        normalizedRole === 'superadmin' ||
        normalizedRole === 'super admin' ||
        normalizedRole === 'master_super_admin' ||
        normalizedRole === 'admin'
      ) {
        return true;
      }

      const roleAccessDoc = await RoleAccess.findOne({ 
        role: new RegExp(`^${role}$`, 'i'), 
        branchcode: brcode.toUpperCase() 
      });

      // If not found by branchcode, try tenant_id for multi-tenant SaaS
      let finalRoleAccessDoc = roleAccessDoc;
      if (!roleAccessDoc && req && (req as any).tenant && (req as any).tenant.id) {
        finalRoleAccessDoc = await RoleAccess.findOne({
          role: new RegExp(`^${role}$`, 'i'),
          tenant_id: (req as any).tenant.id
        });
      }

      if (!finalRoleAccessDoc) {
        console.error(`No role access found for role: ${role}, branch: ${brcode}`);
        return false;
      }
  
      const docObj = (typeof (finalRoleAccessDoc as any).toObject === 'function')
        ? (finalRoleAccessDoc as any).toObject()
        : finalRoleAccessDoc;

      const matchedKey = Object.keys(docObj).find(
        (key) => key.toLowerCase() === permissions.toLowerCase()
      );
  
      if (!matchedKey) {
        console.error(`Permission key not found: ${permissions}`);
        return false;
      }
  
      const permissionObject = (finalRoleAccessDoc as any)[matchedKey];
  
      if (!permissionObject || typeof permissionObject !== 'object') {
        console.error(`Invalid permission object for: ${permissions}`);
        return false;
      }

      const hasBasePermission = (permissionObject as any)[base] === true;
      
      if (!hasBasePermission) {
        return false;
      }

      if (base === 'own' && userId && resourceId) {
        return await checkResourceOwnership(userId, resourceId, permissions, brcode);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`settingAccessControl Error: ${message}`);
      return false;
    }
  };

  const checkResourceOwnership = async (userId: number, resourceId: number, permissionType: string, brcode: string): Promise<boolean> => {
    try {
      // TODO: Implement resource ownership checks when relevant models are migrated
      // For now, return false for 'own' permissions
      console.warn(`Resource ownership check not yet implemented for ${permissionType}`);
      return false;
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return false;
    }
  };

  export const checkTenantAccess = async (userId: number, tenantId: number, permission: string): Promise<boolean> => {
    try {
      // TODO: Implement tenant access checks when user_tenants and tenants models are migrated
      console.warn(`Tenant access check not yet implemented`);
      return false;
    } catch (error) {
      console.error('Error checking tenant access:', error);
      return false;
    }
  };
