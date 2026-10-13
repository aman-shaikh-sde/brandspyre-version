import express from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import {
  createContract,
  getContracts,
  createAgreement,
  createAgreementVersion,
  getAgreements,
  getAgreementById,
  createBillingRule,
  saveSuccessStageConfig,
  getSuccessStageConfig,
  getBillableTransactions,
  tierApproveTransaction,
  clientAcceptLead,
  reverseTransaction,
  createDispute,
  getDisputes,
  resolveDispute,
  generateInvoiceFromTransactions,
  getBillingDashboard,
  getROASAnalytics,
  runDailyCronTasks
} from "../controllers/billing/billingController";

const router = express.Router();

// Apply auth and tenant isolation middleware
router.use(authMiddleware);
router.use(tenantAuth());

// Client Master Contracts endpoints
router.post("/contracts", createContract);
router.get("/contracts", getContracts);

// Client Agreement Versioning endpoints
router.post("/agreements", createAgreement);
router.post("/agreements/:id/version", createAgreementVersion);
router.get("/agreements", getAgreements);
router.get("/agreements/:id", getAgreementById);

// Billing Rule endpoints
router.post("/rules", createBillingRule);

// Success Stage Configuration endpoints
router.post("/success-stages", saveSuccessStageConfig);
router.get("/success-stages", getSuccessStageConfig);

// Billable Transaction Ledger, Approvals & Client Acceptance endpoints
router.get("/transactions", getBillableTransactions);
router.post("/transactions/:id/tier-approve", tierApproveTransaction);
router.post("/transactions/:id/client-accept", clientAcceptLead);
router.post("/transactions/:id/reverse", reverseTransaction);

// Dispute Resolution endpoints
router.post("/disputes", createDispute);
router.get("/disputes", getDisputes);
router.post("/disputes/:id/resolve", resolveDispute);

// Invoice Integration endpoint
router.post("/generate-invoice", generateInvoiceFromTransactions);

// Operational Automation & Analytics endpoints
router.post("/cron/run-daily-tasks", runDailyCronTasks);
router.get("/dashboard", getBillingDashboard);
router.get("/roas-analytics", getROASAnalytics);

export default router;
