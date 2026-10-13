import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { Tenant, UserTenant, TenantSubscription, RefreshToken, AuditLog } from '../../db/ModelSceham/saasSchema';
import { Branch } from '../../db/ModelSceham/branchSchema';
import { LogEntry } from '../../db/ModelSceham/user/18_loginEntry';
import tokenSession, { revokeAllUserTokens } from '../../middleware/token';
import { createSession, revokeSession, revokeAllUserSessions, sessionStore } from '../../middleware/sessionStore';
import { todayDate, todayTime } from '../../db/timezone';
import InitializationService, { OrgRegistrationWizardPayload } from './InitializationService';
import OnboardingService from './OnboardingService';
import SubscriptionService from './SubscriptionService';
import EmailService from '../email/EmailService';
import MfaService from './MfaService';
import { normalizeEmail } from '../../utils/emailUtils';

export class AuthService {
  /**
   * Complete multi-step organization registration wizard.
   */
  static async registerOrganization(payload: OrgRegistrationWizardPayload) {
    return await InitializationService.registerOrganizationTransaction(payload);
  }

  /**
   * Verifies tenant email using verification token.
   */
  static async verifyEmail(token: string) {
    const tenant = await Tenant.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: new Date() }
    });

    if (!tenant) {
      throw new Error('Invalid or expired email verification token.');
    }

    tenant.is_email_verified = true;
    tenant.email_verification_token = undefined;
    tenant.email_verification_expires = undefined;
    await tenant.save();

    // Update onboarding status
    await OnboardingService.updateStep(tenant._id.toString(), { email_verified: true });

    return { success: true, message: 'Email verified successfully', tenantId: tenant._id };
  }

  /**
   * Enterprise tenant-aware login handler.
   */
  static async login(email: string, pass: string, device?: string, ip?: string) {
    const emailLower = normalizeEmail(email);
    if (!emailLower) {
      console.warn(`[AUTH_LOGIN_USER_NOT_FOUND] Login attempt with empty email.`);
      throw new Error('Invalid email or password.');
    }

    // Primary exact normalized lookup
    let user = await UserInfo.findOne({ email: emailLower }).lean() as any;

    // Fallback: case-insensitive regex in case user was stored with legacy mixed casing
    if (!user) {
      const escapedEmail = emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await UserInfo.findOne({
        email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
      }).lean() as any;

      if (user && user._id) {
        // Auto-migrate legacy non-normalized email to canonical lowercase
        await UserInfo.updateOne({ _id: user._id }, { $set: { email: emailLower } }).catch(() => {});
        user.email = emailLower;
      }
    }

    if (!user) {
      console.warn(`[AUTH_LOGIN_USER_NOT_FOUND] User account not found for email: ${emailLower}`);
      throw new Error('Invalid email or password.');
    }

    if (!user.password) {
      console.warn(`[AUTH_LOGIN_PASSWORD_MISSING] User account has no password set: ${emailLower}`);
      throw new Error('Invalid email or password.');
    }

    if (user.status && user.status.toLowerCase() !== 'active') {
      console.warn(`[AUTH_LOGIN_ACCOUNT_INACTIVE] Account is inactive: ${emailLower}`);
      const err: any = new Error('Account is inactive. Please contact your organization administrator.');
      err.code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (!isValidPassword) {
      console.warn(`[AUTH_LOGIN_PASSWORD_MISMATCH] Password mismatch for user: ${emailLower}`);
      throw new Error('Invalid email or password.');
    }

    const userId = user._id.toString();
    const role = (user.role || '').toLowerCase();

    // Lookup tenant association
    let tenantId: string | undefined;
    const userTenant = await UserTenant.findOne({
      $or: [
        { user_id: user._id },
        { user_id: new mongoose.Types.ObjectId(userId) },
        { user_id: userId }
      ]
    });
    if (userTenant) {
      tenantId = userTenant.tenant_id.toString();
    }

    // Subscription & Organization enforcement for non-platform admins
    let graceWarning: any = null;
    if (role !== 'platform_superadmin' && role !== 'superadmin' && tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('ORGANIZATION_NOT_FOUND: Organization account does not exist.');
      }

      if (tenant.status === 'suspended' || tenant.status === 'deleted') {
        throw new Error(`ORGANIZATION_SUSPENDED: Your organization account has been ${tenant.status}. Please contact support.`);
      }

      const subscription = await TenantSubscription.findOne({ tenant_id: tenantId });
      if (!subscription) {
        throw new Error('SUBSCRIPTION_REQUIRED: No subscription found for your organization. Please choose a subscription plan.');
      }

      // Evaluate live subscription status (auto-shifts trial->grace->expired)
      const subStatus = await SubscriptionService.evaluateSubscriptionStatus(tenantId);
      const now = new Date();
      const hasActivePaidPeriod = (subscription.end_date && subscription.end_date > now) ||
                                  (tenant.subscription_end_date && tenant.subscription_end_date > now);

      if (subStatus !== 'trial' && !hasActivePaidPeriod && (subStatus === 'pending_payment' || subscription.payment_status === 'pending')) {
        throw new Error('PAYMENT_PENDING: Payment is pending for your organization subscription. Please complete payment to access your account.');
      }

      if (subStatus === 'expired') {
        if (subscription.status === 'trial' || subscription.trial_end_date) {
          throw new Error('TRIAL_EXPIRED: Your 14-day free trial has expired. Please choose a subscription plan to continue.');
        } else {
          throw new Error('SUBSCRIPTION_EXPIRED: Your organization subscription has expired. Please renew your subscription to access your account.');
        }
      }

      if (subStatus === 'suspended') {
        throw new Error('ORGANIZATION_SUSPENDED: Your organization account has been suspended.');
      }

      if (subStatus === 'cancelled') {
        throw new Error('SUBSCRIPTION_CANCELLED: Your organization subscription has been cancelled. Please reactivate your plan.');
      }

      if (subStatus === 'grace' && subscription.grace_end_date) {
        const remainingMs = subscription.grace_end_date.getTime() - Date.now();
        const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        graceWarning = {
          inGracePeriod: true,
          graceDaysRemaining: Math.max(0, daysLeft),
          graceEndDate: subscription.grace_end_date,
          message: `Warning: Your subscription has expired. You are in a ${daysLeft}-day grace period. Please renew to avoid account suspension.`
        };
      }
    }

    // Lookup authorized branch code (do not fallback to arbitrary tenant branch)
    let branchcode = user.branchcode || '';

    // -------------------------------------------------------------
    // MFA ENFORCEMENT CHECK (Email OTP MFA Only)
    // -------------------------------------------------------------
    const isMfaMandatory = MfaService.isMfaMandatoryForRole(role);
    const isMfaActive = Boolean(user.mfaEnabled);

    if (isMfaActive || isMfaMandatory) {
      const destinationEmail = user.mfaEmail || user.email;
      const purpose = isMfaActive ? "LOGIN_MFA" : "LOGIN_SETUP_MFA";

      const challenge = await MfaService.createChallenge({
        userId,
        email: destinationEmail,
        purpose,
        requestIp: ip,
        userAgent: device,
        tenantId,
        loginContext: {
          userId,
          role,
          branchcode,
          tenantId,
          device,
          ip
        }
      });

      // CRITICAL: DO NOT ISSUE ACCESS TOKEN, REFRESH TOKEN, OR SESSION UNTIL MFA IS VERIFIED!
      return {
        mfaRequired: true,
        mfaSetupRequired: !isMfaActive && isMfaMandatory,
        challengeId: challenge.challengeId,
        maskedEmail: challenge.maskedEmail,
        expiresInSeconds: challenge.expiresInSeconds,
        resendCooldownSeconds: challenge.resendCooldownSeconds,
        message: isMfaActive
          ? "Multi-Factor Authentication required. Enter the verification code sent to your email."
          : "Multi-Factor Authentication is mandatory for your role. Please enter the verification code sent to your email to complete setup."
      };
    }

    // Log login entry
    await LogEntry.create({
      branchcode,
      staff_id: userId,
      date: todayDate,
      time: todayTime,
      ip,
      device
    });

    // 1. Create a unique session in the persistent session store
    const session = await createSession({
      userId,
      role,
      brcode: branchcode,
      tenantId,
      userAgent: device,
      ip
    });

    // 2. Generate Access & Refresh tokens bound to this unique session ID (sid)
    const { accessToken, refreshToken } = await tokenSession.generateTokens(
      userId,
      role,
      branchcode,
      tenantId,
      undefined,
      session.sessionId
    );

    if (tenantId) {
      await AuditLog.create({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        user_id: user._id,
        action: 'USER_LOGIN',
        entity: 'UserInfo',
        ip
      });
    }

    return {
      user: {
        id: userId,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        tenantId,
        branchcode
      },
      tokens: {
        accessToken
      },
      refreshToken, // Returned at top level for controller to set in HttpOnly cookie
      sid: session.sessionId,
      graceWarning
    };
  }

  /**
   * Finalizes MFA login after OTP verification.
   * Mints session and returns JWT tokens bound to the authenticated user.
   */
  static async completeMfaLogin(params: {
    challengeId: string;
    otp: string;
    ip?: string;
    device?: string;
  }) {
    const { challengeId, otp, ip, device } = params;

    const { challenge } = await MfaService.verifyChallenge({
      challengeId,
      enteredOtp: otp,
      requestIp: ip
    });

    if (challenge.purpose !== "LOGIN_MFA" && challenge.purpose !== "LOGIN_SETUP_MFA") {
      throw new Error("INVALID_PURPOSE: This challenge is not a login challenge.");
    }

    const ctx = challenge.loginContext;
    if (!ctx || !ctx.userId) {
      throw new Error("CORRUPTED_CHALLENGE: Login context missing from challenge.");
    }

    const user = await UserInfo.findById(ctx.userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND: User associated with challenge no longer exists.");
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      throw new Error("ACCOUNT_INACTIVE: Account is inactive. Contact your administrator.");
    }

    // If setup was required, enable MFA now
    if (challenge.purpose === "LOGIN_SETUP_MFA") {
      user.mfaEnabled = true;
      user.mfaEmail = user.email;
      user.mfaVerifiedAt = new Date();
      await AuditLog.create({
        tenant_id: ctx.tenantId ? new mongoose.Types.ObjectId(ctx.tenantId) : undefined,
        user_id: user._id,
        action: "MFA_ENABLED",
        entity: "MfaChallenge",
        details: { setupViaLogin: true },
        ip
      }).catch(() => {});
    }

    user.recentMfaAt = new Date();
    await user.save();

    const userId = user._id.toString();
    const role = (ctx.role || user.role || "").toLowerCase();
    const branchcode = ctx.branchcode || user.branchcode || "";
    const tenantId = ctx.tenantId;

    // Log login entry
    await LogEntry.create({
      branchcode,
      staff_id: userId,
      date: todayDate,
      time: todayTime,
      ip: ip || ctx.ip,
      device: device || ctx.device
    }).catch(() => {});

    // 1. Create a unique session in the persistent session store
    const session = await createSession({
      userId,
      role,
      brcode: branchcode,
      tenantId,
      userAgent: device || ctx.device,
      ip: ip || ctx.ip
    });

    // 2. Generate Access & Refresh tokens bound to this unique session ID (sid)
    const { accessToken, refreshToken } = await tokenSession.generateTokens(
      userId,
      role,
      branchcode,
      tenantId,
      undefined,
      session.sessionId
    );

    if (tenantId) {
      await AuditLog.create({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        user_id: user._id,
        action: "USER_LOGIN",
        entity: "UserInfo",
        details: { mfaVerified: true },
        ip
      }).catch(() => {});
    }

    return {
      user: {
        id: userId,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        tenantId,
        branchcode,
        mfaEnabled: true,
        mfaVerified: true
      },
      tokens: {
        accessToken
      },
      refreshToken, // Returned at top level for controller to set in HttpOnly cookie
      sid: session.sessionId
    };
  }

  /**
   * Generates password reset token, saves expiry, and emails reset link.
   * Enforces strict anti-user-enumeration security by returning generic response.
   */
  static async requestPasswordReset(email: string) {
    const emailNormalized = normalizeEmail(email);
    if (!emailNormalized) {
      return {
        success: true,
        message: 'If an account exists with that email, password reset instructions have been sent.'
      };
    }

    let user = await UserInfo.findOne({ email: emailNormalized });
    if (!user) {
      // Fallback: check case-insensitive match for legacy mixed-case accounts
      const escapedEmail = emailNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await UserInfo.findOne({
        email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
      });
      if (user && user._id) {
        // Auto-normalize email
        await UserInfo.updateOne({ _id: user._id }, { $set: { email: emailNormalized } }).catch(() => {});
        user.email = emailNormalized;
      }
    }
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hr

      await UserInfo.updateOne(
        { _id: user._id },
        {
          $set: {
            reset_password_token: resetTokenHash,
            reset_password_expires: resetExpires,
            email: emailNormalized
          }
        }
      );

      // Trigger password reset email via Zoho SMTP
      const userName = user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : 'User';
      EmailService.sendPasswordResetEmail({
        userName,
        userEmail: emailNormalized,
        resetToken,
        tenantId: user.tenant_id
      }).catch((err) => {
        console.error('[AuthService] Failed to send password reset email:', err?.message || err);
      });
    }

    // Always return uniform generic response to prevent user enumeration
    return {
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.'
    };
  }

  /**
   * Resets password using reset token with strong password policy.
   */
  static async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string') {
      throw new Error('Reset token is required.');
    }

    if (!newPassword || newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters long.');
    }

    const cleanToken = token.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    const user = await UserInfo.findOne({
      $or: [
        { reset_password_token: tokenHash },
        { reset_password_token: cleanToken }
      ],
      reset_password_expires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const normalizedEmail = user.email ? normalizeEmail(user.email) : user.email;

    // Atomically persist new password and remove reset token
    const updateResult = await UserInfo.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          email: normalizedEmail,
          last_update_datetime: new Date()
        },
        $unset: {
          reset_password_token: 1,
          reset_password_expires: 1
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error('User record not found during password update.');
    }

    // Verify hash persistence
    const verifiedUser = await UserInfo.findById(user._id).select('+password').lean() as any;
    if (!verifiedUser || !verifiedUser.password) {
      throw new Error('Failed to verify password persistence in database.');
    }
    const hashMatches = await bcrypt.compare(newPassword, verifiedUser.password);
    if (!hashMatches) {
      throw new Error('Password hash persistence verification failed.');
    }

    // Revoke all active sessions and refresh tokens for this user upon password reset
    await revokeAllUserTokens(user._id);
    await revokeAllUserSessions(user._id);

    // Send security notification
    const userName = user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : 'User';
    EmailService.sendPasswordChangedConfirmation({
      userName,
      userEmail: normalizedEmail,
      tenantId: user.tenant_id
    }).catch(() => {});

    return { success: true, message: 'Password reset successfully. Please log in with your new password.' };
  }

  /**
   * Refreshes access token using valid refresh token with token family tracking and reuse detection.
   */
  static async rotateRefreshToken(token: string) {
    return await tokenSession.rotateRefreshToken(token);
  }

  /**
   * Revokes refresh token and ends session on logout.
   */
  static async logout(token?: string, userId?: string, sid?: string) {
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await RefreshToken.updateMany(
        { token_hash: tokenHash },
        { $set: { is_revoked: true } }
      );
    }

    if (sid) {
      await revokeSession(sid);
    } else if (userId) {
      await revokeAllUserSessions(userId);
    }

    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * Fetches all tenant workspaces assigned to a user.
   */
  static async getUserWorkspaces(userId: string) {
    const userTenants = await UserTenant.find({
      user_id: new mongoose.Types.ObjectId(userId),
      is_active: true
    }).lean();

    const tenantIds = userTenants.map(ut => ut.tenant_id);
    const tenants = await Tenant.find({ _id: { $in: tenantIds }, status: { $ne: 'deleted' } }).lean();

    const tenantMap = new Map(tenants.map((t: any) => [t._id.toString(), t]));

    const workspaces = userTenants.map(ut => {
      const tenant = tenantMap.get(ut.tenant_id.toString());
      return {
        tenantId: ut.tenant_id.toString(),
        organizationName: tenant?.name || tenant?.company_name || 'Organization',
        tenantCode: tenant?.tenant_code || '',
        subdomain: tenant?.subdomain || '',
        role: ut.role,
        isOwner: ut.is_owner,
        status: tenant?.status || 'active'
      };
    });

    return workspaces;
  }

  /**
   * Switches the active workspace context for a user and generates new scoped tokens and session.
   */
  static async switchWorkspace(userId: string, targetTenantId: string) {
    const userTenant = await UserTenant.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      tenant_id: new mongoose.Types.ObjectId(targetTenantId),
      is_active: true
    });

    if (!userTenant) {
      throw new Error('Access denied: You do not belong to the target workspace.');
    }

    const tenant = await Tenant.findById(targetTenantId);
    if (!tenant || tenant.status === 'deleted' || tenant.status === 'suspended') {
      throw new Error('Target organization workspace is suspended or unavailable.');
    }

    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    // Lookup authorized branch code (do not fallback to arbitrary tenant branch)
    let branchcode = userTenant.default_branch_code || user.branchcode || '';

    const role = userTenant.role || user.role || 'employee';

    // 1. Create a workspace-scoped session
    const session = await createSession({
      userId,
      role,
      brcode: branchcode,
      tenantId: targetTenantId
    });

    // 2. Generate new tenant-scoped tokens bound to this session
    const { accessToken, refreshToken } = await tokenSession.generateTokens(
      userId,
      role,
      branchcode,
      targetTenantId,
      undefined,
      session.sessionId
    );

    return {
      message: `Switched to workspace ${tenant.name}`,
      accessToken,
      refreshToken,
      activeWorkspace: {
        tenantId: tenant._id.toString(),
        name: tenant.name,
        tenantCode: tenant.tenant_code,
        role,
        branchcode
      }
    };
  }
}

export default AuthService;
