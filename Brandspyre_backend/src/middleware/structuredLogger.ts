import { Request, Response, NextFunction } from "express";

const SENSITIVE_KEYS = [
  'password', 'pass', 'rawPassword', 'token', 'accessToken', 'refreshToken',
  'secret', 'jwt', 'access_token', 'refresh_token', 'key_secret',
  'webhookSecret', 'meta_app_secret', 'razorpay_secret', 'credit_card', 'cvv'
];

/**
 * Recursively masks sensitive keys in objects before logging
 */
export const maskSensitiveData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const masked: any = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      masked[key] = maskSensitiveData(obj[key]);
    } else {
      masked[key] = obj[key];
    }
  }
  return masked;
};

/**
 * Structured JSON Logger Middleware
 * Terminal request logging disabled by default to keep terminal clean.
 * Set ENABLE_REQUEST_LOGGING=true in .env to enable request logs.
 */
export const structuredLogger = (req: any, res: Response, next: NextFunction): void => {
  const isEnabled = process.env.ENABLE_REQUEST_LOGGING === 'true' || process.env.DEBUG === 'true';

  if (!isEnabled) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      requestId: req.id || 'N/A',
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      tenantId: req.tenant?.id || req.user?.tenantId || 'N/A',
      userId: req.user?.userId || 'N/A',
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ ...logData, body: maskSensitiveData(req.body) }));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(logData));
    } else {
      console.log(JSON.stringify(logData));
    }
  });

  next();
};

export default structuredLogger;
