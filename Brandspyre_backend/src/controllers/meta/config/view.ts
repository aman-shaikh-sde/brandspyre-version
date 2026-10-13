import { Request, Response } from "express";
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
 * View Config Controller
 * Retrieves Meta integration status, assets overview, and configuration without exposing secrets
 */
export const getMetaConfig = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Config";

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

    // Find the integration for this tenant (exclude all sensitive keys)
    const integration: any = await MetaIntegration.findOne({
      tenant_id: objectTenantId,
      branchcode: branchcode,
    })
      .select("-access_token -refresh_token -meta_app_secret -webhook_verify_token")
      .lean();

    if (!integration || !integration.is_connected) {
      res.status(200).json({
        success: true,
        message: "Meta integration not configured or disconnected",
        data: {
          is_connected: false,
          connection_status: integration?.connection_status || "disconnected",
          tenant_id: tenantId,
          branchcode: branchcode,
          enabled_forms: [],
          enabled_forms_count: 0,
          has_app_credentials: !!(integration as any)?.meta_app_id || !!process.env.META_APP_ID,
          assets_summary: {
            pages: 0,
            ad_accounts: 0,
            businesses: 0,
            instagram: 0,
            whatsapp: 0,
          },
        },
      });
      return;
    }

    // Fetch counts and overview of connected assets
    const [enabledForms, pagesCount, adAccountsCount, businessesCount, instagramCount, whatsappCount] =
      await Promise.all([
        MetaLeadForm.find({ tenant_id: objectTenantId, is_enabled: true }).lean(),
        MetaPage.countDocuments({ tenant_id: objectTenantId, status: "active" }),
        MetaAdAccount.countDocuments({ tenant_id: objectTenantId, status: "active" }),
        MetaBusinessAccount.countDocuments({ tenant_id: objectTenantId, status: "active" }),
        MetaInstagramAccount.countDocuments({ tenant_id: objectTenantId, status: "active" }),
        MetaWhatsAppAccount.countDocuments({ tenant_id: objectTenantId, status: "active" }),
      ]);

    // Check token expiration status
    let tokenStatus = "valid";
    if (integration.token_expires_at && new Date() > new Date(integration.token_expires_at)) {
      tokenStatus = "expired";
    }

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: {
        ...integration,
        token_status: tokenStatus,
        enabled_forms: enabledForms,
        enabled_forms_count: enabledForms.length,
        has_app_credentials: true,
        assets_summary: {
          pages: pagesCount,
          ad_accounts: adAccountsCount,
          businesses: businessesCount,
          instagram: instagramCount,
          whatsapp: whatsappCount,
        },
      },
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

export default getMetaConfig;
