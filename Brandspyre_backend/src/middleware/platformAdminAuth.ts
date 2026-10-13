import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../db/ModelSceham/saasSchema';
import { isPlatformAdminRole } from '../utils/roleUtils';

/**
 * PLATFORM ADMIN Authorization Middleware
 * Enforces dedicated Platform Admin capability for multi-tenant SaaS management.
 */
export const platformAdminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const userRole = (user?.userRole || user?.role || '').toLowerCase();

    if (!isPlatformAdminRole(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: Platform Admin authorization required.',
        code: 'PLATFORM_ADMIN_REQUIRED'
      });
      return;
    }

    // Log admin access audit trail for non-GET modifying requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      try {
        await AuditLog.create({
          tenant_id: user?.tenantId || null,
          user_id: user?.userId || null,
          action: `PLATFORM_ADMIN_${req.method}_${req.path.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()}`,
          entity: 'PLATFORM_ADMIN_ACTION',
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            bodyKeys: Object.keys(req.body || {})
          },
          ip: req.ip || req.socket.remoteAddress || ''
        });
      } catch (e) {
        // Continue even if audit log fails
      }
    }

    next();
  } catch (error) {
    console.error('Platform Admin Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error validating Platform Admin credentials.'
    });
  }
};

export default platformAdminAuth;
