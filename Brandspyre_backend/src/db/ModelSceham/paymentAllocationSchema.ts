import mongoose, { Schema, Document } from "mongoose";

export type PaymentAllocationStatus = 
  | 'ALLOCATED'
  | 'TRANSFERRED'
  | 'SETTLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'DISPUTED'
  | 'TRANSFER_FAILED';

export interface IPaymentAllocation extends Document {
  allocation_code: string;
  payment_id: mongoose.Types.ObjectId;
  payment_request_id?: mongoose.Types.ObjectId;
  invoice_id: mongoose.Types.ObjectId;
  settlement_transaction_id: mongoose.Types.ObjectId;
  lead_id?: mongoose.Types.ObjectId;
  
  provider_tenant_id: mongoose.Types.ObjectId; // Seller / Lead provider
  receiver_tenant_id: mongoose.Types.ObjectId; // Buyer / Lead worker
  
  allocated_amount: number; // Gross amount allocated to this transaction
  allocated_platform_fee: number; // Brandspyre commission portion
  allocated_platform_tax: number; // GST on Brandspyre commission
  allocated_receiver_amount: number; // Net payout entitled to Provider for this allocation
  
  currency: string;
  status: PaymentAllocationStatus;
  provider_transfer_id?: string;
  
  created_at: Date;
  updated_at: Date;
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>({
  allocation_code: { type: String, required: true, unique: true, index: true },
  payment_id: { type: Schema.Types.ObjectId, required: true, ref: 'OrganizationPayment', index: true },
  payment_request_id: { type: Schema.Types.ObjectId, ref: 'OrganizationPaymentRequest', index: true },
  invoice_id: { type: Schema.Types.ObjectId, required: true, ref: 'B2BSettlementInvoice', index: true },
  settlement_transaction_id: { type: Schema.Types.ObjectId, required: true, ref: 'B2BSettlementTransaction', index: true },
  lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  
  provider_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receiver_tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  
  allocated_amount: { type: Number, required: true, min: 0 },
  allocated_platform_fee: { type: Number, required: true, default: 0 },
  allocated_platform_tax: { type: Number, required: true, default: 0 },
  allocated_receiver_amount: { type: Number, required: true, min: 0 },
  
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    required: true, 
    default: 'ALLOCATED',
    enum: ['ALLOCATED', 'TRANSFERRED', 'SETTLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'TRANSFER_FAILED'],
    index: true 
  },
  provider_transfer_id: { type: String, index: true },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PaymentAllocationSchema.index({ payment_id: 1, settlement_transaction_id: 1 }, { unique: true });
PaymentAllocationSchema.index({ invoice_id: 1, status: 1 });

export const PaymentAllocation = mongoose.models.PaymentAllocation || mongoose.model<IPaymentAllocation>('PaymentAllocation', PaymentAllocationSchema);
export default PaymentAllocation;
