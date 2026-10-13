import { Request, Response } from "express";
import { MetaInstagramAccount } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Fetch Instagram Professional Accounts for the authenticated organization
 */
export const getMetaInstagramAccounts = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Instagram Accounts";

  try {
    const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
    if (!tenantId) {
      res.status(400).json({ success: false, message: "Tenant context required" });
      return;
    }

    const accounts = await MetaInstagramAccount.find({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
    }).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: accounts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};
