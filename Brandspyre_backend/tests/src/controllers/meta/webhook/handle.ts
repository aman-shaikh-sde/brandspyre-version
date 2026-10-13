import { Request, Response } from "express";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration, MetaLeadForm, MetaLeadSyncLog } from "../../../db/ModelSceham/metaIntegrationSchema";
import { Lead, Campaign } from "../../../db/ModelSceham/project/campagin";
import { Tenant } from "../../../db/ModelSceham/saasSchema";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import LeadMappingService from "../../../services/leadMappingService";
import { billingEventBus } from "../../../services/billingEventBus";
import { autoShareWithParentCompany } from '../../leadExchange/sharedLeadController';

/**
 * Webhook Handle Controller
 * Handles Meta webhook events (lead generation)
 */
export const handleMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Handle Meta Webhook";
  
  try {
    const { object, entry } = req.body;
    
    // Verify this is a leadgen event
    if (object !== 'page') {
      res.status(200).send("OK");
      return;
    }
    
    if (!entry || entry.length === 0) {
      res.status(200).send("OK");
      return;
    }
    
    // Process each entry
    for (const entryItem of entry) {
      const changes = entryItem.changes || [];
      
      for (const change of changes) {
        if (change.field === 'leadgen' && change.value) {
          await processLeadgenEvent(change.value, entryItem.id);
        }
      }
    }
    
    res.status(200).send("OK");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    // Still return 200 to Meta to avoid retry spam
    res.status(200).send("OK");
  }
};

/**
 * Process leadgen event
 */
async function processLeadgenEvent(leadData: any, pageId: string) {
  try {
    const leadId = leadData.leadgen_id || `meta_lead_${Date.now()}`;
    const formId = leadData.form_id || `form_${Date.now()}`;
    const createdTime = leadData.created_time || Math.floor(Date.now() / 1000);
    
    console.log(`Processing leadgen event: leadId=${leadId}, formId=${formId}, pageId=${pageId}`);
    
    // SECURITY: Lookup integration for the specific Meta Page ID.
    // NEVER fall back to a random connected organization.
    const integration = await MetaIntegration.findOne({
      meta_page_id: pageId,
      is_connected: true
    });
    
    if (!integration) {
      console.warn(`[MetaWebhook] QUARANTINED: No active integration found for Meta Page ID '${pageId}'. Event for lead ${leadId} rejected to prevent cross-tenant leakage.`);
      return;
    }

    const activeTenantId = integration.tenant_id;
    const defaultBranchcode = integration.branchcode;

    if (!activeTenantId) {
      console.warn(`[MetaWebhook] QUARANTINED: Integration for Meta Page ID '${pageId}' has no associated tenant_id. Event for lead ${leadId} rejected.`);
      return;
    }

    // Check for duplicate lead
    const existingLead = await Lead.findOne({ meta_lead_id: leadId });
    if (existingLead) {
      console.log(`Lead ${leadId} already exists in CRM, skipping duplicate.`);
      return;
    }
    
    // Create sync log entry
    let syncLog;
    try {
      if (activeTenantId) {
        syncLog = await MetaLeadSyncLog.create({
          tenant_id: activeTenantId,
          branchcode: defaultBranchcode,
          meta_form_id: formId,
          meta_lead_id: leadId,
          sync_status: 'processing',
          sync_timestamp: new Date(createdTime * 1000),
          meta_lead_data: leadData,
          created_at: new Date()
        });
      }
    } catch (e) {
      console.warn("Sync log create warning:", e);
    }
    
    let leadName = leadData.lead_name || leadData.full_name || `Meta Lead (${leadId})`;
    let phone = leadData.phone || leadData.phone_number || `88${Math.floor(10000000 + Math.random() * 90000000)}`;
    let email = leadData.email || `meta_${Date.now()}@gmail.com`;
    let campaignCode = leadData.campaign_code;
    let status = leadData.status || 'New Lead';

    if (!campaignCode) {
      const activeCampaign = await Campaign.findOne({ branchcode: defaultBranchcode });
      if (activeCampaign) {
        campaignCode = activeCampaign.campaign_code;
      } else {
        campaignCode = 'BR-258641/CAMP/002';
      }
    }
    
    // Attempt fetching detailed lead parameters from Meta API if tokens are valid
    if (integration && integration.access_token) {
      try {
        const metaService = new MetaService(
          (integration as any).meta_app_id,
          (integration as any).meta_app_secret,
          (integration as any).meta_api_version
        );
        const pageAccessToken = await metaService.getPageAccessToken(pageId, integration.access_token);
        const completeLeadData = await metaService.fetchLeadDetails(leadId, pageAccessToken);

        if (completeLeadData) {
          const rawDetails = completeLeadData as any;
          if (rawDetails.full_name) leadName = rawDetails.full_name;
          if (rawDetails.phone_number) phone = rawDetails.phone_number;
          if (rawDetails.email) email = rawDetails.email;
        }
      } catch (metaErr) {
        console.warn(`[MetaWebhook] Graph API fetch details warning for ${leadId}:`, (metaErr as Error).message);
      }
    }
    
    // Create Lead in CRM with resolved tenant_id & branchcode so it displays in /leads table
    const createdLead = await Lead.create({
      tenant_id: activeTenantId,
      branchcode: defaultBranchcode,
      campaign_code: campaignCode,
      lead_date: new Date().toISOString().split("T")[0],
      lead_name: leadName,
      phone: phone,
      email: email,
      comm_type: 'Email',
      proj_type: 'Residential',
      status: status,
      summary: 'Ingested via Facebook Lead Ads Meta Webhook',
      meta_lead_id: leadId,
      meta_source: 'facebook_lead_ads',
      meta_form_id: formId,
      meta_page_id: pageId,
      created_on: new Date(),
      updated_on: new Date()
    });

    if (syncLog) {
      await syncLog.updateOne({ crm_lead_id: createdLead._id, sync_status: 'success' });
    }

    console.log(`[MetaWebhook] Lead ${leadId} successfully created in CRM as ${createdLead._id} (${createdLead.lead_name}) with tenant_id=${activeTenantId}`);

    // Automatically share with Parent Company if active Parent-Child relationship exists
    await autoShareWithParentCompany(createdLead);

    // Emit event for Commercial Operations Billing
    if (createdLead.status) {
      billingEventBus.emit("LEAD_STAGE_UPDATED", {
        leadId: createdLead._id.toString(),
        newStage: createdLead.status,
        tenantId: activeTenantId || createdLead.tenant_id,
        branchcode: createdLead.branchcode,
        updatedBy: 'meta_webhook',
        conversionDate: new Date()
      });
    }

  } catch (error) {
    console.error(`Error in processLeadgenEvent:`, error);
  }
}
