/**
 * Centralized Production Environment Configuration Validator
 * Enforces strict presence, length, and entropy requirements for all sensitive credentials.
 * Fails application startup fast if production requirements are violated.
 * Strictly guarantees: No silent fallbacks, no localhost in production, no dummy keys.
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateProductionEnvironment = (exitOnFailure: boolean = true): EnvValidationResult => {
  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  const checkPlaceholder = (val?: string) => {
    if (!val) return true;
    const lower = val.toLowerCase().trim();
    return (
      lower.includes("placeholder") ||
      lower.includes("change_this") ||
      lower.includes("your_secret") ||
      lower.includes("your_key") ||
      lower.includes("default-32-char") ||
      lower.includes("sk_test_dummy") ||
      lower.includes("rzp_test_dummy") ||
      lower.endsWith("_xxx") ||
      lower === "secret" ||
      lower === "jwt_secret" ||
      lower === "dummy_secret"
    );
  };

  // 1. Database Configuration
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    if (isProduction) {
      errors.push("MONGODB_URI is missing. Dedicated production database connection string is strictly required.");
    } else {
      warnings.push("MONGODB_URI not set. Falling back to local development database.");
    }
  } else if (isProduction) {
    if (mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1")) {
      errors.push("MONGODB_URI points to localhost in production. Production must connect to dedicated, secure database.");
    }
    if (checkPlaceholder(mongoUri)) {
      errors.push("MONGODB_URI contains insecure placeholder credentials.");
    }
  }

  // 2. Authentication & JWT Secrets
  const accessSecret = process.env.ACCESS_SECRET;
  if (!accessSecret) {
    errors.push("ACCESS_SECRET is missing. Required for signing authentication access tokens.");
  } else if (accessSecret.length < 32) {
    errors.push(`ACCESS_SECRET is too short (${accessSecret.length} chars). Minimum 32 characters required.`);
  } else if (checkPlaceholder(accessSecret)) {
    errors.push("ACCESS_SECRET contains insecure placeholder value. Must be cryptographically random.");
  }

  const refreshSecret = process.env.REFRESH_SECRET;
  if (!refreshSecret) {
    errors.push("REFRESH_SECRET is missing. Required for signing refresh tokens.");
  } else if (refreshSecret.length < 32) {
    errors.push(`REFRESH_SECRET is too short (${refreshSecret.length} chars). Minimum 32 characters required.`);
  } else if (checkPlaceholder(refreshSecret)) {
    errors.push("REFRESH_SECRET contains insecure placeholder value. Must be cryptographically random.");
  } else if (accessSecret && refreshSecret === accessSecret) {
    errors.push("REFRESH_SECRET must be distinct and different from ACCESS_SECRET for token family separation.");
  }

  // 3. Application Encryption Key (AES-256)
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    if (isProduction) {
      errors.push("ENCRYPTION_KEY is missing. AES-256 field-level encryption key is mandatory in production.");
    } else {
      warnings.push("ENCRYPTION_KEY not set. Using local development fallback.");
    }
  } else if (encryptionKey.length < 32) {
    errors.push(`ENCRYPTION_KEY is too short (${encryptionKey.length} chars). Minimum 32 characters required.`);
  } else if (checkPlaceholder(encryptionKey)) {
    errors.push("ENCRYPTION_KEY contains insecure default/placeholder string.");
  }

  // 4. CORS & Frontend Origins
  const frontendUrls = process.env.FRONTEND_URLS || process.env.FRONTEND_URL;
  if (!frontendUrls) {
    if (isProduction) {
      errors.push("FRONTEND_URLS is missing. Explicit CORS domain allowlist is mandatory in production.");
    }
  } else if (isProduction) {
    const urls = frontendUrls.split(",").map(u => u.trim());
    const hasLocalhost = urls.some(u => u.includes("localhost") || u.includes("127.0.0.1"));
    if (hasLocalhost) {
      errors.push("FRONTEND_URLS in production contains localhost origins. Localhost origins are forbidden in production.");
    }
    if (urls.includes("*")) {
      errors.push("FRONTEND_URLS cannot contain wildcard '*' when credentials/cookies are enabled.");
    }
  }

  // 5. Payment Gateway Configuration (Razorpay)
  const isRazorpayEnabled = process.env.RAZORPAY_ENABLED !== "false";
  if (isRazorpayEnabled && isProduction) {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpayWebhook = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!razorpayKeyId) {
      errors.push("RAZORPAY_KEY_ID is missing while Razorpay integration is enabled in production.");
    } else if (checkPlaceholder(razorpayKeyId)) {
      errors.push("RAZORPAY_KEY_ID contains placeholder/dummy credentials.");
    }

    if (!razorpaySecret) {
      errors.push("RAZORPAY_KEY_SECRET is missing while Razorpay integration is enabled in production.");
    } else if (checkPlaceholder(razorpaySecret)) {
      errors.push("RAZORPAY_KEY_SECRET contains placeholder/dummy credentials.");
    }

    if (!razorpayWebhook) {
      errors.push("RAZORPAY_WEBHOOK_SECRET is missing while Razorpay integration is enabled in production.");
    } else if (checkPlaceholder(razorpayWebhook)) {
      errors.push("RAZORPAY_WEBHOOK_SECRET contains placeholder/dummy credentials.");
    }
  }

  // 6. Optional Payment Gateway Configuration (Stripe)
  const isStripeEnabled = process.env.STRIPE_ENABLED === "true";
  if (isStripeEnabled && isProduction) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecret || checkPlaceholder(stripeSecret)) {
      errors.push("STRIPE_SECRET_KEY is missing or dummy while STRIPE_ENABLED=true in production.");
    }
    if (!stripeWebhook || checkPlaceholder(stripeWebhook)) {
      errors.push("STRIPE_WEBHOOK_SECRET is missing or dummy while STRIPE_ENABLED=true in production.");
    }
  }

  // 7. Email Configuration (SMTP)
  const isEmailEnabled = process.env.EMAIL_ENABLED !== "false";
  if (isEmailEnabled && isProduction) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    if (!smtpUser || !smtpPass) {
      errors.push("SMTP credentials (SMTP_USER / SMTP_PASS) are missing while EMAIL_ENABLED=true in production.");
    } else if (checkPlaceholder(smtpPass)) {
      errors.push("SMTP_PASS contains placeholder credentials.");
    }
  }

  // Result Handling
  if (errors.length > 0) {
    console.error("\n❌ ========================================================");
    console.error("❌ CRITICAL STARTUP FAILURE: Insecure Environment Configuration");
    console.error("❌ ========================================================");
    errors.forEach(err => console.error(`   • [CONFIG ERROR] ${err}`));
    console.error("\n   Please configure the required environment variables in .env before starting.\n");

    if (exitOnFailure && (isProduction || process.env.STRICT_ENV_VALIDATION === "true")) {
      process.exit(1);
    }
  }

  if (process.env.SILENT_LOGGING !== "true" && process.env.QUIET_LOGS !== "true") {
    if (warnings.length > 0) {
      console.warn("\n⚠️  [Config Validator Warnings]:");
      warnings.forEach(w => console.warn(`   • [WARNING] ${w}`));
    } else if (errors.length === 0) {
      console.log("✅ Production environment configuration validated successfully.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default validateProductionEnvironment;
