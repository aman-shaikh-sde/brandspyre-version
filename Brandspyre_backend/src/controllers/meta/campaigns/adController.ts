import { Request, Response } from "express";
import {
  MetaIntegration,
  MetaAd,
  MetaAdAccount,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import MetaService from "../../../services/metaService";
import mongoose from "mongoose";

export const getAds = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Ads";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "Tenant context required" });
      return;
    }

    const { ad_set_id, campaign_id } = req.query;
    const filter: any = { tenant_id: new mongoose.Types.ObjectId(tenantId) };
    if (ad_set_id) filter.meta_ad_set_id = ad_set_id;
    if (campaign_id) filter.meta_campaign_id = campaign_id;

    const ads = await MetaAd.find(filter).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: ads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

export const createAd = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Meta Ad";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    const branchcode = (req.user as any)?.brcode;
    const { name, campaign_id, ad_set_id, creative, ad_account_id } = req.body;

    if (!name || !ad_set_id) {
      res.status(400).json({ success: false, message: "Ad name and Ad Set ID are required" });
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

    // Persist locally with draft/pending Meta ID
    const generatedAdId = `ad_${Date.now()}`;
    const createdAd = await MetaAd.create({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode,
      meta_ad_account_id: ad_account_id || "act_default",
      meta_campaign_id: campaign_id || "camp_default",
      meta_ad_set_id: ad_set_id,
      meta_ad_id: generatedAdId,
      name,
      status: "PAUSED",
      creative: creative || {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${msgField} created successfully`,
      data: createdAd,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};
