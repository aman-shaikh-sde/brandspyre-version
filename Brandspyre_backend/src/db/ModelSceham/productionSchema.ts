import mongoose, { Schema, Document } from 'mongoose';

export interface IBOM extends Document {
  tenant_id: mongoose.Types.ObjectId;
  bom_number: string;
  finished_product_id: mongoose.Types.ObjectId;
  quantity_to_produce: number;
  raw_materials: Array<{
    product_id: mongoose.Types.ObjectId;
    quantity: number;
    unit_cost?: number;
  }>;
  labor_cost: number;
  overhead_cost: number;
  total_material_cost: number;
  total_production_cost: number;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const BOMSchema: Schema = new Schema<IBOM>(
  {
    tenant_id: { type: Schema.Types.ObjectId, required: true, index: true },
    bom_number: { type: String, required: true },
    finished_product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity_to_produce: { type: Number, required: true, default: 1 },
    raw_materials: [
      {
        product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        unit_cost: { type: Number, default: 0 }
      }
    ],
    labor_cost: { type: Number, default: 0 },
    overhead_cost: { type: Number, default: 0 },
    total_material_cost: { type: Number, default: 0 },
    total_production_cost: { type: Number, default: 0 },
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    is_deleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

BOMSchema.index({ tenant_id: 1, bom_number: 1 }, { unique: true });

export interface IProductionOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  production_order_number: string;
  bom_id?: mongoose.Types.ObjectId;
  finished_product_id: mongoose.Types.ObjectId;
  warehouse_id?: mongoose.Types.ObjectId;
  planned_quantity: number;
  produced_quantity: number;
  total_cost: number;
  status: 'PLANNED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduled_start_date?: Date;
  scheduled_end_date?: Date;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductionOrderSchema: Schema = new Schema<IProductionOrder>(
  {
    tenant_id: { type: Schema.Types.ObjectId, required: true, index: true },
    production_order_number: { type: String, required: true },
    bom_id: { type: Schema.Types.ObjectId, ref: 'BOM' },
    finished_product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse_id: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    planned_quantity: { type: Number, required: true, default: 1 },
    produced_quantity: { type: Number, default: 0 },
    total_cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNED'
    },
    scheduled_start_date: { type: Date },
    scheduled_end_date: { type: Date },
    is_deleted: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ProductionOrderSchema.index({ tenant_id: 1, production_order_number: 1 }, { unique: true });

export interface IWorkOrder extends Document {
  tenant_id: mongoose.Types.ObjectId;
  work_order_number: string;
  production_order_id: mongoose.Types.ObjectId;
  operation_name: string;
  workstation?: string;
  assigned_to?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: Date;
  updated_at: Date;
}

const WorkOrderSchema: Schema = new Schema<IWorkOrder>(
  {
    tenant_id: { type: Schema.Types.ObjectId, required: true, index: true },
    work_order_number: { type: String, required: true },
    production_order_id: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true },
    operation_name: { type: String, required: true },
    workstation: { type: String },
    assigned_to: { type: String },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const BOM = mongoose.models.BOM || mongoose.model<IBOM>('BOM', BOMSchema);
export const ProductionOrder = mongoose.models.ProductionOrder || mongoose.model<IProductionOrder>('ProductionOrder', ProductionOrderSchema);
export const WorkOrder = mongoose.models.WorkOrder || mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);
