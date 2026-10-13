import { Request, Response } from "express";
import { MetaService, DEFAULT_META_API_VERSION } from "../../../services/metaService";
import { MetaIntegration, MetaLeadForm } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Update Config Controller
 * Updates Meta integration configuration
 */
export const updateMetaConfig = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Meta Config";
  
  try {
    const { pageId, pageName, meta_app_id, meta_app_secret, meta_api_version } = req.body;
    
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    if (!tenantId || !branchcode) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context" 
      });
      return;
    }
    
    // Find or create the integration for this tenant
    let integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    });
    
    // If credentials are provided, update them
    if (meta_app_id && meta_app_secret) {
      if (!integration) {
        // Create new integration with credentials
        integration = new MetaIntegration({
          tenant_id: new mongoose.Types.ObjectId(tenantId),
          branchcode: branchcode,
          meta_app_id: meta_app_id,
          meta_app_secret: meta_app_secret,
          meta_api_version: meta_api_version || DEFAULT_META_API_VERSION,
          is_connected: false,
          connection_status: 'disconnected'
        });
      } else {
        // Update existing credentials
        (integration as any).meta_app_id = meta_app_id;
        (integration as any).meta_app_secret = meta_app_secret;
        if (meta_api_version) {
          (integration as any).meta_api_version = meta_api_version;
        }
      }
      await integration.save();
    }
    
    if (!integration) {
      res.status(404).json({ 
        success: false, 
        message: "Meta integration not found. Please provide Meta App credentials first." 
      });
      return;
    }
    
    // If pageId is provided, update the page and subscribe to webhook
    if (pageId && integration.is_connected) {
      // Create tenant-specific MetaService instance
      const metaService = new MetaService(
        (integration as any).meta_app_id,
        (integration as any).meta_app_secret,
        (integration as any).meta_api_version
      );
      
      // Get page access token
      const pageAccessToken = await metaService.getPageAccessToken(pageId, integration.access_token!);
      
      // Subscribe to leadgen webhook
      const webhookUrl = integration.webhook_url || `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/webhook`;
      const verifyToken = integration.webhook_verify_token || "";
      
      await metaService.subscribeToLeadgenWebhook(
        pageId,
        pageAccessToken,
        webhookUrl,
        verifyToken
      );
      
      // Update integration with page info
      integration.meta_page_id = pageId;
      integration.updated_at = new Date();
      await integration.save();
    }
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: integration
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
