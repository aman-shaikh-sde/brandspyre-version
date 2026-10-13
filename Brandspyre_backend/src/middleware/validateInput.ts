import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import mongoose from "mongoose";

// Sanitize query/params against MongoDB operator injection
const hasMongoOperator = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) return true;
    if (typeof obj[key] === 'object' && hasMongoOperator(obj[key])) return true;
  }
  return false;
};

export interface ValidationSchemas {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

/**
 * Reusable Zod Validation Middleware
 */
export const validateInput = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check for NoSQL Injection operators in query/params/body
      if (hasMongoOperator(req.query) || hasMongoOperator(req.params) || hasMongoOperator(req.body)) {
        res.status(400).json({
          success: false,
          error: "Invalid input: MongoDB query operators are not permitted in request data."
        });
        return;
      }

      if (schemas.body && req.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query && req.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params && req.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: "Invalid input data format"
      });
    }
  };
};

// Common Zod Types for reuse
export const commonSchemas = {
  objectId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid ObjectId format" }),
  nonNegativeAmount: z.number().min(0, { message: "Monetary amount cannot be negative" }),
  positiveAmount: z.number().gt(0, { message: "Monetary amount must be greater than 0" }),
  email: z.string().email({ message: "Invalid email address format" }),
  pagination: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 25)
  }).optional()
};
