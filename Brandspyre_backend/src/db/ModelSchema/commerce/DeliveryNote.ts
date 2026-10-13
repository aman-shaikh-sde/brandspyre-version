import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryNoteItem {
  product_id: mongoose.Types.ObjectId;
  variant_id?: mongoose.Types.ObjectId;
  batch_id?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  ordered_quantity: number;
  delivered_quantity: number;
  unit_price: number;
}

export interface IDeliveryNote extends Document {
  tenant_id: mongoose.Types.ObjectId;
  delivery_number: string; // Prefix DN-2026-000001
  sales_order_id: mongoose.Types.ObjectId;
  sales_order_number: string;
  customer_id?: mongoose.Types.ObjectId;
  customer_name?: string;
  warehouse_id: mongoose.Types.ObjectId;
  delivery_date: Date;
  status: 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  tracking_number?: string;
  carrier?: string;
  items: IDeliveryNoteItem[];
  notes?: string;
  operation_key: string; // Idempotency key
  branchcode: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const DeliveryNoteSchema = new Schema<IDeliveryNote>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  delivery_number: { type: String, required: true, index: true },
  sales_order_id: { type: Schema.Types.ObjectId, required: true, ref: 'SalesOrder', index: true },
  sales_order_number: { type: String, required: true },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  customer_name: { type: String, default: '' },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  delivery_date: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'], default: 'DISPATCHED', index: true },
  tracking_number: { type: String, default: '' },
  carrier: { type: String, default: '' },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    variant_id: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    batch_id: { type: Schema.Types.ObjectId, ref: 'ProductBatch' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    ordered_quantity: { type: Number, required: true },
    delivered_quantity: { type: Number, required: true },
    unit_price: { type: Number, default: 0 }
  }],
  notes: { type: String, default: '' },
  operation_key: { type: String, required: true, index: true },
  branchcode: { type: String, required: true, default: 'DEFAULT', index: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DeliveryNoteSchema.index({ tenant_id: 1, delivery_number: 1 }, { unique: true });
DeliveryNoteSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

export const DeliveryNote = mongoose.models.DeliveryNote || mongoose.model<IDeliveryNote>('DeliveryNote', DeliveryNoteSchema);
