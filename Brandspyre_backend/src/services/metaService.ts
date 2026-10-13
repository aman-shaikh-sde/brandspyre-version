import axios from "axios";

/**
 * Meta Graph API Service
 * Handles all interactions with Facebook/Meta Graph API for Marketing, Lead Ads, Pages, Instagram & WhatsApp
 */

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  instagram_business_account?: {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count?: number;
  };
}

export interface MetaLeadForm {
  id: string;
  name: string;
  status: string;
  leadgen_export_csv_url?: string;
}

export interface MetaLeadData {
  id?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  form_id?: string;
  is_organic?: boolean;
  platform?: string;
  [key: string]: any;
}

export const DEFAULT_META_API_VERSION = process.env.META_API_VERSION || "v21.0";

export class MetaService {
  private axiosInstance: any;
  public appId: string;
  public appSecret: string;
  public apiVersion: string;
  public redirectUri: string;

  constructor(appId?: string, appSecret?: string, apiVersion?: string, redirectUri?: string) {
    this.appId = appId || process.env.META_APP_ID || "";
    this.appSecret = appSecret || process.env.META_APP_SECRET || "";
    this.apiVersion = apiVersion || process.env.META_API_VERSION || DEFAULT_META_API_VERSION;
    this.redirectUri =
      redirectUri ||
      process.env.META_REDIRECT_URI ||
      `${process.env.BASE_URL || "http://localhost:3000"}/api/meta/oauth/callback`;

    this.axiosInstance = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 30000,
    });

    // Automatic retry interceptor for transient network failures & rate limits (429, 613)
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const config = error.config;
        if (!config || config.__isRetry) {
          return Promise.reject(error);
        }

        const status = error.response?.status;
        const metaCode = error.response?.data?.error?.code;

        const isRateLimited = status === 429 || metaCode === 4 || metaCode === 17 || metaCode === 613;
        const isTransientServer = status >= 500 && status <= 504;

        if (isRateLimited || isTransientServer) {
          config.__isRetry = true;
          const backoffDelay = isRateLimited ? 2000 : 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Parse and format Meta API errors safely without leaking internal secrets
   */
  private handleMetaError(error: any, contextMessage: string): Error {
    const metaError = error.response?.data?.error;
    const errorCode = metaError?.code;
    const errorSubcode = metaError?.error_subcode;
    const errorMessage = metaError?.message || error.message;

    console.error(`[MetaService] ${contextMessage} failed:`, {
      status: error.response?.status,
      code: errorCode,
      subcode: errorSubcode,
      message: errorMessage,
    });

    // Check for permission / access issues
    if (errorCode === 200 || errorCode === 10 || errorCode === 298 || errorSubcode === 458 || errorSubcode === 463) {
      return new Error("Your Meta integration does not currently have the required permission for this operation.");
    }
    if (errorCode === 190) {
      return new Error("Meta access token is invalid or expired. Reconnection required.");
    }
    if (errorCode === 17 || errorCode === 4 || errorCode === 613) {
      return new Error("Meta API rate limit reached. Please try again shortly.");
    }

    return new Error(`${contextMessage}: ${errorMessage || "Meta Graph API error"}`);
  }

  /**
   * Update service credentials dynamically
   */
  updateCredentials(appId: string, appSecret: string, apiVersion?: string, redirectUri?: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    if (apiVersion) this.apiVersion = apiVersion;
    if (redirectUri) this.redirectUri = redirectUri;

    this.axiosInstance = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 30000,
    });
  }

  /**
   * Generate OAuth URL for user authorization with full marketing suite scopes
   */
  getOAuthUrl(state: string): string {
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_manage_ads",
      "leads_retrieval",
      "ads_management",
      "ads_read",
      "business_management",
      "instagram_basic",
      "instagram_manage_insights",
      "whatsapp_business_management",
      "whatsapp_business_messaging",
    ].join(",");

    return (
      `https://www.facebook.com/${this.apiVersion}/dialog/oauth?` +
      `client_id=${encodeURIComponent(this.appId)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${encodeURIComponent(state)}&` +
      `response_type=code`
    );
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    try {
      const response = await this.axiosInstance.get("/oauth/access_token", {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code,
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to exchange authorization code for access token");
    }
  }

  /**
   * Get long-lived access token from short-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
    try {
      const response = await this.axiosInstance.get("/oauth/access_token", {
        params: {
          grant_type: "fb_exchange_token",
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to get long-lived access token");
    }
  }

  /**
   * Debug token to get expiration info and user/app IDs
   */
  async debugToken(token: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get("/debug_token", {
        params: {
          input_token: token,
          access_token: `${this.appId}|${this.appSecret}`,
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to debug token");
    }
  }

  /**
   * Fetch authenticated user identity
   */
  async getMe(accessToken: string): Promise<{ id: string; name: string; email?: string }> {
    try {
      const response = await this.axiosInstance.get("/me", {
        params: {
          fields: "id,name,email",
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to fetch Meta user profile");
    }
  }

  /**
   * Fetch user's Facebook pages with connected Instagram account
   */
  async fetchUserPages(accessToken: string): Promise<MetaPage[]> {
    try {
      const response = await this.axiosInstance.get("/me/accounts", {
        params: {
          access_token: accessToken,
          fields: "id,name,access_token,category,instagram_business_account{id,username,name,profile_picture_url,followers_count}",
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (error) {
      throw this.handleMetaError(error, "Failed to fetch Facebook pages");
    }
  }

  /**
   * Fetch Business Managers owned by or accessible to user
   */
  async fetchBusinesses(accessToken: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get("/me/businesses", {
        params: {
          access_token: accessToken,
          fields: "id,name,verification_status,created_time",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.warn("[MetaService] Could not fetch businesses directly (user might lack business_management scope):", (error as Error).message);
      return [];
    }
  }

  /**
   * Fetch Meta Ad Accounts associated with user or business
   */
  async fetchAdAccounts(accessToken: string, businessId?: string): Promise<any[]> {
    try {
      const path = businessId ? `/${businessId}/client_ad_accounts` : "/me/adaccounts";
      const response = await this.axiosInstance.get(path, {
        params: {
          access_token: accessToken,
          fields: "id,name,account_id,account_status,currency,timezone_name",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      // Fallback to /me/adaccounts if business path failed
      if (businessId) {
        try {
          const fallback = await this.axiosInstance.get("/me/adaccounts", {
            params: {
              access_token: accessToken,
              fields: "id,name,account_id,account_status,currency,timezone_name",
              limit: 100,
            },
          });
          return fallback.data.data || [];
        } catch (fbErr) {
          console.warn("[MetaService] Failed fetching ad accounts fallback:", (fbErr as Error).message);
          return [];
        }
      }
      console.warn("[MetaService] Failed fetching ad accounts:", (error as Error).message);
      return [];
    }
  }

  /**
   * Fetch WhatsApp Business Accounts (WABA) for a Business Manager
   */
  async fetchWhatsAppAccounts(businessId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/${businessId}/owned_whatsapp_business_accounts`, {
        params: {
          access_token: accessToken,
          fields: "id,name,currency,timezone_id",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.warn(`[MetaService] Failed fetching WABA for business ${businessId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Fetch WhatsApp phone numbers for a WABA
   */
  async fetchWhatsAppPhoneNumbers(wabaId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/${wabaId}/phone_numbers`, {
        params: {
          access_token: accessToken,
          fields: "id,display_phone_number,verified_name,quality_rating,code_verification_status",
          limit: 50,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.warn(`[MetaService] Failed fetching phone numbers for WABA ${wabaId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Fetch Campaigns for an Ad Account
   */
  async fetchCampaigns(adAccountId: string, accessToken: string): Promise<any[]> {
    try {
      const normalizedAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const response = await this.axiosInstance.get(`/${normalizedAccountId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: "id,name,objective,status,buying_type,daily_budget,lifetime_budget,start_time,stop_time,insights{spend,actions,cost_per_action_type}",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleMetaError(error, `Failed to fetch campaigns for ad account ${adAccountId}`);
    }
  }

  /**
   * Create Campaign in Ad Account
   */
  async createCampaign(
    adAccountId: string,
    accessToken: string,
    campaignData: {
      name: string;
      objective: string;
      status?: string;
      special_ad_categories?: string[];
      daily_budget?: number;
      lifetime_budget?: number;
    }
  ): Promise<any> {
    try {
      const normalizedAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const payload: any = {
        name: campaignData.name,
        objective: campaignData.objective || "OUTCOME_LEADS",
        status: campaignData.status || "PAUSED",
        special_ad_categories: campaignData.special_ad_categories || ["NONE"],
      };

      if (campaignData.daily_budget) {
        payload.daily_budget = Math.round(campaignData.daily_budget * 100); // Meta uses cents
      } else if (campaignData.lifetime_budget) {
        payload.lifetime_budget = Math.round(campaignData.lifetime_budget * 100);
      }

      const response = await this.axiosInstance.post(`/${normalizedAccountId}/campaigns`, payload, {
        params: { access_token: accessToken },
      });
      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, `Failed to create campaign in ad account ${adAccountId}`);
    }
  }

  /**
   * Update Campaign status or properties in Meta
   */
  async updateCampaign(campaignId: string, accessToken: string, updateData: Record<string, any>): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/${campaignId}`, updateData, {
        params: { access_token: accessToken },
      });
      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, `Failed to update campaign ${campaignId}`);
    }
  }

  /**
   * Fetch Ad Sets for an Ad Account or Campaign
   */
  async fetchAdSets(parentId: string, accessToken: string): Promise<any[]> {
    try {
      const normalizedId = parentId.startsWith("act_") || !isNaN(Number(parentId)) ? parentId : `act_${parentId}`;
      const response = await this.axiosInstance.get(`/${normalizedId}/adsets`, {
        params: {
          access_token: accessToken,
          fields: "id,name,status,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event,start_time,end_time,campaign_id",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleMetaError(error, `Failed to fetch ad sets for ${parentId}`);
    }
  }

  /**
   * Create Ad Set in Ad Account
   */
  async createAdSet(
    adAccountId: string,
    accessToken: string,
    adSetData: {
      name: string;
      campaign_id: string;
      daily_budget?: number;
      lifetime_budget?: number;
      billing_event?: string;
      optimization_goal?: string;
      targeting?: any;
      status?: string;
    }
  ): Promise<any> {
    try {
      const normalizedAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const payload: any = {
        name: adSetData.name,
        campaign_id: adSetData.campaign_id,
        status: adSetData.status || "PAUSED",
        billing_event: adSetData.billing_event || "IMPRESSIONS",
        optimization_goal: adSetData.optimization_goal || "LEAD_GENERATION",
        targeting: adSetData.targeting || { geo_locations: { countries: ["US"] } },
      };

      if (adSetData.daily_budget) {
        payload.daily_budget = Math.round(adSetData.daily_budget * 100);
      } else if (adSetData.lifetime_budget) {
        payload.lifetime_budget = Math.round(adSetData.lifetime_budget * 100);
      }

      const response = await this.axiosInstance.post(`/${normalizedAccountId}/adsets`, payload, {
        params: { access_token: accessToken },
      });
      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, `Failed to create ad set in ad account ${adAccountId}`);
    }
  }

  /**
   * Fetch Ads for an Ad Set or Ad Account
   */
  async fetchAds(parentId: string, accessToken: string): Promise<any[]> {
    try {
      const normalizedId = parentId.startsWith("act_") || !isNaN(Number(parentId)) ? parentId : `act_${parentId}`;
      const response = await this.axiosInstance.get(`/${normalizedId}/ads`, {
        params: {
          access_token: accessToken,
          fields: "id,name,status,adset_id,campaign_id,creative{id,name,title,body,image_url}",
          limit: 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleMetaError(error, `Failed to fetch ads for ${parentId}`);
    }
  }

  /**
   * Fetch Insights / Analytics for an Ad Account
   */
  async fetchInsights(adAccountId: string, accessToken: string, params?: any): Promise<any[]> {
    try {
      const normalizedAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
      const response = await this.axiosInstance.get(`/${normalizedAccountId}/insights`, {
        params: {
          access_token: accessToken,
          fields: "spend,impressions,clicks,cpc,cpm,ctr,actions,cost_per_action_type",
          date_preset: params?.date_preset || "maximum",
          level: params?.level || "account",
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.warn(`[MetaService] Failed fetching insights for ${adAccountId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Fetch lead forms for a specific page
   */
  async fetchPageLeadForms(pageId: string, pageAccessToken: string): Promise<MetaLeadForm[]> {
    try {
      const response = await this.axiosInstance.get(`/${pageId}/leadgen_forms`, {
        params: {
          access_token: pageAccessToken,
          fields: "id,name,status,leadgen_export_csv_url",
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (error) {
      throw this.handleMetaError(error, "Failed to fetch lead forms for page");
    }
  }

  /**
   * Fetch leads submitted for a specific lead form (with automatic cursor pagination)
   */
  async fetchFormLeads(
    formId: string,
    pageAccessToken: string,
    options?: {
      since?: string | number | Date;
      until?: string | number | Date;
      limit?: number;
      fields?: string;
      maxPages?: number;
    }
  ): Promise<MetaLeadData[]> {
    try {
      const allLeads: MetaLeadData[] = [];
      const maxPages = options?.maxPages || 10; // Safety boundary: up to 1,000 leads per execution

      const params: Record<string, any> = {
        access_token: pageAccessToken,
        fields:
          options?.fields ||
          "id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,adset_id,adset_name,form_id,is_organic,platform",
        limit: options?.limit || 100,
      };

      if (options?.since) {
        params.since =
          options.since instanceof Date
            ? Math.floor(options.since.getTime() / 1000)
            : typeof options.since === "string" && isNaN(Number(options.since))
            ? Math.floor(new Date(options.since).getTime() / 1000)
            : Math.floor(Number(options.since));
      }

      if (options?.until) {
        params.until =
          options.until instanceof Date
            ? Math.floor(options.until.getTime() / 1000)
            : typeof options.until === "string" && isNaN(Number(options.until))
            ? Math.floor(new Date(options.until).getTime() / 1000)
            : Math.floor(Number(options.until));
      }

      let response = await this.axiosInstance.get(`/${formId}/leads`, { params });
      if (response.data?.data && Array.isArray(response.data.data)) {
        allLeads.push(...response.data.data);
      }

      let nextUrl: string | null = response.data?.paging?.next || null;
      let afterCursor: string | null = response.data?.paging?.cursors?.after || null;
      let pageCount = 1;

      // Follow Meta cursor pagination
      while (pageCount < maxPages && (nextUrl || afterCursor)) {
        try {
          let nextRes: any;
          if (nextUrl) {
            nextRes = await axios.get(nextUrl, { timeout: 15000 });
          } else if (afterCursor) {
            nextRes = await this.axiosInstance.get(`/${formId}/leads`, {
              params: { ...params, after: afterCursor },
            });
          } else {
            break;
          }

          if (nextRes?.data?.data && Array.isArray(nextRes.data.data) && nextRes.data.data.length > 0) {
            allLeads.push(...nextRes.data.data);
            nextUrl = nextRes.data?.paging?.next || null;
            afterCursor = nextRes.data?.paging?.cursors?.after || null;
            pageCount++;
          } else {
            break;
          }
        } catch (pageErr) {
          console.warn(`[MetaService] Pagination fetch notice on form ${formId}:`, (pageErr as Error).message);
          break;
        }
      }

      return allLeads;
    } catch (error) {
      throw this.handleMetaError(error, `Failed to fetch leads for form ${formId}`);
    }
  }

  /**
   * Fetch complete lead data using lead ID
   */
  async fetchLeadDetails(leadId: string, pageAccessToken: string): Promise<MetaLeadData> {
    try {
      const response = await this.axiosInstance.get(`/${leadId}`, {
        params: {
          access_token: pageAccessToken,
          fields: "field_data,created_time,ad_id,ad_name,campaign_id,campaign_name,adset_id,adset_name,form_id,platform",
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to fetch lead details from Meta");
    }
  }

  /**
   * Subscribe page to leadgen webhook
   */
  async subscribeToLeadgenWebhook(
    pageId: string,
    pageAccessToken: string,
    webhookUrl: string,
    verifyToken: string
  ): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(
        `/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ["leadgen"],
          callback_url: webhookUrl,
          verify_token: verifyToken,
        },
        {
          params: {
            access_token: pageAccessToken,
          },
        }
      );

      return response.data.success === true;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to subscribe to leadgen webhook");
    }
  }

  /**
   * Unsubscribe page from leadgen webhook
   */
  async unsubscribeFromLeadgenWebhook(pageId: string, pageAccessToken: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete(`/${pageId}/subscribed_apps`, {
        params: {
          access_token: pageAccessToken,
        },
      });

      return response.data.success === true;
    } catch (error) {
      console.warn("[MetaService] Webhook unsubscription warning:", (error as Error).message);
      return false;
    }
  }

  /**
   * Refresh access token using long-lived token
   */
  async refreshAccessToken(longLivedToken: string): Promise<MetaTokenResponse | null> {
    try {
      const response = await this.axiosInstance.get("/oauth/access_token", {
        params: {
          grant_type: "fb_exchange_token",
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: longLivedToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error("[MetaService] Error refreshing access token:", (error as Error).message);
      return null;
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete(`/me/permissions`, {
        params: { access_token: token },
      });
      return response.data.success === true;
    } catch (error) {
      console.error("[MetaService] Error revoking token:", (error as Error).message);
      return false;
    }
  }

  /**
   * Get page access token from user access token
   */
  async getPageAccessToken(pageId: string, userAccessToken: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/${pageId}`, {
        params: {
          fields: "access_token",
          access_token: userAccessToken,
        },
      });

      return response.data.access_token;
    } catch (error) {
      throw this.handleMetaError(error, "Failed to get page access token");
    }
  }

  /**
   * Validate Meta Webhook signature (HMAC-SHA256 primary, HMAC-SHA1 fallback)
   * Uses timingSafeEqual with buffer length matching to prevent timing & length attacks
   */
  static verifyWebhookSignature(payload: string | Buffer, signatureHeader: string, appSecret: string): boolean {
    if (!signatureHeader || !appSecret || !payload) return false;
    try {
      const crypto = require("crypto");
      let algorithm = "sha256";
      let hashToCompare = signatureHeader.trim();

      if (signatureHeader.startsWith("sha256=")) {
        algorithm = "sha256";
        hashToCompare = signatureHeader.substring(7).trim();
      } else if (signatureHeader.startsWith("sha1=")) {
        algorithm = "sha1";
        hashToCompare = signatureHeader.substring(5).trim();
      }

      const hmac = crypto.createHmac(algorithm, appSecret);
      hmac.update(payload);
      const expectedHash = hmac.digest("hex");

      const actualBuf = Buffer.from(hashToCompare, "hex");
      const expectedBuf = Buffer.from(expectedHash, "hex");

      if (actualBuf.length !== expectedBuf.length || actualBuf.length === 0) {
        return false;
      }

      return crypto.timingSafeEqual(actualBuf, expectedBuf);
    } catch (err) {
      console.error("[MetaService] Signature verification exception:", (err as Error).message);
      return false;
    }
  }
}

export default MetaService;
