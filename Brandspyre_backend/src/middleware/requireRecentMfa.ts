import { Request, Response, NextFunction } from "express";
import { UserInfo } from "../db/ModelSceham/userSchema";
import MfaService from "../services/saas/MfaService";

const DEFAULT_STEP_UP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Middleware requiring recent MFA verification (step-up authentication)
 * for sensitive / high-risk actions.
 */
export const requireRecentMfa = (windowMinutes: number = 15) => {
  const windowMs = windowMinutes * 60 * 1000;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.userId) {
        res.status(401).json({ success: false, error: "unauthorized", message: "Authentication required." });
        return;
      }

      const user = await UserInfo.findById(authUser.userId).lean() as any;
      if (!user) {
        res.status(401).json({ success: false, error: "user_not_found", message: "User not found." });
        return;
      }

      const isMfaActive = Boolean(user.mfaEnabled);
      const isMandatory = MfaService.isMfaMandatoryForRole(user.role);

      // If MFA is not enabled and not mandatory, proceed
      if (!isMfaActive && !isMandatory) {
        return next();
      }

      // If MFA is enabled or mandatory, check recentMfaAt
      const recentMfaAt = user.recentMfaAt ? new Date(user.recentMfaAt).getTime() : 0;
      const timeSinceLastMfa = Date.now() - recentMfaAt;

      if (!recentMfaAt || timeSinceLastMfa > windowMs) {
        res.status(428).json({
          success: false,
          error: "mfa_step_up_required",
          message: "Recent MFA verification is required for this sensitive action. Please confirm your identity with a verification code.",
          action: "REQUEST_MFA_STEP_UP"
        });
        return;
      }

      next();
    } catch (err: any) {
      console.error("[requireRecentMfa Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "internal_error", message: "Security verification check failed." });
    }
  };
};

export default requireRecentMfa;
