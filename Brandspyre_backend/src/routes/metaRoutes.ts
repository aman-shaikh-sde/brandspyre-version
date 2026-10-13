import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { platformAdminAuth } from "../middleware/platformAdminAuth";

// OAuth controllers
import { metaOAuthConnect } from "../controllers/meta/connect/oauth";
import { metaOAuthCallback } from "../controllers/meta/connect/callback";
import { metaDisconnect } from "../controllers/meta/connect/disconnect";

// Asset controllers
import { getMetaBusinesses } from "../controllers/meta/assets/businesses";
import { getMetaAdAccounts } from "../controllers/meta/assets/adAccounts";
import { getMetaPages } from "../controllers/meta/assets/pages";
import { getMetaInstagramAccounts } from "../controllers/meta/assets/instagram";
import { getMetaWhatsAppAccounts } from "../controllers/meta/assets/whatsapp";
import { triggerMetaAssetSync } from "../controllers/meta/assets/syncAssets";

// Form controllers
import { fetchMetaForms } from "../controllers/meta/pages/forms";
import { toggleMetaForm } from "../controllers/meta/config/toggleForm";

// Campaign, Ad Set, Ad controllers
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  pauseCampaign,
  resumeCampaign,
  syncCampaigns,
} from "../controllers/meta/campaigns/campaignController";
import { getAdSets, createAdSet } from "../controllers/meta/campaigns/adSetController";
import { getAds, createAd } from "../controllers/meta/campaigns/adController";

// Analytics controller
import { getMetaAnalytics } from "../controllers/meta/analytics/analyticsController";

// Platform Admin controller
import { getPlatformAdminMetaHealth } from "../controllers/meta/admin/platformAdminController";

// Config controllers
import { getMetaConfig } from "../controllers/meta/config/view";
import { updateMetaConfig } from "../controllers/meta/config/create";

// Sync logs controllers
import { getSyncLogs, getSyncStats } from "../controllers/meta/sync/logs";

// Webhook controllers (public endpoints)
import { verifyMetaWebhook } from "../controllers/meta/webhook/verify";
import { handleMetaWebhook } from "../controllers/meta/webhook/handle";

const router = Router();

// ==========================================
// 1. OAuth & Connection Management
// ==========================================
router.post("/oauth/connect", authMiddleware, tenantAuth(), metaOAuthConnect);
router.post("/connect", authMiddleware, tenantAuth(), metaOAuthConnect);
router.get("/oauth/callback", metaOAuthCallback);
router.post("/disconnect", authMiddleware, tenantAuth(), metaDisconnect);

// ==========================================
// 2. Channel Assets (Businesses, Ad Accounts, Pages, IG, WA)
// ==========================================
router.get("/businesses", authMiddleware, tenantAuth(), getMetaBusinesses);
router.get("/ad-accounts", authMiddleware, tenantAuth(), getMetaAdAccounts);
router.get("/pages", authMiddleware, tenantAuth(), getMetaPages);
router.get("/instagram", authMiddleware, tenantAuth(), getMetaInstagramAccounts);
router.get("/whatsapp", authMiddleware, tenantAuth(), getMetaWhatsAppAccounts);
router.post("/sync/assets", authMiddleware, tenantAuth(), triggerMetaAssetSync);

// ==========================================
// 3. Lead Forms & Mapping
// ==========================================
router.get("/forms", authMiddleware, tenantAuth(), fetchMetaForms);
router.post("/forms/toggle", authMiddleware, tenantAuth(), toggleMetaForm);

// ==========================================
// 4. Campaign Management (Marketing Suite)
// ==========================================
router.get("/campaigns", authMiddleware, tenantAuth(), getCampaigns);
router.post("/campaigns", authMiddleware, tenantAuth(), createCampaign);
router.post("/campaigns/sync", authMiddleware, tenantAuth(), syncCampaigns);
router.get("/campaigns/:id", authMiddleware, tenantAuth(), getCampaignById);
router.post("/campaigns/:id/pause", authMiddleware, tenantAuth(), pauseCampaign);
router.post("/campaigns/:id/resume", authMiddleware, tenantAuth(), resumeCampaign);

// Ad Sets & Ads
router.get("/ad-sets", authMiddleware, tenantAuth(), getAdSets);
router.post("/ad-sets", authMiddleware, tenantAuth(), createAdSet);
router.get("/ads", authMiddleware, tenantAuth(), getAds);
router.post("/ads", authMiddleware, tenantAuth(), createAd);

// ==========================================
// 5. Marketing Analytics
// ==========================================
router.get("/analytics", authMiddleware, tenantAuth(), getMetaAnalytics);

// ==========================================
// 6. Platform Admin Monitoring
// ==========================================
router.get("/admin/health", authMiddleware, platformAdminAuth, getPlatformAdminMetaHealth);

// ==========================================
// 7. General Configuration & Sync Logs
// ==========================================
router.get("/config", authMiddleware, tenantAuth(), getMetaConfig);
router.post("/config", authMiddleware, tenantAuth(), updateMetaConfig);
router.get("/sync/logs", authMiddleware, tenantAuth(), getSyncLogs);
router.get("/sync/stats", authMiddleware, tenantAuth(), getSyncStats);

// ==========================================
// 8. Meta Webhook (Public endpoints - verified by signature/token)
// ==========================================
router.get("/webhook", verifyMetaWebhook);
router.post("/webhook", handleMetaWebhook);

export default router;
