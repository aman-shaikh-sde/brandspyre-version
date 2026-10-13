import { Request, Response } from "express";
import { MetaIntegration, MetaPage } from "../../../db/ModelSceham/metaIntegrationSchema";
import { MetaSyncService } from "../../../services/metaSyncService";
import mongoose from "mongoose";

/**
 * Fetch Facebook Pages for the authenticated organization
 * Uses locally cached MetaPage entities and falls back to live sync if empty or refresh=true
 */
export const getMetaPages = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Fetch Meta Pages";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;

    if (!tenantId || !branchcode) {
      res.status(400).json({
        success: false,
        message: "Tenant ID and branchcode are required from authentication context",
      });
      return;
    }

    const objectTenantId = new mongoose.Types.ObjectId(tenantId);

    // Check integration connection
    const integration = await MetaIntegration.findOne({
      tenant_id: objectTenantId,
      branchcode: branchcode,
    });

    if (!integration || !integration.is_connected) {
      res.status(404).json({
        success: false,
        message: "Meta integration not found or not connected",
      });
      return;
    }

    // Check if token expired
    if (integration.token_expires_at && new Date() > new Date(integration.token_expires_at)) {
      res.status(401).json({
        success: false,
        message: "Access token expired. Please reconnect.",
      });
      return;
    }

    // Check if we need live refresh
    let pages = await MetaPage.find({
      tenant_id: objectTenantId,
      status: "active",
    })
      .select("-page_access_token")
      .lean();

    if (pages.length === 0 || req.query.refresh === "true") {
      try {
        await MetaSyncService.syncTenantAssets(integration._id);
        pages = await MetaPage.find({
          tenant_id: objectTenantId,
          status: "active",
        })
          .select("-page_access_token")
          .lean();
      } catch (syncErr) {
        console.warn(`${msgField} Live sync fallback warning:`, (syncErr as Error).message);
      }
    }

    // Format output to be backward-compatible with existing frontend expectations
    const formattedPages = pages.map((p) => ({
      id: p.meta_page_id,
      name: p.page_name,
      category: p.category || "Facebook Page",
      status: p.status,
      is_webhook_subscribed: p.is_webhook_subscribed,
      created_at: p.created_at,
    }));

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: formattedPages,
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

export default getMetaPages;
