import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import { authorizePermission } from '../middleware/authorize';
import POSService from '../services/saas/POSService';
import { POSSession, POSSale } from '../db/ModelSceham/commerceSchema';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('POS'));

/**
 * GET /api/pos/session/active
 */
router.get('/session/active', authorizePermission('pos.access'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;

    const session = await POSSession.findOne({
      tenant_id: tenantId,
      cashier_id: String(userId),
      status: 'open'
    }).populate('warehouse_id', 'name code');

    res.status(200).json({ success: true, data: session || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/pos/session/open
 */
router.post('/session/open', authorizePermission('pos.access'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const userName = (req as any).user?.name || 'Cashier';

    const session = await POSService.openSession(tenantId, {
      cashierId: String(userId),
      cashierName: userName,
      warehouseId: req.body.warehouseId,
      openingCash: req.body.openingCash
    });

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/pos/session/close
 */
router.post('/session/close', authorizePermission('pos.access'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const { sessionId, closingCash } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId is required.' });
      return;
    }

    const session = await POSService.closeSession(tenantId, sessionId, closingCash, String(userId));
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/pos/checkout (Atomic Checkout Pipeline)
 */
router.post('/checkout', authorizePermission('pos.sale.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;

    if (!req.body.sessionId || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      res.status(400).json({ success: false, error: 'sessionId and non-empty items array are required.' });
      return;
    }

    const result = await POSService.processCheckout(tenantId, req.body, String(userId));
    res.status(201).json({ success: true, data: result.sale, isDuplicate: result.isDuplicate });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /api/pos/sales (List POS transactions)
 */
router.get('/sales', authorizePermission('pos.access'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const sales = await POSSale.find({ tenant_id: tenantId })
      .populate('customer_id', 'client_name company_name primary_phone')
      .sort({ created_at: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
