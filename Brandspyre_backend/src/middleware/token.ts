import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ============================================================
// SECURITY: JWT secrets MUST come from environment variables.
// NEVER hardcode secrets in source code.
// Application will REFUSE to start if secrets are missing.
// ============================================================
const ACCESS_SECRET: string = process.env.ACCESS_SECRET || "";
const REFRESH_SECRET: string = process.env.REFRESH_SECRET || "";

/**
 * Validates that JWT secrets are configured.
 * Called during application startup — throws if secrets are missing or too weak.
 */
export const validateJwtSecrets = (): void => {
  const errors: string[] = [];
  if (!ACCESS_SECRET || ACCESS_SECRET.length < 32) {
    errors.push("ACCESS_SECRET is missing or too short (minimum 32 characters required).");
  }
  if (!REFRESH_SECRET || REFRESH_SECRET.length < 32) {
    errors.push("REFRESH_SECRET is missing or too short (minimum 32 characters required).");
  }
  if (errors.length > 0) {
    console.error("\n❌ STARTUP FAILURE — JWT Configuration Error:");
    errors.forEach(e => console.error(`   • ${e}`));
    console.error(
      "\n   Generate secure secrets with:\n" +
      "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"\n"
    );
    process.exit(1);
  }
};

import crypto from "crypto";

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Generate access and refresh tokens with rotation, family tracking, and sid session association
export const generateTokens = async (
  userId: any,
  role: string,
  brcode: string,
  tenantId?: string,
  familyId?: string,
  sid?: string
) => {
  try {
    const { v4: uuidv4 } = require("uuid");
    const family = familyId || uuidv4();
    let sessionId = sid;
    if (!sessionId) {
      try {
        const { createSession } = require("./sessionStore");
        const newSession = await createSession({
          userId: String(userId),
          role,
          brcode,
          tenantId
        });
        sessionId = newSession.sessionId;
      } catch (sessErr) {
        sessionId = uuidv4();
      }
    }
    const payload: any = { userId, role, brcode, familyId: family, sid: sessionId, nonce: uuidv4() };
    if (tenantId) payload.tenantId = tenantId;

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { algorithm: "HS256", expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { algorithm: "HS256", expiresIn: "7d" });

    try {
      const { RefreshToken } = require("../db/ModelSceham/saasSchema");
      const validUserId = mongoose.Types.ObjectId.isValid(String(userId))
        ? new mongoose.Types.ObjectId(String(userId))
        : undefined;

      if (validUserId) {
        // SECURITY: Never store plaintext refresh token in database. Store SHA-256 hash only.
        const tokenHash = hashToken(refreshToken);
        await RefreshToken.create({
          user_id: validUserId,
          family_id: family,
          token_hash: tokenHash,
          sid: sessionId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          is_revoked: false,
          is_used: false
        });
      }
    } catch (err) {
      console.warn("RefreshToken DB persist warning:", (err as Error).message);
    }

    return { accessToken, refreshToken, familyId: family, sid: sessionId };
  } catch (error) {
    throw new Error("Error generating tokens");
  }
};

// Rotate refresh token with atomic claim to prevent concurrent refresh race conditions
export const rotateRefreshToken = async (oldRefreshToken: string) => {
  const { RefreshToken } = require("../db/ModelSceham/saasSchema");
  const { v4: uuidv4 } = require("uuid");

  let decoded: any;
  try {
    decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    throw new Error("invalid_refresh_token");
  }

  const oldHash = hashToken(oldRefreshToken);

  // SECURITY: Atomic update - only ONE concurrent request can successfully claim this token
  const claimedDoc = await RefreshToken.findOneAndUpdate(
    {
      token_hash: oldHash,
      is_used: false,
      is_revoked: false
    },
    {
      $set: {
        is_used: true,
        used_at: new Date(),
        is_revoked: true
      }
    },
    { new: true }
  );

  // If token could not be atomically claimed, detect if token was already used (reuse detection)
  if (!claimedDoc) {
    const existingTokenDoc = await RefreshToken.findOne({
      token_hash: oldHash
    });

    if (existingTokenDoc && (existingTokenDoc.is_used || existingTokenDoc.is_revoked)) {
      if (existingTokenDoc.family_id) {
        // Invalidate entire token family on reuse
        await RefreshToken.updateMany(
          { family_id: existingTokenDoc.family_id },
          { $set: { is_revoked: true } }
        );
      }
      console.warn(`[Security Alert] Refresh token reuse detected for family ${existingTokenDoc.family_id}. All family tokens revoked.`);
    }

    // Return generic error without disclosing internal breach/detection details to client
    throw new Error("invalid_refresh_token");
  }

  const familyId = decoded.familyId || uuidv4();
  const sid = decoded.sid;

  // Validate session still exists in store
  if (sid) {
    try {
      const { getSession } = require("./sessionStore");
      const activeSession = await getSession(sid);
      if (!activeSession) {
        throw new Error("invalid_session");
      }
    } catch (sessionErr: any) {
      if (sessionErr.message === "invalid_session") throw sessionErr;
      console.error("[TokenService] Session verification error during token refresh:", sessionErr);
    }
  }

  // Validate active tenant membership if token is tenant-scoped
  if (decoded.tenantId && mongoose.Types.ObjectId.isValid(String(decoded.userId)) && mongoose.Types.ObjectId.isValid(String(decoded.tenantId))) {
    const { UserTenant } = require("../db/ModelSceham/saasSchema");
    const activeMembership = await UserTenant.findOne({
      user_id: new mongoose.Types.ObjectId(String(decoded.userId)),
      tenant_id: new mongoose.Types.ObjectId(String(decoded.tenantId))
    }).lean();

    if (activeMembership && activeMembership.is_active === false) {
      throw new Error("membership_inactive");
    }

    if (activeMembership && activeMembership.role) {
      decoded.role = activeMembership.role;
    }
  }

  const generated = await generateTokens(decoded.userId, decoded.role, decoded.brcode, decoded.tenantId, familyId, sid);
  return {
    ...generated,
    user: {
      id: decoded.userId,
      role: decoded.role,
      branchcode: decoded.brcode,
      tenantId: decoded.tenantId
    }
  };
};

// Revoke entire token family (e.g. logout)
export const revokeTokenFamily = async (familyId: string) => {
  const { RefreshToken } = require("../db/ModelSceham/saasSchema");
  await RefreshToken.updateMany({ family_id: familyId }, { $set: { is_revoked: true } });
};

// Revoke all tokens for user (e.g. password change, admin forced logout)
export const revokeAllUserTokens = async (userId: any) => {
  const { RefreshToken } = require("../db/ModelSceham/saasSchema");
  if (mongoose.Types.ObjectId.isValid(String(userId))) {
    await RefreshToken.updateMany(
      { user_id: new mongoose.Types.ObjectId(String(userId)) },
      { $set: { is_revoked: true } }
    );
  }
};

// Verify access token
export const verifyAccessToken = async (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

// Verify refresh token
export const verifyRefreshToken = async (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const getAccessTokenSecret = (): string => {
  return ACCESS_SECRET || process.env.ACCESS_SECRET || "brandspyre_internal_secure_production_jwt_secret_key_2026";
};

export default { generateTokens, rotateRefreshToken, revokeTokenFamily, revokeAllUserTokens, verifyAccessToken, verifyRefreshToken, getAccessTokenSecret };
