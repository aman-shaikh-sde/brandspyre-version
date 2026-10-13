import { Request, Response } from "express";
import { MetaIntegration, MetaLeadForm } from "../../../db/ModelSceham/metaIntegrationSchema";
import LeadMappingService from "../../../services/leadMappingService";

/**
 * Toggle Form Controller
 * Enables or disables a specific lead form
 */
export const toggleMetaForm = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Toggle Meta Form";
  
  try {
    const { formId, pageId, pageName, isEnabled, assigneeId, campaignCode, leadMapping } = req.body;
    
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    if (!tenantId || !branchcode || !formId || !pageId) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID, branchcode, form ID, and page ID are required" 
      });
      return;
    }
    
    // Find the integration for this tenant
    const integration = await MetaIntegration.findOne({
      tenant_id: tenantId,
      branchcode: branchcode
    });
    
    if (!integration || !integration.is_connected) {
      res.status(404).json({ 
        success: false, 
        message: "Meta integration not found or not connected" 
      });
      return;
    }
    
    // Validate mapping if provided
    if (leadMapping) {
      const validation = LeadMappingService.validateMapping(leadMapping);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid field mapping",
          errors: validation.errors
        });
        return;
      }
    }
    
    // Find or create form configuration
    let formConfig = await MetaLeadForm.findOne({
      meta_form_id: formId,
      tenant_id: tenantId,
      branchcode: branchcode
    });
    
    if (formConfig) {
      // Update existing form
      formConfig.is_enabled = isEnabled;
      formConfig.meta_page_id = pageId;
      formConfig.meta_page_name = pageName || formConfig.meta_page_name;
      if (assigneeId) formConfig.default_assignee_id = assigneeId;
      if (campaignCode) formConfig.default_campaign_code = campaignCode;
      if (leadMapping) formConfig.lead_mapping = leadMapping;
      formConfig.updated_at = new Date();
      await formConfig.save();
    } else {
      // Create new form configuration
      formConfig = await MetaLeadForm.create({
        meta_integration_id: integration._id,
        tenant_id: tenantId,
        branchcode: branchcode,
        meta_form_id: formId,
        meta_form_name: pageName || "Unknown Form",
        meta_page_id: pageId,
        meta_page_name: pageName,
        is_enabled: isEnabled,
        default_assignee_id: assigneeId,
        default_campaign_code: campaignCode,
        lead_mapping: leadMapping || {},
        total_leads_received: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: formConfig
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
