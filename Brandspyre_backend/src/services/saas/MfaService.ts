import crypto from "crypto";
import mongoose from "mongoose";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { MfaChallenge, IMfaChallenge, MfaPurpose } from "../../db/ModelSceham/mfaChallengeSchema";
import { AuditLog } from "../../db/ModelSceham/saasSchema";
import EmailService from "../email/EmailService";
import bcrypt from "bcrypt";

const OTP_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class MfaService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   * e.g., "482913". Never uses Math.random().
   */
  static generateNumericOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Generates an unguessable unique challenge ID.
   */
  static generateChallengeId(): string {
    return `mfa_ch_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Computes an HMAC-SHA256 hash of the OTP bound to the challenge ID and server pepper.
   */
  static hashOtp(otp: string, challengeId: string): string {
    const pepper =
      process.env.MFA_PEPPER ||
      process.env.ACCESS_SECRET ||
      "brandspyre_production_mfa_default_pepper_salt_984124";
    return crypto
      .createHmac("sha256", pepper)
      .update(`${challengeId}:${otp.trim()}`)
      .digest("hex");
  }

  /**
   * Performs constant-time comparison of entered OTP hash against stored HMAC.
   */
  static verifyOtpHash(enteredOtp: string, challengeId: string, storedHash: string): boolean {
    if (!enteredOtp || !challengeId || !storedHash) return false;
    const computed = this.hashOtp(enteredOtp, challengeId);
    const bufA = Buffer.from(computed, "hex");
    const bufB = Buffer.from(storedHash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Obfuscates email for safe display in UI/API responses (e.g. "am***@gmail.com").
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "******";
    const [local, domain] = email.split("@");
    if (local.length <= 2) {
      return `${local[0]}*@${domain}`;
    }
    const visiblePrefix = local.slice(0, 2);
    return `${visiblePrefix}${"*".repeat(Math.min(local.length - 2, 6))}@${domain}`;
  }

  /**
   * Checks whether MFA is mandatory for the specified user role.
   * Mandatory roles: Platform Admin, Tenant Owner, Finance Admin.
   */
  static isMfaMandatoryForRole(role?: string | null): boolean {
    if (!role) return false;
    const normalized = role.toLowerCase().trim();
    return (
      normalized === "superadmin" ||
      normalized === "platform_superadmin" ||
      normalized === "platform_admin" ||
      normalized === "master_super_admin" ||
      normalized === "owner" ||
      normalized === "tenant_owner" ||
      normalized === "finance_admin"
    );
  }

  /**
   * Internal helper to record security audit logs.
   * Strictly avoids logging OTPs, passwords, or secrets.
   */
  private static async logMfaAudit(params: {
    userId: string | mongoose.Types.ObjectId;
    tenantId?: string | mongoose.Types.ObjectId;
    action: string;
    details?: Record<string, any>;
    ip?: string;
  }): Promise<void> {
    try {
      const uObjectId = mongoose.Types.ObjectId.isValid(String(params.userId))
        ? new mongoose.Types.ObjectId(String(params.userId))
        : undefined;
      const tObjectId = params.tenantId && mongoose.Types.ObjectId.isValid(String(params.tenantId))
        ? new mongoose.Types.ObjectId(String(params.tenantId))
        : undefined;

      await AuditLog.create({
        user_id: uObjectId,
        tenant_id: tObjectId,
        action: params.action,
        entity: "MfaChallenge",
        details: params.details || {},
        ip: params.ip,
        created_at: new Date()
      });
    } catch (err: any) {
      console.warn("[MfaService] AuditLog warning:", err?.message || err);
    }
  }

  /**
   * Creates and dispatches a new Email OTP MFA challenge.
   * Invalidates any prior active challenges for the same user and purpose.
   */
  static async createChallenge(params: {
    userId: string | mongoose.Types.ObjectId;
    email: string;
    purpose: MfaPurpose;
    requestIp?: string;
    userAgent?: string;
    tenantId?: string | mongoose.Types.ObjectId;
    loginContext?: {
      userId: string;
      role: string;
      branchcode: string;
      tenantId?: string;
      device?: string;
      ip?: string;
    };
  }): Promise<{
    challengeId: string;
    maskedEmail: string;
    expiresInSeconds: number;
    resendCooldownSeconds: number;
  }> {
    const { userId, email, purpose, requestIp, userAgent, tenantId, loginContext } = params;
    const uObjectId = new mongoose.Types.ObjectId(String(userId));
    const now = new Date();

    // 1. Strict Rate Limiting: Max 3 OTP requests per 15 minutes per user
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentRequestsCount = await MfaChallenge.countDocuments({
      userId: uObjectId,
      createdAt: { $gte: windowStart }
    });

    if (recentRequestsCount >= MAX_SENDS_PER_WINDOW) {
      await this.logMfaAudit({
        userId,
        tenantId,
        action: "MFA_TOO_MANY_ATTEMPTS",
        details: { reason: "rate_limit_exceeded", count: recentRequestsCount, purpose },
        ip: requestIp
      });
      throw new Error("RATE_LIMIT_EXCEEDED: Too many verification code requests. Please wait 15 minutes before trying again.");
    }

    // 2. Invalidate previous active OTP challenges for this user and purpose
    await MfaChallenge.updateMany(
      { userId: uObjectId, purpose, used: false },
      { $set: { used: true } }
    );

    // 3. Generate cryptographic 6-digit OTP and challenge ID
    const otp = this.generateNumericOtp();
    const challengeId = this.generateChallengeId();
    const otpHash = this.hashOtp(otp, challengeId);
    const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
    const resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);

    // Terminal Logging for Developer & User convenience
    const otpBanner = [
      '',
      '======================================================================',
      '🔐 [BRANDSPYRE MFA OTP CODE GENERATED]',
      `📧 RECIPIENT : ${email}`,
      `🔑 OTP CODE  : >>> ${otp} <<<`,
      `🎯 PURPOSE   : ${purpose}`,
      `⏰ VALIDITY  : 5 Minutes (Expires: ${expiresAt.toLocaleTimeString()})`,
      `🆔 CHALLENGE : ${challengeId}`,
      '======================================================================',
      ''
    ].join('\n');
    console.log(otpBanner);
    try { process.stdout.write(otpBanner + '\n'); } catch (e) {}

    // 4. Persist challenge record in MongoDB
    await MfaChallenge.create({
      userId: uObjectId,
      challengeId,
      otpHash,
      expiresAt,
      attemptCount: 0,
      maxAttempts: MAX_ATTEMPTS,
      used: false,
      purpose,
      createdAt: now,
      requestIp,
      userAgent,
      resendCooldownUntil,
      sendCount: 1,
      loginContext
    });

    // 5. Send Email via EmailService (without logging plaintext OTP)
    await EmailService.sendMfaOtpEmail({
      to: email,
      otpCode: otp,
      purpose: purpose === "LOGIN_MFA" ? "Sign-In Verification" : "Security Configuration",
      tenantId
    });

    // 6. Audit log OTP dispatch (never log the OTP)
    await this.logMfaAudit({
      userId,
      tenantId,
      action: "MFA_OTP_SENT",
      details: { challengeId, purpose },
      ip: requestIp
    });

    return {
      challengeId,
      maskedEmail: this.maskEmail(email),
      expiresInSeconds: Math.floor(OTP_LIFETIME_MS / 1000),
      resendCooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000)
    };
  }

  /**
   * Resends OTP for an existing active challenge respecting cooldown and rate limits.
   */
  static async resendOtp(params: {
    challengeId: string;
    requestIp?: string;
  }): Promise<{
    success: boolean;
    message: string;
    resendCooldownSeconds: number;
  }> {
    const { challengeId, requestIp } = params;
    const challenge = await MfaChallenge.findOne({ challengeId });

    if (!challenge || challenge.used) {
      throw new Error("INVALID_CHALLENGE: Challenge has expired or is invalid. Please sign in again.");
    }

    const now = new Date();
    if (challenge.expiresAt < now) {
      challenge.used = true;
      await challenge.save();
      throw new Error("CHALLENGE_EXPIRED: Verification code has expired. Please sign in again.");
    }

    // Enforce 60-second resend cooldown
    if (challenge.resendCooldownUntil > now) {
      const waitSeconds = Math.ceil((challenge.resendCooldownUntil.getTime() - now.getTime()) / 1000);
      throw new Error(`COOLDOWN_ACTIVE: Please wait ${waitSeconds} seconds before requesting a new code.`);
    }

    // Enforce max sends per challenge (up to 3 sends)
    if (challenge.sendCount >= MAX_SENDS_PER_WINDOW) {
      challenge.used = true;
      await challenge.save();
      throw new Error("MAX_RESENDS_EXCEEDED: Maximum code requests reached for this session. Please log in again.");
    }

    // Lookup user to get email
    const user = await UserInfo.findById(challenge.userId).lean() as any;
    if (!user) {
      throw new Error("USER_NOT_FOUND: Associated user not found.");
    }

    const destinationEmail = user.mfaEmail || user.email;

    // Generate new OTP, update hash, reset 5m expiry, reset 60s cooldown
    const newOtp = this.generateNumericOtp();
    const newHash = this.hashOtp(newOtp, challenge.challengeId);

    // Terminal Logging for Developer & User convenience
    const resendBanner = [
      '',
      '======================================================================',
      '🔐 [BRANDSPYRE MFA OTP RESENT]',
      `📧 RECIPIENT : ${destinationEmail}`,
      `🔑 OTP CODE  : >>> ${newOtp} <<<`,
      `🎯 PURPOSE   : ${challenge.purpose}`,
      `⏰ VALIDITY  : 5 Minutes`,
      `🆔 CHALLENGE : ${challenge.challengeId}`,
      '======================================================================',
      ''
    ].join('\n');
    console.log(resendBanner);
    try { process.stdout.write(resendBanner + '\n'); } catch (e) {}

    challenge.otpHash = newHash;
    challenge.expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
    challenge.resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);
    challenge.sendCount += 1;
    challenge.attemptCount = 0; // Reset attempt count on new code
    await challenge.save();

    await EmailService.sendMfaOtpEmail({
      to: destinationEmail,
      otpCode: newOtp,
      purpose: challenge.purpose === "LOGIN_MFA" ? "Sign-In Verification" : "Security Configuration",
      tenantId: user.tenant_id
    });

    await this.logMfaAudit({
      userId: challenge.userId,
      tenantId: user.tenant_id,
      action: "MFA_OTP_SENT",
      details: { challengeId: challenge.challengeId, resendNumber: challenge.sendCount },
      ip: requestIp
    });

    return {
      success: true,
      message: "A new verification code has been sent to your email.",
      resendCooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000)
    };
  }

  /**
   * Verifies submitted OTP against challenge.
   * Single-use, attempt-counted, timing-safe.
   */
  static async verifyChallenge(params: {
    challengeId: string;
    enteredOtp: string;
    requestIp?: string;
  }): Promise<{
    success: boolean;
    challenge: IMfaChallenge;
  }> {
    const { challengeId, enteredOtp, requestIp } = params;

    if (!challengeId || !enteredOtp) {
      throw new Error("MISSING_PARAMS: Challenge ID and verification code are required.");
    }

    const challenge = await MfaChallenge.findOne({ challengeId });
    if (!challenge) {
      throw new Error("INVALID_CHALLENGE: Verification code is invalid or has expired.");
    }

    if (challenge.used) {
      throw new Error("CHALLENGE_ALREADY_USED: This verification code has already been used.");
    }

    const now = new Date();
    if (challenge.expiresAt < now) {
      challenge.used = true;
      await challenge.save();
      await this.logMfaAudit({
        userId: challenge.userId,
        action: "MFA_CHALLENGE_EXPIRED",
        details: { challengeId },
        ip: requestIp
      });
      throw new Error("CHALLENGE_EXPIRED: Verification code has expired. Please request a new code.");
    }

    if (challenge.attemptCount >= challenge.maxAttempts) {
      challenge.used = true;
      await challenge.save();
      await this.logMfaAudit({
        userId: challenge.userId,
        action: "MFA_TOO_MANY_ATTEMPTS",
        details: { challengeId, attemptCount: challenge.attemptCount },
        ip: requestIp
      });
      throw new Error("TOO_MANY_ATTEMPTS: Maximum verification attempts exceeded. This code is now invalid.");
    }

    // Constant-time HMAC comparison
    const isValid = this.verifyOtpHash(enteredOtp, challenge.challengeId, challenge.otpHash);

    if (!isValid) {
      challenge.attemptCount += 1;
      const attemptsRemaining = Math.max(0, challenge.maxAttempts - challenge.attemptCount);

      if (challenge.attemptCount >= challenge.maxAttempts) {
        challenge.used = true; // Invalidate challenge
      }
      await challenge.save();

      await this.logMfaAudit({
        userId: challenge.userId,
        action: "MFA_VERIFICATION_FAILED",
        details: { challengeId, attemptsRemaining },
        ip: requestIp
      });

      if (attemptsRemaining === 0) {
        throw new Error("TOO_MANY_ATTEMPTS: Maximum verification attempts exceeded. Please request a new code.");
      }

      throw new Error(`INVALID_OTP: Invalid verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`);
    }

    // Success! Mark challenge as used immediately (single-use invariant)
    challenge.used = true;
    challenge.verifiedAt = now;
    await challenge.save();

    await this.logMfaAudit({
      userId: challenge.userId,
      action: "MFA_VERIFICATION_SUCCESS",
      details: { challengeId, purpose: challenge.purpose },
      ip: requestIp
    });

    return {
      success: true,
      challenge
    };
  }

  /**
   * Initiates MFA Enablement flow for an authenticated user.
   */
  static async initiateEnableMfa(userId: string, requestIp?: string) {
    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (user.mfaEnabled) {
      throw new Error("MFA is already enabled on your account.");
    }

    const email = user.email;
    return this.createChallenge({
      userId: user._id,
      email,
      purpose: "ENABLE_MFA",
      requestIp,
      tenantId: user.tenant_id
    });
  }

  /**
   * Finalizes MFA Enablement by verifying OTP.
   */
  static async confirmEnableMfa(userId: string, challengeId: string, otp: string, requestIp?: string) {
    const { challenge } = await this.verifyChallenge({ challengeId, enteredOtp: otp, requestIp });

    if (challenge.userId.toString() !== userId.toString()) {
      throw new Error("SECURITY_ERROR: Challenge does not belong to this user.");
    }

    if (challenge.purpose !== "ENABLE_MFA" && challenge.purpose !== "LOGIN_SETUP_MFA") {
      throw new Error("INVALID_PURPOSE: Challenge is not for MFA enablement.");
    }

    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    user.mfaEnabled = true;
    user.mfaEmail = user.email;
    user.mfaVerifiedAt = new Date();
    user.recentMfaAt = new Date();
    await user.save();

    await this.logMfaAudit({
      userId,
      tenantId: user.tenant_id,
      action: "MFA_ENABLED",
      details: { mfaEmail: user.mfaEmail },
      ip: requestIp
    });

    return {
      success: true,
      message: "Multi-Factor Authentication (Email OTP) enabled successfully."
    };
  }

  /**
   * Initiates MFA Disablement flow.
   * Strictly requires password verification first!
   */
  static async initiateDisableMfa(userId: string, currentPassword: string, requestIp?: string) {
    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (!user.mfaEnabled) {
      throw new Error("MFA is not currently enabled.");
    }

    // Role check: Mandatory roles cannot disable MFA
    if (this.isMfaMandatoryForRole(user.role)) {
      throw new Error("POLICY_RESTRICTION: Multi-Factor Authentication is mandatory for your role and cannot be disabled.");
    }

    // Password verification before issuing disable challenge
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("INVALID_PASSWORD: Incorrect current password.");
    }

    const email = user.mfaEmail || user.email;
    return this.createChallenge({
      userId: user._id,
      email,
      purpose: "DISABLE_MFA",
      requestIp,
      tenantId: user.tenant_id
    });
  }

  /**
   * Finalizes MFA Disablement by verifying OTP.
   */
  static async confirmDisableMfa(userId: string, challengeId: string, otp: string, requestIp?: string) {
    const { challenge } = await this.verifyChallenge({ challengeId, enteredOtp: otp, requestIp });

    if (challenge.userId.toString() !== userId.toString()) {
      throw new Error("SECURITY_ERROR: Challenge does not belong to this user.");
    }

    if (challenge.purpose !== "DISABLE_MFA") {
      throw new Error("INVALID_PURPOSE: Challenge is not for MFA disablement.");
    }

    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (this.isMfaMandatoryForRole(user.role)) {
      throw new Error("POLICY_RESTRICTION: Multi-Factor Authentication is mandatory for your role and cannot be disabled.");
    }

    user.mfaEnabled = false;
    user.mfaVerifiedAt = undefined;
    user.recentMfaAt = undefined;
    await user.save();

    await this.logMfaAudit({
      userId,
      tenantId: user.tenant_id,
      action: "MFA_DISABLED",
      details: {},
      ip: requestIp
    });

    return {
      success: true,
      message: "Multi-Factor Authentication disabled successfully."
    };
  }

  /**
   * Retrieves MFA status for the authenticated user.
   */
  static async getMfaStatus(userId: string) {
    const user = await UserInfo.findById(userId).lean() as any;
    if (!user) {
      throw new Error("User not found.");
    }

    const isMandatory = this.isMfaMandatoryForRole(user.role);

    return {
      mfaEnabled: Boolean(user.mfaEnabled),
      mfaEmail: this.maskEmail(user.mfaEmail || user.email),
      mfaVerifiedAt: user.mfaVerifiedAt || null,
      isMandatory
    };
  }
}

export default MfaService;
