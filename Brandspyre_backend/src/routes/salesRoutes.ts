import express from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import SalesLifecycleController from "../controllers/commerce/salesLifecycleController";

// Legacy Controllers
import { viewCampaign } from "../controllers/sales/campaign/view";
import { createCampaign } from "../controllers/sales/campaign/create";
import { editCampaign } from "../controllers/sales/campaign/edit";
import { deleteCampaign } from "../controllers/sales/campaign/delete";
import { viewClients } from "../controllers/sales/clients/view";
import { createClients } from "../controllers/sales/clients/create";
import { editClients } from "../controllers/sales/clients/edit";
import { deleteClients } from "../controllers/sales/clients/delete";
import { viewLeads } from "../controllers/sales/leads/view";
import { createLeads } from "../controllers/sales/leads/create";
import { editLeads } from "../controllers/sales/leads/edit";
import { deleteLeads } from "../controllers/sales/leads/delete";
import { getLeadConversionStatss } from "../controllers/sales/leads/leadConversion";
import { viewClientsPayment } from "../controllers/sales/payments/view";
import { createClientPayment } from "../controllers/sales/payments/create";
import { editClientsPayment } from "../controllers/sales/payments/edit";
import { deleteClientsPayment } from "../controllers/sales/payments/delete";

const router = express.Router();

// Apply auth & tenant isolation to all routes
router.use(authMiddleware);
router.use(tenantAuth());

// 1. Sales Quotations
router.get("/quotations", SalesLifecycleController.getQuotations);
router.post("/quotations", SalesLifecycleController.createQuotation);
router.post("/quotations/:quotationId/convert", SalesLifecycleController.convertQuotationToOrder);

// 2. Sales Orders
router.get("/orders", SalesLifecycleController.getSalesOrders);
router.post("/orders", SalesLifecycleController.createSalesOrder);
router.get("/orders/:id", SalesLifecycleController.getSalesOrderById);
router.put("/orders/:id/status", SalesLifecycleController.updateOrderStatus);

// 3. Delivery Notes
router.get("/deliveries", SalesLifecycleController.getDeliveryNotes);
router.post("/deliveries", SalesLifecycleController.createDeliveryNote);

// 4. Sales Invoices
router.post("/invoices", SalesLifecycleController.createSalesInvoice);

// 5. Customer Receipts / Payments
router.post("/receipts", SalesLifecycleController.recordCustomerPayment);

// 6. Sales Returns & Credit Notes
router.post("/returns", SalesLifecycleController.createSalesReturn);

// 7. Customer Subledger
router.get("/customer-ledger/:customerId", SalesLifecycleController.getCustomerLedger);

// Legacy CRM Routes
router.get("/campaign/read", viewCampaign);
router.post("/campaign/create", createCampaign);
router.put("/campaign/edit/:id", editCampaign);
router.delete("/campaign/delete/:id", deleteCampaign);

router.get("/client/read", viewClients);
router.post("/client/create", createClients);
router.put("/client/edit/:id", editClients);
router.delete("/client/delete/:id", deleteClients);

router.get("/lead/read", viewLeads);
router.post("/lead/create", createLeads);
router.put("/lead/edit/:id", editLeads);
router.delete("/lead/delete/:id", deleteLeads);

router.get("/getleadconversion", getLeadConversionStatss);

router.get("/pay/read", viewClientsPayment);
router.post("/pay/create", createClientPayment);
router.put("/pay/edit/:id", editClientsPayment);
router.delete("/pay/delete/:id", deleteClientsPayment);

export default router;
