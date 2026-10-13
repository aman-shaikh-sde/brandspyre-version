import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

export type PaymentRequestStatus = 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface IOrganizationPaymentRequest extends Document {
  request_code: string; // e.g. PR-2026-0001
  receiver_tenant_id: mongoose.Types.ObjectId; // Organization issuing request and receiving funds
  payer_tenant_id?: mongoose.Types.ObjectId; // Paying organization if internal tenant
  payer_client_id?: mongoose.Types.ObjectId; // Client record in CRM
  payer_name: string;
  payer_email: string;
  payer_phone?: string;
  invoice_id?: mongoose.Types.ObjectId; // Linked B2BSettlementInvoice, SalesOrder, etc.
  invoice_number?: string;
  sales_order_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  base_amount?: number;
  tax_amount?: number;
  total_amount: number; // Gross amount in INR
  paid_amount: number; // Accumulated captured amount
  balance_due: number; // Remaining balance
  currency: string;
  due_date?: Date;
  status: PaymentRequestStatus;
  payment_type?: string;
  preferred_provider?: 'razorpay' | 'stripe';
  selected_provider?: 'razorpay' | 'stripe';
  allowed_payment_methods?: string[];
  notes?: string;
  payment_link_token: string; // Cryptographically random secure token for public URL
  active_order_id?: string; // Latest order/session ID to reuse where valid
  metadata?: Record<string, any>;
  created_by?: string | mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const OrganizationPaymentRequestSchema = new Schema<IOrganizationPaymentRequest>({
  request_code: { type: String, required: true, unique: true, index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  payer_tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  payer_client_id: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  payer_name: { type: String, required: true },
  payer_email: { type: String, required: true },
  payer_phone: { type: String },
  invoice_id: { type: Schema.Types.ObjectId, index: true },
  invoice_number: { type: String },
  sales_order_id: { type: Schema.Types.ObjectId, index: true },
  project_id: { type: Schema.Types.ObjectId },
  title: { type: String, required: true },
  description: { type: String },
  base_amount: { type: Number },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true, min: 1 },
  paid_amount: { type: Number, default: 0 },
  balance_due: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  due_date: { type: Date },
  status: { 
    type: String, 
    default: 'PENDING', 
    enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED'],
    index: true 
  },
  payment_type: { 
    type: String, 
    default: 'GENERAL_B2B_PAYMENT', 
    enum: ['GENERAL_B2B_PAYMENT', 'ORGANIZATION_PAYMENT', 'LEAD_MARKETPLACE_SETTLEMENT', 'INVOICE_PAYMENT', 'OTHER'],
    index: true 
  },
  preferred_provider: { type: String, enum: ['razorpay', 'stripe'] },
  selected_provider: { type: String, enum: ['razorpay', 'stripe'] },
  allowed_payment_methods: [{ type: String }],
  notes: { type: String },
  payment_link_token: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    default: () => crypto.randomBytes(24).toString('hex')
  },
  active_order_id: { type: String },
  metadata: { type: Schema.Types.Mixed },
  created_by: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

OrganizationPaymentRequestSchema.index({ receiver_tenant_id: 1, status: 1, created_at: -1 });
OrganizationPaymentRequestSchema.index({ payer_tenant_id: 1, status: 1, created_at: -1 });

if (mongoose.models.OrganizationPaymentRequest) {
  delete (mongoose.models as any).OrganizationPaymentRequest;
}

export const OrganizationPaymentRequest = mongoose.models.OrganizationPaymentRequest || 
  mongoose.model<IOrganizationPaymentRequest>('OrganizationPaymentRequest', OrganizationPaymentRequestSchema);
