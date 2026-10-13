import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import ProductionService from '../services/saas/ProductionService';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('PRODUCTION'));

/**
 * GET /api/production/dashboard
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const metrics = await ProductionService.getDashboardMetrics(tenantId);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /api/production/boms
 */
router.get('/boms', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const boms = await ProductionService.getBOMs(tenantId, req.query as any);
    res.status(200).json({ success: true, data: boms });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/production/boms
 */
router.post('/boms', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const bom = await ProductionService.createBOM(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: bom });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/production/boms/:id/clone
 */
router.post('/boms/:id/clone', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const bom = await ProductionService.cloneBOM(tenantId, req.params.id, userId);
    res.status(201).json({ success: true, data: bom });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/production/orders
 */
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const orders = await ProductionService.getProductionOrders(tenantId, req.query as any);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/production/orders
 */
router.post('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const order = await ProductionService.createProductionOrder(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * PUT /api/production/orders/:id/approve
 */
router.put('/orders/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const order = await ProductionService.approveProductionOrder(tenantId, req.params.id, userId);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/production/orders/:id/consume
 */
router.post('/orders/:id/consume', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const order = await ProductionService.consumeMaterials(tenantId, req.params.id, userId);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/production/orders/:id/complete
 */
router.post('/orders/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const order = await ProductionService.completeProductionOrder(
      tenantId,
      req.params.id,
      req.body.produced_quantity,
      userId
    );
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/production/work-orders
 */
router.get('/work-orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const workOrders = await ProductionService.getWorkOrders(tenantId);
    res.status(200).json({ success: true, data: workOrders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
