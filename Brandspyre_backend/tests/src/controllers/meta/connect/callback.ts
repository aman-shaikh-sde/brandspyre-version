import { Request, Response } from "express";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";
import { getOAuthState, deleteOAuthState } from "./oauth";
import mongoose from "mongoose";

/**
 * OAuth Callback Controller
 * Handles the OAuth callback from Meta/Facebook
 */
export const metaOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta OAuth Callback";
  
  try {
    const { code, state, error, error_reason } = req.query;
    
    // Handle OAuth errors
    if (error) {
      console.error(`${msgField} Error: ${error} - ${error_reason}`);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?error=${error}&reason=${error_reason}`);
      return;
    }
    
    if (!code || !state) {
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?error=missing_params`);
      return;
    }
    
    // Retrieve and validate state from storage
    const storedState = getOAuthState(state as string);
    if (!storedState) {
      console.error(`${msgField} Error: Invalid or expired state`);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?error=invalid_state`);
      return;
    }
    
    const { tenantId, branchcode } = storedState;
    
    // Fetch existing integration to get tenant-specific credentials
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    });
    
    if (!integration || !(integration as any).meta_app_id || !(integration as any).meta_app_secret) {
      console.error(`${msgField} Error: Meta integration not found or missing credentials`);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?error=missing_credentials`);
      return;
    }
    
    // Create tenant-specific MetaService instance
    const metaService = new MetaService(
      (integration as any).meta_app_id,
      (integration as any).meta_app_secret,
      (integration as any).meta_api_version
    );
    
    // Exchange code for access token
    const tokenResponse = await metaService.exchangeCodeForToken(code as string);
    
    // Get long-lived token
    const longLivedToken = await metaService.getLongLivedToken(tokenResponse.access_token);
    
    // Debug token to get expiration info
    const debugInfo = await metaService.debugToken(longLivedToken.access_token);
    
    // Calculate token expiration
    const expiresAt = debugInfo.data?.expires_at 
      ? new Date(debugInfo.data.expires_at * 1000) 
      : new Date(Date.now() + (longLivedToken.expires_in * 1000));
    
    // Generate webhook verify token
    const crypto = require("crypto");
    const webhookVerifyToken = crypto.randomBytes(32).toString("hex");
    
    // Check if integration already exists for this tenant
    const existingIntegration = await MetaIntegration.findOne({
      tenant_id: tenantId,
      branchcode: branchcode
    });
    
    if (existingIntegration) {
      // Update existing integration
      existingIntegration.access_token = longLivedToken.access_token;
      existingIntegration.token_expires_at = expiresAt;
      existingIntegration.is_connected = true;
      existingIntegration.connection_status = 'connected';
      existingIntegration.webhook_verify_token = webhookVerifyToken;
      existingIntegration.updated_at = new Date();
      await existingIntegration.save();
    } else {
      // Create new integration
      await MetaIntegration.create({
        tenant_id: tenantId,
        branchcode: branchcode,
        access_token: longLivedToken.access_token,
        token_expires_at: expiresAt,
        webhook_verify_token: webhookVerifyToken,
        webhook_url: `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/webhook`,
        is_connected: true,
        connection_status: 'connected',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    
    // Clean up state
    deleteOAuthState(state as string);
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?status=connected`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/settings/integrations/meta?error=server_error`);
  }
};
