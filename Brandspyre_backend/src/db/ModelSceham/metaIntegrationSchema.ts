import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

// Encryption helpers
export const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (process.env.NODE_ENV === "production" && (!envKey || envKey.includes("default-32-char"))) {
    throw new Error("FATAL: ENCRYPTION_KEY must be provided and cannot be a default placeholder in production.");
  }
  return Buffer.from(envKey || "default-32-char-encryption-key-123456", "utf8").slice(0, 32);
};

export const encryptToken = (token: string): string => {
  if (!token) return "";
  const algorithm = "aes-256-gcm";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
};

export const decryptToken = (encryptedToken: string): string => {
  if (!encryptedToken) return "";
  try {
    const key = getEncryptionKey();

    // 1. Authenticated AES-256-GCM format: gcm:iv:authTag:ciphertext
    if (encryptedToken.startsWith("gcm:")) {
      const parts = encryptedToken.slice(4).split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid GCM encrypted token structure");
      }
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    // 2. Backward compatibility for legacy AES-256-CBC format: iv:ciphertext
    const parts = encryptedToken.split(":");
    if (parts.length === 2 && parts[0].length === 32) {
      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    // Unrecognized or unencrypted format: Reject to prevent plaintext leaking
    throw new Error("Unrecognized token format or unencrypted data rejected");
  } catch (error) {
    console.error("[MetaSecurity] Token decryption error:", (error as Error).message);
    return "";
  }
};

// ==========================================
// 1. Meta Integration Model (Main connection per tenant)
// ==========================================
export interface IMetaIntegration extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  connected_by_user_id?: mongoose.Types.ObjectId;
  meta_user_id?: string;
  meta_user_name?: string;
  business_manager_id?: string;
  meta_app_id?: string;
  meta_app_secret?: string;
  meta_api_version?: string;
  meta_business_account_id?: string;
  meta_page_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  webhook_verify_token?: string;
  webhook_url?: string;
  is_connected: boolean;
  connection_status: 'connected' | 'expired' | 'revoked' | 'error' | 'disconnected';
  last_sync_at?: Date;
  last_successful_sync_at?: Date;
  last_error?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

const MetaIntegrationSchema = new Schema<IMetaIntegration>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  connected_by_user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  meta_user_id: { type: String },
  meta_user_name: { type: String },
  business_manager_id: { type: String },
  meta_app_id: { type: String },
  meta_app_secret: { type: String },
  meta_api_version: { type: String, default: process.env.META_API_VERSION || 'v21.0' },
  meta_business_account_id: { type: String },
  meta_page_id: { type: String },
  access_token: { 
    type: String, 
    set: (val: string) => val ? encryptToken(val) : val,
    get: (val: string) => val ? decryptToken(val) : val
  },
  refresh_token: { 
    type: String, 
    set: (val: string) => val ? encryptToken(val) : val,
    get: (val: string) => val ? decryptToken(val) : val
  },
  token_expires_at: { type: Date },
  webhook_verify_token: { type: String },
  webhook_url: { type: String },
  is_connected: { type: Boolean, default: false },
  connection_status: { type: String, default: 'disconnected', enum: ['connected', 'expired', 'revoked', 'error', 'disconnected'] },
  last_sync_at: { type: Date },
  last_successful_sync_at: { type: Date },
  last_error: { type: String },
  error_message: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaIntegrationSchema.index({ tenant_id: 1, branchcode: 1 }, { unique: true });
MetaIntegrationSchema.index({ meta_page_id: 1 });
MetaIntegrationSchema.index({ connection_status: 1 });

// ==========================================
// 2. Meta OAuth State (Production-safe shared TTL state)
// ==========================================
export interface IMetaOAuthState extends Document {
  state: string;
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  user_id?: mongoose.Types.ObjectId;
  app_id?: string;
  app_secret?: string;
  api_version?: string;
  expires_at: Date;
  created_at: Date;
}

const MetaOAuthStateSchema = new Schema<IMetaOAuthState>({
  state: { type: String, required: true, unique: true },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'UserInfo' },
  app_id: { type: String },
  app_secret: { type: String },
  api_version: { type: String },
  expires_at: { type: Date, required: true, index: { expires: 0 } }, // Native MongoDB TTL index!
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 3. Meta Business Accounts (Business Managers)
// ==========================================
export interface IMetaBusinessAccount extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  integration_id: mongoose.Types.ObjectId;
  meta_business_id: string;
  name: string;
  verification_status?: string;
  status: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaBusinessAccountSchema = new Schema<IMetaBusinessAccount>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  meta_business_id: { type: String, required: true },
  name: { type: String, required: true },
  verification_status: { type: String },
  status: { type: String, default: 'active' },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaBusinessAccountSchema.index({ tenant_id: 1, meta_business_id: 1 }, { unique: true });
MetaBusinessAccountSchema.index({ integration_id: 1 });

// ==========================================
// 4. Meta Ad Accounts
// ==========================================
export interface IMetaAdAccount extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  integration_id: mongoose.Types.ObjectId;
  business_account_id?: string;
  meta_ad_account_id: string;
  name: string;
  currency: string;
  timezone_name?: string;
  account_status?: number;
  status: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaAdAccountSchema = new Schema<IMetaAdAccount>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  business_account_id: { type: String },
  meta_ad_account_id: { type: String, required: true },
  name: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  timezone_name: { type: String },
  account_status: { type: Number, default: 1 },
  status: { type: String, default: 'active' },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaAdAccountSchema.index({ tenant_id: 1, meta_ad_account_id: 1 }, { unique: true });
MetaAdAccountSchema.index({ integration_id: 1 });

// ==========================================
// 5. Meta Facebook Pages
// ==========================================
export interface IMetaPage extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  integration_id: mongoose.Types.ObjectId;
  business_account_id?: string;
  meta_page_id: string;
  page_name: string;
  category?: string;
  page_access_token?: string;
  status: string;
  is_webhook_subscribed: boolean;
  instagram_account_id?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaPageSchema = new Schema<IMetaPage>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  business_account_id: { type: String },
  meta_page_id: { type: String, required: true },
  page_name: { type: String, required: true },
  category: { type: String },
  page_access_token: { 
    type: String,
    set: (val: string) => val ? encryptToken(val) : val,
    get: (val: string) => val ? decryptToken(val) : val
  },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'revoked'] },
  is_webhook_subscribed: { type: Boolean, default: false },
  instagram_account_id: { type: String },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaPageSchema.index({ tenant_id: 1, meta_page_id: 1 }, { unique: true });
