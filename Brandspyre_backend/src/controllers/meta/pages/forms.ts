import { Request, Response } from "express";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration, MetaLeadForm } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Fetch Forms Controller
 * Fetches lead forms for a specific Facebook page
 */
export const fetchMetaForms = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Fetch Meta Forms";
  
  try {
    const { pageId } = req.query;
    
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    if (!tenantId || !branchcode || !pageId) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID, branchcode, and page ID are required" 
      });
      return;
    }
    
    // Find the integration for this tenant
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    });
    
    if (!integration || !integration.is_connected) {
      res.status(404).json({ 
        success: false, 
        message: "Meta integration not found or not connected" 
      });
      return;
    }
    
    // Check if token is expired
    if (integration.token_expires_at && new Date() > integration.token_expires_at) {
      res.status(401).json({ 
        success: false, 
        message: "Access token expired. Please reconnect." 
      });
      return;
    }
    
    // Create tenant-specific MetaService instance
    const metaService = new MetaService(
      (integration as any).meta_app_id,
      (integration as any).meta_app_secret,
      (integration as any).meta_api_version
    );
    
    // Get page access token
    const pageAccessToken = await metaService.getPageAccessToken(pageId as string, integration.access_token!);
    
    // Fetch lead forms for the page
    const forms = await metaService.fetchPageLeadForms(pageId as string, pageAccessToken);
    
    // Get existing form configurations for this tenant
    const existingForms = await MetaLeadForm.find({
      tenant_id: tenantId,
      branchcode: branchcode
    }).lean();
    
    // Merge form data with existing configurations
    const formsWithConfig = forms.map(form => {
      const existingConfig = existingForms.find(f => f.meta_form_id === form.id);
      return {
        ...form,
        is_enabled: existingConfig?.is_enabled || false,
        default_assignee_id: existingConfig?.default_assignee_id,
        default_campaign_code: existingConfig?.default_campaign_code,
        lead_mapping: existingConfig?.lead_mapping || {},
        total_leads_received: existingConfig?.total_leads_received || 0,
        last_lead_received_at: existingConfig?.last_lead_received_at,
      };
    });
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: formsWithConfig
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ 
      success: false, 
      error: `${msgField} Causes Error Message: ${message}` 
    });
  }
};
