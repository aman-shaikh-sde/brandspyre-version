import mongoose, { Schema, Document } from 'mongoose';

export interface IStockReservation extends Document {
  tenant_id: mongoose.Types.ObjectId;
  reservation_id: string; // Prefix RES-2026-000001
  source_type: 'SALES_ORDER' | 'PRODUCTION_ORDER' | 'STOCK_TRANSFER' | 'MANUAL';
  source_id: string;       // Document ID or Order Number
  product_id: mongoose.Types.ObjectId;
  variant_id?: mongoose.Types.ObjectId;
  batch_id?: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  location_id?: mongoose.Types.ObjectId;
  quantity: number;
  status: 'RESERVED' | 'FULFILLED' | 'RELEASED';
  branchcode: string;
  created_at: Date;
  released_at?: Date;
  fulfilled_at?: Date;
}

const StockReservationSchema = new Schema<IStockReservation>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  reservation_id: { type: String, required: true, index: true },
  source_type: { 
    type: String, 
    enum: ['SALES_ORDER', 'PRODUCTION_ORDER', 'STOCK_TRANSFER', 'MANUAL'], 
    required: true,
    index: true 
  },
  source_id: { type: String, required: true, index: true },
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
  variant_id: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
  batch_id: { type: Schema.Types.ObjectId, ref: 'ProductBatch' },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  location_id: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation' },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['RESERVED', 'FULFILLED', 'RELEASED'], default: 'RESERVED', index: true },
  branchcode: { type: String, required: true, default: 'DEFAULT', index: true },
  created_at: { type: Date, default: Date.now },
  released_at: { type: Date },
  fulfilled_at: { type: Date }
});

StockReservationSchema.index({ tenant_id: 1, reservation_id: 1 }, { unique: true });
StockReservationSchema.index({ tenant_id: 1, product_id: 1, warehouse_id: 1, status: 1 });

export const StockReservation = mongoose.models.StockReservation || mongoose.model<IStockReservation>('StockReservation', StockReservationSchema);
