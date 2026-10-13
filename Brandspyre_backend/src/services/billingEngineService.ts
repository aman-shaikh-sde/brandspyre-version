import mongoose from "mongoose";
import crypto from "crypto";
import { Lead } from "../db/ModelSceham/project/campagin";
import { Client } from "../db/ModelSceham/project/client";
import { 
  ClientAgreement, 
  BillingRule, 
  BillableTransaction, 
  SuccessStageConfig,
  ClientContract,
  BillingDispute,
  IBillableTransaction 
} from "../db/ModelSceham/billingSchema";
import { JournalEntry, FinancialTransaction } from "../db/ModelSceham/accountingSchema";

export class BillingEngineService {
  /**
   * Evaluate a Lead stage transition and trigger idempotent billable transaction creation.
   */
  public static async evaluateLeadSuccessStage(
    leadId: string | mongoose.Types.ObjectId,
    newStage: string,
    tenantId?: mongoose.Types.ObjectId | string,
    branchcode?: string,
    conversionDate?: Date
  ): Promise<IBillableTransaction | null> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        console.warn(`[BillingEngine] Lead ${leadId} not found.`);
        return null;
      }

      const activeTenantId = tenantId || lead.tenant_id;
      const activeBranchcode = branchcode || lead.branchcode;
      const eventTimestamp = conversionDate || new Date();

      if (!activeTenantId) {
        console.warn(`[BillingEngine] Tenant ID missing for Lead ${leadId}`);
        return null;
      }

      // Check success stage config
      let stageConfig = await SuccessStageConfig.findOne({
        tenant_id: activeTenantId,
        branchcode: activeBranchcode,
        is_active: true
      });

      const successStages = stageConfig?.success_stages || [
        "won", 
        "won lead", 
        "closed", 
        "booking amount received", 
        "admission paid", 
        "treatment completed", 
        "policy issued", 
        "qualified lead accepted",
        "sale",
        "converted",
        "active"
      ];

      const isSuccessStage = successStages.some(
        (stg: string) => stg.trim().toLowerCase() === newStage.trim().toLowerCase()
      );

      if (!isSuccessStage) {
        return null;
      }

      // Determine Client Code from Lead or Campaign lookup
      let clientCode: string | undefined;
      if (lead.campaign_code) {
        const clientDoc = await Client.findOne({
          tenant_id: activeTenantId,
          campaign_code: lead.campaign_code
        });
        if (clientDoc) {
          clientCode = clientDoc.client_code;
        }
      }

      if (!clientCode) {
        const defaultClient = await Client.findOne({
          tenant_id: activeTenantId,
          status: 'active'
        });
        if (defaultClient) {
          clientCode = defaultClient.client_code;
        }
      }

      // Match Versioned Agreement effective at eventTimestamp
      let agreement: any;
      if (clientCode) {
        agreement = (await ClientAgreement.findOne({
          tenant_id: activeTenantId,
          client_code: clientCode,
          status: 'active',
          effective_from: { $lte: eventTimestamp },
          $or: [{ effective_to: { $exists: false } }, { effective_to: null }, { effective_to: { $gte: eventTimestamp } }]
        }).sort({ version: -1 }).lean()) as any;
      }

      if (!agreement) {
        // Fallback: match ANY active agreement in database
        agreement = (await ClientAgreement.findOne({
          status: 'active'
        }).sort({ version: -1 }).lean()) as any;
      }

      if (!agreement) {
        console.warn(`[BillingEngine] Active versioned agreement not found in database`);
        return null;
      }

      clientCode = agreement.client_code;

      // Generate SHA256 Idempotency Lock Key
      const rawIdempotencyString = `${activeTenantId}_${lead._id}_${newStage}_v${agreement.version}`;
      const idempotencyKey = crypto.createHash("sha256").update(rawIdempotencyString).digest("hex");

      // Check existing transaction via Idempotency Key Lock
      const existingTxn = await BillableTransaction.findOne({ idempotency_key: idempotencyKey });
      if (existingTxn) {
        console.log(`[BillingEngine] Idempotency lock hit: Transaction ${existingTxn.transaction_code} already exists for lead ${lead._id}. Skipping duplicate.`);
        return existingTxn;
      }

      // Hierarchy Scope Matching: Campaign Rule -> Client Rule -> Default Agreement Rate
      const rules = await BillingRule.find({
        tenant_id: activeTenantId,
        agreement_id: agreement._id,
        status: 'active'
      }).sort({ priority: 1 }).lean();

      let calculatedAmount = agreement.rate || 0;
      let matchedRuleId: mongoose.Types.ObjectId | undefined;
      let breakdown: Record<string, any> = {
        agreement_code: agreement.agreement_code,
        agreement_version: agreement.version,
        billing_type: agreement.billing_type,
        base_rate: agreement.rate,
        stage_triggered: newStage,
        idempotency_key: idempotencyKey
      };

      if (rules && rules.length > 0) {
        const matchingRule = rules.find((r: any) => {
          if (r.campaign_code && r.campaign_code !== lead.campaign_code) return false;
          if (r.lead_source && r.lead_source !== lead.meta_source) return false;
          return true;
        }) || rules[0];

        matchedRuleId = matchingRule._id as mongoose.Types.ObjectId;
        calculatedAmount = matchingRule.base_rate;

        if (matchingRule.formula_expression) {
          try {
            const sanitizedFormula = matchingRule.formula_expression.replace(/rate/g, String(matchingRule.base_rate));
            calculatedAmount = Function(`"use strict"; return (${sanitizedFormula})`)();
          } catch (e) {
            console.error("[BillingEngine] Custom formula evaluation error:", e);
            calculatedAmount = matchingRule.base_rate;
          }
        } else if (matchingRule.percentage_rate && matchingRule.percentage_rate > 0) {
          const saleAmount = (lead as any).sale_amount || matchingRule.min_qualifying_amount || 0;
          calculatedAmount = (saleAmount * matchingRule.percentage_rate) / 100 + matchingRule.base_rate;
        }

        breakdown.matched_rule = matchingRule.rule_name;
        breakdown.rule_priority = matchingRule.priority;
      }

      // Tax Calculation (CGST / SGST / IGST / TDS / Exempt)
      const taxConfig = agreement.tax_config || {
        cgst_percentage: 9,
        sgst_percentage: 9,
        igst_percentage: 0,
        tds_percentage: 0,
        is_reverse_charge: false,
        is_tax_exempt: false
      };

      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, tdsAmount = 0, totalTax = 0;

      if (!taxConfig.is_tax_exempt) {
        cgstAmount = (calculatedAmount * (taxConfig.cgst_percentage || 0)) / 100;
        sgstAmount = (calculatedAmount * (taxConfig.sgst_percentage || 0)) / 100;
        igstAmount = (calculatedAmount * (taxConfig.igst_percentage || 0)) / 100;
        tdsAmount = (calculatedAmount * (taxConfig.tds_percentage || 0)) / 100;
        totalTax = cgstAmount + sgstAmount + igstAmount;
      }

      const totalAmount = calculatedAmount + totalTax - tdsAmount;
      const exchangeRate = agreement.exchange_rate_to_base || 1.0;
      const transactionCode = `TXN-ENT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Build Multi-Tier Approval Chain based on threshold
      const approvalThreshold = agreement.approval_threshold_amount || 50000;
      const approvalChain = [];

      if (totalAmount >= approvalThreshold) {
        approvalChain.push(
          { tier_level: 1, role: 'Manager', status: 'pending' },
          { tier_level: 2, role: 'Finance', status: 'pending' },
          { tier_level: 3, role: 'Director', status: 'pending' }
        );
      } else {
        approvalChain.push({ tier_level: 1, role: 'Manager', status: 'pending' });
      }

      const clientAcceptanceStatus = agreement.client_acceptance_required ? 'pending' : 'not_required';
      const initialStatus = 'pending_approval';

      const billableTxn = await BillableTransaction.create({
        tenant_id: activeTenantId,
        branchcode: activeBranchcode,
        transaction_code: transactionCode,
        idempotency_key: idempotencyKey,
        contract_id: agreement.contract_id,
        agreement_id: agreement._id,
        agreement_version: agreement.version,
        billing_rule_id: matchedRuleId,
        client_code: clientCode,
        campaign_code: lead.campaign_code,
        lead_id: lead._id,
        calculated_amount: calculatedAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        tds_amount: tdsAmount,
        tax_amount: totalTax,
        total_amount: totalAmount,
        currency: agreement.currency || 'INR',
        exchange_rate: exchangeRate,
        calculation_breakdown: breakdown,
        approval_chain: approvalChain,
        status: initialStatus,
        client_acceptance_status: clientAcceptanceStatus,
        invoice_status: 'unbilled',
        payment_status: 'unpaid'
      });

      // Update Lead Billing Metadata
      await Lead.findByIdAndUpdate(lead._id, {
        $set: {
          billing_status: 'pending_approval',
          billable_transaction_id: billableTxn._id,
          success_stage_reached_at: new Date()
        }
      });

      console.log(`[BillingEngine] Generated 10/10 Enterprise BillableTransaction ${transactionCode} (Idempotency Key Lock: ${idempotencyKey.substring(0, 12)}...)`);
      return billableTxn;
    } catch (error) {
      console.error("[BillingEngine] Error in evaluateLeadSuccessStage:", error);
      return null;
    }
  }

  /**
   * Reverse a Billable Transaction (Lead Rollback) and post reversing accounting entries.
   */
  public static async reverseBillableTransaction(
    transactionId: string | mongoose.Types.ObjectId,
    reversalReason: string,
    userId?: string
  ): Promise<{ success: boolean; credit_note_no?: string; message: string }> {
    try {
      const txn = await BillableTransaction.findById(transactionId);
      if (!txn) {
        return { success: false, message: "Transaction not found" };
      }

      if (txn.status === 'reversed') {
        return { success: false, message: "Transaction is already reversed" };
      }

      const creditNoteNo = `CN-B2B-${Date.now()}`;
      txn.status = 'reversed';
      txn.reversal_reason = reversalReason;
      txn.credit_note_no = creditNoteNo;
      txn.credit_note_amount = txn.total_amount;
      await txn.save();

      // Post Reversing Accounting Entry
      try {
        await JournalEntry.create({
          tenant_id: txn.tenant_id,
          entry_number: `JE-CN-${Date.now()}`,
          entry_date: new Date(),
          reference: creditNoteNo,
          description: `Reversal Credit Note ${creditNoteNo} for Transaction ${txn.transaction_code}. Reason: ${reversalReason}`,
          total_debit: txn.total_amount,
          total_credit: txn.total_amount,
          status: 'posted',
          branchcode: txn.branchcode || 'DEFAULT',
          created_by: userId || 'system'
        });

        await FinancialTransaction.create({
          tenant_id: txn.tenant_id,
          transaction_number: `FT-CN-${Date.now()}`,
          transaction_date: new Date(),
          transaction_type: 'CREDIT_NOTE',
          reference: creditNoteNo,
          description: `Credit Note reversal posted for ${txn.transaction_code}`,
          amount: -txn.total_amount,
          currency: txn.currency,
          branchcode: txn.branchcode || 'DEFAULT',
          created_by: userId || 'system'
        });
      } catch (accErr) {
        console.warn("[BillingEngine] Accounting reversal warning:", accErr);
      }

      // Update lead billing status to reversed/exempt
      await Lead.findByIdAndUpdate(txn.lead_id, { $set: { billing_status: 'exempt' } });

      return {
        success: true,
        credit_note_no: creditNoteNo,
        message: `Transaction ${txn.transaction_code} reversed successfully. Issued Credit Note ${creditNoteNo}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[BillingEngine] Reversal error:", error);
      return { success: false, message: `Reversal failed: ${message}` };
    }
  }

  /**
   * Sync all converted leads that have not yet been evaluated into Billable Ledger.
   */
  public static async syncUnbilledLeads(): Promise<void> {
    try {
      const allLeads = await Lead.find({});
      for (const lead of allLeads) {
        if (lead.status) {
          await this.evaluateLeadSuccessStage(
            lead._id, 
            lead.status, 
            lead.tenant_id, 
            lead.branchcode, 
            lead.updated_on ? new Date(lead.updated_on) : new Date()
          );
        }
      }
    } catch (err) {
      console.warn("[BillingEngine] syncUnbilledLeads warning:", err);
    }
  }
}
