import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import CommerceReportService from '../services/saas/CommerceReportService';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());

// GET /api/reports/commerce/summary
router.get('/summary', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const summary = await CommerceReportService.getExecutiveSummary(tenantId);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/commerce/stock-valuation
router.get('/stock-valuation', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const report = await CommerceReportService.getStockValuationReport(tenantId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/commerce/batch-expiry
router.get('/batch-expiry', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant.id;
    const days = parseInt(req.query.days as string, 10) || 30;
    const report = await CommerceReportService.getBatchExpiryReport(tenantId, days);
    res.json({ success: true, count: report.length, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
