import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
  product_id: mongoose.Types.ObjectId;
  variant_id?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  uom: string; // PCS, KG, LTR, BOX
  unit_cost: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  tax_amount: number;
  total: number;
  received_quantity: number;
  billed_quantity: number;
  batch_number?: string;
  expiry_date?: Date;
  expected_delivery_date?: Date;
}

export interface IPurchaseOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  order_number: string; // PO-2026-000001
  supplier_id: mongoose.Types.ObjectId;
  supplier_name: string;
  supplier_code: string;
  supplier_contact?: string;
  supplier_tax_number?: string;
  billing_address?: string;
  shipping_address?: string;
  branchcode: string;
  warehouse_id: mongoose.Types.ObjectId;
  order_date: Date;
  expected_delivery_date?: Date;
  currency: string;
  payment_terms: 'Immediate' | 'Net 7' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Custom';
  payment_due_date?: Date;
  shipping_terms?: string;
  buyer_name?: string;
  reference_number?: string;
  supplier_reference?: string;
  internal_notes?: string;
  terms_and_conditions?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'BILLED' | 'CLOSED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  items: IPurchaseOrderItem[];

  // Financial Totals
  subtotal: number;
  line_discounts: number;
  additional_discount: number;
  taxable_amount: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  shipping_charges: number;
  handling_charges: number;
  round_off: number;
  grand_total: number;

  // Payment Snapshot
  advance_percent: number;
  advance_amount: number;
  payment_method: string;

  // Delivery Metadata
  shipping_method?: string;
  carrier?: string;
  delivery_instructions?: string;

  // Origin Integration References
  requisition_id?: mongoose.Types.ObjectId;
  rfq_id?: mongoose.Types.ObjectId;
  vendor_quotation_id?: mongoose.Types.ObjectId;

  operation_key: string;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  variant_id: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  uom: { type: String, default: 'PCS' },
  unit_cost: { type: Number, required: true, min: 0 },
  discount_percent: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  igst_amount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  received_quantity: { type: Number, default: 0 },
  billed_quantity: { type: Number, default: 0 },
  batch_number: { type: String },
  expiry_date: { type: Date },
  expected_delivery_date: { type: Date }
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  order_number: { type: String, required: true, index: true },
  supplier_id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', index: true },
  supplier_name: { type: String, required: true },
  supplier_code: { type: String, required: true },
  supplier_contact: { type: String, default: '' },
  supplier_tax_number: { type: String, default: '' },
  billing_address: { type: String, default: '' },
  shipping_address: { type: String, default: '' },
  branchcode: { type: String, required: true, default: 'DEFAULT', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  order_date: { type: Date, default: Date.now, index: true },
  expected_delivery_date: { type: Date },
  currency: { type: String, default: 'INR' },
  payment_terms: { type: String, enum: ['Immediate', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'], default: 'Net 30' },
  payment_due_date: { type: Date },
  shipping_terms: { type: String, default: '' },
  buyer_name: { type: String, default: '' },
  reference_number: { type: String, default: '' },
  supplier_reference: { type: String, default: '' },
  internal_notes: { type: String, default: '' },
  terms_and_conditions: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'SENT_TO_SUPPLIER',
      'PARTIALLY_RECEIVED',
      'FULLY_RECEIVED',
      'BILLED',
      'CLOSED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED'
    ],
    default: 'DRAFT',
    index: true
  },
  items: [PurchaseOrderItemSchema],

  subtotal: { type: Number, default: 0 },
  line_discounts: { type: Number, default: 0 },
  additional_discount: { type: Number, default: 0 },
  taxable_amount: { type: Number, default: 0 },
  cgst_total: { type: Number, default: 0 },
  sgst_total: { type: Number, default: 0 },
  igst_total: { type: Number, default: 0 },
  shipping_charges: { type: Number, default: 0 },
  handling_charges: { type: Number, default: 0 },
  round_off: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },

  advance_percent: { type: Number, default: 0 },
  advance_amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'BANK_TRANSFER' },

  shipping_method: { type: String, default: '' },
  carrier: { type: String, default: '' },
  delivery_instructions: { type: String, default: '' },

  requisition_id: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
  rfq_id: { type: Schema.Types.ObjectId, ref: 'RFQ' },
  vendor_quotation_id: { type: Schema.Types.ObjectId, ref: 'VendorQuotation' },

  operation_key: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  approved_by: { type: String },
  approved_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PurchaseOrderSchema.index({ tenant_id: 1, order_number: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenant_id: 1, status: 1, created_at: -1 });

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
