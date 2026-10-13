import { Request, Response } from 'express';
import SalesWorkflowService from '../../services/sales/SalesWorkflowService';
import { SalesQuotation } from '../../db/ModelSchema/commerce/SalesQuotation';
import { SalesOrder as SalesOrderDomain } from '../../db/ModelSchema/commerce/SalesOrder';
import { SalesReturn } from '../../db/ModelSceham/commerceSchema';
import { DeliveryNote } from '../../db/ModelSchema/commerce/DeliveryNote';
import { CustomerLedger } from '../../db/ModelSchema/commerce/CustomerLedger';

export class SalesLifecycleController {
  /**
   * 1. Create Sales Quotation
   */
  static async createQuotation(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const quotation = await SalesWorkflowService.createQuotation({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: quotation });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 2. List Sales Quotations
   */
  static async getQuotations(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const quotations = await SalesQuotation.find({ tenant_id: tenantId }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: quotations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 3. Create Production-Grade Sales Order
   */
  static async createSalesOrder(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const order = await SalesWorkflowService.createSalesOrder({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 4. List Sales Orders
   */
  static async getSalesOrders(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const orders = await SalesOrderDomain.find({ tenant_id: tenantId }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 5. Get Sales Order by ID
   */
  static async getSalesOrderById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;

      const order = await SalesOrderDomain.findOne({ _id: id, tenant_id: tenantId })
        .populate('customer_id')
        .populate('warehouse_id')
        .lean();

      if (!order) {
        res.status(404).json({ success: false, error: 'Sales Order not found' });
        return;
      }

      res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 6. Update Order Status Lifecycle
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = (req as any).user?.email || 'SYSTEM';

      const order = await SalesWorkflowService.updateOrderStatus(tenantId, id, status, updatedBy);
      res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 7. Convert Quotation → Sales Order
   */
  static async convertQuotationToOrder(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { quotationId } = req.params;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const order = await SalesWorkflowService.convertQuotationToSalesOrder(tenantId, quotationId, createdBy);
      res.status(200).json({ success: true, data: order });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 8. Create Delivery Note
   */
  static async createDeliveryNote(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const delivery = await SalesWorkflowService.createDeliveryNote({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: delivery });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 9. List Delivery Notes
   */
  static async getDeliveryNotes(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const deliveries = await DeliveryNote.find({ tenant_id: tenantId }).sort({ created_at: -1 }).lean();
      res.status(200).json({ success: true, data: deliveries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * 10. Create Sales Invoice
   */
  static async createSalesInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const invoiceResult = await SalesWorkflowService.createSalesInvoiceAndPostAccounting({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: invoiceResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 11. Record Customer Payment Receipt
   */
  static async recordCustomerPayment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const receipt = await SalesWorkflowService.recordCustomerPayment({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: receipt });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 12. Create Sales Return
   */
  static async createSalesReturn(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'SYSTEM';

      const salesReturn = await SalesWorkflowService.createSalesReturn({
        ...req.body,
        tenantId,
        createdBy
      });

      res.status(201).json({ success: true, data: salesReturn });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * 13. Get Customer Subledger
   */
  static async getCustomerLedger(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenant_id || (req as any).user?.tenantId;
      const { customerId } = req.params;

      const ledger = await CustomerLedger.find({ tenant_id: tenantId, customer_id: customerId })
        .sort({ transaction_date: -1 })
        .lean();

      res.status(200).json({ success: true, data: ledger });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default SalesLifecycleController;
