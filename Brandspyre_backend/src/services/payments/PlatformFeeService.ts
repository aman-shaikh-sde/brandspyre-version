import { PlatformPaymentConfig, IPlatformPaymentConfig } from "../../db/ModelSceham/platformPaymentConfigSchema";

export interface FeeCalculationResult {
  grossAmount: number;
  platformFee: number; // Brandspyre marketplace commission
  taxOnPlatformFee: number; // GST on commission (e.g. 18%)
  totalPlatformDeduction: number; // Fee + Tax
  receiverAmount: number; // Net payout entitled to Receiver
  currency: string;
  commissionRateApplied: number;
}

export class PlatformFeeService {
  /**
   * Get active platform fee configuration, initializing defaults if none exists
   */
  static async getConfig(): Promise<IPlatformPaymentConfig> {
    let config = await PlatformPaymentConfig.findOne();
    if (!config) {
      config = await PlatformPaymentConfig.create({
        fee_type: 'PERCENTAGE',
        fee_percentage: 10.0, // Default 10% marketplace commission
        fixed_fee: 0,
        tax_percentage: 18,
        minimum_fee: 0,
        maximum_fee: 10000,
        is_active: true,
        payout_hold_period_days: 0,
        razorpay_enabled: true,
        stripe_enabled: true,
        default_marketplace_provider: 'razorpay'
      });
    }
    return config;
  }

  /**
   * Update platform fee configuration
   */
  static async updateConfig(updates: Partial<IPlatformPaymentConfig>, updatedBy?: string): Promise<IPlatformPaymentConfig> {
    const config = await this.getConfig();
    Object.assign(config, updates, {
      updated_by: updatedBy,
      updated_at: new Date()
    });
    await config.save();
    return config;
  }

  /**
   * Centralized fee and commission calculation
   * Supports optional commission rate override (e.g. from specific B2B SLA agreements)
   */
  static async calculateFee(
    grossAmount: number, 
    currency: string = 'INR',
    customCommissionRate?: number
  ): Promise<FeeCalculationResult> {
    const config = await this.getConfig();

    if (!config.is_active || grossAmount <= 0) {
      return {
        grossAmount,
        platformFee: 0,
        taxOnPlatformFee: 0,
        totalPlatformDeduction: 0,
        receiverAmount: grossAmount,
        currency,
        commissionRateApplied: 0
      };
    }

    let baseFee = 0;
    const rateToUse = (customCommissionRate !== undefined && customCommissionRate >= 0)
      ? customCommissionRate
      : config.fee_percentage;

    if (customCommissionRate !== undefined && customCommissionRate >= 0) {
      baseFee = (grossAmount * customCommissionRate) / 100;
    } else {
      switch (config.fee_type) {
        case 'PERCENTAGE':
          baseFee = (grossAmount * config.fee_percentage) / 100;
          break;
        case 'FIXED':
          baseFee = config.fixed_fee;
          break;
        case 'PERCENTAGE_PLUS_FIXED':
          baseFee = ((grossAmount * config.fee_percentage) / 100) + config.fixed_fee;
          break;
        default:
          baseFee = (grossAmount * 10.0) / 100;
      }
    }

    // Apply minimum and maximum boundaries if standard config applies
    if (customCommissionRate === undefined) {
      if (config.minimum_fee > 0 && baseFee < config.minimum_fee) {
        baseFee = config.minimum_fee;
      }
      if (config.maximum_fee > 0 && baseFee > config.maximum_fee) {
        baseFee = config.maximum_fee;
      }
    }

    // Cannot exceed gross amount
    if (baseFee > grossAmount) {
      baseFee = grossAmount;
    }

    // Round to 2 decimal places
    baseFee = Math.round(baseFee * 100) / 100;

    // Calculate tax on platform fee (e.g. 18% GST)
    const taxRate = config.tax_percentage || 18;
    const taxOnFee = Math.round((baseFee * taxRate) / 100 * 100) / 100;
    const totalPlatformDeduction = Math.round((baseFee + taxOnFee) * 100) / 100;

    const receiverAmount = Math.max(0, Math.round((grossAmount - totalPlatformDeduction) * 100) / 100);

    return {
      grossAmount,
      platformFee: baseFee,
      taxOnPlatformFee: taxOnFee,
      totalPlatformDeduction,
      receiverAmount,
      currency,
      commissionRateApplied: rateToUse
    };
  }
}

export default PlatformFeeService;
