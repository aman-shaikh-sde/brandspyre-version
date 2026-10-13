import express from 'express';
import {
  getAllOrganizations,
  getOrganizationDetails,
  updateOrganizationStatus,
  getAllPayments,
  processRefund,
  getRevenueMetrics,
  getCoupons,
  createCoupon
} from '../controllers/saas/superAdminController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Require platform admin auth for all super admin routes
router.use(authMiddleware);

// Middleware to ensure user is platform admin or superadmin
router.use((req: any, res, next) => {
  const role = (req.user?.userRole || req.user?.role || '').toLowerCase();
  if (role !== 'platform_superadmin' && role !== 'superadmin' && role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Super Admin privilege required.' });
    return;
  }
  next();
});

router.get('/organizations', getAllOrganizations);
router.get('/organizations/:id', getOrganizationDetails);
router.put('/organizations/:id/status', updateOrganizationStatus);
router.get('/payments', getAllPayments);
router.post('/payments/:id/refund', processRefund);
router.get('/revenue/dashboard', getRevenueMetrics);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);

export default router;
