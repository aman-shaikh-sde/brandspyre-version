import { Request, Response } from "express";
import { MetaService, DEFAULT_META_API_VERSION } from "../../../services/metaService";
import {
  MetaIntegration,
  MetaLeadForm,
  MetaPage,
  MetaAdAccount,
  MetaBusinessAccount,
  MetaInstagramAccount,
  MetaWhatsAppAccount,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Disconnect Controller
 * Handles disconnection from Meta/Facebook, revokes tokens, and updates tenant asset records
 */
export const metaDisconnect = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta Disconnect";

  try {
    // Get tenant info securely from auth context
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;

    if (!tenantId || !branchcode) {
      res.status(400).json({
        success: false,
        message: "Tenant ID and branchcode are required from authentication context",
      });
      return;
    }

    // Find the integration for this tenant
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode,
    });

    if (!integration) {
      res.status(404).json({
        success: false,
        message: "Meta integration not found for this organization",
      });
      return;
    }

    const appId = integration.meta_app_id || process.env.META_APP_ID || "";
    const appSecret = integration.meta_app_secret || process.env.META_APP_SECRET || "";
    const apiVersion = integration.meta_api_version || DEFAULT_META_API_VERSION;

    const metaService = new MetaService(appId, appSecret, apiVersion);

    // Revoke token with Meta if present
    if (integration.access_token) {
      try {
        await metaService.revokeToken(integration.access_token);
      } catch (err) {
        console.warn(`${msgField} Token revoke notice:`, (err as Error).message);
      }
    }

    // Unsubscribe all active connected pages from leadgen webhooks
    const connectedPages = await MetaPage.find({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      status: "active",
    });

    for (const page of connectedPages) {
      if (page.page_access_token) {
        try {
          await metaService.unsubscribeFromLeadgenWebhook(page.meta_page_id, page.page_access_token);
        } catch (unsubErr) {
          console.warn(`${msgField} Webhook unsubscribe notice for page ${page.meta_page_id}:`, (unsubErr as Error).message);
        }
      }
    }

    // Mark assets as inactive
    const objectTenantId = new mongoose.Types.ObjectId(tenantId);
    await MetaPage.updateMany({ tenant_id: objectTenantId }, { status: "inactive", is_webhook_subscribed: false, updated_at: new Date() });
    await MetaAdAccount.updateMany({ tenant_id: objectTenantId }, { status: "inactive", updated_at: new Date() });
    await MetaBusinessAccount.updateMany({ tenant_id: objectTenantId }, { status: "inactive", updated_at: new Date() });
    await MetaInstagramAccount.updateMany({ tenant_id: objectTenantId }, { status: "inactive", updated_at: new Date() });
    await MetaWhatsAppAccount.updateMany({ tenant_id: objectTenantId }, { status: "inactive", updated_at: new Date() });

    // Disable all lead forms for this integration
    await MetaLeadForm.updateMany(
      { tenant_id: objectTenantId },
      { is_enabled: false, updated_at: new Date() }
    );

    // Update integration status
    integration.is_connected = false;
    integration.connection_status = "disconnected";
    integration.access_token = undefined;
    integration.refresh_token = undefined;
    integration.token_expires_at = undefined;
    integration.updated_at = new Date();
    await integration.save();

    res.status(200).json({
      success: true,
      message: `${msgField} Success. Meta connection and associated channel assets disconnected.`,
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

export default metaDisconnect;
