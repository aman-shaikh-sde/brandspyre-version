import rateLimit from "express-rate-limit";

const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV;

// Skip rate limiting for verified webhooks
const skipWebhooks = (req: any) => {
  const path = req.originalUrl || req.url || '';
  return path.includes('/razorpay/webhook') || path.includes('/meta/webhook');
};

// 1. Normal API Limiter: 10000 requests per 15 minutes (configurable via RATE_LIMIT_MAX)
export const normalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "10000", 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => isDevelopment || skipWebhooks(req),
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes."
  }
});

// 2. Login Limiter: 30 attempts per 15 minutes per IP (relaxed in development)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 200 : parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "30", 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => isDevelopment,
  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again after 15 minutes."
  }
});

// 3. Password Reset Limiter: 20 requests per 15 minutes per IP (configurable)
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || "20", 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => isDevelopment,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again after 15 minutes."
  }
});

// 4. OTP Limiter: 5 requests per 15 minutes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes."
  }
});

// 4a. MFA Send Limiter: 3 requests per 15 minutes (strict per-user/IP)
export const mfaSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 50 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "mfa_rate_limit_exceeded",
    message: "Too many verification code requests. Please wait 15 minutes before trying again."
  }
});

// 4b. MFA Verify Limiter: 10 attempts per 15 minutes (brute-force defense)
export const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "mfa_too_many_attempts",
    message: "Too many verification attempts. Please wait 15 minutes."
  }
});

// 4c. MFA Configuration Limiter (enable/disable): 5 requests per 15 minutes
export const mfaConfigLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "mfa_config_rate_limited",
    message: "Too many security configuration requests. Please try again later."
  }
});

// 5. File Upload Limiter: 20 uploads per 15 minutes
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many file upload requests. Please try again after 15 minutes."
  }
});

// 6. Platform Deployment Limiter: 5 deployment triggers per 15 minutes
export const deploymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many deployment triggers. Please wait 15 minutes before triggering another deployment."
  }
});

// 7. Registration Limiter: 10 registrations per 1 hour per IP
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after 1 hour."
  }
});

// 8. Refresh Token Limiter: 300 refresh requests per 15 minutes (unrestricted in development)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 50000 : parseInt(process.env.REFRESH_RATE_LIMIT_MAX || "300", 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => isDevelopment || skipWebhooks(req),
  message: {
    success: false,
    message: "Too many token refresh requests. Please try again later."
  }
});

// 9. AI Query Limiter: 30 requests per minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI rate limit reached. Please wait a moment before sending more requests."
  }
});
