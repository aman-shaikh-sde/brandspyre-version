import { Request, Response } from "express";
import crypto from "crypto";
import { MetaService, DEFAULT_META_API_VERSION } from "../../../services/metaService";
import { MetaIntegration, MetaOAuthState } from "../../../db/ModelSceham/metaIntegrationSchema";
import { MetaSyncService } from "../../../services/metaSyncService";
import mongoose from "mongoose";

/**
 * OAuth Callback Controller
 * Handles the OAuth callback from Meta/Facebook
 * Validates cryptographically secure single-use state from MongoDB, exchanges token, and synchronizes assets
 */
export const metaOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta OAuth Callback";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const { code, state, error, error_reason, error_description } = req.query;

    // Handle OAuth errors returned by Meta
    if (error) {
      console.error(`${msgField} Error from Meta: ${error} - ${error_reason} (${error_description})`);
      res.redirect(
        `${frontendUrl}/settings/integrations/meta?error=${encodeURIComponent(
          String(error)
        )}&reason=${encodeURIComponent(String(error_description || error_reason || "Access denied"))}`
      );
      return;
    }

    if (!code || !state) {
      res.redirect(`${frontendUrl}/settings/integrations/meta?error=missing_params`);
      return;
    }

    // Atomically find and consume OAuth state (single-use, prevents CSRF and replay attacks)
    const storedState = await MetaOAuthState.findOneAndDelete({ state: state as string });
    if (!storedState) {
      console.error(`${msgField} Error: Invalid or expired state '${state}'`);
      res.redirect(`${frontendUrl}/settings/integrations/meta?error=invalid_state`);
      return;
    }

    // Verify state has not expired
    if (new Date() > storedState.expires_at) {
      console.error(`${msgField} Error: Expired state token`);
      res.redirect(`${frontendUrl}/settings/integrations/meta?error=state_expired`);
      return;
    }

    const { tenant_id, branchcode, user_id, app_id, app_secret, api_version } = storedState;

    const appId = app_id || process.env.META_APP_ID || "";
    const appSecret = app_secret || process.env.META_APP_SECRET || "";
    const apiVersion = api_version || DEFAULT_META_API_VERSION;
    const redirectUri =
      process.env.META_REDIRECT_URI ||
      `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/oauth/callback`;

    const metaService = new MetaService(appId, appSecret, apiVersion, redirectUri);

    // 1. Exchange authorization code for short-lived access token
    const tokenResponse = await metaService.exchangeCodeForToken(code as string);

    // 2. Exchange for long-lived access token (valid 60 days)
    const longLivedToken = await metaService.getLongLivedToken(tokenResponse.access_token);

    // 3. Debug token to verify expiration and identity
    const debugInfo = await metaService.debugToken(longLivedToken.access_token);
    const expiresAt = debugInfo.data?.expires_at
      ? new Date(debugInfo.data.expires_at * 1000)
      : new Date(Date.now() + (longLivedToken.expires_in || 5184000) * 1000);

    // 4. Fetch Meta user profile
    let metaUserId = debugInfo.data?.user_id;
    let metaUserName = "";
    try {
      const me = await metaService.getMe(longLivedToken.access_token);
      metaUserId = me.id || metaUserId;
      metaUserName = me.name || "";
    } catch (meErr) {
      console.warn(`${msgField} Profile fetch warning:`, (meErr as Error).message);
    }

    // 5. Generate secure webhook verify token
    const webhookVerifyToken = crypto.randomBytes(32).toString("hex");

    // 6. Find or create tenant MetaIntegration
    let integration = await MetaIntegration.findOne({
      tenant_id: tenant_id,
      branchcode: branchcode,
    });

    if (integration) {
      integration.access_token = longLivedToken.access_token; // Encrypted automatically by schema setter
      integration.token_expires_at = expiresAt;
      integration.is_connected = true;
      integration.connection_status = "connected";
      integration.meta_user_id = metaUserId;
      integration.meta_user_name = metaUserName;
      if (user_id) integration.connected_by_user_id = user_id;
      if (!integration.webhook_verify_token) {
        integration.webhook_verify_token = webhookVerifyToken;
      }
      integration.last_error = undefined;
      integration.error_message = undefined;
      integration.updated_at = new Date();
      await integration.save();
    } else {
      integration = await MetaIntegration.create({
        tenant_id: tenant_id,
        branchcode: branchcode,
        connected_by_user_id: user_id,
        meta_user_id: metaUserId,
        meta_user_name: metaUserName,
        meta_app_id: appId !== process.env.META_APP_ID ? appId : undefined,
        meta_app_secret: appSecret !== process.env.META_APP_SECRET ? appSecret : undefined,
        meta_api_version: apiVersion,
        access_token: longLivedToken.access_token, // Encrypted automatically
        token_expires_at: expiresAt,
        webhook_verify_token: webhookVerifyToken,
        webhook_url: `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/webhook`,
        is_connected: true,
        connection_status: "connected",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 7. Trigger initial asset sync asynchronously in background
    MetaSyncService.syncTenantAssets(integration._id).catch((syncErr) => {
      console.error(`${msgField} Initial asset sync error:`, (syncErr as Error).message);
    });

    console.log(`${msgField} Successfully connected Meta for tenant ${tenant_id} (${branchcode})`);

    // Redirect to frontend integration dashboard with connected status
    res.redirect(`${frontendUrl}/settings/integrations/meta?status=connected`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Server Error: ${message}`);
    res.redirect(`${frontendUrl}/settings/integrations/meta?error=server_error&message=${encodeURIComponent(message)}`);
  }
};

export default metaOAuthCallback;
