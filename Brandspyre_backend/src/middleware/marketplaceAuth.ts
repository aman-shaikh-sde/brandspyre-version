import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getAccessTokenSecret } from './token';
import { MarketplaceAuthRequest } from '../controllers/marketplace/marketplaceAuthController';

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookie = (req as any).cookies?.buyerToken || (req as any).cookies?.accessToken;
  if (cookie) return cookie;
  return null;
};

export const requireBuyerAuth = async (
  req: MarketplaceAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is required to access this resource.'
    });
    return;
  }

  try {
    const secret = getAccessTokenSecret();
    const decoded: any = jwt.verify(token, secret);

    req.buyer = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      name: decoded.name || 'Buyer',
      isOrgUser: decoded.isOrgUser || false,
      orgId: decoded.orgId || decoded.tenantId,
      companyName: decoded.companyName
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'InvalidToken',
      message: 'Session has expired or token is invalid. Please sign in again.'
    });
  }
};

export const optionalBuyerAuth = async (
  req: MarketplaceAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const secret = getAccessTokenSecret();
    const decoded: any = jwt.verify(token, secret);

    req.buyer = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      name: decoded.name || 'Buyer',
      isOrgUser: decoded.isOrgUser || false,
      orgId: decoded.orgId || decoded.tenantId,
      companyName: decoded.companyName
    };
  } catch (err) {
    // Optional auth silently continues
  }

  next();
};

export default { requireBuyerAuth, optionalBuyerAuth };
