import { Request, Response } from "express";
import { MetaAdAccount } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Fetch Meta Ad Accounts for the authenticated organization
 */
export const getMetaAdAccounts = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Ad Accounts";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "Tenant context required" });
      return;
    }

    const adAccounts = await MetaAdAccount.find({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
    }).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: adAccounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};
