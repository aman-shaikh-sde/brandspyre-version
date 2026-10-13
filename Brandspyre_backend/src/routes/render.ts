import { Router, Request, Response } from "express";
import axios from "axios";
import authMiddleware from "../middleware/auth";
import securityContext, { isPlatformAdminRole } from "../middleware/securityContext";
import { deploymentLimiter } from "../middleware/rateLimiter";
import { AuditLog } from "../db/ModelSceham/saasSchema";

const router = Router();

const PLATFORM_ROLES = ["superadmin", "platform_admin", "master_super_admin", "platform_superadmin"];

router.post(
  "/restart-service",
  authMiddleware,
  securityContext({ optional: false }),
  deploymentLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const userRole = (user?.userRole || user?.role || "").toLowerCase();
    const permissions: string[] = (req as any).securityContext?.permissions || user?.permissions || [];

    // SECURITY: Must be a platform admin role
    const isPlatformAdmin = isPlatformAdminRole(userRole) || PLATFORM_ROLES.includes(userRole);
    if (!isPlatformAdmin) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Platform administrator credentials required."
      });
      return;
    }

    // SECURITY: Must possess explicit deployment permission or superadmin role
    const hasDeploymentPermission =
      userRole === "superadmin" ||
      userRole === "master_super_admin" ||
      userRole === "platform_superadmin" ||
      permissions.includes("platform.deployment.trigger") ||
      permissions.includes("*");

    if (!hasDeploymentPermission) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Missing explicit permission 'platform.deployment.trigger'."
      });
      return;
    }

    const serviceId = process.env.RENDER_SERVICE_ID;
    const apiKey = process.env.RENDER_API_KEY;

    if (!serviceId || !apiKey) {
      res.status(503).json({
        success: false,
        message: "Deployment service is not configured in this environment."
      });
      return;
    }

    try {
      // Audit log the infrastructure action
      await AuditLog.create({
        action: "PLATFORM_DEPLOYMENT_TRIGGERED",
        user_id: user._id || user.userId,
        user_email: user.email || user.username || "platform_admin",
        details: {
          serviceId,
          ip: req.ip,
          userAgent: req.headers["user-agent"]
        }
      }).catch((logErr: any) => console.warn("[AuditLog Warning] Could not record deployment:", logErr.message));

      const response = await axios.post(
        `https://api.render.com/v1/services/${serviceId}/deploys`,
        { clearCache: false },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      res.status(200).json({
        success: true,
        message: "Deployment triggered successfully.",
        deployId: (response.data as any)?.id || "initiated"
      });
    } catch (error: any) {
      const errorMsg = error.response?.status
        ? `Render API returned status ${error.response.status}`
        : "Error connecting to deployment provider";
      console.error("[Render Deploy Error]", error.response?.data || error.message);
      res.status(502).json({
        success: false,
        message: errorMsg
      });
    }
  }
);

export default router;