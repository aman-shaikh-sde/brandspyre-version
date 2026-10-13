import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. PRODUCT CATEGORY
// ============================================================
export interface IProductCategory extends Document {
  tenant_id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  parent_id?: mongoose.Types.ObjectId | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductCategorySchema = new Schema<IProductCategory>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  parent_id: { type: Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ProductCategorySchema.index({ tenant_id: 1, code: 1 }, { unique: true });

// ============================================================
// 2. PRODUCT BRAND
// ============================================================
export interface IProductBrand extends Document {
  tenant_id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  logo_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductBrandSchema = new Schema<IProductBrand>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  logo_url: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ProductBrandSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

// ============================================================
// 3. PRODUCT UNIT
// ============================================================
export interface IProductUnit extends Document {
  tenant_id: mongoose.Types.ObjectId;
  code: string;          // e.g., 'PCS', 'KG', 'LTR', 'BOX'
  name: string;          // e.g., 'Pieces', 'Kilogram'
  is_active: boolean;
  created_at: Date;
}

const ProductUnitSchema = new Schema<IProductUnit>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

ProductUnitSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

// ============================================================
// 4. PRODUCT
// ============================================================
export interface IProduct extends Document {
  tenant_id: mongoose.Types.ObjectId;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: mongoose.Types.ObjectId;
  brand_id?: mongoose.Types.ObjectId;
  unit_id?: mongoose.Types.ObjectId;
  product_type: 'single' | 'variant' | 'combo' | 'service';
  purchase_price: number;
  selling_price: number;
  tax_rate: number;         // Percentage (e.g. 18 for 18% GST/VAT)
  tax_inclusive?: boolean;
  reorder_level: number;
  track_inventory: boolean;
  track_batch: boolean;
  track_expiry: boolean;
  image_url?: string;
  is_active: boolean;
  is_deleted?: boolean;
  custom_fields?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  sku: { type: String, required: true, index: true },
  barcode: { type: String, sparse: true, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  category_id: { type: Schema.Types.ObjectId, ref: 'ProductCategory', index: true },
  brand_id: { type: Schema.Types.ObjectId, ref: 'ProductBrand' },
  unit_id: { type: Schema.Types.ObjectId, ref: 'ProductUnit' },
  product_type: { type: String, enum: ['single', 'variant', 'combo', 'service'], default: 'single' },
  purchase_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  tax_rate: { type: Number, default: 0 },
  tax_inclusive: { type: Boolean, default: false },
  reorder_level: { type: Number, default: 5 },
  track_inventory: { type: Boolean, default: true },
  track_batch: { type: Boolean, default: false },
  track_expiry: { type: Boolean, default: false },
  image_url: { type: String, default: '' },
  custom_fields: { type: Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ProductSchema.index({ tenant_id: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenant_id: 1, barcode: 1 }, { unique: true, sparse: true });
ProductSchema.index({ tenant_id: 1, category_id: 1 });
ProductSchema.index({ tenant_id: 1, is_active: 1, is_deleted: 1 });

// ============================================================
// 5. PRODUCT VARIANT
// ============================================================
export interface IProductVariant extends Document {
  tenant_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  sku: string;
  barcode?: string;
  variant_name: string; // e.g., 'Red / XL'
  purchase_price?: number;
  selling_price?: number;
  is_active: boolean;
  created_at: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
  sku: { type: String, required: true },
  barcode: { type: String, sparse: true },
  variant_name: { type: String, required: true },
  purchase_price: { type: Number },
  selling_price: { type: Number },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

ProductVariantSchema.index({ tenant_id: 1, sku: 1 }, { unique: true });
ProductVariantSchema.index({ tenant_id: 1, barcode: 1 }, { unique: true, sparse: true });

// ============================================================
// 6. SUPPLIER
// ============================================================
export interface ISupplier extends Document {
  tenant_id: mongoose.Types.ObjectId;
  supplier_code: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string; // e.g., 'Net 30'
  credit_limit?: number;
  opening_balance?: number;
  current_balance: number;
  status: 'active' | 'inactive';
  details?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  supplier_code: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  company_name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  tax_number: { type: String, default: '' },
  payment_terms: { type: String, default: 'Net 30' },
  credit_limit: { type: Number, default: 0 },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  details: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SupplierSchema.index({ tenant_id: 1, supplier_code: 1 }, { unique: true });

// ============================================================
// 7. WAREHOUSE
// ============================================================
export interface IWarehouse extends Document {
  tenant_id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  address?: string;
  manager_id?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const WarehouseSchema = new Schema<IWarehouse>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  address: { type: String, default: '' },
  manager_id: { type: String },
  is_default: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

WarehouseSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

// ============================================================
// 8. INVENTORY STOCK (SINGLE SOURCE OF TRUTH FOR CURRENT STOCK)
// ============================================================
export interface IInventoryStock extends Document {
  tenant_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  average_cost: number;
  reorder_level: number;
  updated_at: Date;
}

const InventoryStockSchema = new Schema<IInventoryStock>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
  quantity: { type: Number, default: 0 },
  reserved_quantity: { type: Number, default: 0 },
  available_quantity: { type: Number, default: 0 },
  average_cost: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 5 },
  updated_at: { type: Date, default: Date.now }
});

InventoryStockSchema.index({ tenant_id: 1, warehouse_id: 1, product_id: 1 }, { unique: true });

// ============================================================
// 9. INVENTORY TRANSACTION (IMMUTABLE STOCK LEDGER)
// ============================================================
export interface IInventoryTransaction extends Document {
  tenant_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  transaction_type: 'PURCHASE' | 'SALE' | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING_STOCK';
  quantity: number;            // Signed or absolute quantity moved
  unit_cost: number;
  balance_after: number;       // Balance quantity after transaction
  reference_type?: string;     // e.g. 'Purchase', 'SalesInvoice', 'POSSale', 'StockAdjustment', 'StockTransfer'
  reference_id?: string;       // ID or Order Number
  operation_key: string;       // IDEMPOTENCY KEY (e.g. 'PURCHASE_REC_123_PROD_456')
  created_by?: string;
  created_at: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  transaction_type: { 
    type: String, 
    enum: ['PURCHASE', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'OPENING_STOCK'], 
    required: true,
    index: true 
  },
  quantity: { type: Number, required: true },
  unit_cost: { type: Number, default: 0 },
  balance_after: { type: Number, required: true },
  reference_type: { type: String },
  reference_id: { type: String },
  operation_key: { type: String, required: true, index: true },
  created_by: { type: String },
  created_at: { type: Date, default: Date.now }
});

InventoryTransactionSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });
InventoryTransactionSchema.index({ tenant_id: 1, product_id: 1, created_at: -1 });

// ============================================================
// 10. STOCK ADJUSTMENT
// ============================================================
export interface IStockAdjustmentItem {
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  unit_cost: number;
}

export interface IStockAdjustment extends Document {
  tenant_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  adjustment_number: string;
  type: 'INCREASE' | 'DECREASE';
  reason: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'FOUND' | 'COUNT_CORRECTION' | 'OPENING_STOCK' | 'OTHER';
  items: IStockAdjustmentItem[];
  notes?: string;
  created_by: string;
  created_at: Date;
}

const StockAdjustmentSchema = new Schema<IStockAdjustment>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  adjustment_number: { type: String, required: true, index: true },
  type: { type: String, enum: ['INCREASE', 'DECREASE'], required: true },
  reason: { type: String, enum: ['DAMAGED', 'EXPIRED', 'LOST', 'FOUND', 'COUNT_CORRECTION', 'OPENING_STOCK', 'OTHER'], required: true },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, default: 0 }
  }],
  notes: { type: String, default: '' },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

