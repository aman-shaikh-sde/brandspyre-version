import { Request, Response } from "express";
import mongoose from "mongoose";
import { 
  ClientContract,
  ClientAgreement, 
  BillingRule, 
  BillableTransaction, 
  SuccessStageConfig,
  BillingDispute
} from "../../db/ModelSceham/billingSchema";
import { ProjectInvoice } from "../../db/ModelSceham/project/client";
import { JournalEntry, FinancialTransaction } from "../../db/ModelSceham/accountingSchema";
import { Lead, Campaign } from "../../db/ModelSceham/project/campagin";
import { BillingEngineService } from "../../services/billingEngineService";
import { CommercialCronWorker } from "../../services/commercialCronWorker";

// --- CONTRACT CONTROLLERS ---

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || req.body.tenant_id;
    const { branchcode, contract_number, client_code, title, signed_date, effective_date, expiry_date, auto_renew, sla_details, attachment_url } = req.body;

    if (!contract_number || !client_code || !title) {
      res.status(400).json({ success: false, message: "contract_number, client_code, and title are required" });
      return;
    }

    const contract = await ClientContract.create({
      tenant_id: tenantId,
      branchcode: branchcode || 'DEFAULT',
      contract_number,
      client_code,
      title,
      signed_date: signed_date ? new Date(signed_date) : new Date(),
      effective_date: effective_date ? new Date(effective_date) : new Date(),
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      auto_renew: Boolean(auto_renew),
      sla_details,
      attachment_url,
      status: 'active',
      created_by: (req as any).user?.id || 'system'
    });

    res.status(201).json({ success: true, message: "Client master contract created successfully", data: contract });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { client_code } = req.query;

    const filter: Record<string, any> = {};
    if (tenantId) filter.tenant_id = tenantId;
    if (client_code) filter.client_code = client_code;

    const contracts = await ClientContract.find(filter).sort({ created_at: -1 }).lean();
    res.status(200).json({ success: true, count: contracts.length, data: contracts });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- AGREEMENT & VERSIONING CONTROLLERS ---

