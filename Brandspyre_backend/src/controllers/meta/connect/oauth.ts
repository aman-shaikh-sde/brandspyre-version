import { Request, Response } from "express";
import crypto from "crypto";
import { MetaService, DEFAULT_META_API_VERSION } from "../../../services/metaService";
import { MetaIntegration, MetaOAuthState } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * OAuth Connect Controller
 * Initiates the OAuth flow with Meta using centralized SaaS App credentials or tenant custom overrides
 */
export const metaOAuthConnect = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta OAuth Connect";

  try {
    // Get tenant info securely from auth context
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const userId = (req.user as any)?.userId || (req.user as any)?._id;

    // Super admin cannot connect Meta integration (tenant-specific feature)
    const userRole = req.user?.userRole || (req.user as any)?.role;
    if (userRole === "superadmin" || userRole === "Super Admin") {
      res.status(403).json({
        success: false,
        message: "Meta integration is a tenant-specific feature. Super admin cannot connect integration directly.",
      });
      return;
    }

    if (!tenantId || !branchcode) {
      res.status(400).json({
        success: false,
        message: "Tenant ID and branchcode are required from authentication context",
      });
      return;
    }

    // Fetch existing integration if configured
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode,
    }).lean();

    // Priority: Request Body > Existing Integration Override > SaaS-level App Config
    const { meta_app_id, meta_app_secret, meta_api_version } = req.body || {};

    const appId =
      meta_app_id ||
      (integration as any)?.meta_app_id ||
      process.env.META_APP_ID;

    const appSecret =
      meta_app_secret ||
      (integration as any)?.meta_app_secret ||
      process.env.META_APP_SECRET;

    const apiVersion =
      meta_api_version ||
      (integration as any)?.meta_api_version ||
      DEFAULT_META_API_VERSION;

    if (!appId || !appSecret) {
      res.status(400).json({
        success: false,
        message: "SaaS Meta Developer App ID and Secret must be configured on the server or provided by tenant.",
      });
      return;
    }

    const redirectUri =
      process.env.META_REDIRECT_URI ||
      `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/oauth/callback`;

    // Create MetaService instance
    const metaService = new MetaService(appId, appSecret, apiVersion, redirectUri);

    // Cryptographically secure state parameter
    const state = crypto.randomBytes(32).toString("hex");

    // Store in MongoDB MetaOAuthState with 10-minute TTL
    await MetaOAuthState.create({
      state,
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      app_id: appId,
      app_secret: appSecret,
      api_version: apiVersion,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Generate OAuth URL
    const oauthUrl = metaService.getOAuthUrl(state);

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: {
        oauth_url: oauthUrl,
        state: state,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({
      success: false,
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};