MetaPageSchema.index({ meta_page_id: 1 });
MetaPageSchema.index({ integration_id: 1 });

// ==========================================
// 6. Meta Instagram Professional Accounts
// ==========================================
export interface IMetaInstagramAccount extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  integration_id: mongoose.Types.ObjectId;
  meta_page_id: string;
  meta_instagram_account_id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  status: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaInstagramAccountSchema = new Schema<IMetaInstagramAccount>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  meta_page_id: { type: String, required: true },
  meta_instagram_account_id: { type: String, required: true },
  username: { type: String, required: true },
  name: { type: String },
  profile_picture_url: { type: String },
  followers_count: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaInstagramAccountSchema.index({ tenant_id: 1, meta_instagram_account_id: 1 }, { unique: true });
MetaInstagramAccountSchema.index({ meta_page_id: 1 });
MetaInstagramAccountSchema.index({ integration_id: 1 });

// ==========================================
// 7. Meta WhatsApp Business Accounts (WABA)
// ==========================================
export interface IMetaWhatsAppAccount extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  integration_id: mongoose.Types.ObjectId;
  business_account_id?: string;
  meta_waba_id: string;
  name: string;
  currency?: string;
  timezone_id?: string;
  phone_numbers: Array<{
    id: string;
    display_phone_number: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
  }>;
  status: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaWhatsAppAccountSchema = new Schema<IMetaWhatsAppAccount>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  business_account_id: { type: String },
  meta_waba_id: { type: String, required: true },
  name: { type: String, required: true },
  currency: { type: String },
  timezone_id: { type: String },
  phone_numbers: [{
    id: { type: String, required: true },
    display_phone_number: { type: String, required: true },
    verified_name: { type: String },
    quality_rating: { type: String },
    code_verification_status: { type: String }
  }],
  status: { type: String, default: 'active' },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaWhatsAppAccountSchema.index({ tenant_id: 1, meta_waba_id: 1 }, { unique: true });
MetaWhatsAppAccountSchema.index({ integration_id: 1 });

