import { Response, Request } from "express";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standardized, production-sanitized error responder.
 * Never leaks database connection strings, stack traces, or internal server errors to clients.
 */
export const sendErrorResponse = (
  res: Response,
  error: unknown,
  fallbackStatusCode: number = 500,
  userMessage?: string
): void => {
  const isProd = process.env.NODE_ENV === "production";
  const req = (res as any).req as Request | undefined;
  const requestId = (req as any)?.id || "N/A";

  let statusCode = fallbackStatusCode;
  let rawMessage = "Internal Server Error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    rawMessage = error.message;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "string") {
    rawMessage = error;
  }

  // Structured server log for observability
  console.error(`[API Error] [ReqID: ${requestId}] [Status: ${statusCode}]:`, error);

  // In production, sanitize 500 errors so sensitive DB errors, filepaths, or stack traces aren't returned
  if (isProd && statusCode >= 500) {
    res.status(statusCode).json({
      success: false,
      error: userMessage || "An unexpected error occurred. Please contact support if the issue persists.",
      requestId
    });
    return;
  }

  // In development or for operational 4xx errors, return appropriate message
  res.status(statusCode).json({
    success: false,
    error: userMessage || rawMessage,
    requestId,
    ...(isProd ? {} : { details: error instanceof Error ? error.stack : error })
  });
};

export default {
  AppError,
  sendErrorResponse
};
