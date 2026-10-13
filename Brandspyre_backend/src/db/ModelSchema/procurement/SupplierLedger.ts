import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierLedger extends Document {
  tenant_id: mongoose.Types.ObjectId;
  supplier_id: mongoose.Types.ObjectId;
  transaction_date: Date;
  voucher_type: 'VENDOR_BILL' | 'SUPPLIER_PAYMENT' | 'DEBIT_NOTE' | 'PURCHASE_RETURN' | 'OPENING_BALANCE';
  voucher_number: string;
  reference_id?: string;
  debit_amount: number;   // Decrease payable balance (Payment/Debit Note)
  credit_amount: number;  // Increase payable balance (Vendor Bill)
  running_balance: number;
  description: string;
  branchcode: string;
  operation_key: string;
  created_at: Date;
}

const SupplierLedgerSchema = new Schema<ISupplierLedger>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  supplier_id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', index: true },
  transaction_date: { type: Date, default: Date.now, index: true },
  voucher_type: { 
    type: String, 
    enum: ['VENDOR_BILL', 'SUPPLIER_PAYMENT', 'DEBIT_NOTE', 'PURCHASE_RETURN', 'OPENING_BALANCE'], 
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

SupplierLedgerSchema.index({ tenant_id: 1, supplier_id: 1, transaction_date: -1 });
SupplierLedgerSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

export const SupplierLedger = mongoose.models.SupplierLedger || mongoose.model<ISupplierLedger>('SupplierLedger', SupplierLedgerSchema);