StockAdjustmentSchema.index({ tenant_id: 1, adjustment_number: 1 }, { unique: true });

// ============================================================
// 11. STOCK TRANSFER
// ============================================================
export interface IStockTransferItem {
  product_id: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IStockTransfer extends Document {
  tenant_id: mongoose.Types.ObjectId;
  transfer_number: string;
  from_warehouse_id: mongoose.Types.ObjectId;
  to_warehouse_id: mongoose.Types.ObjectId;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  items: IStockTransferItem[];
  notes?: string;
  created_by: string;
  completed_at?: Date;
  created_at: Date;
}

const StockTransferSchema = new Schema<IStockTransfer>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  transfer_number: { type: String, required: true, index: true },
  from_warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  to_warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  status: { type: String, enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    quantity: { type: Number, required: true }
  }],
  notes: { type: String, default: '' },
  created_by: { type: String, required: true },
  completed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

StockTransferSchema.index({ tenant_id: 1, transfer_number: 1 }, { unique: true });

// ============================================================
// 12. PRODUCT BATCH
// ============================================================
export interface IProductBatch extends Document {
  tenant_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  batch_number: string;
  manufacturing_date?: Date;
  expiry_date?: Date;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  created_at: Date;
}

const ProductBatchSchema = new Schema<IProductBatch>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  batch_number: { type: String, required: true, index: true },
  manufacturing_date: { type: Date },
  expiry_date: { type: Date, index: true },
  quantity: { type: Number, default: 0 },
  purchase_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

