import express from 'express';
import { getStatus, updateStep } from '../controllers/saas/saasOnboardingController';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);
router.get('/status', getStatus);
router.get('/progress', getStatus);
router.put('/step', updateStep);

export default router;
