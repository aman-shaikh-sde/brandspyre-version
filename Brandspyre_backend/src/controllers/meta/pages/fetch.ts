import { Request, Response } from "express";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * Fetch Pages Controller
 * Fetches Facebook pages for the connected account
 */
export const fetchMetaPages = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Fetch Meta Pages";
  
  try {
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
    
    // Fetch user pages
    const pages = await metaService.fetchUserPages(integration.access_token!);
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: pages
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