ProductBatchSchema.index({ tenant_id: 1, product_id: 1, batch_number: 1 }, { unique: true });

// ============================================================
// 13. PURCHASE ORDER & ITEM
// ============================================================
export interface IPurchaseOrderItem {
  product_id: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  received_quantity: number;
}

export interface IPurchaseOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  supplier_id: mongoose.Types.ObjectId;
  order_number: string;
  order_date: Date;
  expected_date?: Date;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT_TO_SUPPLIER' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'RECEIVED' | 'BILLED' | 'CLOSED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  items: IPurchaseOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  supplier_id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', index: true },
  order_number: { type: String, required: true, index: true },
  order_date: { type: Date, default: Date.now },
  expected_date: { type: Date },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'PENDING_APPROVAL',
      'APPROVED',
      'SENT_TO_SUPPLIER',
      'PARTIALLY_RECEIVED',
      'FULLY_RECEIVED',
      'RECEIVED',
      'BILLED',
      'CLOSED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED'
    ],
    default: 'DRAFT'
  },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    tax_rate: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    received_quantity: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PurchaseOrderSchema.index({ tenant_id: 1, order_number: 1 }, { unique: true });

// ============================================================
// 14. PURCHASE INVOICE & RECEIVING LOG
// ============================================================
export interface IPurchase extends Document {
  tenant_id: mongoose.Types.ObjectId;
  purchase_number: string;
  supplier_id: mongoose.Types.ObjectId;
  purchase_order_id?: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  invoice_number?: string;
  invoice_date?: Date;
  items: IPurchaseOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  status: 'received' | 'cancelled';
  operation_key: string; // IDEMPOTENCY KEY
  created_by: string;
  created_at: Date;
}

const PurchaseSchema = new Schema<IPurchase>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  purchase_number: { type: String, required: true, index: true },
  supplier_id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', index: true },
  purchase_order_id: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  invoice_number: { type: String },
  invoice_date: { type: Date, default: Date.now },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    tax_rate: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  payment_status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  status: { type: String, enum: ['received', 'cancelled'], default: 'received' },
  operation_key: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

PurchaseSchema.index({ tenant_id: 1, purchase_number: 1 }, { unique: true });
PurchaseSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

// ============================================================
// 15. POS SESSION
// ============================================================
export interface IPOSSession extends Document {
  tenant_id: mongoose.Types.ObjectId;
  session_code: string;
  cashier_id: string;
  cashier_name: string;
  warehouse_id: mongoose.Types.ObjectId;
  opened_at: Date;
  closed_at?: Date;
  opening_cash: number;
  total_sales: number;
  total_returns: number;
  expected_cash: number;
  closing_cash?: number;
  cash_variance?: number;
  status: 'open' | 'closed';
}

const POSSessionSchema = new Schema<IPOSSession>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  session_code: { type: String, required: true, index: true },
  cashier_id: { type: String, required: true },
  cashier_name: { type: String, required: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  opened_at: { type: Date, default: Date.now },
  closed_at: { type: Date },
  opening_cash: { type: Number, default: 0 },
  total_sales: { type: Number, default: 0 },
  total_returns: { type: Number, default: 0 },
  expected_cash: { type: Number, default: 0 },
  closing_cash: { type: Number },
  cash_variance: { type: Number },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
});

POSSessionSchema.index({ tenant_id: 1, session_code: 1 }, { unique: true });

