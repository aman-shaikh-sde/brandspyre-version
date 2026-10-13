import { Request, Response, NextFunction } from "express";

/**
 * Master Super Admin Middleware
 * 
 * This middleware protects platform-level routes that require Master Super Admin access.
 * Only users with role 'master_super_admin' can access these routes.
 * 
 * Usage:
 * router.use(authMiddleware);
 * router.use(masterSuperAdminAuth);
 * router.get('/organizations', getAllOrganizations);
 */

export const masterSuperAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const userRole = req.user?.userRole;

  // Check if user has master_super_admin role
  if (userRole !== 'master_super_admin') {
    res.status(403).json({
      success: false,
      message: "Access denied: Master Super Admin privileges required"
    });
    return;
  }

  next();
};

export default masterSuperAdminAuth;
