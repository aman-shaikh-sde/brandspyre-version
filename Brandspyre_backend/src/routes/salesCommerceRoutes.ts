import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import { authorizePermission } from '../middleware/authorize';
import SalesCommerceService from '../services/saas/SalesCommerceService';
import { SalesOrder, SalesReturn } from '../db/ModelSceham/commerceSchema';
import { ProjectInvoice } from '../db/ModelSceham/project/client';

const router = Router();

// Apply core middlewares
router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('SALES'));

// GET /api/sales/orders
router.get('/orders', authorizePermission('sales.view'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const orders = await SalesOrder.find({ tenant_id: tenantId })
      .populate('customer_id', 'name company_name email phone')
      .populate('warehouse_id', 'name code')
      .sort({ created_at: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sales/orders
router.post('/orders', authorizePermission('sales.create'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const createdBy = req.user?.email || req.user?.id || 'system';

    // Validate stock prior to order draft if requested
    if (req.body.validate_stock) {
      const stockCheck = await SalesCommerceService.validateStock(tenantId, req.body.warehouse_id, req.body.items);
      if (!stockCheck.valid) {
        res.status(400).json({ success: false, errors: stockCheck.errors });
        return;
      }
    }

    const newOrder = await SalesCommerceService.createSalesOrder(tenantId, createdBy, req.body);
    res.status(201).json({ success: true, message: 'Sales order created successfully.', data: newOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/sales/orders/:id
router.get('/orders/:id', authorizePermission('sales.view'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const order = await SalesOrder.findOne({ _id: req.params.id, tenant_id: tenantId })
      .populate('customer_id', 'name company_name email phone')
      .populate('warehouse_id', 'name code');

    if (!order) {
      res.status(404).json({ success: false, error: 'Sales order not found.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/sales/orders/:id
router.put('/orders/:id', authorizePermission('sales.edit'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const order = await SalesOrder.findOne({ _id: req.params.id, tenant_id: tenantId });
    if (!order) {
      res.status(404).json({ success: false, error: 'Sales order not found.' });
      return;
    }

    if (order.status !== 'DRAFT') {
      res.status(400).json({ success: false, error: 'Only DRAFT sales orders can be modified.' });
      return;
    }

    if (req.body.items) {
      const calc = SalesCommerceService.calculateTotals(req.body.items);
      order.items = calc.items as any;
      order.subtotal = calc.subtotal;
      order.discount = calc.discount;
      order.tax = calc.tax;
      order.grand_total = calc.grand_total;
    }

    if (req.body.notes !== undefined) order.notes = req.body.notes;
    order.updated_at = new Date();
    await order.save();

    res.json({ success: true, message: 'Sales order updated successfully.', data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/sales/orders/:id/confirm
router.post('/orders/:id/confirm', authorizePermission('sales.edit'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const order = await SalesCommerceService.confirmSalesOrder(tenantId, req.params.id);
    res.json({ success: true, message: 'Sales order confirmed and stock reserved.', data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/sales/orders/:id/fulfill
router.post('/orders/:id/fulfill', authorizePermission('sales.edit'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const createdBy = req.user?.email || req.user?.id || 'system';
    const order = await SalesCommerceService.fulfillSalesOrder(tenantId, req.params.id, createdBy);
    res.json({ success: true, message: 'Sales order fulfilled and inventory updated.', data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/sales/invoices
router.get('/invoices', authorizePermission('sales.view'), async (req: any, res: Response): Promise<void> => {
  try {
    const invoices = await ProjectInvoice.find({})
      .sort({ created_on: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sales/invoices
router.post('/invoices', authorizePermission('sales.create'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const createdBy = req.user?.email || req.user?.id || 'system';
    const invoice = await SalesCommerceService.createSalesInvoice(tenantId, createdBy, req.body);
    res.status(201).json({ success: true, message: 'Sales invoice created successfully.', data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/sales/returns
router.get('/returns', authorizePermission('sales.view'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const returnsList = await SalesReturn.find({ tenant_id: tenantId })
      .populate('customer_id', 'name company_name')
      .populate('warehouse_id', 'name code')
      .sort({ created_at: -1 });

    res.json({ success: true, count: returnsList.length, data: returnsList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sales/returns
router.post('/returns', authorizePermission('sales.create'), async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const createdBy = req.user?.email || req.user?.id || 'system';
    const salesReturn = await SalesCommerceService.processSalesReturn(tenantId, createdBy, req.body);
    res.status(201).json({ success: true, message: 'Sales return processed successfully.', data: salesReturn });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
