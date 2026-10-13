import { Request, Response } from "express";
import { MetaIntegration, MetaLeadForm } from "../../../db/ModelSceham/metaIntegrationSchema";
import mongoose from "mongoose";

/**
 * View Config Controller
 * Retrieves Meta integration configuration
 */
export const getMetaConfig = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Meta Config";
  
  try {
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    console.log(`${msgField} - tenantId:`, tenantId, 'branchcode:', branchcode);
    
    if (!tenantId || !branchcode) {
      console.log(`${msgField} - Missing tenantId or branchcode`);
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context",
        debug: { tenantId, branchcode }
      });
      return;
    }
    
    // Find the integration for this tenant
    const integration = await MetaIntegration.findOne({
      tenant_id: new mongoose.Types.ObjectId(tenantId),
      branchcode: branchcode
    }).select('-access_token -refresh_token').lean();
    
    console.log(`${msgField} - integration found:`, !!integration);
    
    if (!integration) {
      // Return 200 with is_connected: false instead of 404
      // This indicates Meta integration is not yet configured for this tenant
      res.status(200).json({ 
        success: true, 
        message: "Meta integration not configured yet",
        data: {
          is_connected: false,
          connection_status: 'disconnected',
          tenant_id: tenantId,
          branchcode: branchcode,
          enabled_forms: [],
          enabled_forms_count: 0
        }
      });
      return;
    }
    
    // Fetch enabled forms
    const enabledForms = await MetaLeadForm.find({
      meta_integration_id: (integration as any)._id,
      is_enabled: true
    }).lean();
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: {
        ...integration,
        enabled_forms: enabledForms,
        enabled_forms_count: enabledForms.length
      }
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
