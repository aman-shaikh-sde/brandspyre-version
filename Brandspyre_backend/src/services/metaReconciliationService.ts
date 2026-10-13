import mongoose from "mongoose";
import {
  MetaIntegration,
  MetaLeadForm,
  MetaLeadSyncLog,
  MetaPage,
  MetaCampaign,
} from "../db/ModelSceham/metaIntegrationSchema";
import { Lead, Campaign } from "../db/ModelSceham/project/campagin";
import { WebhookEventLog } from "../db/ModelSceham/saasSchema";
import MetaService from "./metaService";
import LeadMappingService from "./leadMappingService";
import { autoShareWithParentCompany } from "../controllers/leadExchange/sharedLeadController";

/**
 * Meta Lead Reconciliation & Token Health Background Worker
 * Periodically reconciles missed webhook leads and monitors token health across connected tenants
 */
export class MetaReconciliationService {
  private static timerId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the background reconciliation runner (default: 20 minutes)
   */
  static start(intervalMinutes: number = 20) {
    if (this.timerId) return;

    const intervalMs = Math.max(15, intervalMinutes) * 60 * 1000;
    console.log(`⏰ Starting Meta Lead Reconciliation Worker (Interval: ${intervalMinutes} min)...`);

    // Run reconciliation 60 seconds after boot to let DB connections settle
    setTimeout(() => {
      this.runReconciliationJob().catch((err) =>
        console.error("[MetaReconciliation] Initial run error:", (err as Error).message)
      );
    }, 60000);

    // Schedule periodic execution
    this.timerId = setInterval(() => {
      this.runReconciliationJob().catch((err) =>
        console.error("[MetaReconciliation] Periodic run error:", (err as Error).message)
      );
    }, intervalMs);
  }

