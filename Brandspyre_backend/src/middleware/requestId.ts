import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface RequestWithId extends Request {
  id?: string;
}

/**
 * X-Request-ID Correlation Middleware
 * Attaches a unique request ID to incoming requests for log correlation and tracing.
 */
export const requestIdMiddleware = (req: any, res: Response, next: NextFunction): void => {
  const headerId = req.headers['x-request-id'] as string | undefined;
  const requestId = (headerId && headerId.length < 100 && /^[a-zA-Z0-9_-]+$/.test(headerId))
    ? headerId
    : uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

export default requestIdMiddleware;