// ============================================================
// 16. POS SALE / CHECKOUT
// ============================================================
export interface IPOSSaleItem {
  product_id: mongoose.Types.ObjectId;
  sku: string;
  barcode?: string;
  name: string;
  quantity: number;
  selling_price: number; // Price snapshot
  purchase_price: number; // Purchase price snapshot
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

export interface IPOSSale extends Document {
  tenant_id: mongoose.Types.ObjectId;
  receipt_number: string;
  session_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  customer_id?: mongoose.Types.ObjectId;
  cashier_id: string;
  items: IPOSSaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'SPLIT';
  payment_details?: Record<string, number>; // e.g. { cash: 50, card: 50 }
  status: 'completed' | 'returned' | 'voided';
  operation_key: string; // IDEMPOTENCY KEY
  created_at: Date;
}

const POSSaleSchema = new Schema<IPOSSale>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  receipt_number: { type: String, required: true, index: true },
  session_id: { type: Schema.Types.ObjectId, required: true, ref: 'POSSession', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Client' },
  cashier_id: { type: String, required: true },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    barcode: { type: String },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    purchase_price: { type: Number, default: 0 },
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
  paid_amount: { type: Number, default: 0 },
  change_amount: { type: Number, default: 0 },
  payment_method: { type: String, enum: ['CASH', 'CARD', 'UPI', 'SPLIT'], default: 'CASH' },
  payment_details: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['completed', 'returned', 'voided'], default: 'completed' },
  operation_key: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now }
});

POSSaleSchema.index({ tenant_id: 1, receipt_number: 1 }, { unique: true });
POSSaleSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });
POSSaleSchema.index({ tenant_id: 1, created_at: -1 });

// ============================================================
// 17. SALES ORDER
// ============================================================
export interface ISalesOrderItem {
  product_id: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  fulfilled_quantity: number;
}

export interface ISalesOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  order_number: string;
  order_date: Date;
  customer_id?: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  items: ISalesOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const SalesOrderSchema = new Schema<ISalesOrder>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  order_number: { type: String, required: true, index: true },
  order_date: { type: Date, default: Date.now },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  status: { type: String, enum: ['DRAFT', 'CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'], default: 'DRAFT' },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax_rate: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    fulfilled_quantity: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SalesOrderSchema.index({ tenant_id: 1, order_number: 1 }, { unique: true });

// ============================================================
// 18. SALES RETURN
// ============================================================
export interface ISalesReturnItem {
  product_id: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  refund_amount: number;
}

export interface ISalesReturn extends Document {
  tenant_id: mongoose.Types.ObjectId;
  return_number: string;
  original_sale_type: 'POS' | 'SalesOrder' | 'SalesInvoice';
  original_sale_id?: string;
  customer_id?: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  items: ISalesReturnItem[];
  subtotal: number;
  tax: number;
  grand_total: number;
  reason: string;
  refund_payment_method: string;
  operation_key: string; // IDEMPOTENCY KEY
  created_by: string;
  created_at: Date;
}

const SalesReturnSchema = new Schema<ISalesReturn>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  return_number: { type: String, required: true, index: true },
  original_sale_type: { type: String, enum: ['POS', 'SalesOrder', 'SalesInvoice'], required: true },
  original_sale_id: { type: String },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Client' },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    tax_amount: { type: Number, default: 0 },
    refund_amount: { type: Number, required: true }
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  reason: { type: String, required: true },
  refund_payment_method: { type: String, default: 'CASH' },
  operation_key: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

SalesReturnSchema.index({ tenant_id: 1, return_number: 1 }, { unique: true });
SalesReturnSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

// ============================================================
// 19. PURCHASE RETURN
// ============================================================
export interface IPurchaseReturnItem {
  product_id: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unit_cost: number;
  credit_amount: number;
}

export interface IPurchaseReturn extends Document {
  tenant_id: mongoose.Types.ObjectId;
  return_number: string;
  purchase_id?: mongoose.Types.ObjectId;
  supplier_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  items: IPurchaseReturnItem[];
  subtotal: number;
  tax: number;
  grand_total: number;
  reason: string;
  operation_key: string; // IDEMPOTENCY KEY
  created_by: string;
  created_at: Date;
}

