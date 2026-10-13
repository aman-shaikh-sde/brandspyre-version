import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import { authorizePermission } from '../middleware/authorize';
import InventoryService from '../services/saas/InventoryService';
import ProductService from '../services/saas/ProductService';
import {
  InventoryStock,
  InventoryTransaction,
  Warehouse,
  StockAdjustment,
  StockTransfer,
  ProductBatch
} from '../db/ModelSceham/commerceSchema';
import mongoose from 'mongoose';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('INVENTORY'));

/**
 * GET /api/inventory/warehouses
 */
router.get('/warehouses', authorizePermission('inventory.warehouse.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    await ProductService.ensureDefaultWarehouse(tenantId);
    const warehouses = await Warehouse.find({ tenant_id: tenantId, is_active: { $ne: false } }).sort({ is_default: -1, name: 1 });
    res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/inventory/warehouses
 */
router.post('/warehouses', authorizePermission('inventory.warehouse.manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { name, code, address, manager_id } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, error: 'Warehouse name and code are required.' });
      return;
    }

    const warehouse = await Warehouse.create({
      tenant_id: tenantId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      address: address || '',
      manager_id: manager_id || '',
      is_default: false,
      is_active: true,
      created_at: new Date()
    });

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * PUT /api/inventory/warehouses/:id
 */
router.put('/warehouses/:id', authorizePermission('inventory.warehouse.manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const warehouseId = req.params.id;
    const { name, code, address } = req.body;

    const warehouse = await Warehouse.findOne({ _id: warehouseId, tenant_id: tenantId, is_active: { $ne: false } });
    if (!warehouse) {
      res.status(404).json({ success: false, error: 'Warehouse not found.' });
      return;
    }

    if (name) warehouse.name = name.trim();
    if (code) warehouse.code = code.toUpperCase().trim();
    if (address !== undefined) warehouse.address = address;

    await warehouse.save();
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * DELETE /api/inventory/warehouses/:id
 */
router.delete('/warehouses/:id', authorizePermission('inventory.warehouse.manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const warehouseId = req.params.id;

    const warehouse = await Warehouse.findOne({ _id: warehouseId, tenant_id: tenantId, is_active: { $ne: false } });
    if (!warehouse) {
      res.status(404).json({ success: false, error: 'Warehouse not found.' });
      return;
    }

    if (warehouse.is_default) {
      res.status(400).json({ success: false, error: 'Cannot delete the default main warehouse.' });
      return;
    }

    warehouse.is_active = false;
    await warehouse.save();
    res.status(200).json({ success: true, message: 'Warehouse deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/inventory/stock
 */
router.get('/stock', authorizePermission('inventory.stock.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { warehouse_id, search } = req.query;

    const filter: any = { tenant_id: tenantId };
    if (warehouse_id) {
      filter.warehouse_id = new mongoose.Types.ObjectId(warehouse_id as string);
    }

    const stockList = await InventoryStock.find(filter)
      .populate('product_id', 'sku barcode name selling_price purchase_price tax_rate reorder_level category_id')
      .populate('warehouse_id', 'name code')
      .sort({ updated_at: -1 });

    res.status(200).json({ success: true, data: stockList });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/inventory/movements
 */
router.get('/movements', authorizePermission('inventory.stock.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const { product_id, warehouse_id, transaction_type } = req.query;

    const filter: any = { tenant_id: tenantId };
    if (product_id) filter.product_id = new mongoose.Types.ObjectId(product_id as string);
    if (warehouse_id) filter.warehouse_id = new mongoose.Types.ObjectId(warehouse_id as string);
    if (transaction_type) filter.transaction_type = transaction_type;

    const transactions = await InventoryTransaction.find(filter)
      .populate('product_id', 'name sku barcode')
      .populate('warehouse_id', 'name code')
      .sort({ created_at: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/inventory/adjustments
 */
router.get('/adjustments', authorizePermission('inventory.stock.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const adjustments = await StockAdjustment.find({ tenant_id: tenantId })
      .populate('warehouse_id', 'name code')
      .populate('items.product_id', 'name sku')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, data: adjustments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/inventory/adjustments
 */
router.post('/adjustments', authorizePermission('inventory.stock.adjust'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId || (req as any).user?.email || 'system';

    const warehouseId = req.body.warehouseId || req.body.warehouse_id;
    const type = req.body.type;
    const reason = req.body.reason;
    const items = req.body.items;

    if (!warehouseId || !type || !reason || !Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'warehouse_id, type, reason, and items array are required.' });
      return;
    }

    const payload = {
      warehouseId,
      type,
      reason,
      items,
      notes: req.body.notes || ''
    };

    const adjustment = await InventoryService.createStockAdjustment(tenantId, payload, userId);
    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/inventory/transfers
 */
router.get('/transfers', authorizePermission('inventory.stock.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const transfers = await StockTransfer.find({ tenant_id: tenantId })
      .populate('from_warehouse_id', 'name code')
      .populate('to_warehouse_id', 'name code')
      .populate('items.product_id', 'name sku')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/inventory/transfers
 */
router.post('/transfers', authorizePermission('inventory.stock.transfer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId || (req as any).user?.email || 'system';

    const fromWarehouseId = req.body.fromWarehouseId || req.body.from_warehouse_id;
    const toWarehouseId = req.body.toWarehouseId || req.body.to_warehouse_id;
    const items = req.body.items;

    if (!fromWarehouseId || !toWarehouseId || !Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'from_warehouse_id, to_warehouse_id, and items array are required.' });
      return;
    }

    const payload = {
      fromWarehouseId,
      toWarehouseId,
      items,
      notes: req.body.notes || ''
    };

    const transfer = await InventoryService.completeStockTransfer(tenantId, payload, userId);
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/inventory/batches
 */
router.get('/batches', authorizePermission('inventory.batch.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const batches = await ProductBatch.find({ tenant_id: tenantId })
      .populate('product_id', 'name sku')
      .populate('warehouse_id', 'name code')
      .sort({ expiry_date: 1 });

    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
