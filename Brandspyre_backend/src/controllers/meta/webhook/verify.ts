import { Request, Response } from "express";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";

/**
 * Webhook Verify Controller
 * Handles Meta webhook verification requests
 * Supports both standard hub.* parameter keys sent by Meta Graph API and legacy parameters
 */
export const verifyMetaWebhook = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Verify Meta Webhook";

  try {
    const mode = req.query["hub.mode"] || req.query.mode;
    const token = req.query["hub.verify_token"] || req.query.token;
    const challenge = req.query["hub.challenge"] || req.query.challenge;

    // Verify the mode and token
    if (mode === "subscribe" && token) {
      // 1. Check against global SaaS webhook verify token
      const saasToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
      if (saasToken && token === saasToken) {
        console.log(`${msgField} - Global SaaS Webhook verified successfully`);
        res.status(200).send(challenge);
        return;
      }

      // 2. Check against tenant-specific webhook verify token
      const integration = await MetaIntegration.findOne({
        webhook_verify_token: token,
      });

      if (integration) {
        console.log(`${msgField} - Tenant Webhook verified for tenant: ${integration.tenant_id}`);
        res.status(200).send(challenge);
        return;
      }
    }

    console.warn(`${msgField} - Verification failed for token: ${token}`);
    res.status(403).json({
      success: false,
      message: "Webhook verification failed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(403).json({
      success: false,
      message: "Webhook verification failed",
    });
  }
};

export default verifyMetaWebhook;
