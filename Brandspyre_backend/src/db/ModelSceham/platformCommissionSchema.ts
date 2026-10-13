import mongoose, { Schema, Document } from "mongoose";

export type PlatformCommissionStatus = 
  | 'PENDING'
  | 'CALCULATED'
  | 'PARTIALLY_COLLECTED'
  | 'COLLECTED'
  | 'SETTLED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'REVERSED'
  | 'DISPUTED';

export interface IPlatformCommission extends Document {
  commission_code: string; // Unique commission identifier e.g. COMM-2026-0001
  lead_id?: mongoose.Types.ObjectId;
  settlement_transaction_id?: mongoose.Types.ObjectId;
  settlement_invoice_id?: mongoose.Types.ObjectId;
  payment_id?: mongoose.Types.ObjectId;
  payment_request_id?: mongoose.Types.ObjectId;

  // Bilateral organization context
  payer_tenant_id: mongoose.Types.ObjectId; // Organization paying for the lead (Consumer/Buyer)
  receiver_tenant_id: mongoose.Types.ObjectId; // Organization receiving the net settlement (Provider/Seller)

  // Financial breakdown
  gross_amount: number; // Total settlement value e.g. ₹10,000
  commission_rate: number; // Commission percentage e.g. 10 (%) or custom rate
  commission_amount: number; // Base Brandspyre commission e.g. ₹1,000
  commission_tax: number; // GST on commission e.g. ₹180 (18% on ₹1,000)
  total_commission_deduction: number; // Commission + Tax e.g. ₹1,180
  commission_collected_amount: number; // Proportional commission collected on partial payments
  commission_refunded_amount: number; // Proportional commission reversed on refunds
  commission_remaining_amount: number; // Remaining commission to be collected
  payment_allocations?: {
    payment_id: mongoose.Types.ObjectId;
    allocated_commission: number;
    allocated_tax: number;
    allocated_total: number;
    allocation_date: Date;
  }[];
  gateway_fee: number; // Razorpay payment gateway fee if applicable
  receiver_net_amount: number; // Net amount payable to Receiver e.g. ₹8,820

  currency: string;
  status: PlatformCommissionStatus;

  // Provider tracking
  provider: 'razorpay' | 'stripe';
  provider_payment_id?: string; // Razorpay payment ID or Stripe PI/Charge ID
  provider_transfer_id?: string; // Razorpay Route transfer ID or Stripe Transfer ID
  provider_order_id?: string;

  // Timestamps
  calculated_at: Date;
  collected_at?: Date;
  settled_at?: Date;
  refunded_at?: Date;
  disputed_at?: Date;

  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const PlatformCommissionSchema = new Schema<IPlatformCommission>({
  commission_code: { type: String, required: true, unique: true, index: true },
  lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  settlement_transaction_id: { type: Schema.Types.ObjectId, ref: 'B2BSettlementTransaction', index: true },
  settlement_invoice_id: { type: Schema.Types.ObjectId, ref: 'B2BSettlementInvoice', index: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPayment', index: true },
  payment_request_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPaymentRequest', index: true },

  payer_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },

  gross_amount: { type: Number, required: true, min: 0 },
  commission_rate: { type: Number, required: true, default: 0 },
  commission_amount: { type: Number, required: true, default: 0 },
  commission_tax: { type: Number, required: true, default: 0 },
  total_commission_deduction: { type: Number, required: true, default: 0 },
  commission_collected_amount: { type: Number, required: true, default: 0 },
  commission_refunded_amount: { type: Number, required: true, default: 0 },
  commission_remaining_amount: { type: Number, required: true, default: 0 },
  payment_allocations: [{
    payment_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPayment' },
    allocated_commission: { type: Number, required: true },
    allocated_tax: { type: Number, required: true },
    allocated_total: { type: Number, required: true },
    allocation_date: { type: Date, default: Date.now }
  }],
  gateway_fee: { type: Number, default: 0 },
  receiver_net_amount: { type: Number, required: true, min: 0 },

  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    required: true, 
    default: 'PENDING',
    enum: ['PENDING', 'CALCULATED', 'PARTIALLY_COLLECTED', 'COLLECTED', 'SETTLED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'REVERSED', 'DISPUTED'],
    index: true 
  },

  provider: { type: String, default: 'razorpay', enum: ['razorpay', 'stripe'] },
  provider_payment_id: { type: String, index: true },
  provider_transfer_id: { type: String, index: true },
  provider_order_id: { type: String, index: true },

  calculated_at: { type: Date, default: Date.now },
  collected_at: { type: Date },
  settled_at: { type: Date },
  refunded_at: { type: Date },
  disputed_at: { type: Date },

  notes: { type: String },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PlatformCommissionSchema.index({ receiver_tenant_id: 1, status: 1 });
PlatformCommissionSchema.index({ payer_tenant_id: 1, status: 1 });
PlatformCommissionSchema.index({ created_at: -1 });

export const PlatformCommission = mongoose.models.PlatformCommission || mongoose.model<IPlatformCommission>("PlatformCommission", PlatformCommissionSchema);
