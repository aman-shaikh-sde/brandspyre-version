import { Session, ISession } from "../db/ModelSceham/sessionSchema";
import { v4 as uuidv4 } from "uuid";

export interface SessionData {
  sessionId: string;
  userId: any;
  role: string;
  brcode: string | null;
  tenantId?: string;
  membershipId?: string;
  isRevoked: boolean;
  lastSeen: number;
  userAgent?: string;
  ip?: string;
}

// In-memory write-through cache for fast sub-millisecond lookups keyed by sessionId
const memoryCache: Record<string, SessionData> = {};
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours

/**
 * Creates a brand-new authenticated session with a unique sessionId (sid).
 * NEVER call this on existing JWTs to prevent revocation bypass.
 */
export const createSession = async (data: {
  userId: string | number;
  role?: string;
  brcode?: string | null;
  tenantId?: string;
  membershipId?: string;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
}): Promise<SessionData> => {
  const sid = data.sessionId || uuidv4();
  const uid = String(data.userId);
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_TTL_MS);

  const sessionData: SessionData = {
    sessionId: sid,
    userId: uid,
    role: data.role || "employee",
    brcode: data.brcode || null,
    tenantId: data.tenantId,
    membershipId: data.membershipId,
    isRevoked: false,
    lastSeen: now,
    userAgent: data.userAgent,
    ip: data.ip
  };

  memoryCache[sid] = sessionData;

  try {
    await Session.create({
      sessionId: sid,
      userId: uid,
      role: sessionData.role,
      brcode: sessionData.brcode,
      tenantId: sessionData.tenantId,
      membershipId: sessionData.membershipId,
      isRevoked: false,
      lastSeen: new Date(now),
      expiresAt,
      userAgent: sessionData.userAgent,
      ip: sessionData.ip
    });
  } catch (err) {
    console.warn("[SessionStore] MongoDB session create error:", (err as Error).message);
  }

  return sessionData;
};

/**
 * Retrieves an active, non-revoked session by its unique sessionId (sid).
 */
export const getSession = async (sessionIdOrUserId: string | number): Promise<SessionData | null> => {
  const key = String(sessionIdOrUserId);
  const now = Date.now();

  // 1. Check memory cache by sessionId or userId
  let cached = memoryCache[key];
  if (!cached) {
    for (const sid in memoryCache) {
      if (memoryCache[sid].userId === key) {
        cached = memoryCache[sid];
        break;
      }
    }
  }

  if (cached) {
    if (!cached.isRevoked && (now - cached.lastSeen <= SESSION_TTL_MS)) {
      return cached;
    } else {
      delete memoryCache[cached.sessionId];
      delete memoryCache[key];
    }
  }

  // 2. Query MongoDB by unique sessionId or userId
  try {
    const sessionDoc: any = await Session.findOne({
      $or: [{ sessionId: key }, { userId: key }],
      isRevoked: { $ne: true },
      expiresAt: { $gt: new Date(now) }
    }).sort({ lastSeen: -1 }).lean();

    if (sessionDoc && !sessionDoc.isRevoked) {
      const sessionData: SessionData = {
        sessionId: sessionDoc.sessionId || key,
        userId: sessionDoc.userId,
        role: sessionDoc.role,
        brcode: sessionDoc.brcode,
        tenantId: sessionDoc.tenantId,
        membershipId: sessionDoc.membershipId,
        isRevoked: false,
        lastSeen: sessionDoc.lastSeen ? new Date(sessionDoc.lastSeen).getTime() : now,
        userAgent: sessionDoc.userAgent,
        ip: sessionDoc.ip
      };
      memoryCache[sessionData.sessionId] = sessionData;
      return sessionData;
    }
  } catch (err) {
    console.warn("[SessionStore] MongoDB lookup error:", (err as Error).message);
  }

  return null;
};

/**
 * Updates or sets session data (legacy compatibility).
 */
