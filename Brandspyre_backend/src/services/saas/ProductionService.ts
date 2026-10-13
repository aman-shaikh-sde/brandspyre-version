import mongoose from 'mongoose';
import { BOM, ProductionOrder, WorkOrder } from '../../db/ModelSceham/productionSchema';

export class ProductionService {
  /**
   * Get production dashboard metrics
   */
  static async getDashboardMetrics(tenantId: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const plannedOrders = await ProductionOrder.countDocuments({ tenant_id: tId, status: 'PLANNED', is_deleted: { $ne: true } });
    const inProgressOrders = await ProductionOrder.countDocuments({ tenant_id: tId, status: 'IN_PROGRESS', is_deleted: { $ne: true } });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedToday = await ProductionOrder.countDocuments({
      tenant_id: tId,
      status: 'COMPLETED',
      updated_at: { $gte: startOfToday },
      is_deleted: { $ne: true }
    });

    const completedOrders = await ProductionOrder.find({ tenant_id: tId, status: 'COMPLETED', is_deleted: { $ne: true } });
    const finishedGoodsProduced = completedOrders.reduce((sum, o) => sum + (o.produced_quantity || 0), 0);
    const totalManufacturingCost = completedOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);

    return {
      planned_orders: plannedOrders,
      in_progress_orders: inProgressOrders,
      completed_today: completedToday,
      material_shortages: 0,
      finished_goods_produced: finishedGoodsProduced,
      total_manufacturing_cost: totalManufacturingCost
    };
  }

  /**
   * Get Bills of Materials (BOM)
   */
  static async getBOMs(tenantId: string | mongoose.Types.ObjectId, query?: { search?: string }) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const filter: any = { tenant_id: tId, is_deleted: { $ne: true } };

    if (query?.search) {
      filter.$or = [
        { bom_number: { $regex: query.search, $options: 'i' } }
      ];
    }

    const boms = await BOM.find(filter)
      .populate('finished_product_id', 'name sku barcode unit_id')
      .populate('raw_materials.product_id', 'name sku purchase_price')
      .sort({ created_at: -1 });

    return boms;
  }

  /**
   * Create new BOM
   */
  static async createBOM(tenantId: string | mongoose.Types.ObjectId, data: any, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const count = await BOM.countDocuments({ tenant_id: tId });
    const bomNumber = data.bom_number || `BOM-${String(count + 1001).padStart(4, '0')}`;

    let totalMaterialCost = 0;
    if (Array.isArray(data.raw_materials)) {
      for (const item of data.raw_materials) {
        totalMaterialCost += (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
      }
    }

    const laborCost = Number(data.labor_cost) || 0;
    const overheadCost = Number(data.overhead_cost) || 0;
    const totalProductionCost = totalMaterialCost + laborCost + overheadCost;

    const bom = await BOM.create({
      tenant_id: tId,
      bom_number: bomNumber,
      finished_product_id: data.finished_product_id,
      quantity_to_produce: Number(data.quantity_to_produce) || 1,
      raw_materials: data.raw_materials || [],
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      total_material_cost: totalMaterialCost,
      total_production_cost: totalProductionCost,
      notes: data.notes,
      status: data.status || 'ACTIVE'
    });

    return bom;
  }

  /**
   * Clone an existing BOM
   */
  static async cloneBOM(tenantId: string | mongoose.Types.ObjectId, bomId: string, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const original = await BOM.findOne({ _id: bomId, tenant_id: tId });

    if (!original) {
      throw new Error('BOM not found.');
    }

    const count = await BOM.countDocuments({ tenant_id: tId });
    const newBomNumber = `BOM-${String(count + 1001).padStart(4, '0')}`;

    const cloned = await BOM.create({
      tenant_id: tId,
      bom_number: newBomNumber,
      finished_product_id: original.finished_product_id,
      quantity_to_produce: original.quantity_to_produce,
      raw_materials: original.raw_materials,
      labor_cost: original.labor_cost,
      overhead_cost: original.overhead_cost,
      total_material_cost: original.total_material_cost,
      total_production_cost: original.total_production_cost,
      notes: `Cloned from ${original.bom_number}`,
      status: 'ACTIVE'
    });

    return cloned;
  }

  /**
   * Get Production Orders
   */
  static async getProductionOrders(tenantId: string | mongoose.Types.ObjectId, query?: { search?: string }) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const filter: any = { tenant_id: tId, is_deleted: { $ne: true } };

    if (query?.search) {
      filter.$or = [
        { production_order_number: { $regex: query.search, $options: 'i' } }
      ];
    }

    const orders = await ProductionOrder.find(filter)
      .populate('finished_product_id', 'name sku barcode')
      .populate('warehouse_id', 'name code')
      .populate('bom_id', 'bom_number total_production_cost')
      .sort({ created_at: -1 });

    return orders;
  }

  /**
   * Create Production Order
   */
  static async createProductionOrder(tenantId: string | mongoose.Types.ObjectId, data: any, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const count = await ProductionOrder.countDocuments({ tenant_id: tId });
    const poNumber = data.production_order_number || `PO-${String(count + 2001).padStart(4, '0')}`;

    const order = await ProductionOrder.create({
      tenant_id: tId,
      production_order_number: poNumber,
      bom_id: data.bom_id || undefined,
      finished_product_id: data.finished_product_id,
      warehouse_id: data.warehouse_id || undefined,
      planned_quantity: Number(data.planned_quantity) || 1,
      produced_quantity: 0,
      total_cost: Number(data.total_cost) || 0,
      status: 'PLANNED',
      scheduled_start_date: data.scheduled_start_date ? new Date(data.scheduled_start_date) : undefined,
      scheduled_end_date: data.scheduled_end_date ? new Date(data.scheduled_end_date) : undefined
    });

    return order;
  }

  /**
   * Approve Production Order
   */
  static async approveProductionOrder(tenantId: string | mongoose.Types.ObjectId, orderId: string, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const order = await ProductionOrder.findOneAndUpdate(
      { _id: orderId, tenant_id: tId },
      { status: 'APPROVED', updated_at: new Date() },
      { new: true }
    );

    if (!order) throw new Error('Production Order not found.');
    return order;
  }

  /**
   * Consume Materials for Production Order
   */
  static async consumeMaterials(tenantId: string | mongoose.Types.ObjectId, orderId: string, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const order = await ProductionOrder.findOne({ _id: orderId, tenant_id: tId });
    if (!order) throw new Error('Production Order not found.');

    order.status = 'IN_PROGRESS';
    order.updated_at = new Date();
    await order.save();

    return order;
  }

  /**
   * Complete Production Order
   */
  static async completeProductionOrder(
    tenantId: string | mongoose.Types.ObjectId,
    orderId: string,
    producedQuantity?: number,
    userId?: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const order = await ProductionOrder.findOne({ _id: orderId, tenant_id: tId });
    if (!order) throw new Error('Production Order not found.');

    const finalProducedQty = producedQuantity !== undefined ? Number(producedQuantity) : order.planned_quantity;

    order.status = 'COMPLETED';
    order.produced_quantity = finalProducedQty;
    order.updated_at = new Date();
    await order.save();

    return order;
  }

  /**
   * Get Work Orders
   */
  static async getWorkOrders(tenantId: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    const workOrders = await WorkOrder.find({ tenant_id: tId })
      .populate({
        path: 'production_order_id',
        populate: { path: 'finished_product_id', select: 'name sku' }
      })
      .sort({ created_at: -1 });

    return workOrders;
  }
}

export default ProductionService;
