import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { tenantAuth } from '../middleware/tenantAuth';
import PurchaseLifecycleController from '../controllers/commerce/purchaseLifecycleController';

const router = Router();

router.use(authMiddleware);
router.use(tenantAuth());

// 1. Purchase Orders
router.get('/orders', PurchaseLifecycleController.getPurchaseOrders);
router.post('/orders', PurchaseLifecycleController.createPurchaseOrder);
router.get('/orders/:id', PurchaseLifecycleController.getPurchaseOrderById);
router.put('/orders/:id/status', PurchaseLifecycleController.updatePOStatus);

// 2. PO → GRN & 3-Way Match Vendor Bills
router.post('/orders/:id/grn', PurchaseLifecycleController.createGRNFromPO);
router.post('/orders/:id/bill', PurchaseLifecycleController.postBillFromPO);

// 3. GRN / Vendor Bills List
router.get('/', PurchaseLifecycleController.getPurchases);

// 4. Supplier Payments
router.post('/payments', PurchaseLifecycleController.recordSupplierPayment);

// 5. Supplier Subledger
router.get('/supplier-ledger/:supplierId', PurchaseLifecycleController.getSupplierLedger);

export default router;