// ==========================================
// 8. Meta Campaigns
// ==========================================
export interface IMetaCampaign extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  meta_ad_account_id: string;
  meta_campaign_id: string;
  name: string;
  objective: string;
  status: string;
  buying_type?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: Date;
  stop_time?: Date;
  spend?: number;
  leads_count?: number;
  cpl?: number;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaCampaignSchema = new Schema<IMetaCampaign>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  meta_ad_account_id: { type: String, required: true },
  meta_campaign_id: { type: String, required: true },
  name: { type: String, required: true },
  objective: { type: String, default: 'OUTCOME_LEADS' },
  status: { type: String, default: 'PAUSED', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'] },
  buying_type: { type: String, default: 'AUCTION' },
  daily_budget: { type: Number },
  lifetime_budget: { type: Number },
  start_time: { type: Date },
  stop_time: { type: Date },
  spend: { type: Number, default: 0 },
  leads_count: { type: Number, default: 0 },
  cpl: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaCampaignSchema.index({ tenant_id: 1, meta_campaign_id: 1 }, { unique: true });
MetaCampaignSchema.index({ meta_ad_account_id: 1 });
MetaCampaignSchema.index({ status: 1 });

// ==========================================
// 9. Meta Ad Sets
// ==========================================
export interface IMetaAdSet extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  meta_ad_account_id: string;
  meta_campaign_id: string;
  meta_ad_set_id: string;
  name: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: any;
  optimization_goal?: string;
  billing_event?: string;
  start_time?: Date;
  end_time?: Date;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaAdSetSchema = new Schema<IMetaAdSet>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  meta_ad_account_id: { type: String, required: true },
  meta_campaign_id: { type: String, required: true },
  meta_ad_set_id: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'PAUSED' },
  daily_budget: { type: Number },
  lifetime_budget: { type: Number },
  targeting: { type: Schema.Types.Mixed },
  optimization_goal: { type: String, default: 'LEAD_GENERATION' },
  billing_event: { type: String, default: 'IMPRESSIONS' },
  start_time: { type: Date },
  end_time: { type: Date },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaAdSetSchema.index({ tenant_id: 1, meta_ad_set_id: 1 }, { unique: true });
MetaAdSetSchema.index({ meta_campaign_id: 1 });

// ==========================================
// 10. Meta Ads
// ==========================================
export interface IMetaAd extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  meta_ad_account_id: string;
  meta_campaign_id: string;
  meta_ad_set_id: string;
  meta_ad_id: string;
  name: string;
  status: string;
  creative_id?: string;
  creative?: any;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

const MetaAdSchema = new Schema<IMetaAd>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  meta_ad_account_id: { type: String, required: true },
  meta_campaign_id: { type: String, required: true },
  meta_ad_set_id: { type: String, required: true },
  meta_ad_id: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'PAUSED' },
  creative_id: { type: String },
  creative: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaAdSchema.index({ tenant_id: 1, meta_ad_id: 1 }, { unique: true });
MetaAdSchema.index({ meta_ad_set_id: 1 });

// ==========================================
// 11. Meta Lead Form Configuration (Existing & Extended)
// ==========================================
export interface IMetaLeadForm extends Document {
  meta_integration_id: mongoose.Types.ObjectId;
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  meta_form_id: string;
  meta_form_name: string;
  meta_page_id: string;
  meta_page_name?: string;
  is_enabled: boolean;
  default_assignee_id?: string;
  default_campaign_code?: string;
  default_lead_status?: string;
  lead_mapping: Record<string, string>;
  last_lead_received_at?: Date;
  last_sync_at?: Date;
  total_leads_received: number;
  created_at: Date;
  updated_at: Date;
}

