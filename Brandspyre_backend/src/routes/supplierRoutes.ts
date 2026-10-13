import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import { requireModule } from '../middleware/moduleGuard';
import { authorizePermission } from '../middleware/authorize';
import SupplierService from '../services/saas/SupplierService';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());
router.use(requireModule('PURCHASE'));

/**
 * GET /api/suppliers
 */
router.get('/', authorizePermission('suppliers.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const result = await SupplierService.getSuppliers(tenantId, req.query as any);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/suppliers
 */
router.post('/', authorizePermission('suppliers.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;

    if (!req.body.name) {
      res.status(400).json({ success: false, error: 'Supplier name is required.' });
      return;
    }

    const supplier = await SupplierService.createSupplier(tenantId, req.body, userId);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * PUT /api/suppliers/:id
 */
router.put('/:id', authorizePermission('suppliers.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant.id;
    const userId = (req as any).user?.userId;
    const supplierId = req.params.id;

    const supplier = await SupplierService.updateSupplier(tenantId, supplierId, req.body, userId);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
