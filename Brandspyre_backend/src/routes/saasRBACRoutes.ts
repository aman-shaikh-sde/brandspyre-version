import { Router } from 'express';
import RBACController from '../controllers/saas/rbacController';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { authorizePermission } from '../middleware/authorize';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());

// Permissions Registry API
router.get('/permissions', authorizePermission('setting.roles.manage'), RBACController.getPermissions);

// Roles API
router.get('/roles', authorizePermission('setting.roles.manage'), RBACController.getRoles);
router.post('/roles', authorizePermission('setting.roles.manage'), RBACController.createCustomRole);

// User Multi-Role Assignment API
router.post('/assign-role', authorizePermission('setting.roles.manage'), RBACController.assignUserRole);

export default router;
