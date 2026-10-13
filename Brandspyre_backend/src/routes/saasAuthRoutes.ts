import express from 'express';
import {
  registerWizard,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getUserWorkspaces,
  switchWorkspace,
  sendMfaOtp,
  verifyMfa,
  enableMfa,
  disableMfa,
  getMfaStatus
} from '../controllers/saas/saasAuthController';
import authMiddleware from '../middleware/auth';

import {
  loginLimiter,
  passwordResetLimiter,
  registrationLimiter,
  refreshLimiter,
  mfaSendLimiter,
  mfaVerifyLimiter,
  mfaConfigLimiter
} from '../middleware/rateLimiter';

const router = express.Router();

// Public Authentication & Registration Routes
router.post('/register-wizard', registrationLimiter, registerWizard);
router.get('/verify-email', verifyEmail);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/refresh-token', refreshLimiter, refreshToken);

// Multi-Factor Authentication (Email OTP MFA)
router.post('/mfa/send', mfaSendLimiter, sendMfaOtp);
router.post('/mfa/verify', mfaVerifyLimiter, verifyMfa);
router.post('/mfa/enable', authMiddleware, mfaConfigLimiter, enableMfa);
router.post('/mfa/disable', authMiddleware, mfaConfigLimiter, disableMfa);
router.get('/mfa/status', authMiddleware, getMfaStatus);

// Authenticated Routes
router.post('/logout', authMiddleware, logout);
router.get('/workspaces', authMiddleware, getUserWorkspaces);
router.post('/switch-workspace', authMiddleware, switchWorkspace);

export default router;
