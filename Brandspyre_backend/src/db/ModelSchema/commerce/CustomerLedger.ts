import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerLedger extends Document {
  tenant_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  transaction_date: Date;
  voucher_type: 'SALES_INVOICE' | 'CUSTOMER_PAYMENT' | 'CREDIT_NOTE' | 'SALES_RETURN' | 'OPENING_BALANCE';
  voucher_number: string;
  reference_id?: string;
  debit_amount: number;   // Increase receivable balance
  credit_amount: number;  // Decrease receivable balance
  running_balance: number;
  description: string;
  branchcode: string;
  operation_key: string;
  created_at: Date;
}

const CustomerLedgerSchema = new Schema<ICustomerLedger>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  customer_id: { type: Schema.Types.ObjectId, required: true, ref: 'Client', index: true },
  transaction_date: { type: Date, default: Date.now, index: true },
  voucher_type: { 
    type: String, 
    enum: ['SALES_INVOICE', 'CUSTOMER_PAYMENT', 'CREDIT_NOTE', 'SALES_RETURN', 'OPENING_BALANCE'], 
    required: true,
    index: true 
  },
  voucher_number: { type: String, required: true },
  reference_id: { type: String },
  debit_amount: { type: Number, default: 0 },
  credit_amount: { type: Number, default: 0 },
  running_balance: { type: Number, required: true },
  description: { type: String, required: true },
  branchcode: { type: String, required: true, default: 'DEFAULT', index: true },
  operation_key: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now }
});

CustomerLedgerSchema.index({ tenant_id: 1, customer_id: 1, transaction_date: -1 });
CustomerLedgerSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

export const CustomerLedger = mongoose.models.CustomerLedger || mongoose.model<ICustomerLedger>('CustomerLedger', CustomerLedgerSchema);
