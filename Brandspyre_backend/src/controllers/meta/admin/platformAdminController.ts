import { Request, Response } from "express";
import {
  MetaIntegration,
  MetaPage,
  MetaAdAccount,
  MetaBusinessAccount,
  MetaInstagramAccount,
  MetaWhatsAppAccount,
  MetaLeadSyncLog,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import { Tenant } from "../../../db/ModelSceham/saasSchema";

/**
 * Platform Admin Meta Integration Health Overview
 * Returns system-wide integration health without exposing customer access tokens
 */
export const getPlatformAdminMetaHealth = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Platform Admin Meta Health";

  try {
    // 1. Fetch all tenant integrations (strict exclusion of token secrets)
    const integrations = await MetaIntegration.find()
      .select("-access_token -refresh_token -meta_app_secret -webhook_verify_token")
      .sort({ updated_at: -1 })
      .lean();

    // 2. Fetch all tenants for organization names
    const tenants = await Tenant.find().select("_id name slug status").lean();
    const tenantMap = new Map<string, any>();
    tenants.forEach((t: any) => tenantMap.set(t._id.toString(), t));

    // 3. Aggregate health status per tenant
    const healthReports = await Promise.all(
      integrations.map(async (integ) => {
        const tenantId = integ.tenant_id.toString();
        const tenantInfo = tenantMap.get(tenantId);

        const [pagesCount, adAccountsCount, businessesCount, instagramCount, whatsappCount, recentLogs] =
          await Promise.all([
            MetaPage.countDocuments({ tenant_id: integ.tenant_id, status: "active" }),
            MetaAdAccount.countDocuments({ tenant_id: integ.tenant_id, status: "active" }),
            MetaBusinessAccount.countDocuments({ tenant_id: integ.tenant_id, status: "active" }),
            MetaInstagramAccount.countDocuments({ tenant_id: integ.tenant_id, status: "active" }),
            MetaWhatsAppAccount.countDocuments({ tenant_id: integ.tenant_id, status: "active" }),
            MetaLeadSyncLog.find({ tenant_id: integ.tenant_id }).sort({ sync_timestamp: -1 }).limit(1).lean(),
          ]);

        const lastWebhook = recentLogs[0]?.sync_timestamp || null;

        // Determine token health
        let tokenHealth = "healthy";
        if (!integ.is_connected) {
          tokenHealth = "disconnected";
        } else if (integ.token_expires_at && new Date() > new Date(integ.token_expires_at)) {
          tokenHealth = "expired";
        } else if (integ.last_error) {
          tokenHealth = "warning";
        }

        return {
          id: integ._id,
          tenant_id: integ.tenant_id,
          organization_name: tenantInfo?.name || "Unknown Organization",
          organization_slug: tenantInfo?.slug || "",
          organization_status: tenantInfo?.status || "active",
          branchcode: integ.branchcode,
          is_connected: integ.is_connected,
          connection_status: integ.connection_status,
          token_health: tokenHealth,
          token_expires_at: integ.token_expires_at,
          meta_user_id: integ.meta_user_id,
          meta_user_name: integ.meta_user_name,
          business_manager_id: integ.business_manager_id,
          last_successful_sync_at: integ.last_successful_sync_at,
          last_webhook_at: lastWebhook,
          last_error: integ.last_error || integ.error_message || null,
          assets: {
            pages: pagesCount,
            ad_accounts: adAccountsCount,
            businesses: businessesCount,
            instagram: instagramCount,
            whatsapp: whatsappCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `${msgField} Success`,
      data: {
        total_integrations: integrations.length,
        connected_count: healthReports.filter((h) => h.is_connected).length,
        expired_count: healthReports.filter((h) => h.token_health === "expired").length,
        error_count: healthReports.filter((h) => h.token_health === "warning").length,
        integrations: healthReports,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ success: false, error: message });
  }
};

export default getPlatformAdminMetaHealth;
