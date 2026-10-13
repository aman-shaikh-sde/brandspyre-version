import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesOrderItem {
  product_id: mongoose.Types.ObjectId;
  variant_id?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  tax_amount: number;
  total: number;
  fulfilled_quantity: number;
  delivered_quantity: number;
  invoiced_quantity: number;
  batch_number?: string;
  serial_number?: string;
}

export interface ISalesOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  order_number: string;
  quotation_id?: mongoose.Types.ObjectId;
  quotation_number?: string;

  customer_id?: mongoose.Types.ObjectId;
  customer_name: string;
  customer_code?: string;
  customer_contact?: string;
  customer_tax_number?: string;

  billing_address?: string;
  shipping_address?: string;

  branchcode: string;
  warehouse_id: mongoose.Types.ObjectId;

  salesperson_id?: string;
  salesperson_name?: string;

  order_date: Date;
  expected_delivery_date?: Date;
  currency: string;
  payment_terms: string;

  customer_po_number?: string;
  reference_number?: string;

  shipping_method?: string;
  carrier?: string;
  delivery_instructions?: string;
  internal_notes?: string;
  terms_and_conditions?: string;

  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'CONFIRMED'
    | 'STOCK_RESERVED'
    | 'PARTIALLY_DELIVERED'
    | 'FULLY_DELIVERED'
    | 'INVOICED'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'CLOSED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'ON_HOLD'
    | 'BACKORDERED';

  items: ISalesOrderItem[];

  subtotal: number;
  line_discounts: number;
  additional_discount: number;
  taxable_amount: number;

  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  tax: number;

  shipping_charges: number;
  handling_charges: number;
  other_charges: number;
  round_off: number;
  grand_total: number;

  paid_amount: number;
  outstanding_balance: number;

  credit_limit?: number;
  current_outstanding?: number;
  approval_status?: string;
  approved_by?: string;
  approved_at?: Date;

  operation_key: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const SalesOrderItemSchema = new Schema<ISalesOrderItem>({
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  variant_id: { type: Schema.Types.ObjectId },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  uom: { type: String, default: 'PCS' },
  unit_price: { type: Number, required: true, min: 0 },
  discount_percent: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  igst_amount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  fulfilled_quantity: { type: Number, default: 0 },
  delivered_quantity: { type: Number, default: 0 },
  invoiced_quantity: { type: Number, default: 0 },
  batch_number: { type: String, default: '' },
  serial_number: { type: String, default: '' }
});

const SalesOrderSchema = new Schema<ISalesOrder>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  order_number: { type: String, required: true, index: true },
  quotation_id: { type: Schema.Types.ObjectId, ref: 'SalesQuotation' },
  quotation_number: { type: String, default: '' },

  customer_id: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  customer_name: { type: String, required: true },
  customer_code: { type: String, default: '' },
  customer_contact: { type: String, default: '' },
  customer_tax_number: { type: String, default: '' },

  billing_address: { type: String, default: '' },
  shipping_address: { type: String, default: '' },

  branchcode: { type: String, default: 'DEFAULT', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },

  salesperson_id: { type: String, default: '' },
  salesperson_name: { type: String, default: '' },

  order_date: { type: Date, default: Date.now },
  expected_delivery_date: { type: Date },
  currency: { type: String, default: 'INR' },
  payment_terms: { type: String, default: 'Net 30' },

  customer_po_number: { type: String, default: '' },
  reference_number: { type: String, default: '' },

  shipping_method: { type: String, default: '' },
  carrier: { type: String, default: '' },
  delivery_instructions: { type: String, default: '' },
  internal_notes: { type: String, default: '' },
  terms_and_conditions: { type: String, default: '' },

  status: {
    type: String,
    enum: [
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'CONFIRMED',
      'STOCK_RESERVED',
      'PARTIALLY_DELIVERED',
      'FULLY_DELIVERED',
      'INVOICED',
      'PARTIALLY_PAID',
      'PAID',
      'CLOSED',
      'REJECTED',
      'CANCELLED',
      'ON_HOLD',
      'BACKORDERED'
    ],
    default: 'DRAFT',
    index: true
  },

  items: [SalesOrderItemSchema],

  subtotal: { type: Number, default: 0 },
  line_discounts: { type: Number, default: 0 },
  additional_discount: { type: Number, default: 0 },
  taxable_amount: { type: Number, default: 0 },

  cgst_total: { type: Number, default: 0 },
  sgst_total: { type: Number, default: 0 },
  igst_total: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },

  shipping_charges: { type: Number, default: 0 },
  handling_charges: { type: Number, default: 0 },
  other_charges: { type: Number, default: 0 },
  round_off: { type: Number, default: 0 },
  grand_total: { type: Number, required: true },

  paid_amount: { type: Number, default: 0 },
  outstanding_balance: { type: Number, default: 0 },

  credit_limit: { type: Number, default: 0 },
  current_outstanding: { type: Number, default: 0 },
  approval_status: { type: String, default: '' },
  approved_by: { type: String, default: '' },
  approved_at: { type: Date },

  operation_key: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SalesOrderSchema.index({ tenant_id: 1, order_number: 1 }, { unique: true });
SalesOrderSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

export const SalesOrder = mongoose.model<ISalesOrder>('SalesOrderDomain', SalesOrderSchema);
export default SalesOrder;
