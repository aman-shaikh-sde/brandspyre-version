// logout.ts
import { Request, Response } from "express";
import { deleteSession, revokeSession, revokeAllUserSessions } from "../../../middleware/sessionStore";
import { RefreshToken } from "../../../db/ModelSceham/saasSchema";
import { hashToken } from "../../../middleware/token";

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.userId || req.body?.userId;
    const sid = authUser?.sid;
    const token = (req.cookies && req.cookies.refreshToken) || req.body?.refreshToken;

    if (token) {
      const tokenHash = hashToken(token);
      await RefreshToken.updateOne({ token_hash: tokenHash }, { $set: { is_revoked: true } }).catch(() => {});
    }

    if (sid) {
      await revokeSession(sid).catch(() => {});
    }
    if (userId) {
      await revokeAllUserSessions(String(userId)).catch(() => {});
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as any,
    };
    res.clearCookie('refreshToken', { ...cookieOpts, path: '/api/saas/auth' });
    res.clearCookie('refreshToken', { ...cookieOpts, path: '/' });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, error: "Logout failed" });
  }
};
