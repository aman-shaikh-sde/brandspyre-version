import mongoose from "mongoose";
import MetaService, { DEFAULT_META_API_VERSION } from "./metaService";
import {
  MetaIntegration,
  MetaBusinessAccount,
  MetaAdAccount,
  MetaPage,
  MetaInstagramAccount,
  MetaWhatsAppAccount,
  MetaLeadForm,
  IMetaIntegration
} from "../db/ModelSceham/metaIntegrationSchema";

/**
 * Meta Sync Service
 * Handles comprehensive synchronization of Pages, Ad Accounts, Businesses, Instagram & WhatsApp assets
 */
export class MetaSyncService {
  /**
   * Synchronize all assets for a given tenant integration
   */
  static async syncTenantAssets(integrationId: string | mongoose.Types.ObjectId): Promise<{
    pagesCount: number;
    adAccountsCount: number;
    businessesCount: number;
    instagramCount: number;
    whatsappCount: number;
    formsCount: number;
  }> {
    const integration = await MetaIntegration.findById(integrationId);
    if (!integration || !integration.access_token || !integration.is_connected) {
      throw new Error("Active Meta integration with valid access token required for asset synchronization.");
    }

    const tenantId = integration.tenant_id;
    const branchcode = integration.branchcode;
    const accessToken = integration.access_token;

    const appId = integration.meta_app_id || process.env.META_APP_ID || "";
    const appSecret = integration.meta_app_secret || process.env.META_APP_SECRET || "";
    const apiVersion = integration.meta_api_version || DEFAULT_META_API_VERSION;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/oauth/callback`;

    const metaService = new MetaService(appId, appSecret, apiVersion, redirectUri);

    let pagesCount = 0;
    let adAccountsCount = 0;
    let businessesCount = 0;
    let instagramCount = 0;
    let whatsappCount = 0;
    let formsCount = 0;

    const webhookUrl = integration.webhook_url || `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/webhook`;
    const verifyToken = integration.webhook_verify_token || process.env.META_WEBHOOK_VERIFY_TOKEN || "";

    try {
      // 1. Fetch & Synchronize Facebook Pages
      const pages = await metaService.fetchUserPages(accessToken);
      const activePageIds = new Set<string>();

      for (const page of pages) {
        activePageIds.add(page.id);

        let isSubscribed = false;
        try {
          if (verifyToken) {
            isSubscribed = await metaService.subscribeToLeadgenWebhook(page.id, page.access_token, webhookUrl, verifyToken);
          }
        } catch (subErr) {
          console.warn(`[MetaSync] Webhook subscribe warning for page ${page.id}:`, (subErr as Error).message);
        }

        // Upsert Page
        await MetaPage.findOneAndUpdate(
          { tenant_id: tenantId, meta_page_id: page.id },
          {
            branchcode,
            integration_id: integration._id,
            meta_page_id: page.id,
            page_name: page.name,
            category: page.category,
            page_access_token: page.access_token,
            status: "active",
            is_webhook_subscribed: isSubscribed,
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );
        pagesCount++;

        // Set primary meta_page_id on integration if not set
        if (!integration.meta_page_id) {
          integration.meta_page_id = page.id;
        }

        // 2. Synchronize connected Instagram Professional Account
        if (page.instagram_business_account) {
          const ig = page.instagram_business_account;
          await MetaInstagramAccount.findOneAndUpdate(
            { tenant_id: tenantId, meta_instagram_account_id: ig.id },
            {
              branchcode,
              integration_id: integration._id,
              meta_page_id: page.id,
              meta_instagram_account_id: ig.id,
              username: ig.username,
              name: ig.name || ig.username,
              profile_picture_url: ig.profile_picture_url,
              followers_count: ig.followers_count || 0,
              status: "active",
              updated_at: new Date(),
            },
            { upsert: true, new: true }
          );
          instagramCount++;
        }

        // 3. Synchronize Lead Forms for this Page
        try {
          const forms = await metaService.fetchPageLeadForms(page.id, page.access_token);
          for (const form of forms) {
            await MetaLeadForm.findOneAndUpdate(
              { tenant_id: tenantId, meta_form_id: form.id },
              {
                branchcode,
                meta_integration_id: integration._id,
                meta_page_id: page.id,
                meta_page_name: page.name,
                meta_form_id: form.id,
                meta_form_name: form.name,
                updated_at: new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            formsCount++;
          }
        } catch (formErr) {
          console.warn(`[MetaSync] Fetch forms warning for page ${page.id}:`, (formErr as Error).message);
        }
      }

      // Soft-disconnect pages no longer returned
      if (activePageIds.size > 0) {
        await MetaPage.updateMany(
          { tenant_id: tenantId, meta_page_id: { $nin: Array.from(activePageIds) } },
          { status: "inactive", updated_at: new Date() }
        );
      }

      // 4. Fetch & Synchronize Business Accounts (Business Managers)
      const businesses = await metaService.fetchBusinesses(accessToken);
      for (const biz of businesses) {
        await MetaBusinessAccount.findOneAndUpdate(
          { tenant_id: tenantId, meta_business_id: biz.id },
          {
            branchcode,
            integration_id: integration._id,
            meta_business_id: biz.id,
            name: biz.name,
            verification_status: biz.verification_status,
            status: "active",
            metadata: biz,
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );
        businessesCount++;

        if (!integration.business_manager_id) {
          integration.business_manager_id = biz.id;
          integration.meta_business_account_id = biz.id;
        }

        // 5. Fetch WhatsApp Business Accounts for this Business
        try {
          const wabas = await metaService.fetchWhatsAppAccounts(biz.id, accessToken);
          for (const waba of wabas) {
            const phoneNumbers = await metaService.fetchWhatsAppPhoneNumbers(waba.id, accessToken);
            await MetaWhatsAppAccount.findOneAndUpdate(
              { tenant_id: tenantId, meta_waba_id: waba.id },
              {
                branchcode,
                integration_id: integration._id,
                business_account_id: biz.id,
                meta_waba_id: waba.id,
                name: waba.name,
                currency: waba.currency,
                timezone_id: waba.timezone_id,
                phone_numbers: phoneNumbers.map((p: any) => ({
                  id: p.id,
                  display_phone_number: p.display_phone_number,
                  verified_name: p.verified_name,
                  quality_rating: p.quality_rating,
                  code_verification_status: p.code_verification_status,
                })),
                status: "active",
                updated_at: new Date(),
              },
              { upsert: true, new: true }
            );
            whatsappCount++;
          }
        } catch (waErr) {
          console.warn(`[MetaSync] WhatsApp sync warning for business ${biz.id}:`, (waErr as Error).message);
        }
      }

      // 6. Fetch & Synchronize Ad Accounts
      const adAccounts = await metaService.fetchAdAccounts(accessToken, integration.business_manager_id);
      for (const adAcc of adAccounts) {
        const adAccId = adAcc.id || (adAcc.account_id ? `act_${adAcc.account_id}` : "");
        if (!adAccId) continue;

        await MetaAdAccount.findOneAndUpdate(
          { tenant_id: tenantId, meta_ad_account_id: adAccId },
          {
            branchcode,
            integration_id: integration._id,
            business_account_id: integration.business_manager_id,
            meta_ad_account_id: adAccId,
            name: adAcc.name || `Ad Account (${adAccId})`,
            currency: adAcc.currency || "USD",
            timezone_name: adAcc.timezone_name,
            account_status: adAcc.account_status,
            status: adAcc.account_status === 1 ? "active" : "disabled",
            metadata: adAcc,
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );
        adAccountsCount++;
      }

      // Update integration state
      integration.last_sync_at = new Date();
      integration.last_successful_sync_at = new Date();
      integration.last_error = undefined;
      integration.error_message = undefined;
      integration.updated_at = new Date();
      await integration.save();

      console.log(`[MetaSync] Asset sync complete for tenant ${tenantId}: ${pagesCount} pages, ${adAccountsCount} ad accounts, ${businessesCount} businesses, ${instagramCount} IG, ${whatsappCount} WA, ${formsCount} forms.`);

      return {
        pagesCount,
        adAccountsCount,
        businessesCount,
        instagramCount,
        whatsappCount,
        formsCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      integration.last_error = message;
      integration.updated_at = new Date();
      await integration.save();
      console.error(`[MetaSync] Asset sync error for tenant ${tenantId}: ${message}`);
      throw error;
    }
  }
}

export default MetaSyncService;
