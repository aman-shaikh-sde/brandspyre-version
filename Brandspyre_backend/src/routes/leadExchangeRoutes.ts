import { Router } from "express";
import authenticateToken from "../middleware/auth";
import { getTenantRelationships, createTenantRelationship, updateTenantRelationshipStatus, getAvailableOrganizations } from "../controllers/leadExchange/relationshipController";
import { getSharingRules, createSharingRule, toggleSharingRule } from "../controllers/leadExchange/sharingRuleController";
import { 
  getSharedLeads, 
  shareLeadWithTenant, 
  updateSharedLeadStage, 
  getAvailableLeads,
  assignSharedLeadProcessor,
  recallSharedLead,
  rejectSharedLead,
  getLeadExchangeAnalytics,
  getSharedLeadSettlementStatus
} from "../controllers/leadExchange/sharedLeadController";
import { 
  getB2BSettlementAgreements, 
  createB2BSettlementAgreement, 
  getB2BSettlementTransactions, 
  generateB2BSettlementInvoice, 
  createB2BPaymentOrder,
  verifyB2BPayment,
  disputeSettlementTransaction,
  getMarketplaceCommissions
} from "../controllers/leadExchange/settlementController";

const router = Router();

router.use(authenticateToken);

// Relationships
router.get("/available-organizations", getAvailableOrganizations);
router.get("/relationships", getTenantRelationships);
router.post("/relationships", createTenantRelationship);
router.patch("/relationships/:id/status", updateTenantRelationshipStatus);

// Sharing Rules
router.get("/rules", getSharingRules);
router.post("/rules", createSharingRule);
router.patch("/rules/:id/toggle", toggleSharingRule);

// Shared Leads (Single Source of Truth)
router.get("/available-leads", getAvailableLeads);
router.get("/shared-leads", getSharedLeads);
router.get("/shared-leads/:id/settlement-status", getSharedLeadSettlementStatus);
router.post("/share-lead", shareLeadWithTenant);
router.patch("/shared-leads/:lead_id/stage", updateSharedLeadStage);
router.patch("/shared-leads/:lead_id/assign", assignSharedLeadProcessor);
router.patch("/shared-leads/:lead_id/recall", recallSharedLead);
router.patch("/shared-leads/:lead_id/reject", rejectSharedLead);
router.get("/analytics", getLeadExchangeAnalytics);

// B2B Settlements & Razorpay Marketplace Payment Integration
router.get("/agreements", getB2BSettlementAgreements);
router.get("/settlement-agreements", getB2BSettlementAgreements);
router.post("/agreements", createB2BSettlementAgreement);
router.post("/create-agreement", createB2BSettlementAgreement);
router.get("/transactions", getB2BSettlementTransactions);
router.get("/settlement-transactions", getB2BSettlementTransactions);
router.post("/generate-invoice", generateB2BSettlementInvoice);
router.post("/pay-now", createB2BPaymentOrder);
router.post("/verify-payment", verifyB2BPayment);
router.post("/confirm-payment", verifyB2BPayment); // Backwards-compatible alias routed through HMAC/signature verification
router.post("/dispute/:transaction_id", disputeSettlementTransaction);
router.get("/commissions", getMarketplaceCommissions);

export default router;
