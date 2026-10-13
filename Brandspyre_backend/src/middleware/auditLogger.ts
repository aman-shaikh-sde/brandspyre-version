import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../db/ModelSceham/saasSchema';
import mongoose from 'mongoose';

export interface AuditOptions {
  module: string;
  action: string;
}

export const auditLogger = (options: AuditOptions) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    // Execute request first
    next();

    // Record audit log asynchronously after response finishes
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const tenantId = req.tenant?.id || req.user?.tenantId;
          const userId = req.user?.userId;

          if (tenantId && userId) {
            await AuditLog.create({
              tenant_id: new mongoose.Types.ObjectId(tenantId as string),
              user_id: new mongoose.Types.ObjectId(userId as string),
              action: options.action,
              entity: options.module,
              details: {
                method: req.method,
                url: req.originalUrl,
                query: req.query,
                body: req.body,
                status: res.statusCode
              },
              ip_address: req.ip || req.headers['x-forwarded-for'] || '',
              created_at: new Date()
            });
          }
        } catch (err) {
          console.error('Audit logger recording error:', err);
        }
      }
    });
  };
};

export default auditLogger;