const MetaLeadFormSchema = new Schema<IMetaLeadForm>({
  meta_integration_id: { type: Schema.Types.ObjectId, required: true, ref: 'MetaIntegration' },
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  meta_form_id: { type: String, required: true },
  meta_form_name: { type: String, required: true },
  meta_page_id: { type: String, required: true },
  meta_page_name: { type: String },
  is_enabled: { type: Boolean, default: false },
  default_assignee_id: { type: String },
  default_campaign_code: { type: String },
  default_lead_status: { type: String, default: 'New Lead' },
  lead_mapping: { type: Schema.Types.Mixed, default: {} },
  last_lead_received_at: { type: Date },
  last_sync_at: { type: Date },
  total_leads_received: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

MetaLeadFormSchema.index({ tenant_id: 1, meta_form_id: 1 }, { unique: true });
MetaLeadFormSchema.index({ meta_integration_id: 1 });
MetaLeadFormSchema.index({ meta_page_id: 1 });

// ==========================================
// 12. Meta Lead Sync Log (Existing & Extended)
// ==========================================
export interface IMetaLeadSyncLog extends Document {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  meta_form_id: string;
  meta_lead_id: string;
  crm_lead_id?: mongoose.Types.ObjectId;
  sync_status: 'success' | 'failed' | 'duplicate' | 'processing';
  error_message?: string;
  sync_timestamp: Date;
  meta_lead_data: any;
  created_at: Date;
}

const MetaLeadSyncLogSchema = new Schema<IMetaLeadSyncLog>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
  branchcode: { type: String, required: true },
  meta_form_id: { type: String, required: true },
  meta_lead_id: { type: String, required: true },
  crm_lead_id: { type: Schema.Types.ObjectId, ref: 'Lead' },
  sync_status: { type: String, required: true, enum: ['success', 'failed', 'duplicate', 'processing'] },
  error_message: { type: String },
  sync_timestamp: { type: Date, required: true },
  meta_lead_data: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

MetaLeadSyncLogSchema.index({ tenant_id: 1, meta_lead_id: 1 }, { unique: true });
MetaLeadSyncLogSchema.index({ meta_form_id: 1 });
MetaLeadSyncLogSchema.index({ sync_timestamp: -1 });

// Export models
export const MetaIntegration = mongoose.models.MetaIntegration || mongoose.model<IMetaIntegration>('MetaIntegration', MetaIntegrationSchema);
export const MetaOAuthState = mongoose.models.MetaOAuthState || mongoose.model<IMetaOAuthState>('MetaOAuthState', MetaOAuthStateSchema);
export const MetaBusinessAccount = mongoose.models.MetaBusinessAccount || mongoose.model<IMetaBusinessAccount>('MetaBusinessAccount', MetaBusinessAccountSchema);
export const MetaAdAccount = mongoose.models.MetaAdAccount || mongoose.model<IMetaAdAccount>('MetaAdAccount', MetaAdAccountSchema);
export const MetaPage = mongoose.models.MetaPage || mongoose.model<IMetaPage>('MetaPage', MetaPageSchema);
export const MetaInstagramAccount = mongoose.models.MetaInstagramAccount || mongoose.model<IMetaInstagramAccount>('MetaInstagramAccount', MetaInstagramAccountSchema);
export const MetaWhatsAppAccount = mongoose.models.MetaWhatsAppAccount || mongoose.model<IMetaWhatsAppAccount>('MetaWhatsAppAccount', MetaWhatsAppAccountSchema);
export const MetaCampaign = mongoose.models.MetaCampaign || mongoose.model<IMetaCampaign>('MetaCampaign', MetaCampaignSchema);
export const MetaAdSet = mongoose.models.MetaAdSet || mongoose.model<IMetaAdSet>('MetaAdSet', MetaAdSetSchema);
export const MetaAd = mongoose.models.MetaAd || mongoose.model<IMetaAd>('MetaAd', MetaAdSchema);
export const MetaLeadForm = mongoose.models.MetaLeadForm || mongoose.model<IMetaLeadForm>('MetaLeadForm', MetaLeadFormSchema);
export const MetaLeadSyncLog = mongoose.models.MetaLeadSyncLog || mongoose.model<IMetaLeadSyncLog>('MetaLeadSyncLog', MetaLeadSyncLogSchema);

// Initialize function
export const initializeMetaIntegrationSchema = async () => {
  try {
    await MetaIntegration.createIndexes();
    await MetaOAuthState.createIndexes();
    await MetaBusinessAccount.createIndexes();
    await MetaAdAccount.createIndexes();
    await MetaPage.createIndexes();
    await MetaInstagramAccount.createIndexes();
    await MetaWhatsAppAccount.createIndexes();
    await MetaCampaign.createIndexes();
    await MetaAdSet.createIndexes();
    await MetaAd.createIndexes();
    await MetaLeadForm.createIndexes();
    await MetaLeadSyncLog.createIndexes();
    console.log("Meta Integration models & schemas initialized successfully with full index guarantees.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing Meta Integration schema: ${message}`);
  }
};
