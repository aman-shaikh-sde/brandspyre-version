import { Request, Response } from "express";
import { MetaService, DEFAULT_META_API_VERSION } from "../../../services/metaService";
import {
  MetaIntegration,
  MetaLeadForm,
  MetaLeadSyncLog,
  MetaPage,
  MetaCampaign,
} from "../../../db/ModelSceham/metaIntegrationSchema";
import { Lead, Campaign } from "../../../db/ModelSceham/project/campagin";
import LeadMappingService from "../../../services/leadMappingService";
import { billingEventBus } from "../../../services/billingEventBus";
import { autoShareWithParentCompany } from "../../leadExchange/sharedLeadController";
import { WebhookEventLog } from "../../../db/ModelSceham/saasSchema";
import mongoose from "mongoose";

/**
 * Webhook Handle Controller
 * Handles Meta webhook events (leadgen) with HMAC signature verification, fast async ACK, tenant isolation, strict deduplication, and field mapping
 */
export const handleMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Handle Meta Webhook";

  try {
    // 1. Signature Verification (HMAC-SHA256)
    const signature = (req.headers["x-hub-signature-256"] || req.headers["x-hub-signature"]) as string;
    const rawPayload = (req as any).rawBody || JSON.stringify(req.body);
    const appSecret = process.env.META_APP_SECRET || "";

    if (signature && appSecret) {
      const isValid = MetaService.verifyWebhookSignature(rawPayload, signature, appSecret);
      if (!isValid) {
        console.warn("[MetaWebhook] Security alert: Invalid webhook signature detected from", req.ip);
        res.status(403).json({ error: "Invalid webhook signature" });
        return;
      }
    } else if (process.env.NODE_ENV === "production" && !signature) {
      console.warn("[MetaWebhook] Security alert: Missing X-Hub-Signature-256 header in production request");
      res.status(403).json({ error: "Missing signature header" });
      return;
    }

    const { object, entry } = req.body;

    // Verify this is a page leadgen event
    if (object !== "page" || !entry || !Array.isArray(entry) || entry.length === 0) {
      res.status(200).send("OK");
      return;
    }

    // 2. DURABLE EVENT PERSISTENCE:
    // Persist raw webhook event to WebhookEventLog BEFORE acknowledging HTTP 200.
    // If the server crashes or restarts, the event is securely preserved in MongoDB.
    for (const entryItem of entry) {
      const pageId = entryItem.id;
      const changes = entryItem.changes || [];
      for (const change of changes) {
        if (change.field === "leadgen" && change.value?.leadgen_id) {
          const eventKey = `meta_lead_${change.value.leadgen_id}`;
          try {
            await WebhookEventLog.findOneAndUpdate(
              { event_id: eventKey },
              {
                provider: "meta",
                event_type: "leadgen",
                status: "pending",
                payload: { leadValue: change.value, pageId },
                created_at: new Date(),
              },
              { upsert: true }
            );
          } catch (persistErr) {
            // Non-blocking catch if duplicate key
          }
        }
      }
    }

    // 3. FAST ACK: Immediately acknowledge Meta to prevent HTTP timeouts
    res.status(200).send("EVENT_RECEIVED");

    // 4. Process entries asynchronously in the background so Graph API & MongoDB operations never block Meta
    setImmediate(async () => {
      try {
        for (const entryItem of entry) {
          const pageId = entryItem.id;
          const changes = entryItem.changes || [];

          for (const change of changes) {
            if (change.field === "leadgen" && change.value) {
              await processLeadgenEvent(change.value, pageId);
            }
          }
        }
      } catch (asyncErr) {
        console.error("[MetaWebhook] Background async processing error:", (asyncErr as Error).message);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    // Always return 200 to Meta so it does not retry spamming on server error
    if (!res.headersSent) {
      res.status(200).send("OK");
    }
  }
};

/**
 * Process individual leadgen event with idempotency, tenant resolution, and attribution preservation
 */
async function processLeadgenEvent(leadValue: any, pageId: string) {
  const leadId = leadValue.leadgen_id;
  const formId = leadValue.form_id;
  const createdTime = leadValue.created_time || Math.floor(Date.now() / 1000);

  if (!leadId) {
    console.warn("[MetaWebhook] Missing leadgen_id in event payload, skipping.");
    return;
  }

  try {
    console.log(`[MetaWebhook] Received lead event: leadId=${leadId}, formId=${formId}, pageId=${pageId}`);

    // 1. Resolve tenant context securely from connected MetaPage or MetaIntegration
    let pageRecord = await MetaPage.findOne({ meta_page_id: pageId, status: "active" });
    let integration = pageRecord
      ? await MetaIntegration.findById(pageRecord.integration_id)
      : await MetaIntegration.findOne({ meta_page_id: pageId, is_connected: true });

    if (!integration) {
      console.warn(
        `[MetaWebhook] QUARANTINED: No active integration found for Meta Page ID '${pageId}'. Event for lead ${leadId} rejected to preserve tenant isolation.`
      );
      return;
    }

    const activeTenantId = integration.tenant_id;
    const branchcode = integration.branchcode;

    // 2. Idempotency Check: Strict deduplication by meta_lead_id within tenant
    const existingLog = await MetaLeadSyncLog.findOne({
      tenant_id: activeTenantId,
      meta_lead_id: leadId,
    });

    if (existingLog && existingLog.sync_status === "success") {
      console.log(`[MetaWebhook] Duplicate lead ${leadId} detected in sync log, skipping duplicate processing.`);
      return;
    }

    // Protect against concurrent in-flight processing within a 5-minute window
    if (
      existingLog &&
      existingLog.sync_status === "processing" &&
      existingLog.created_at &&
      Date.now() - new Date(existingLog.created_at).getTime() < 5 * 60 * 1000
    ) {
      console.log(`[MetaWebhook] Lead ${leadId} is already actively being processed. Skipping concurrent run.`);
      return;
    }

    const existingLead = await Lead.findOne({
      tenant_id: activeTenantId,
      meta_lead_id: leadId,
    });

    if (existingLead) {
      console.log(`[MetaWebhook] Duplicate lead ${leadId} detected in CRM Lead model, skipping duplicate processing.`);
      return;
    }

    // 3. Create or update sync log with status 'processing'
    const syncLog = await MetaLeadSyncLog.findOneAndUpdate(
      { tenant_id: activeTenantId, meta_lead_id: leadId },
      {
        branchcode,
        meta_form_id: formId || "unknown",
        meta_lead_id: leadId,
        sync_status: "processing",
        sync_timestamp: new Date(createdTime * 1000),
        meta_lead_data: leadValue,
        created_at: existingLog?.created_at || new Date(),
      },
      { upsert: true, new: true }
    );

    // 4. Fetch rich lead details from Meta Graph API using page access token
    let rawLeadDetails: any = null;
    const pageAccessToken = pageRecord?.page_access_token || integration.access_token;

    if (pageAccessToken) {
      try {
        const appId = integration.meta_app_id || process.env.META_APP_ID || "";
        const appSecret = integration.meta_app_secret || process.env.META_APP_SECRET || "";
        const apiVersion = integration.meta_api_version || DEFAULT_META_API_VERSION;
        const metaService = new MetaService(appId, appSecret, apiVersion);

        rawLeadDetails = await metaService.fetchLeadDetails(leadId, pageAccessToken);
      } catch (graphErr) {
        console.warn(`[MetaWebhook] Graph API fetch details notice for lead ${leadId}:`, (graphErr as Error).message);
      }
    }

    // Merge payload data with Graph API lead details
    const completeLeadData = {
      ...(rawLeadDetails || {}),
      id: leadId,
      leadgen_id: leadId,
      form_id: formId,
      page_id: pageId,
      created_time: rawLeadDetails?.created_time || createdTime,
      ad_id: rawLeadDetails?.ad_id || leadValue.ad_id,
      campaign_id: rawLeadDetails?.campaign_id || leadValue.campaign_id,
      adset_id: rawLeadDetails?.adset_id || leadValue.adset_id,
      platform: rawLeadDetails?.platform || leadValue.platform || "facebook_lead_ads",
    };

    // 5. Look up Form Configuration for custom field mappings and default assignment
    const formConfig = await MetaLeadForm.findOne({
      tenant_id: activeTenantId,
      meta_form_id: formId,
    });

    let defaultCampaignCode = formConfig?.default_campaign_code;
    // Derive campaign code ONLY from form config or explicit Meta Campaign attribution
    // (Never randomly select an unrelated active campaign for this branch)
    if (!defaultCampaignCode && (completeLeadData.campaign_id || completeLeadData.campaign_name)) {
      const metaCampaign = await MetaCampaign.findOne({
        tenant_id: activeTenantId,
        $or: [
          { meta_campaign_id: completeLeadData.campaign_id },
          { name: completeLeadData.campaign_name },
        ],
      });
      if (metaCampaign) {
        defaultCampaignCode = metaCampaign.name;
      }
    }

    const leadMapping = formConfig?.lead_mapping || {};
    const defaultAssigneeId = formConfig?.default_assignee_id;
    const defaultStatus = formConfig?.default_lead_status || "New Lead";

    // 6. Map Meta Lead to CRM Lead format
    const mappedLead = LeadMappingService.mapMetaLeadToCRM(
      completeLeadData,
      leadMapping,
      activeTenantId,
      branchcode,
      defaultAssigneeId,
      defaultCampaignCode,
      defaultStatus
    );

    // 7. Persist CRM Lead
    const createdLead = await LeadMappingService.createLead(mappedLead);

    // 8. Update sync log & form statistics
    await syncLog.updateOne({
      crm_lead_id: createdLead._id,
      sync_status: "success",
      meta_lead_data: completeLeadData,
    });

    // Mark durable webhook event as processed
    try {
      await WebhookEventLog.updateOne(
        { event_id: `meta_lead_${leadId}` },
        { status: "processed" }
      );
    } catch (e) {
      // Non-blocking
    }

    if (formConfig) {
      await formConfig.updateOne({
        $inc: { total_leads_received: 1 },
        last_lead_received_at: new Date(),
      });
    }

    console.log(
      `[MetaWebhook] Lead ${leadId} successfully created in CRM as ${createdLead._id} (${createdLead.lead_name}) for tenant ${activeTenantId}`
    );

    // 9. Auto-share with parent company if applicable
    try {
      await autoShareWithParentCompany(createdLead);
    } catch (shareErr) {
      console.warn("[MetaWebhook] Auto-share notice:", (shareErr as Error).message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[MetaWebhook] Error processing lead ${leadId}:`, message);
    try {
      await MetaLeadSyncLog.findOneAndUpdate(
        { meta_lead_id: leadId },
        { sync_status: "failed", error_message: message }
      );
      await WebhookEventLog.updateOne(
        { event_id: `meta_lead_${leadId}` },
        { status: "failed" }
      );
    } catch (logErr) {
      // Ignore
    }
  }
}

export { processLeadgenEvent };

export default handleMetaWebhook;
