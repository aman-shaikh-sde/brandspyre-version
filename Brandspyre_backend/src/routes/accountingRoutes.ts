import express from "express";
import {
  createJournalEntry,
  getTrialBalance,
  getFinancialTransactions,
  createTransaction,
  getChartOfAccounts
} from "../controllers/accounting/accountingController";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Apply tenant authentication middleware to all routes
router.use(tenantAuth());

// Journal Entry routes
router.post("/journal-entry", createJournalEntry);
router.get("/trial-balance", getTrialBalance);

// Financial Transaction routes
router.get("/transactions", getFinancialTransactions);
router.post("/transactions", createTransaction);

// Chart of Accounts routes
router.get("/chart-of-accounts", getChartOfAccounts);

export default router;