export const setSession = async (key: string | number, data: Partial<SessionData>): Promise<SessionData> => {
  const sid = String(key);
  const uid = data.userId ? String(data.userId) : sid;
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_TTL_MS);

  const existing = await getSession(sid);
  if (existing) {
    existing.role = data.role || existing.role;
    existing.brcode = data.brcode !== undefined ? data.brcode : existing.brcode;
    existing.tenantId = data.tenantId || existing.tenantId;
    existing.membershipId = data.membershipId || existing.membershipId;
    existing.lastSeen = now;
    existing.isRevoked = false;
    memoryCache[existing.sessionId] = existing;

    try {
      await Session.updateOne(
        { sessionId: existing.sessionId },
        {
          $set: {
            role: existing.role,
            brcode: existing.brcode,
            tenantId: existing.tenantId,
            membershipId: existing.membershipId,
            lastSeen: new Date(now),
            expiresAt,
            isRevoked: false
          }
        },
        { upsert: true }
      );
    } catch (err) {}
    return existing;
  }

  const sessionData: SessionData = {
    sessionId: sid,
    userId: uid,
    role: data.role || "employee",
    brcode: data.brcode || null,
    tenantId: data.tenantId,
    membershipId: data.membershipId,
    isRevoked: false,
    lastSeen: now,
    userAgent: data.userAgent,
    ip: data.ip
  };

  memoryCache[sid] = sessionData;

  try {
    await Session.updateOne(
      { sessionId: sid },
      {
        $set: {
          sessionId: sid,
          userId: uid,
          role: sessionData.role,
          brcode: sessionData.brcode,
          tenantId: sessionData.tenantId,
          membershipId: sessionData.membershipId,
          isRevoked: false,
          lastSeen: new Date(now),
          expiresAt,
          userAgent: sessionData.userAgent,
          ip: sessionData.ip
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn("[SessionStore] MongoDB session upsert error:", (err as Error).message);
  }

  return sessionData;
};

/**
 * Touches a session to extend its activity timestamp.
 */
export const touchSession = async (sessionId: string | number): Promise<void> => {
  const sid = String(sessionId);
  const now = Date.now();
  if (memoryCache[sid]) {
    memoryCache[sid].lastSeen = now;
  } else {
    for (const id in memoryCache) {
      if (memoryCache[id].userId === sid) {
        memoryCache[id].lastSeen = now;
        break;
      }
    }
  }

  try {
    const expiresAt = new Date(now + SESSION_TTL_MS);
    await Session.updateOne(
      { $or: [{ sessionId: sid }, { userId: sid }] },
      { $set: { lastSeen: new Date(now), expiresAt } }
    );
  } catch (err) {
    // Non-blocking
  }
};

/**
 * Revokes a session immediately, ensuring it cannot be used again.
 */
export const revokeSession = async (sessionId: string | number): Promise<void> => {
  const sid = String(sessionId);
  if (memoryCache[sid]) {
    memoryCache[sid].isRevoked = true;
    delete memoryCache[sid];
  }
  for (const id in memoryCache) {
    if (memoryCache[id].userId === sid) {
      memoryCache[id].isRevoked = true;
      delete memoryCache[id];
    }
  }

  try {
    await Session.updateMany(
      { $or: [{ sessionId: sid }, { userId: sid }] },
      { $set: { isRevoked: true } }
    );
  } catch (err) {
    console.warn("[SessionStore] MongoDB revoke error:", (err as Error).message);
  }
};

/**
 * Revokes all sessions for a specific user (e.g. password reset / admin forced logout).
 */
export const revokeAllUserSessions = async (userId: string | number): Promise<void> => {
  const uid = String(userId);
  Object.keys(memoryCache).forEach((sid) => {
    if (memoryCache[sid].userId === uid) {
      delete memoryCache[sid];
    }
  });

  try {
    await Session.updateMany(
      { userId: uid },
      { $set: { isRevoked: true } }
    );
  } catch (err) {
    console.warn("[SessionStore] MongoDB revokeAllUserSessions error:", (err as Error).message);
  }
};

export const deleteSession = revokeSession;

// Backward-compatible Proxy object
export const sessionStore: Record<string, SessionData> = new Proxy(memoryCache, {
  get(target, prop: string) {
    return target[prop];
  },
  set(target, prop: string, value: SessionData) {
    target[prop] = value;
    setSession(prop, value).catch(() => {});
    return true;
  },
  deleteProperty(target, prop: string) {
    delete target[prop];
    revokeSession(prop).catch(() => {});
    return true;
  }
});

export default {
  createSession,
  getSession,
  setSession,
  touchSession,
  revokeSession,
  revokeAllUserSessions,
  deleteSession,
  sessionStore
};