  /**
   * Stop the background worker
   */
  static stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log("🛑 Stopped Meta Lead Reconciliation Worker.");
    }
  }

  /**
   * Execute full reconciliation job across active tenants
   */
  static async runReconciliationJob(): Promise<void> {
    if (this.isRunning) return;

    // Distributed lock check (50 minute TTL per bucket)
    const lockKey = `cron_meta_reconciliation_lock_${new Date().toISOString().slice(0, 13)}`;
    const hasLock = await this.acquireDistributedLock(lockKey);
    if (!hasLock) {
      console.log(`[MetaReconciliation] Skipped: Lock '${lockKey}' already held by another pod.`);
      return;
    }

    this.isRunning = true;
    const now = new Date();
    console.log(`[MetaReconciliation] Running reconciliation check at ${now.toISOString()}...`);

    try {
      // Find all active connected integrations
      const activeIntegrations = await MetaIntegration.find({
        is_connected: true,
        access_token: { $exists: true, $ne: "" },
      });

      console.log(`[MetaReconciliation] Found ${activeIntegrations.length} active integrations to reconcile.`);

      for (const integration of activeIntegrations) {
        try {
          await this.reconcileTenant(integration);
        } catch (tenantErr) {
          console.error(
            `[MetaReconciliation] Error reconciling tenant ${integration.tenant_id}:`,
            (tenantErr as Error).message
          );
        }
      }

      // Recovery of any stuck pending webhook events from previous server restarts
      try {
        const stuckEvents = await WebhookEventLog.find({
          provider: "meta",
          event_type: "leadgen",
          status: "pending",
          created_at: { $lt: new Date(Date.now() - 2 * 60 * 1000) },
        }).limit(20);

        if (stuckEvents.length > 0) {
          console.log(`[MetaReconciliation] Recovering ${stuckEvents.length} stuck pending webhook events...`);
          const { processLeadgenEvent } = require("../controllers/meta/webhook/handle");
          for (const ev of stuckEvents) {
            if (ev.payload?.leadValue && ev.payload?.pageId) {
              await processLeadgenEvent(ev.payload.leadValue, ev.payload.pageId);
            }
          }
        }
      } catch (recoverErr) {
        console.warn("[MetaReconciliation] Stuck event recovery notice:", (recoverErr as Error).message);
      }

      console.log("[MetaReconciliation] Completed reconciliation check cleanly.");
    } catch (error) {
      console.error("[MetaReconciliation] General job error:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Reconcile missed leads and check token health for a single tenant
   */
  private static async reconcileTenant(integration: any): Promise<void> {
    const tenantId = integration.tenant_id;
    const branchcode = integration.branchcode;
    const accessToken = integration.access_token;

    // 1. Token Validity & Auto-Refresh Check
    if (integration.token_expires_at) {
      const daysUntilExpiry =
        (new Date(integration.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry < 0) {
        integration.connection_status = "expired";
        integration.last_error = "Access token expired. Reconnection required.";
        await integration.save();
        return;
      }

      // If token expires in less than 7 days, attempt proactive refresh
      if (daysUntilExpiry < 7) {
        try {
          const metaService = new MetaService(
            integration.meta_app_id || process.env.META_APP_ID,
            integration.meta_app_secret || process.env.META_APP_SECRET
          );
          const refreshed = await metaService.refreshAccessToken(accessToken);
          if (refreshed?.access_token) {
            integration.access_token = refreshed.access_token;
            integration.token_expires_at = new Date(Date.now() + (refreshed.expires_in || 5184000) * 1000);
            await integration.save();
            console.log(`[MetaReconciliation] Successfully refreshed access token for tenant ${tenantId}`);
          }
        } catch (refreshErr) {
          console.warn(`[MetaReconciliation] Proactive token refresh notice for ${tenantId}:`, (refreshErr as Error).message);
        }
      }
    }

    // 2. Fetch enabled lead forms for this tenant
    const forms = await MetaLeadForm.find({
      tenant_id: tenantId,
      is_enabled: true,
    });

    if (forms.length === 0) return;

    // Look up connected pages to get page access tokens
    const pages = await MetaPage.find({
      tenant_id: tenantId,
      status: "active",
    });

    const pageTokenMap = new Map<string, string>();
    for (const page of pages) {
      if (page.page_access_token) {
        pageTokenMap.set(page.meta_page_id, page.page_access_token);
      }
    }

    const metaService = new MetaService(
      integration.meta_app_id || process.env.META_APP_ID,
      integration.meta_app_secret || process.env.META_APP_SECRET
    );

    // Incremental sync cursor: use form.last_sync_at (with 5-minute safety overlap) or 24-hour fallback
    const defaultLookback = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const form of forms) {
      const pageToken = pageTokenMap.get(form.meta_page_id) || accessToken;
      if (!pageToken) continue;

      const formLookback = form.last_sync_at
        ? new Date(form.last_sync_at.getTime() - 5 * 60 * 1000)
        : defaultLookback;

      try {
        const remoteLeads = await metaService.fetchFormLeads(form.meta_form_id, pageToken, {
          since: formLookback,
          limit: 100,
        });

        for (const remoteLead of remoteLeads) {
          const leadId = remoteLead.id;
          if (!leadId) continue;

          // Check if already processed in sync log or CRM
          const isDuplicateInLog = await MetaLeadSyncLog.findOne({
            tenant_id: tenantId,
            meta_lead_id: leadId,
            sync_status: "success",
          });
          if (isDuplicateInLog) continue;

          const isDuplicateInCrm = await Lead.findOne({
            tenant_id: tenantId,
            meta_lead_id: leadId,
          });
          if (isDuplicateInCrm) {
            // Consistency self-repair: Ensure MetaLeadSyncLog exists and reflects success
            await MetaLeadSyncLog.findOneAndUpdate(
              { tenant_id: tenantId, meta_lead_id: leadId },
              {
                branchcode,
                meta_form_id: form.meta_form_id,
                meta_lead_id: leadId,
                crm_lead_id: isDuplicateInCrm._id,
                sync_status: "success",
                sync_timestamp: remoteLead.created_time ? new Date(remoteLead.created_time) : new Date(),
                meta_lead_data: remoteLead,
                created_at: new Date(),
              },
              { upsert: true }
            );
            continue;
          }

          console.log(`[MetaReconciliation] Detected missed lead ${leadId} for form ${form.meta_form_id}. Reconciling...`);

          // Map lead to CRM format with verified attribution
          const defaultAssigneeId = form.default_assignee_id;
          let defaultCampaignCode = form.default_campaign_code;

          // Derive campaign code ONLY from form config or explicit Meta Campaign attribution
          if (!defaultCampaignCode && (remoteLead.campaign_id || remoteLead.campaign_name)) {
            const metaCampaign = await MetaCampaign.findOne({
              tenant_id: tenantId,
              $or: [
                { meta_campaign_id: remoteLead.campaign_id },
                { name: remoteLead.campaign_name },
              ],
            });
            if (metaCampaign) {
              defaultCampaignCode = metaCampaign.name;
            }
          }

          const mappedLead = LeadMappingService.mapMetaLeadToCRM(
            {
              ...remoteLead,
              leadgen_id: leadId,
              form_id: form.meta_form_id,
              page_id: form.meta_page_id,
            },
            form.lead_mapping || {},
            tenantId,
            branchcode,
            defaultAssigneeId,
            defaultCampaignCode,
            form.default_lead_status || "New Lead"
          );

          // Create CRM Lead
          const createdLead = await LeadMappingService.createLead(mappedLead);

          // Record in sync log
          await MetaLeadSyncLog.create({
            tenant_id: tenantId,
            branchcode,
            meta_form_id: form.meta_form_id,
            meta_lead_id: leadId,
            crm_lead_id: createdLead._id,
            sync_status: "success",
            sync_timestamp: remoteLead.created_time ? new Date(remoteLead.created_time) : new Date(),
            meta_lead_data: remoteLead,
            created_at: new Date(),
          });

          // Update form counters
          await form.updateOne({
            $inc: { total_leads_received: 1 },
            last_lead_received_at: new Date(),
          });

          try {
            await autoShareWithParentCompany(createdLead);
          } catch (e) {
            // Ignore
          }
        }

        // Update form last_sync_at timestamp for incremental efficiency
        await form.updateOne({
          last_sync_at: new Date(),
        });
      } catch (formErr) {
        console.warn(`[MetaReconciliation] Form ${form.meta_form_id} reconciliation warning:`, (formErr as Error).message);
      }
    }
  }

  /**
   * Acquire MongoDB distributed lock
   */
  private static async acquireDistributedLock(lockKey: string): Promise<boolean> {
    try {
      await WebhookEventLog.create({
        event_id: lockKey,
        provider: "meta_reconciliation",
        event_type: "scheduled_sync",
        status: "locked",
        created_at: new Date(),
      });
      return true;
    } catch (err: any) {
      if (err.code === 11000 || (err.message && err.message.includes("duplicate key"))) {
        return false;
      }
      return false;
    }
  }
}

export default MetaReconciliationService;
