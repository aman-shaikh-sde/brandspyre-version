import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformPaymentConfig extends Document {
  fee_type: 'PERCENTAGE' | 'FIXED' | 'PERCENTAGE_PLUS_FIXED';
  fee_percentage: number; // e.g. 10.0 for 10%
  fixed_fee: number; // e.g. 0
  tax_percentage: number; // e.g. 18 for 18% GST
  minimum_fee: number;
  maximum_fee: number;
  is_active: boolean;
  payout_hold_period_days: number;
  razorpay_enabled: boolean;
  stripe_enabled: boolean;
  default_marketplace_provider: 'razorpay' | 'stripe';
  updated_by?: string;
  updated_at: Date;
}

const PlatformPaymentConfigSchema = new Schema<IPlatformPaymentConfig>({
  fee_type: { 
    type: String, 
    default: 'PERCENTAGE', 
    enum: ['PERCENTAGE', 'FIXED', 'PERCENTAGE_PLUS_FIXED'] 
  },
  fee_percentage: { type: Number, default: 10.0 },
  fixed_fee: { type: Number, default: 0 },
  tax_percentage: { type: Number, default: 18 },
  minimum_fee: { type: Number, default: 0 },
  maximum_fee: { type: Number, default: 10000 },
  is_active: { type: Boolean, default: true },
  payout_hold_period_days: { type: Number, default: 0 },
  razorpay_enabled: { type: Boolean, default: true },
  stripe_enabled: { type: Boolean, default: true },
  default_marketplace_provider: { type: String, default: 'razorpay', enum: ['razorpay', 'stripe'] },
  updated_by: { type: String },
  updated_at: { type: Date, default: Date.now }
});

export const PlatformPaymentConfig = mongoose.models.PlatformPaymentConfig || 
  mongoose.model<IPlatformPaymentConfig>('PlatformPaymentConfig', PlatformPaymentConfigSchema);