export const createAgreement = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || req.body.tenant_id;
    const { 
      contract_id,
      branchcode, 
      client_code, 
      agreement_name, 
      effective_from, 
      effective_to, 
      billing_type, 
      rate, 
      currency, 
      tax_config, 
      client_acceptance_required,
      approval_threshold_amount,
      billing_cycle 
    } = req.body;

    if (!client_code || !agreement_name || rate === undefined) {
      res.status(400).json({ success: false, message: "Missing required agreement fields (client_code, agreement_name, rate)" });
      return;
    }

    const agreementCode = `AGR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const agreement = await ClientAgreement.create({
      tenant_id: tenantId,
      branchcode: branchcode || 'DEFAULT',
      contract_id: contract_id ? new mongoose.Types.ObjectId(contract_id) : undefined,
      agreement_code: agreementCode,
      client_code,
      agreement_name,
      version: 1,
      effective_from: effective_from ? new Date(effective_from) : new Date(),
      effective_to: effective_to ? new Date(effective_to) : undefined,
      billing_type: billing_type || 'per_lead',
      rate: Number(rate),
      currency: currency || 'INR',
      tax_config: tax_config || {
        cgst_percentage: 9,
        sgst_percentage: 9,
        igst_percentage: 0,
        tds_percentage: 0,
        is_reverse_charge: false,
        is_tax_exempt: false
      },
      client_acceptance_required: Boolean(client_acceptance_required),
      approval_threshold_amount: approval_threshold_amount ? Number(approval_threshold_amount) : 50000,
      billing_cycle: billing_cycle || 'instant',
      status: 'active',
      created_by: (req as any).user?.id || 'system'
    });

    res.status(201).json({ success: true, message: "Client commercial agreement created", data: agreement });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const createAgreementVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const oldAgreement = (await ClientAgreement.findById(id).lean()) as any;
    if (!oldAgreement) {
      res.status(404).json({ success: false, message: "Original agreement not found" });
      return;
    }

    const { rate, billing_type, effective_from, tax_config } = req.body;
    const newVersion = (oldAgreement.version || 1) + 1;
    const effectiveFromDate = effective_from ? new Date(effective_from) : new Date();

    await ClientAgreement.findByIdAndUpdate(id, {
      $set: {
        status: 'superseded',
        effective_to: effectiveFromDate,
        updated_at: new Date()
      }
    });

    const newAgreement = await ClientAgreement.create({
      tenant_id: oldAgreement.tenant_id,
      branchcode: oldAgreement.branchcode,
      contract_id: oldAgreement.contract_id,
      agreement_code: oldAgreement.agreement_code,
      client_code: oldAgreement.client_code,
      agreement_name: oldAgreement.agreement_name,
      version: newVersion,
      previous_version_id: oldAgreement._id,
      effective_from: effectiveFromDate,
      billing_type: billing_type || oldAgreement.billing_type,
      rate: rate !== undefined ? Number(rate) : oldAgreement.rate,
      currency: oldAgreement.currency,
      tax_config: tax_config || oldAgreement.tax_config,
      client_acceptance_required: oldAgreement.client_acceptance_required,
      approval_threshold_amount: oldAgreement.approval_threshold_amount,
      billing_cycle: oldAgreement.billing_cycle,
      status: 'active',
      created_by: (req as any).user?.id || 'system'
    });

    res.status(201).json({
      success: true,
      message: `Agreement updated to Version ${newVersion}`,
      data: newAgreement
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getAgreements = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { client_code, status } = req.query;

    const filter: Record<string, any> = {};
    if (tenantId) filter.tenant_id = tenantId;
    if (client_code) filter.client_code = client_code;
    if (status) filter.status = status;

    const agreements = await ClientAgreement.find(filter).sort({ version: -1, created_at: -1 }).lean();
    res.status(200).json({ success: true, count: agreements.length, data: agreements });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getAgreementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const agreement = (await ClientAgreement.findById(id).lean()) as any;
    if (!agreement) {
      res.status(404).json({ success: false, message: "Agreement not found" });
      return;
    }
    const rules = await BillingRule.find({ agreement_id: agreement._id }).sort({ priority: 1 }).lean();
    const versionHistory = await ClientAgreement.find({ agreement_code: agreement.agreement_code }).sort({ version: -1 }).lean();
    res.status(200).json({ success: true, data: { ...agreement, rules, versionHistory } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- BILLING RULE CONTROLLERS ---

export const createBillingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || req.body.tenant_id;
    const { agreement_id, branchcode, rule_name, priority, campaign_code, lead_source, base_rate, percentage_rate, formula_expression } = req.body;

    if (!agreement_id || !rule_name || base_rate === undefined) {
      res.status(400).json({ success: false, message: "Missing required billing rule parameters" });
      return;
    }

    const rule = await BillingRule.create({
      tenant_id: tenantId,
      branchcode: branchcode || 'DEFAULT',
      agreement_id: new mongoose.Types.ObjectId(agreement_id),
      rule_name,
      priority: priority || 1,
      campaign_code,
      lead_source,
      base_rate: Number(base_rate),
      percentage_rate: percentage_rate ? Number(percentage_rate) : 0,
      formula_expression,
      status: 'active'
    });

    res.status(201).json({ success: true, message: "Billing rule created successfully", data: rule });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- SUCCESS STAGE CONFIG CONTROLLERS ---

export const saveSuccessStageConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id || req.body.tenant_id;
    const { branchcode, client_code, campaign_code, success_stages } = req.body;

    if (!success_stages || !Array.isArray(success_stages)) {
      res.status(400).json({ success: false, message: "success_stages array is required" });
      return;
    }

    const filter: Record<string, any> = { tenant_id: tenantId, branchcode: branchcode || 'DEFAULT' };
    if (client_code) filter.client_code = client_code;

    const config = await SuccessStageConfig.findOneAndUpdate(
      filter,
      {
        $set: {
          tenant_id: tenantId,
          branchcode: branchcode || 'DEFAULT',
          client_code,
          campaign_code,
          success_stages,
          is_active: true,
          updated_at: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Success stage configuration saved", data: config });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getSuccessStageConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { client_code } = req.query;

    const filter: Record<string, any> = { is_active: true };
    if (tenantId) filter.tenant_id = tenantId;
    if (client_code) filter.client_code = client_code;

    const configs = await SuccessStageConfig.find(filter).lean();
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- BILLABLE TRANSACTION LEDGER & APPROVAL WORKFLOW CONTROLLERS ---

export const getBillableTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { status, client_code, campaign_code, invoice_status } = req.query;

    // Automatically sync converted leads into Billable Ledger
    await BillingEngineService.syncUnbilledLeads();

    const filter: Record<string, any> = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: String(tenantId) },
        { tenant_id: { $exists: false } },
        { tenant_id: null }
      ];
    }
    if (status) filter.status = status;
    if (client_code) filter.client_code = client_code;
    if (campaign_code) filter.campaign_code = campaign_code;
    if (invoice_status) filter.invoice_status = invoice_status;

    const transactions = await BillableTransaction.find(filter)
      .populate('lead_id', 'lead_name phone email status campaign_code meta_lead_id')
      .populate('agreement_id', 'agreement_name version billing_type rate')
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const tierApproveTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tier_level, comments } = req.body;
    const userId = (req as any).user?.id || 'approver';

    const txn = await BillableTransaction.findById(id);
    if (!txn) {
      res.status(404).json({ success: false, message: "Transaction not found" });
      return;
    }

    const tierIndex = txn.approval_chain.findIndex((t: any) => t.tier_level === Number(tier_level));
    if (tierIndex !== -1) {
      txn.approval_chain[tierIndex].status = 'approved';
      txn.approval_chain[tierIndex].approver_id = userId;
      txn.approval_chain[tierIndex].timestamp = new Date();
      if (comments) txn.approval_chain[tierIndex].comments = comments;
    }

    const allApproved = txn.approval_chain.every((t: any) => t.status === 'approved');
    if (allApproved || txn.approval_chain.length === 0) {
      txn.status = 'approved';
      txn.approved_by = userId;
      txn.approved_at = new Date();
      await Lead.findByIdAndUpdate(txn.lead_id, { $set: { billing_status: 'billable' } });
    }

    await txn.save();

    res.status(200).json({
      success: true,
      message: `Tier ${tier_level} approval recorded. Transaction overall status: ${txn.status}`,
      data: txn
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const clientAcceptLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const txn = await BillableTransaction.findById(id);
    if (!txn) {
      res.status(404).json({ success: false, message: "Transaction not found" });
      return;
    }

    txn.client_acceptance_status = 'accepted';
    txn.status = 'approved';
    txn.approved_at = new Date();
    await txn.save();

    await Lead.findByIdAndUpdate(txn.lead_id, { $set: { billing_status: 'billable' } });

    res.status(200).json({ success: true, message: "Lead accepted by client", data: txn });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const reverseTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reversal_reason } = req.body;
    const userId = (req as any).user?.id || 'manager';

    const result = await BillingEngineService.reverseBillableTransaction(id, reversal_reason || 'Client Lead Rollback', userId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- DISPUTE MANAGEMENT CONTROLLERS ---

export const createDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { transaction_id, dispute_reason } = req.body;

    const txn = await BillableTransaction.findById(transaction_id);
    if (!txn) {
      res.status(404).json({ success: false, message: "Billable transaction not found" });
      return;
    }

    const disputeCode = `DSP-${Date.now()}`;
    const dispute = await BillingDispute.create({
      tenant_id: tenantId || txn.tenant_id,
      branchcode: txn.branchcode,
      dispute_code: disputeCode,
      transaction_id: txn._id,
      client_code: txn.client_code,
      lead_id: txn.lead_id,
      dispute_reason,
      status: 'pending'
    });

    txn.status = 'disputed';
    txn.client_acceptance_status = 'disputed';
    await txn.save();

    res.status(201).json({ success: true, message: "Dispute raised successfully", data: dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getDisputes = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { client_code, status } = req.query;

    const filter: Record<string, any> = {};
    if (tenantId) filter.tenant_id = tenantId;
    if (client_code) filter.client_code = client_code;
    if (status) filter.status = status;

    const disputes = await BillingDispute.find(filter)
      .populate('transaction_id')
      .populate('lead_id', 'lead_name phone email')
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, count: disputes.length, data: disputes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution_status, resolution_notes } = req.body;
    const userId = (req as any).user?.id || 'investigator';

    const dispute = await BillingDispute.findById(id);
    if (!dispute) {
      res.status(404).json({ success: false, message: "Dispute not found" });
      return;
    }

    dispute.status = resolution_status === 'accepted' ? 'accepted' : 'rejected';
    dispute.resolution_notes = resolution_notes;
    dispute.resolved_by = userId;
    dispute.resolved_at = new Date();

    if (resolution_status === 'accepted') {
      const reversalResult = await BillingEngineService.reverseBillableTransaction(
        dispute.transaction_id.toString(),
        `Dispute Accepted: ${resolution_notes}`,
        userId
      );
      if (reversalResult.success) {
        dispute.credit_note_generated = true;
      }
    } else {
      await BillableTransaction.findByIdAndUpdate(dispute.transaction_id, { $set: { status: 'approved', client_acceptance_status: 'accepted' } });
    }

    await dispute.save();
    res.status(200).json({ success: true, message: `Dispute resolved as ${dispute.status}`, data: dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- INVOICE GENERATION CONTROLLER ---

export const generateInvoiceFromTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { client_code, transaction_ids, due_days } = req.body;

    if (!client_code || !transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      res.status(400).json({ success: false, message: "client_code and array of transaction_ids are required" });
      return;
    }

    const txns = await BillableTransaction.find({
      _id: { $in: transaction_ids },
      client_code,
      status: 'approved',
      invoice_status: { $ne: 'invoiced' }
    });

    if (txns.length === 0) {
      res.status(400).json({ success: false, message: "No unbilled approved transactions found for invoicing" });
      return;
    }

    const totalAmount = txns.reduce((sum, t) => sum + t.calculated_amount, 0);
    const cgstAmount = txns.reduce((sum, t) => sum + t.cgst_amount, 0);
    const sgstAmount = txns.reduce((sum, t) => sum + t.sgst_amount, 0);
    const igstAmount = txns.reduce((sum, t) => sum + t.igst_amount, 0);
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const finalAmount = totalAmount + taxAmount;

    const invoiceNo = `INV-COMM-${Date.now()}`;
    const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (due_days || 15));

    const invoice = await ProjectInvoice.create({
      invoice_id: invoiceId,
      branchcode: txns[0].branchcode || 'DEFAULT',
      client_code,
      campaign_code: txns[0].campaign_code,
      invoice_no: invoiceNo,
      invoice_date: new Date(),
      due_date: dueDate,
      total_amount: totalAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      final_amount: finalAmount,
      paid_amount: 0,
      balance_amount: finalAmount,
      status: 'pending',
      notes: `Commercial Operations Invoice for ${txns.length} lead(s)`,
      created_by: (req as any).user?.id || 'system'
    });

    await BillableTransaction.updateMany(
      { _id: { $in: txns.map((t) => t._id) } },
      {
        $set: {
          status: 'invoiced',
          invoice_status: 'invoiced',
          invoice_id: invoice._id,
          invoice_no: invoiceNo
        }
      }
    );

    try {
      await JournalEntry.create({
        tenant_id: tenantId,
        entry_number: `JE-COMM-${Date.now()}`,
        entry_date: new Date(),
        reference: invoiceNo,
        description: `Commercial Lead Success Invoice #${invoiceNo} for Client ${client_code}`,
        total_debit: finalAmount,
        total_credit: finalAmount,
        status: 'posted',
        branchcode: txns[0].branchcode || 'DEFAULT',
        created_by: (req as any).user?.id || 'system'
      });

      await FinancialTransaction.create({
        tenant_id: tenantId,
        transaction_number: `FT-COMM-${Date.now()}`,
        transaction_date: new Date(),
        transaction_type: 'INVOICE',
        reference: invoiceNo,
        description: `Accounts Receivable posted for Invoice #${invoiceNo}`,
        amount: finalAmount,
        currency: txns[0].currency || 'INR',
        branchcode: txns[0].branchcode || 'DEFAULT',
        created_by: (req as any).user?.id || 'system'
      });
    } catch (accErr) {
      console.warn("Accounting entry creation warning:", accErr);
    }

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNo} generated successfully for ${txns.length} transaction(s)`,
      data: invoice
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- ENTERPRISE CRON WORKER TRIGGER CONTROLLER ---

export const runDailyCronTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await CommercialCronWorker.runDailyScheduledTasks();
    res.status(200).json({ success: true, message: "Daily background tasks executed", data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

// --- ENTERPRISE ROAS & CASHFLOW FORECASTING CONTROLLERS ---

export const getROASAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;
    const filter: Record<string, any> = {};
    if (tenantId) filter.tenant_id = tenantId;

    const campaigns = await Campaign.find(filter).lean();
    const approvedTxns = await BillableTransaction.find({ ...filter, status: { $in: ['approved', 'invoiced'] } }).lean();

    const campaignStats = campaigns.map((c: any) => {
      const campTxns = approvedTxns.filter((t: any) => t.campaign_code === c.campaign_code);
      const billableRevenue = campTxns.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
      const estimatedAdSpend = (c.totallead || 0) * 150; // Average ₹150 CPL
      const netProfit = billableRevenue - estimatedAdSpend;
      const roasPercentage = estimatedAdSpend > 0 ? Math.round((billableRevenue / estimatedAdSpend) * 100) : 0;

      return {
        campaign_code: c.campaign_code,
        campaign_name: c.campaignname,
        total_leads: c.totallead || 0,
        billable_revenue: billableRevenue,
        estimated_ad_spend: estimatedAdSpend,
        net_profit: netProfit,
        roas_percentage: roasPercentage
      };
    });

    res.status(200).json({ success: true, count: campaignStats.length, data: campaignStats });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};

export const getBillingDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant?.id;

    // Automatically sync converted leads into Billable Ledger
    await BillingEngineService.syncUnbilledLeads();

    const filter: Record<string, any> = {};
    if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: String(tenantId) },
        { tenant_id: { $exists: false } },
        { tenant_id: null }
      ];
    }

    const allTxns = await BillableTransaction.find(filter).lean();
    const disputes = await BillingDispute.find(filter).lean();

    const totalBillableLeads = allTxns.length;
    const approvedTxns = allTxns.filter((t: any) => t.status === 'approved' || t.status === 'invoiced');
    const totalRevenueGenerated = approvedTxns.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

    const pendingTxns = allTxns.filter((t: any) => t.status === 'pending_approval');
    const pendingAmount = pendingTxns.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

    const reversedTxns = allTxns.filter((t: any) => t.status === 'reversed');
    const totalCreditNotesIssued = reversedTxns.reduce((sum: number, t: any) => sum + (t.credit_note_amount || t.total_amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBillableLeads,
          approvedCount: approvedTxns.length,
          totalRevenueGenerated,
          pendingApprovalCount: pendingTxns.length,
          pendingAmount,
          reversedCount: reversedTxns.length,
          totalCreditNotesIssued,
          disputeCount: disputes.filter((d: any) => d.status === 'pending').length,
          avgRevenuePerLead: approvedTxns.length ? Math.round(totalRevenueGenerated / approvedTxns.length) : 0
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message });
  }
};
