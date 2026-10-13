import { Request, Response } from "express";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";
import { MetaSyncService } from "../../../services/metaSyncService";
import mongoose from "mongoose";

/**
 * Trigger manual asset synchronization for the authenticated organization
 */
export const triggerMetaAssetSync = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Sync Meta Assets";

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

    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode,
    });

    if (!integration || !integration.is_connected) {
      res.status(404).json({
        success: false,
        message: "Meta integration not found or not connected",
      });
      return;
    }

    const result = await MetaSyncService.syncTenantAssets(integration._id);

    res.status(200).json({
      success: true,
      message: `${msgField} completed successfully`,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({
      success: false,
      error: `${msgField} Causes Error Message: ${message}`,
    });
  }
};
