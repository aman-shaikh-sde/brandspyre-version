import Razorpay from "razorpay";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isTestMode: boolean;
  isLiveMode: boolean;
  isConfigured: boolean;
}

let cachedClient: Razorpay | null = null;
let lastKeyId = "";
let lastKeySecret = "";

/**
 * Validates and retrieves current Razorpay configuration.
 * Disallows dummy or hardcoded placeholder credentials.
 */
export const getRazorpayConfig = (): RazorpayConfig => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

  const isDummyKey =
    keyId.toLowerCase().includes("dummy") ||
    keyId.toLowerCase().includes("your_key") ||
    keyId.toLowerCase().endsWith("_xxx") ||
    keyId === "rzp_test_xxx" ||
    keyId === "rzp_live_xxx";
  const isDummySecret =
    keySecret.toLowerCase().includes("dummy") ||
    keySecret.toLowerCase().includes("your_secret") ||
    keySecret.toLowerCase().endsWith("_xxx");

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !isDummyKey &&
    !isDummySecret
  );

  const isTestMode = keyId.startsWith("rzp_test_");
  const isLiveMode = keyId.startsWith("rzp_live_");

  return {
    keyId,
    keySecret,
    webhookSecret,
    isTestMode,
    isLiveMode,
    isConfigured
  };
};

/**
 * Ensures Razorpay is properly configured before attempting gateway operations.
 * Throws a safe, informative error if credentials are missing or invalid.
 */
export const assertRazorpayConfigured = (): { keyId: string; keySecret: string } => {
  const config = getRazorpayConfig();

  if (!config.isConfigured) {
    const errorMsg = !config.keyId || !config.keySecret
      ? "Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing from server environment."
      : "Razorpay credentials contain placeholder or dummy values. A valid Razorpay Key ID and Secret must be configured.";
    
    console.error(`[Razorpay Security Alert] 🚨 ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return { keyId: config.keyId, keySecret: config.keySecret };
};

/**
 * Returns an authenticated Razorpay SDK instance.
 * Automatically recreates the instance if environment keys rotate during runtime.
 */
export const getRazorpayClient = (): Razorpay => {
  const { keyId, keySecret } = assertRazorpayConfigured();

  if (!cachedClient || keyId !== lastKeyId || keySecret !== lastKeySecret) {
    cachedClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    lastKeyId = keyId;
    lastKeySecret = keySecret;
  }

  return cachedClient;
};

export default {
  getRazorpayConfig,
  assertRazorpayConfigured,
  getRazorpayClient
};
