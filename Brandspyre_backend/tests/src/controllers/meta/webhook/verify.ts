import { Request, Response } from "express";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";

/**
 * Webhook Verify Controller
 * Handles Meta webhook verification requests
 */
export const verifyMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Verify Meta Webhook";
  
  try {
    const { mode, token, challenge } = req.query;
    
    // Verify the mode and token
    if (mode === 'subscribe' && token) {
      // Find any integration with this verify token
      const integration = await MetaIntegration.findOne({
        webhook_verify_token: token
      });
      
      if (integration) {
        console.log(`${msgField} - Webhook verified for tenant: ${integration.tenant_id}`);
        res.status(200).send(challenge);
        return;
      }
    }
    
    res.status(403).json({ 
      success: false, 
      message: "Webhook verification failed" 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(403).json({ 
      success: false, 
      message: "Webhook verification failed" 
    });
  }
};
