import mongoose from 'mongoose';
import {
  POSSale,
  Purchase,
  InventoryStock,
  Product,
  ProductBatch,
  SalesOrder,
  SalesReturn
} from '../../db/ModelSceham/commerceSchema';

export class CommerceReportService {
  /**
   * Executive commerce & retail metrics summary
   */
  static async getExecutiveSummary(tenantId: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Today's POS Sales
    const todaySales = await POSSale.find({
      tenant_id: tId,
      created_at: { $gte: startOfDay },
      status: 'completed'
    });

    const todaySalesTotal = todaySales.reduce((acc, s) => acc + (s.grand_total || 0), 0);

    // Today's Purchases
    const todayPurchases = await Purchase.find({
      tenant_id: tId,
      created_at: { $gte: startOfDay },
      status: 'received'
    });

    const todayPurchasesTotal = todayPurchases.reduce((acc, p) => acc + (p.grand_total || 0), 0);

    // Inventory Stock Valuation
    const allStock = await InventoryStock.find({ tenant_id: tId });
    const stockValuation = allStock.reduce((acc, s) => acc + s.quantity * (s.average_cost || 0), 0);

    const lowStockCount = allStock.filter((s) => s.quantity <= (s.reorder_level || 5)).length;
    const outOfStockCount = allStock.filter((s) => s.quantity === 0).length;

    // Expiring stock in 30 days
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const expiringBatches = await ProductBatch.find({
      tenant_id: tId,
      quantity: { $gt: 0 },
      expiry_date: { $lte: in30Days }
    });

    return {
      today_sales: Math.round(todaySalesTotal * 100) / 100,
      today_sales_count: todaySales.length,
      today_purchases: Math.round(todayPurchasesTotal * 100) / 100,
      today_purchases_count: todayPurchases.length,
      stock_valuation: Math.round(stockValuation * 100) / 100,
      low_stock_items: lowStockCount,
      out_of_stock_items: outOfStockCount,
      expiring_soon_items: expiringBatches.length
    };
  }

  /**
   * Stock valuation report by warehouse & category
   */
  static async getStockValuationReport(tenantId: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const stockList = await InventoryStock.find({ tenant_id: tId })
      .populate('product_id', 'name sku selling_price purchase_price category_id')
      .populate('warehouse_id', 'name code');

    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = stockList.map((s: any) => {
      const prod = s.product_id || {};
      const costVal = s.quantity * (s.average_cost || prod.purchase_price || 0);
      const retailVal = s.quantity * (prod.selling_price || 0);

      totalCostValue += costVal;
      totalRetailValue += retailVal;

      return {
        product_name: prod.name || 'N/A',
        sku: prod.sku || 'N/A',
        warehouse_name: s.warehouse_id?.name || 'Main Warehouse',
        quantity: s.quantity,
        unit_cost: s.average_cost || prod.purchase_price || 0,
        selling_price: prod.selling_price || 0,
        cost_value: Math.round(costVal * 100) / 100,
        retail_value: Math.round(retailVal * 100) / 100
      };
    });

    return {
      total_cost_valuation: Math.round(totalCostValue * 100) / 100,
      total_retail_valuation: Math.round(totalRetailValue * 100) / 100,
      potential_profit_margin: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
      items
    };
  }

  /**
   * Batch & Expiry Audit Report
   */
  static async getBatchExpiryReport(tenantId: string | mongoose.Types.ObjectId, filterDays: number = 30) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + filterDays);

    const batches = await ProductBatch.find({
      tenant_id: tId,
      quantity: { $gt: 0 }
    })
      .populate('product_id', 'name sku')
      .populate('warehouse_id', 'name code')
      .sort({ expiry_date: 1 });

    const now = new Date();

    return batches.map((b: any) => {
      const expDate = b.expiry_date ? new Date(b.expiry_date) : null;
      const isExpired = expDate ? expDate < now : false;
      const daysRemaining = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;

      return {
        batch_number: b.batch_number,
        product_name: b.product_id?.name || 'N/A',
        sku: b.product_id?.sku || 'N/A',
        warehouse_name: b.warehouse_id?.name || 'Main Warehouse',
        quantity: b.quantity,
        manufacturing_date: b.manufacturing_date,
        expiry_date: b.expiry_date,
        is_expired: isExpired,
        days_remaining: daysRemaining
      };
    });
  }
}

export default CommerceReportService;
