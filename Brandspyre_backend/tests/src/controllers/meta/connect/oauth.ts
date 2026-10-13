import { Request, Response } from "express";
import crypto from "crypto";
import { MetaService } from "../../../services/metaService";
import { MetaIntegration } from "../../../db/ModelSceham/metaIntegrationSchema";

// Temporary state storage (in production, use Redis)
const oauthStateStore = new Map<string, { tenantId: string; branchcode: string; expiresAt: number }>();

/**
 * OAuth Connect Controller
 * Initiates the OAuth flow with Meta/Facebook
 */
export const metaOAuthConnect = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Meta OAuth Connect";
  
  try {
    // Get tenant info from auth context
    const tenantId = (req.user as any)?.tenantId;
    const branchcode = (req.user as any)?.brcode;
    
    console.log(`${msgField} - tenantId:`, tenantId, 'branchcode:', branchcode);
    
    // Super admin cannot connect Meta integration (tenant-specific feature)
    const userRole = req.user?.userRole;
    if (userRole === 'superadmin' || userRole === 'Super Admin') {
      res.status(403).json({ 
        success: false, 
        message: "Meta integration is a tenant-specific feature. Super admin cannot connect integration." 
      });
      return;
    }
    
    if (!tenantId || !branchcode) {
      res.status(400).json({ 
        success: false, 
        message: "Tenant ID and branchcode are required from authentication context" 
      });
      return;
    }

    // Fetch existing integration or check if credentials are provided
    const integration = await MetaIntegration.findOne({
      tenant_id: tenantId,
      branchcode: branchcode
    }).lean();

    // Get credentials from request body or existing integration
    const { meta_app_id, meta_app_secret, meta_api_version } = req.body;
    
    if (!meta_app_id || !meta_app_secret) {
      if (!integration || !(integration as any).meta_app_id || !(integration as any).meta_app_secret) {
        res.status(400).json({ 
          success: false, 
          message: "Meta App ID and App Secret are required. Please provide them in the request body." 
        });
        return;
      }
    }

    const appId = meta_app_id || (integration as any).meta_app_id;
    const appSecret = meta_app_secret || (integration as any).meta_app_secret;
    const apiVersion = meta_api_version || (integration as any).meta_api_version || 'v19.0';

    // Create tenant-specific MetaService instance
    const metaService = new MetaService(appId, appSecret, apiVersion);

    // Generate a secure state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");
    
    // Store state with tenant info (expires in 10 minutes)
    oauthStateStore.set(state, {
      tenantId: tenantId.toString(),
      branchcode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    // Generate OAuth URL
    const oauthUrl = metaService.getOAuthUrl(state);
    
    res.status(200).json({ 
      success: true, 
      message: `${msgField} Success`,
      data: {
        oauth_url: oauthUrl,
        state: state,
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

/**
 * Get stored OAuth state
 */
export const getOAuthState = (state: string) => {
  const stored = oauthStateStore.get(state);
  if (!stored) return null;
  
  // Check if expired
  if (Date.now() > stored.expiresAt) {
    oauthStateStore.delete(state);
    return null;
  }
  
  return stored;
};

/**
 * Delete OAuth state
 */
export const deleteOAuthState = (state: string) => {
  oauthStateStore.delete(state);
};
