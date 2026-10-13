import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSession, setSession, deleteSession, touchSession, revokeSession } from "./sessionStore";
import { verifyAccessToken } from "./token";
import { UserTenant, Tenant } from "../db/ModelSceham/saasSchema";
import { Branch } from "../db/ModelSceham/branchSchema";
import { SecurityContext, isPlatformAdminRole, isTenantAdminRole } from "./securityContext";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      securityContext?: any;
      tenant?: any;
      dataScope?: any;
    }
  }
}

const parseCookieHeader = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [key, ...vals] = pair.trim().split("=");
    if (key) acc[key] = decodeURIComponent(vals.join("="));
    return acc;
  }, {} as Record<string, string>);
};

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  const cookies = parseCookieHeader(req.headers.cookie);
  if (cookies["accessToken"]) {
    return cookies["accessToken"];
  }
  return null;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: "Authorization header missing", error: "Unauthorized" });
    return;
  }

  try {
    const decoded = (await verifyAccessToken(token)) as any;
    if (!decoded || !decoded.sid) {
      res.status(401).json({ success: false, error: "invalid_session", message: "Session identifier missing in token." });
      return;
    }

    const sid = decoded.sid;
    const userIdStr = String(decoded.userId);

    // SECURITY: Look up session by unique sessionId (sid) ONLY.
    // Legacy fallback to userId as session lookup key is strictly prohibited.
    // NEVER recreate a missing session - reject revoked or non-existent sessions immediately.
    const session = await getSession(sid);

    if (!session || session.isRevoked) {
      res.status(401).json({ success: false, error: "invalid_session", message: "Session is invalid or has been revoked." });
      return;
    }

    // Verify session user matches JWT identity
    if (String(session.userId) !== userIdStr) {
      res.status(401).json({ success: false, error: "invalid_session", message: "Session user mismatch." });
      return;
    }

    const now = Date.now();
    const sessionExpiry = 12 * 60 * 60 * 1000; // 12 Hours

    if (now - session.lastSeen > sessionExpiry) {
      await revokeSession(session.sessionId);
      res.status(401).json({ success: false, error: "session_expired", message: "Session timed out" });
      return;
    }

    await touchSession(session.sessionId);

    let rawRole = (decoded.role || session.role || "employee").toLowerCase().trim();
    let isPlatformAdmin = isPlatformAdminRole(rawRole);

    // Platform admins may optionally inspect a tenant via header
    const headerTenant = isPlatformAdmin
      ? ((req.headers["x-tenant-id"] || req.headers["tenant-id"]) as string | undefined)
      : undefined; // SECURITY: Strictly ignored for non-platform users

    let tenantId: string | undefined = headerTenant || session.tenantId || decoded.tenantId;

    if (!tenantId && !isPlatformAdmin && decoded.userId) {
      try {
        const { UserInfo } = require("../db/ModelSceham/userSchema");
        const userDoc = await UserInfo.findOne({
          $or: [
            ...(mongoose.Types.ObjectId.isValid(userIdStr) ? [{ _id: new mongoose.Types.ObjectId(userIdStr) }] : []),
            { staff_id: userIdStr },
            ...(isNaN(Number(userIdStr)) ? [] : [{ psn: Number(userIdStr) }])
          ]
        }).lean();

        if (userDoc && userDoc.tenant_id) {
          tenantId = userDoc.tenant_id.toString();
        } else if (userDoc) {
          const userTenant = await UserTenant.findOne({ user_id: userDoc._id, is_active: true }).sort({ created_at: -1 });
          if (userTenant) {
            tenantId = userTenant.tenant_id.toString();
          }
        }
      } catch (err) {
        console.warn("Failed to lookup tenant_id for user:", decoded.userId);
      }
    }

    let activeUserTenant: any = null;

    // SECURITY: Server-Authoritative Tenant Membership & Real-Time Role Resolution
    // For non-platform users, verify active membership and derive the authoritative role from UserTenant
    if (!isPlatformAdmin && tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      if (mongoose.Types.ObjectId.isValid(userIdStr)) {
        activeUserTenant = await UserTenant.findOne({
          user_id: new mongoose.Types.ObjectId(userIdStr),
          tenant_id: new mongoose.Types.ObjectId(tenantId)
        }).lean();

        if (!activeUserTenant || activeUserTenant.is_active === false) {
          res.status(403).json({
            success: false,
            error: "membership_inactive",
            message: "User membership in this organization is inactive or revoked."
          });
          return;
        }

        // Server authoritative role: updates take effect immediately without waiting for JWT expiry
        if (activeUserTenant.role) {
          rawRole = String(activeUserTenant.role).toLowerCase().trim();
          isPlatformAdmin = isPlatformAdminRole(rawRole);
        }
      }
    }

    // Resolve branch code safely - never fall back to arbitrary first branch or BR-01
    // If platform admin switched tenant via header, do not carry over branch from previous tenant
    let brcode: string | null = (isPlatformAdmin && headerTenant) ? null : (decoded.brcode || session.brcode || activeUserTenant?.default_branch_code || null);
    if (brcode && tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      try {
        const branch: any = await Branch.findOne({
          tenant_id: new mongoose.Types.ObjectId(tenantId),
          branchcode: brcode,
          status: "active"
        }).lean();
        if (!branch) {
          brcode = null;
        }
      } catch (err) {
        brcode = null;
      }
    }

    // SECURITY: Branch Authorization Check - Normal users cannot supply arbitrary branch codes
    const requestedBranch = (req.query?.branchcode || req.query?.brcode || req.body?.branchcode || req.body?.brcode) as string | undefined;
    if (requestedBranch && requestedBranch !== "all" && !isPlatformAdmin && !isTenantAdminRole(rawRole)) {
      if (!brcode || requestedBranch.toUpperCase() !== brcode.toUpperCase()) {
        res.status(403).json({
          success: false,
          error: "forbidden_branch",
          message: "You are not authorized to access or operate on this branch."
        });
        return;
      }
    }

    const membershipId = activeUserTenant ? String(activeUserTenant._id) : (decoded.membershipId || null);

    req.user = {
      userId: decoded.userId,
      userRole: rawRole,
      scope: decoded.scope || (isPlatformAdmin ? "platform" : "tenant"),
      brcode: brcode,
      tenantId: tenantId,
      membershipId,
      sid: session.sessionId
    };

    req.securityContext = {
      userId: userIdStr,
      userRole: rawRole,
      isPlatformAdmin,
      tenantId: tenantId || null,
      branchCode: brcode,
      membershipId,
      scope: isPlatformAdmin ? "platform" : "tenant",
      dataScope: isPlatformAdmin ? "platform" : isTenantAdminRole(rawRole) ? "all" : "branch",
      sid: session.sessionId
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  (req as any).isOptionalAuth = true;
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = (await verifyAccessToken(token)) as any;
    if (!decoded || !decoded.sid) {
      return next();
    }

    const sid = decoded.sid;
    const userIdStr = String(decoded.userId);
    const session = await getSession(sid);

    if (session && !session.isRevoked && String(session.userId) === userIdStr) {
      const now = Date.now();
      const sessionExpiry = 12 * 60 * 60 * 1000;
      if (now - session.lastSeen <= sessionExpiry) {
        await touchSession(session.sessionId);

        let rawRole = (decoded.role || session.role || "employee").toLowerCase().trim();
        let isPlatformAdmin = isPlatformAdminRole(rawRole);

        const headerTenant = isPlatformAdmin
          ? ((req.headers["x-tenant-id"] || req.headers["tenant-id"]) as string | undefined)
          : undefined;

        let tenantId: string | undefined = headerTenant || session.tenantId || decoded.tenantId;

        if (!tenantId && !isPlatformAdmin && decoded.userId) {
          try {
            const { UserInfo } = require("../db/ModelSceham/userSchema");
            const userDoc = await UserInfo.findById(userIdStr).lean();
            if (userDoc && userDoc.tenant_id) {
              tenantId = userDoc.tenant_id.toString();
            } else {
              const userTenant = await UserTenant.findOne({ user_id: userIdStr, is_active: true }).sort({ created_at: -1 });
              if (userTenant) {
                tenantId = userTenant.tenant_id.toString();
              }
            }
          } catch (err) {}
        }

        let activeUserTenant: any = null;
        if (!isPlatformAdmin && tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
          if (mongoose.Types.ObjectId.isValid(userIdStr)) {
            activeUserTenant = await UserTenant.findOne({
              user_id: new mongoose.Types.ObjectId(userIdStr),
              tenant_id: new mongoose.Types.ObjectId(tenantId),
              is_active: true
            }).lean();

            if (activeUserTenant?.role) {
              rawRole = String(activeUserTenant.role).toLowerCase().trim();
              isPlatformAdmin = isPlatformAdminRole(rawRole);
            }
          }
        }

        // If platform admin switched tenant via header, do not carry over branch from previous tenant
        let brcode: string | null = (isPlatformAdmin && headerTenant) ? null : (decoded.brcode || session.brcode || activeUserTenant?.default_branch_code || null);
        if (brcode && tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
          try {
            const branch: any = await Branch.findOne({
              tenant_id: new mongoose.Types.ObjectId(tenantId),
              branchcode: brcode,
              status: "active"
            }).lean();
            if (!branch) {
              brcode = null;
            }
          } catch (err) {
            brcode = null;
          }
        }

        const membershipId = activeUserTenant ? String(activeUserTenant._id) : (decoded.membershipId || null);

        req.user = {
          userId: decoded.userId,
          userRole: rawRole,
          scope: decoded.scope || (isPlatformAdmin ? "platform" : "tenant"),
          brcode: brcode,
          tenantId: tenantId,
          membershipId,
          sid: session.sessionId
        };

        req.securityContext = {
          userId: userIdStr,
          userRole: rawRole,
          isPlatformAdmin,
          tenantId: tenantId || null,
          branchCode: brcode,
          membershipId,
          scope: isPlatformAdmin ? "platform" : "tenant",
          dataScope: isPlatformAdmin ? "platform" : isTenantAdminRole(rawRole) ? "all" : "branch",
          sid: session.sessionId
        };
      }
    }
  } catch (err) {
    // Optional auth silently proceeds unauthenticated
  }
  next();
};

export default authMiddleware;