const PurchaseReturnSchema = new Schema<IPurchaseReturn>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  return_number: { type: String, required: true, index: true },
  purchase_id: { type: Schema.Types.ObjectId, ref: 'Purchase' },
  supplier_id: { type: Schema.Types.ObjectId, required: true, ref: 'Supplier', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse' },
  items: [{
    product_id: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    credit_amount: { type: Number, required: true }
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grand_total: { type: Number, default: 0 },
  reason: { type: String, required: true },
  operation_key: { type: String, required: true, index: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

PurchaseReturnSchema.index({ tenant_id: 1, return_number: 1 }, { unique: true });
PurchaseReturnSchema.index({ tenant_id: 1, operation_key: 1 }, { unique: true });

// ============================================================
// 20. WAREHOUSE LOCATION (RACK / SHELF / BIN)
// ============================================================
export interface IWarehouseLocation extends Document {
  tenant_id: mongoose.Types.ObjectId;
  warehouse_id: mongoose.Types.ObjectId;
  rack: string;
  shelf: string;
  bin: string;
  code: string;
  name?: string;
  is_active: boolean;
  created_at: Date;
}

const WarehouseLocationSchema = new Schema<IWarehouseLocation>({
  tenant_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant', index: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true, ref: 'Warehouse', index: true },
  rack: { type: String, required: true },
  shelf: { type: String, required: true },
  bin: { type: String, required: true },
  code: { type: String, required: true, index: true },
  name: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

WarehouseLocationSchema.index({ tenant_id: 1, warehouse_id: 1, code: 1 }, { unique: true });

// ============================================================
// MODEL EXPORTS
// ============================================================
export const ProductCategory = mongoose.models.ProductCategory || mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema);
export const ProductBrand = mongoose.models.ProductBrand || mongoose.model<IProductBrand>('ProductBrand', ProductBrandSchema);
export const ProductUnit = mongoose.models.ProductUnit || mongoose.model<IProductUnit>('ProductUnit', ProductUnitSchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const ProductVariant = mongoose.models.ProductVariant || mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
export const Warehouse = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
export const InventoryStock = mongoose.models.InventoryStock || mongoose.model<IInventoryStock>('InventoryStock', InventoryStockSchema);
export const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
export const StockAdjustment = mongoose.models.StockAdjustment || mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);
export const StockTransfer = mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
export const ProductBatch = mongoose.models.ProductBatch || mongoose.model<IProductBatch>('ProductBatch', ProductBatchSchema);
export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
export const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
export const POSSession = mongoose.models.POSSession || mongoose.model<IPOSSession>('POSSession', POSSessionSchema);
export const POSSale = mongoose.models.POSSale || mongoose.model<IPOSSale>('POSSale', POSSaleSchema);
export const SalesOrder = mongoose.models.SalesOrder || mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
export const SalesReturn = mongoose.models.SalesReturn || mongoose.model<ISalesReturn>('SalesReturn', SalesReturnSchema);
export const PurchaseReturn = mongoose.models.PurchaseReturn || mongoose.model<IPurchaseReturn>('PurchaseReturn', PurchaseReturnSchema);
export const WarehouseLocation = mongoose.models.WarehouseLocation || mongoose.model<IWarehouseLocation>('WarehouseLocation', WarehouseLocationSchema);

export const initializeCommerceSchema = async () => {
  try {
    await ProductCategory.createIndexes();
    await ProductBrand.createIndexes();
    await ProductUnit.createIndexes();
    await Product.createIndexes();
    await ProductVariant.createIndexes();
    await Supplier.createIndexes();
    await Warehouse.createIndexes();
    await InventoryStock.createIndexes();
    await InventoryTransaction.createIndexes();
    await StockAdjustment.createIndexes();
    await StockTransfer.createIndexes();
    await ProductBatch.createIndexes();
    await PurchaseOrder.createIndexes();
    await Purchase.createIndexes();
    await POSSession.createIndexes();
    await POSSale.createIndexes();
    await SalesOrder.createIndexes();
    await SalesReturn.createIndexes();
    await PurchaseReturn.createIndexes();
    await WarehouseLocation.createIndexes();
    console.log('✅ Commerce schema indexes initialized.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error initializing commerce schema: ${message}`);
  }
};
