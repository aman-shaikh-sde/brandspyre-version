import { Request, Response } from "express";
import {
  MetaIntegration,
  MetaAdSet,
  MetaAdAccount,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import MetaService from "../../../services/metaService";
import mongoose from "mongoose";

export const getAdSets = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Ad Sets";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "Tenant context required" });
      return;
    }

    const { campaign_id } = req.query;
    const filter: any = { tenant_id: new mongoose.Types.ObjectId(tenantId) };
    if (campaign_id) filter.meta_campaign_id = campaign_id;

    const adSets = await MetaAdSet.find(filter).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: adSets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

export const createAdSet = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Meta Ad Set";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const { name, campaign_id, daily_budget, lifetime_budget, targeting, optimization_goal, billing_event, ad_account_id } = req.body;

    if (!name || !campaign_id) {
      res.status(400).json({ success: false, message: "Ad set name and campaign ID are required" });
      return;
    }

    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode,
    });

    if (!integration || !integration.access_token) {
      res.status(400).json({ success: false, message: "Active Meta integration required" });
      return;
    }

    const metaService = new MetaService(
      integration.meta_app_id || process.env.META_APP_ID,
      integration.meta_app_secret || process.env.META_APP_SECRET
    );

    let targetAdAccountId = ad_account_id;
    if (!targetAdAccountId) {
      const adAcc = await MetaAdAccount.findOne({
        tenant_id: new mongoose.Types.ObjectId(tenantId),
        status: "active",
      });
      if (!adAcc) {
        res.status(400).json({ success: false, message: "No active ad account found" });
        return;
      }
      targetAdAccountId = adAcc.meta_ad_account_id;
    }

    const metaResponse = await metaService.createAdSet(targetAdAccountId, integration.access_token, {
      name,
      campaign_id,
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      lifetime_budget: lifetime_budget ? parseFloat(lifetime_budget) : undefined,
      targeting: targeting || { geo_locations: { countries: ["US"] } },
      optimization_goal: optimization_goal || "LEAD_GENERATION",
      billing_event: billing_event || "IMPRESSIONS",
    });

    const createdAdSet = await MetaAdSet.create({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode,
      meta_ad_account_id: targetAdAccountId,
      meta_campaign_id: campaign_id,
      meta_ad_set_id: metaResponse.id,
      name,
      status: "PAUSED",
      daily_budget: daily_budget ? parseFloat(daily_budget) : undefined,
      lifetime_budget: lifetime_budget ? parseFloat(lifetime_budget) : undefined,
      targeting,
      optimization_goal,
      billing_event,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${msgField} successfully published to Meta`,
      data: createdAdSet,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};
