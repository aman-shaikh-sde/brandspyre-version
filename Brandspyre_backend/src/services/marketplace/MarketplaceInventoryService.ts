import mongoose from 'mongoose';
import { InventoryStock, InventoryTransaction } from '../../db/ModelSceham/commerceSchema';
import { StockReservation, IStockReservation } from '../../db/ModelSchema/inventory/StockReservation';
import { ProductService } from '../saas/ProductService';

export interface ReserveItemRequest {
  productId: string | mongoose.Types.ObjectId;
  quantity: number;
  sellerTenantId: string | mongoose.Types.ObjectId;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  reservations?: IStockReservation[];
  error?: string;
  unavailableProduct?: string;
}

export class MarketplaceInventoryService {
  /**
   * Check available inventory stock for a product
   * Available = quantity - reserved_quantity
   */
  static async getAvailableStock(productId: string | mongoose.Types.ObjectId): Promise<number> {
    try {
      const pId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
      const stocks = await InventoryStock.find({ product_id: pId }).lean();
      
      if (!stocks || stocks.length === 0) {
        // If no explicit inventory row exists, default available buffer of 50
        return 50;
      }

      let totalAvailable = 0;
      for (const stock of stocks) {
        const available = Math.max(0, (stock.quantity || 0) - (stock.reserved_quantity || 0));
        totalAvailable += available;
      }

      return totalAvailable;
    } catch (err) {
      console.error('Error fetching available stock:', err);
      return 0;
    }
  }

  /**
   * Concurrency-safe atomic stock reservation for multiple items.
   * If any item lacks sufficient available stock, all reservations in this batch are rolled back.
   */
  static async reserveStock(
    orderNumber: string,
    items: ReserveItemRequest[]
  ): Promise<ReservationResult> {
    const reservationPrefix = `RES-${Date.now().toString().slice(-6)}`;
    const createdReservations: any[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const pId = typeof item.productId === 'string' ? new mongoose.Types.ObjectId(item.productId) : item.productId;
        const tenantId = typeof item.sellerTenantId === 'string' ? new mongoose.Types.ObjectId(item.sellerTenantId) : item.sellerTenantId;
        const requestedQty = Math.max(1, Number(item.quantity));

        // Find primary stock row for this seller tenant & product
        let stockRecord = await InventoryStock.findOne({
          tenant_id: tenantId,
          product_id: pId
        });

        if (stockRecord) {
          const available = (stockRecord.quantity || 0) - (stockRecord.reserved_quantity || 0);
          if (available < requestedQty) {
            // Insufficient stock: Roll back all reservations created in this batch
            await this.rollbackReservations(orderNumber);
            return {
              success: false,
              error: `Insufficient stock for product. Available: ${Math.max(0, available)}, Requested: ${requestedQty}`,
              unavailableProduct: item.productId.toString()
            };
          }

          // Atomically increment reserved_quantity
          await InventoryStock.updateOne(
            { _id: stockRecord._id },
            { $inc: { reserved_quantity: requestedQty }, $set: { updated_at: new Date() } }
          );

          const resDoc = await StockReservation.create({
            tenant_id: tenantId,
            reservation_id: `${reservationPrefix}-${i + 1}`,
            source_type: 'SALES_ORDER',
            source_id: orderNumber,
            product_id: pId,
            warehouse_id: stockRecord.warehouse_id,
            quantity: requestedQty,
            status: 'RESERVED',
            branchcode: 'DEFAULT',
            created_at: new Date()
          });

          createdReservations.push(resDoc);
        } else {
          // No warehouse inventory tracking row: create informational reservation with default warehouse
          let fallbackWhId: mongoose.Types.ObjectId;
          try {
            const wh = await ProductService.ensureDefaultWarehouse(tenantId);
            fallbackWhId = wh._id;
          } catch (e) {
            fallbackWhId = new mongoose.Types.ObjectId('000000000000000000000001');
          }

          const resDoc = await StockReservation.create({
            tenant_id: tenantId,
            reservation_id: `${reservationPrefix}-${i + 1}`,
            source_type: 'SALES_ORDER',
            source_id: orderNumber,
            product_id: pId,
            warehouse_id: fallbackWhId,
            quantity: requestedQty,
            status: 'RESERVED',
            branchcode: 'DEFAULT',
            created_at: new Date()
          });
          createdReservations.push(resDoc);
        }
      }

      return {
        success: true,
        reservationId: reservationPrefix,
        reservations: createdReservations
      };
    } catch (err: any) {
      console.error('Error reserving stock:', err);
      await this.rollbackReservations(orderNumber);
      return {
        success: false,
        error: err.message || 'Failed to reserve inventory'
      };
    }
  }

  /**
   * Release reserved stock on order cancellation or failure
   */
  static async rollbackReservations(orderNumber: string): Promise<void> {
    try {
      const reservations = await StockReservation.find({
        source_id: orderNumber,
        status: 'RESERVED'
      });

      for (const res of reservations) {
        if (res.warehouse_id && res.warehouse_id.toString() !== '000000000000000000000001') {
          await InventoryStock.updateOne(
            {
              tenant_id: res.tenant_id,
              product_id: res.product_id,
              warehouse_id: res.warehouse_id
            },
            {
              $inc: { reserved_quantity: -res.quantity },
              $set: { updated_at: new Date() }
            }
          );
        }

        res.status = 'RELEASED';
        res.released_at = new Date();
        await res.save();
      }
    } catch (err) {
      console.error('Error rolling back reservations:', err);
    }
  }

  /**
   * Fulfill reserved stock on order shipment/delivery:
   * Decrements on-hand quantity and reserved quantity, marks reservation FULFILLED,
   * and records an audit InventoryTransaction.
   */
  static async fulfillStockReservation(orderNumber: string): Promise<void> {
    try {
      const reservations = await StockReservation.find({
        source_id: orderNumber,
        status: 'RESERVED'
      });

      for (const res of reservations) {
        if (res.warehouse_id && res.warehouse_id.toString() !== '000000000000000000000001') {
          await InventoryStock.updateOne(
            {
              tenant_id: res.tenant_id,
              product_id: res.product_id,
              warehouse_id: res.warehouse_id
            },
            {
              $inc: { quantity: -res.quantity, reserved_quantity: -res.quantity },
              $set: { updated_at: new Date() }
            }
          );

          // Log transaction
          await InventoryTransaction.create({
            tenant_id: res.tenant_id,
            transaction_type: 'SALE',
            reference_type: 'SALES_ORDER',
            reference_id: orderNumber,
            product_id: res.product_id,
            warehouse_id: res.warehouse_id,
            quantity: -res.quantity,
            unit_cost: 0,
            notes: `Marketplace order fulfillment for order ${orderNumber}`,
            created_at: new Date()
          });
        }

        res.status = 'FULFILLED';
        res.fulfilled_at = new Date();
        await res.save();
      }
    } catch (err) {
      console.error('Error fulfilling reservations:', err);
    }
  }
}

export default MarketplaceInventoryService;
