import { Request, Response } from 'express';
import PurchaseWorkflowService from '../../services/procurement/PurchaseWorkflowService';
import { PurchaseOrder } from '../../db/ModelSchema/procurement/PurchaseOrder';
import { Purchase } from '../../db/ModelSceham/commerceSchema';
import { SupplierLedger } from '../../db/ModelSchema/procurement/SupplierLedger';

export class PurchaseLifecycleController {
  /**
   * 1. Create Production-Grade Purchase Order
   */
  static async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const po = await PurchaseWorkflowService.createPurchaseOrder({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: po });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 2. Get All Purchase Orders
   */
  static async getPurchaseOrders(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const pos = await PurchaseOrder.find({ tenant_id: tenantId }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: pos });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 3. Get Purchase Order Details by ID
   */
  static async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;

      const po = await PurchaseOrder.findOne({ _id: id, tenant_id: tenantId })
        .populate('supplier_id')
        .populate('warehouse_id')
        .lean();

      if (!po) {
        res.status(404).json({ success: false, error: 'Purchase Order not found' });
        return;
      }

      res.status(200).json({ success: true, data: po });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 4. Update PO Status Lifecycle (Approve, Send, Cancel, Close)
   */
  static async updatePOStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.email || 'SYSTEM';

      const po = await PurchaseWorkflowService.updatePOStatus(tenantId, id, status, updatedBy);
      res.status(200).json({ success: true, data: po });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 5. Convert PO → GRN (Goods Receipt Note & Physical Stock Update)
   */
  static async createGRNFromPO(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const grnResult = await PurchaseWorkflowService.createGRNFromPO({
        ...req.body,
        tenantId,
        purchaseOrderId: id,
        createdBy
      });

      res.status(201).json({ success: true, data: grnResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 6. Convert PO → Vendor Bill (with 3-Way Match)
   */
  static async postBillFromPO(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const billResult = await PurchaseWorkflowService.postVendorBillFromPO({
        ...req.body,
        tenantId,
        purchaseOrderId: id,
        createdBy
      });

      res.status(201).json({ success: true, data: billResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 7. Get Purchases / Vendor Bills
   */
  static async getPurchases(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const purchases = await Purchase.find({ tenant_id: tenantId }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 8. Record Supplier Payment
   */
  static async recordSupplierPayment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const payment = await PurchaseWorkflowService.recordSupplierPayment({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: payment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 9. Get Supplier Subledger
   */
  static async getSupplierLedger(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { supplierId } = req.params;

      const ledger = await SupplierLedger.find({ tenant_id: tenantId, supplier_id: supplierId })
        .sort({ transaction_date: -1 })
        .lean();

      res.status(200).json({ success: true, data: ledger });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default PurchaseLifecycleController;
