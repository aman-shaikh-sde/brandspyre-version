import { Request, Response } from "express";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration, MetaLeadForm } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Disconnect Controller
 * Handles disconnection from Meta/Facebook
 */
export const metaDisconnect = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta Disconnect";
  
  try {
    // Get tenant info from auth context
    const tenantId = (req as any).tenant?.id;
    const branchcode = req.user?.brcode;
    
    if (!tenantId || !branchcode) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context" 
      });
      return;
    }
    
    // Find the integration for this tenant
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    });
    
    if (!integration) {
      res.status(404).json({ 
        success: false, 
        message: "Meta integration not found" 
      });
      return;
    }
    
    // Create tenant-specific MetaService instance
    const metaService = new MetaService(
      (integration as any).meta_app_id,
      (integration as any).meta_app_secret,
      (integration as any).meta_api_version
    );
    
    // Revoke token if it exists
    if (integration.access_token) {
      await metaService.revokeToken(integration.access_token);
    }
    
    // Unsubscribe from webhooks if page is connected
    if (integration.meta_page_id && integration.access_token) {
      try {
        await metaService.unsubscribeFromLeadgenWebhook(
          integration.meta_page_id,
          integration.access_token
        );
      } catch (error) {
        console.error("Error unsubscribing from webhook:", error);
        // Continue with disconnection even if webhook unsubscription fails
      }
    }
    
    // Disable all lead forms for this integration
    await MetaLeadForm.updateMany(
      { meta_integration_id: integration._id },
      { is_enabled: false, updated_at: new Date() }
    );
    
    // Update integration status
    integration.is_connected = false;
    integration.connection_status = 'disconnected';
    integration.access_token = undefined;
    integration.refresh_token = undefined;
    integration.token_expires_at = undefined;
    integration.meta_page_id = undefined;
    integration.meta_business_account_id = undefined;
    integration.updated_at = new Date();
    await integration.save();
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success` 
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
