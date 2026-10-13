import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesQuotationItem {
  product_id: mongoose.Types.ObjectId;
  variant_id?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

export interface ISalesQuotation extends Document {
  tenant_id: mongoose.Types.ObjectId;
  quotation_number: string;
  quotation_date: Date;
  valid_until?: Date;
  customer_id?: mongoose.Types.ObjectId;
  customer_name?: string;
  warehouse_id: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CONVERTED' | 'REJECTED' | 'EXPIRED';
  items: ISalesQuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes?: string;
  salesperson_id?: string;
  branchcode: string;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const SalesQuotationSchema = new Schema<ISalesQuotation>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  quotation_number: { type: String, required: true, index: true },
  quotation_date: { type: Date, default: Date.now, index: true },
  valid_until: { type: Date },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  customer_name: { type: String, default: '' },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONVERTED', 'REJECTED', 'EXPIRED'], 
    default: 'DRAFT', 
    index: true 
  },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    variant_id: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax_rate: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  salesperson_id: { type: String },
  branchcode: { type: String, required: true, default: 'DEFAULT', index: true },
  created_by: { type: String, required: true },
  approved_by: { type: String },
  approved_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SalesQuotationSchema.index({ tenant_id: 1, quotation_number: 1 }, { unique: true });
SalesQuotationSchema.index({ tenant_id: 1, branchcode: 1, created_at: -1 });

export const SalesQuotation = mongoose.models.SalesQuotation || mongoose.model<ISalesQuotation>('SalesQuotation', SalesQuotationSchema);
