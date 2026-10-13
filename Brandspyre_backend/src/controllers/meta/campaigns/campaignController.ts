import { Request, Response } from "express";
import {
  MetaIntegration,
  MetaAdAccount,
  MetaCampaign,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import MetaService, { DEFAULT_META_API_VERSION } from "../../../services/metaService";
import mongoose from "mongoose";

/**
 * Helper to get active MetaService instance and access token for the tenant
 */
async function getTenantMetaContext(tenantId: string, branchcode: string) {
  const integration = await MetaIntegration.findOne({
    tenant_id: new mongoose.Types.ObjectId(tenantId),
    branchcode: branchcode,
  });

  if (!integration || !integration.is_connected || !integration.access_token) {
    throw new Error("Active Meta integration with valid access token required.");
  }

  if (integration.token_expires_at && new Date() > new Date(integration.token_expires_at)) {
    throw new Error("Meta access token expired. Reconnection required.");
  }

  const appId = integration.meta_app_id || process.env.META_APP_ID || "";
  const appSecret = integration.meta_app_secret || process.env.META_APP_SECRET || "";
  const apiVersion = integration.meta_api_version || DEFAULT_META_API_VERSION;

  const metaService = new MetaService(appId, appSecret, apiVersion);
  return { integration, metaService, accessToken: integration.access_token };
}

/**
 * List Campaigns for tenant
 */
export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Campaigns";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;

    if (!tenantId) {
      res.status(400).json({ success: false, message: "Tenant context required" });
      return;
    }

    const objectTenantId = new mongoose.Types.ObjectId(tenantId);
    let campaigns = await MetaCampaign.find({ tenant_id: objectTenantId }).sort({ created_at: -1 }).lean();

    // If no campaigns in DB or refresh=true requested, attempt live fetch from first active ad account
    if (campaigns.length === 0 || req.query.refresh === "true") {
      try {
        const { metaService, accessToken } = await getTenantMetaContext(tenantId, branchcode);
        const adAccount = await MetaAdAccount.findOne({ tenant_id: objectTenantId, status: "active" });

        if (adAccount) {
          const remoteCampaigns = await metaService.fetchCampaigns(adAccount.meta_ad_account_id, accessToken);
          for (const c of remoteCampaigns) {
            const insights = c.insights?.data?.[0];
            const spend = insights ? parseFloat(insights.spend || "0") : 0;
            const leadsAction = insights?.actions?.find((a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
            const leadsCount = leadsAction ? parseInt(leadsAction.value || "0", 10) : 0;
            const cpl = leadsCount > 0 ? spend / leadsCount : 0;

            await MetaCampaign.findOneAndUpdate(
              { tenant_id: objectTenantId, meta_campaign_id: c.id },
              {
                branchcode,
                meta_ad_account_id: adAccount.meta_ad_account_id,
                meta_campaign_id: c.id,
                name: c.name,
                objective: c.objective,
                status: c.status,
                buying_type: c.buying_type,
                daily_budget: c.daily_budget ? c.daily_budget / 100 : undefined,
                lifetime_budget: c.lifetime_budget ? c.lifetime_budget / 100 : undefined,
                start_time: c.start_time ? new Date(c.start_time) : undefined,
                stop_time: c.stop_time ? new Date(c.stop_time) : undefined,
                spend,
                leads_count: leadsCount,
                cpl,
                metadata: c,
                updated_at: new Date(),
              },
              { upsert: true, new: true }
            );
          }

          campaigns = await MetaCampaign.find({ tenant_id: objectTenantId }).sort({ created_at: -1 }).lean();
        }
      } catch (syncErr) {
        console.warn(`${msgField} Live fetch notice:`, (syncErr as Error).message);
      }
    }

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: campaigns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Get Campaign Details by ID
 */
export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Campaign By ID";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const { id } = req.params;

    const campaign = await MetaCampaign.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      $or: [{ _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : undefined }, { meta_campaign_id: id }],
    }).lean();

    if (!campaign) {
      res.status(404).json({ success: false, message: "Campaign not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: campaign,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Create Meta Campaign (Guided creation flow)
 */
export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Meta Campaign";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const { name, objective, daily_budget, lifetime_budget, special_ad_categories, ad_account_id, status } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: "Campaign name is required" });
      return;
    }

    const { metaService, accessToken } = await getTenantMetaContext(tenantId, branchcode);

    // Resolve ad account
    let targetAdAccountId = ad_account_id;
    if (!targetAdAccountId) {
      const adAcc = await MetaAdAccount.findOne({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        status: "active",
      });
      if (!adAcc) {
        res.status(400).json({
          success: false,
          message: "No active Meta Ad Account connected for this organization. Please connect an ad account first.",
        });
        return;
      }
      targetAdAccountId = adAcc.meta_ad_account_id;
    }

    // Call Meta API to create campaign
    const metaResponse = await metaService.createCampaign(targetAdAccountId, accessToken, {
      name,
      objective: objective || "OUTCOME_LEADS",
      status: status || "PAUSED",
      special_ad_categories: special_ad_categories || ["NONE"],
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      lifetime_budget: lifetime_budget ? parseFloat(lifetime_budget) : undefined,
    });

    const metaCampaignId = metaResponse.id;

    // Persist in local database
    const createdCampaign = await MetaCampaign.create({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode,
      meta_ad_account_id: targetAdAccountId,
      meta_campaign_id: metaCampaignId,
      name,
      objective: objective || "OUTCOME_LEADS",
      status: status || "PAUSED",
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      lifetime_budget: lifetime_budget ? parseFloat(lifetime_budget) : undefined,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${msgField} successfully published to Meta`,
      data: createdCampaign,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Pause Campaign in Meta
 */
export const pauseCampaign = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Pause Meta Campaign";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const { id } = req.params;

    const campaign = await MetaCampaign.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      $or: [{ _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : undefined }, { meta_campaign_id: id }],
    });

    if (!campaign) {
      res.status(404).json({ success: false, message: "Campaign not found" });
      return;
    }

    const { metaService, accessToken } = await getTenantMetaContext(tenantId, branchcode);

    // Update in Meta
    await metaService.updateCampaign(campaign.meta_campaign_id, accessToken, { status: "PAUSED" });

    // Update local DB
    campaign.status = "PAUSED";
    campaign.updated_at = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: campaign,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Resume Campaign in Meta
 */
export const resumeCampaign = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Resume Meta Campaign";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const { id } = req.params;

    const campaign = await MetaCampaign.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      $or: [{ _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : undefined }, { meta_campaign_id: id }],
    });

    if (!campaign) {
      res.status(404).json({ success: false, message: "Campaign not found" });
      return;
    }

    const { metaService, accessToken } = await getTenantMetaContext(tenantId, branchcode);

    // Update in Meta
    await metaService.updateCampaign(campaign.meta_campaign_id, accessToken, { status: "ACTIVE" });

    // Update local DB
    campaign.status = "ACTIVE";
    campaign.updated_at = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: campaign,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Manual sync of campaigns from Meta
 */
export const syncCampaigns = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Sync Meta Campaigns";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;

    const { metaService, accessToken } = await getTenantMetaContext(tenantId, branchcode);
    const objectTenantId = new mongoose.Types.ObjectId(tenantId);
    const adAccounts = await MetaAdAccount.find({ tenant_id: objectTenantId, status: "active" });

    let totalSynced = 0;
    for (const adAcc of adAccounts) {
      try {
        const remoteCampaigns = await metaService.fetchCampaigns(adAcc.meta_ad_account_id, accessToken);
        for (const c of remoteCampaigns) {
          const insights = c.insights?.data?.[0];
          const spend = insights ? parseFloat(insights.spend || "0") : 0;
          const leadsAction = insights?.actions?.find((a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
          const leadsCount = leadsAction ? parseInt(leadsAction.value || "0", 10) : 0;
          const cpl = leadsCount > 0 ? spend / leadsCount : 0;

          await MetaCampaign.findOneAndUpdate(
            { tenant_id: objectTenantId, meta_campaign_id: c.id },
            {
              branchcode,
              meta_ad_account_id: adAcc.meta_ad_account_id,
              meta_campaign_id: c.id,
              name: c.name,
              objective: c.objective,
              status: c.status,
              buying_type: c.buying_type,
              daily_budget: c.daily_budget ? c.daily_budget / 100 : undefined,
              lifetime_budget: c.lifetime_budget ? c.lifetime_budget / 100 : undefined,
              start_time: c.start_time ? new Date(c.start_time) : undefined,
              stop_time: c.stop_time ? new Date(c.stop_time) : undefined,
              spend,
              leads_count: leadsCount,
              cpl,
              metadata: c,
              updated_at: new Date(),
            },
            { upsert: true, new: true }
          );
          totalSynced++;
        }
      } catch (accErr) {
        console.warn(`[CampaignSync] Error syncing ad account ${adAcc.meta_ad_account_id}:`, (accErr as Error).message);
      }
    }

    const updatedCampaigns = await MetaCampaign.find({ tenant_id: objectTenantId }).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      message: `${msgField} completed. Synced ${totalSynced} campaigns.`,
      data: updatedCampaigns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
};
