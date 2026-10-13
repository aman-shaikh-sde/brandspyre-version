import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import {
  createReferral,
  getMarketplace,
  getMyPublishedReferrals,
  getReceivedReferrals,
  getReferralById,
  togglePublishState,
  requestReferral,
  approveRequest,
  rejectRequest,
  assignProcessor,
  updateStatus,
  getAnalytics,
  getPartnerNetwork,
  getAllRequestsForAdmin
} from '../controllers/saas/referralController';

const router = Router();

router.use(authMiddleware);

// Platform Admin Request Visibility & Global Control
router.get('/admin/all-requests', getAllRequestsForAdmin);
router.get('/marketplace', getMarketplace);

// Organization Specific Views
router.get('/my', tenantAuth(), getMyPublishedReferrals);
router.get('/received', tenantAuth(), getReceivedReferrals);
router.get('/analytics', getAnalytics);
router.get('/partners', tenantAuth(), getPartnerNetwork);

// Referral CRUD & Actions
router.post('/', tenantAuth(), createReferral);
router.get('/:id', getReferralById);
router.patch('/:id/publish', tenantAuth(), togglePublishState);
router.patch('/:id/assign', tenantAuth(), assignProcessor);
router.patch('/:id/status', updateStatus);

// Request & Approval Workflow
router.post('/:id/requests', tenantAuth(), requestReferral);
router.post('/requests/:id/approve', tenantAuth(), approveRequest);
router.post('/requests/:id/reject', tenantAuth(), rejectRequest);

export default router;
