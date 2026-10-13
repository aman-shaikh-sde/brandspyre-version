import { Request, Response } from "express";
import { B2BSettlementAgreement, B2BSettlementTransaction, B2BSettlementInvoice } from "../../db/ModelSceham/b2bSettlementSchema";
import { OrganizationPaymentRequest } from "../../db/ModelSceham/organizationPaymentRequestSchema";
import { OrganizationPaymentAccount } from "../../db/ModelSceham/organizationPaymentAccountSchema";
import { PlatformCommission } from "../../db/ModelSceham/platformCommissionSchema";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import { Lead } from "../../db/ModelSceham/project/campagin";
import { PlatformFeeService } from "../../services/payments/PlatformFeeService";
import { OrganizationPaymentService } from "../../services/payments/OrganizationPaymentService";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import mongoose from "mongoose";
import crypto from "crypto";

const getTenantId = async (req: Request): Promise<mongoose.Types.ObjectId | null> => {
  const u = (req as any).user;
  if (!u) return null;

  const isPlatformAdmin = u.role === 'superadmin' || u.userRole === 'superadmin' ||
                          u.role === 'master_super_admin' || u.userRole === 'master_super_admin';

  // SECURITY: Headers (x-tenant-id) are ONLY trusted for platform admins
  const headerId = isPlatformAdmin
    ? (req.headers["x-tenant-id"] || req.headers["tenant-id"]) as string | undefined
    : undefined;

  let id = headerId || u.tenantId || u.tenant_id || u.tenant?._id;

  if (id && mongoose.Types.ObjectId.isValid(id.toString())) {
    return new mongoose.Types.ObjectId(id.toString());
  }

  if (u.email) {
    const dbUser = await UserInfo.findOne({ email: u.email }).lean() as any;
    if (dbUser && dbUser.tenant_id) {
      return dbUser.tenant_id as mongoose.Types.ObjectId;
    }
  }

  return null;
};

// 1. Fetch Bilateral Settlement Agreements
export const getB2BSettlementAgreements = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const agreements = await B2BSettlementAgreement.find({
      $or: [{ provider_tenant_id: tId }, { receiver_tenant_id: tId }]
    })
      .populate("provider_tenant_id", "company_name name tenant_code")
      .populate("receiver_tenant_id", "company_name name tenant_code")
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, data: agreements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch settlement agreements" });
  }
};

// 2. Create B2B Settlement Agreement
export const createB2BSettlementAgreement = async (req: Request, res: Response): Promise<void> => {
  try {
    const providerTenantId = await getTenantId(req);
    const { 
      receiver_tenant_id, 
      billing_model, 
      rate, 
      success_stages, 
      commission_rate_override,
      cgst_pct, 
      sgst_pct 
    } = req.body;

    if (!providerTenantId || !receiver_tenant_id || rate === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields: receiver_tenant_id, rate" });
      return;
    }

    if (providerTenantId.toString() === receiver_tenant_id.toString()) {
      res.status(400).json({ success: false, message: "Provider and Receiver organization cannot be the same" });
      return;
    }

    const agreement = await B2BSettlementAgreement.create({
      agreement_code: `B2B-AGR-${Date.now().toString().slice(-8)}`,
      provider_tenant_id: providerTenantId,
      receiver_tenant_id: new mongoose.Types.ObjectId(receiver_tenant_id),
      billing_model: billing_model || "per_lead",
      rate: Number(rate),
      success_stages: success_stages && success_stages.length > 0 
        ? success_stages 
        : ["Fulfilled", "fulfilled", "Completed", "completed", "Won", "won"],
      success_criteria: {
        type: 'STATUS',
        successful_stages: success_stages && success_stages.length > 0 
          ? success_stages 
          : ["Fulfilled", "fulfilled", "Completed", "completed"]
      },
      commission_rate_override: commission_rate_override !== undefined ? Number(commission_rate_override) : undefined,
      cgst_pct: cgst_pct !== undefined ? Number(cgst_pct) : 9,
      sgst_pct: sgst_pct !== undefined ? Number(sgst_pct) : 9,
      status: "active"
    });

    res.status(201).json({ success: true, message: "B2B Settlement Agreement created successfully", data: agreement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create settlement agreement" });
  }
};

// 3. Fetch Settlement Transactions Ledger
export const getB2BSettlementTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const transactions = await B2BSettlementTransaction.find({
      $or: [{ provider_tenant_id: tId }, { receiver_tenant_id: tId }]
    })
      .populate("provider_tenant_id", "company_name name tenant_code")
      .populate("receiver_tenant_id", "company_name name tenant_code")
      .populate("lead_id", "lead_name phone email status")
      .populate("invoice_id")
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ 
      success: true, 
      count: transactions.length, 
      data: transactions, 
      current_tenant_id: tId.toString() 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch settlement transactions" });
  }
};

// 4. Generate Settlement Invoice (Provider Action)
export const generateB2BSettlementInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const providerTenantId = await getTenantId(req);
    const { transaction_ids } = req.body;

    if (!providerTenantId || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      res.status(400).json({ success: false, message: "Provide non-empty transaction_ids array" });
      return;
    }

    // Security: Only unbilled transactions belonging to this provider organization
    const txns = await B2BSettlementTransaction.find({
      _id: { $in: transaction_ids.map(id => new mongoose.Types.ObjectId(id)) },
      provider_tenant_id: providerTenantId,
      status: "unbilled"
    });

    if (txns.length !== transaction_ids.length) {
      res.status(400).json({ 
        success: false, 
        message: "Invoice creation rejected: All selected transactions must exist, belong to this organization, and be in 'unbilled' status." 
      });
      return;
    }

    // Strict Check: Ensure all selected transactions have the exact same receiver organization and currency
    const firstReceiverId = txns[0].receiver_tenant_id.toString();
    const firstCurrency = txns[0].currency || 'INR';

    const hasMixedReceiver = txns.some(t => t.receiver_tenant_id.toString() !== firstReceiverId);
    if (hasMixedReceiver) {
      res.status(400).json({ 
        success: false, 
        message: "Invoice creation rejected: All selected transactions must belong to the exact same receiving (paying) organization." 
      });
      return;
    }

    const hasMixedCurrency = txns.some(t => (t.currency || 'INR') !== firstCurrency);
    if (hasMixedCurrency) {
      res.status(400).json({ 
        success: false, 
        message: "Invoice creation rejected: All selected transactions must share the same currency." 
      });
      return;
    }

    // Comprehensive Independent Financial & Lead Eligibility Re-Validation for every selected transaction
    for (const txn of txns) {
      if (txn.status !== 'unbilled') {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Transaction ${txn.transaction_code} is in status '${txn.status}' instead of 'unbilled'.`
        });
        return;
      }

      if (txn.provider_tenant_id.toString() !== providerTenantId.toString()) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Transaction ${txn.transaction_code} does not belong to the authenticated provider.`
        });
        return;
      }

      const [agreement, shareAccess, lead] = await Promise.all([
        B2BSettlementAgreement.findOne({
          _id: txn.agreement_id,
          provider_tenant_id: txn.provider_tenant_id,
          receiver_tenant_id: txn.receiver_tenant_id,
          status: 'active'
        }),
        LeadShareAccess.findOne({
          lead_id: txn.lead_id,
          owner_tenant_id: txn.provider_tenant_id,
          shared_tenant_id: txn.receiver_tenant_id
        }),
        Lead.findById(txn.lead_id)
      ]);

      if (!agreement) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Transaction ${txn.transaction_code} lacks an exact active bilateral settlement agreement.`
        });
        return;
      }

      if (!shareAccess) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Transaction ${txn.transaction_code} lacks an exact bilateral LeadShareAccess record.`
        });
        return;
      }

      if (!lead) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Transaction ${txn.transaction_code} refers to a non-existent lead record.`
        });
        return;
      }

      const configuredStages = (
        agreement.success_criteria?.successful_stages?.length
          ? agreement.success_criteria.successful_stages
          : (agreement.success_stages?.length ? agreement.success_stages : [])
      ).map((s: string) => s.toLowerCase().trim());

      if (configuredStages.length === 0) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Agreement ${agreement.agreement_code} has no configured success criteria.`
        });
        return;
      }

      const stageSatisfied = configuredStages.includes((txn.stage_reached || '').toLowerCase().trim());
      if (!stageSatisfied) {
        res.status(400).json({
          success: false,
          message: `Invoice creation rejected: Recorded stage '${txn.stage_reached}' for transaction ${txn.transaction_code} does not satisfy contractual success criteria in the active agreement.`
        });
        return;
      }
    }

    const receiverTenantId = txns[0].receiver_tenant_id;
    const subtotal = txns.reduce((sum, t) => sum + (t.base_amount || 0), 0);
    const taxAmount = txns.reduce((sum, t) => sum + (t.tax_amount || 0), 0);
    const totalAmount = subtotal + taxAmount;
    const platformFeeTotal = txns.reduce((sum, t) => sum + (t.platform_commission || 0), 0);
    const platformTaxTotal = txns.reduce((sum, t) => sum + (t.platform_commission_tax || 0), 0);
    const receiverAmountTotal = txns.reduce((sum, t) => sum + (t.receiver_net_amount || 0), 0);

    const invoiceNumber = `B2B-INV-${Date.now().toString().slice(-8)}`;

    const invoice = await B2BSettlementInvoice.create({
      invoice_number: invoiceNumber,
      provider_tenant_id: providerTenantId,
      receiver_tenant_id: receiverTenantId,
      transaction_ids: txns.map(t => t._id),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      platform_fee_total: platformFeeTotal,
      platform_tax_total: platformTaxTotal,
      receiver_amount_total: receiverAmountTotal,
      paid_amount: 0,
      balance_due: totalAmount,
      currency: firstCurrency,
      payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
      status: "issued",
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    // Create synchronized OrganizationPaymentRequest for unified B2B checkout
    const requestCode = `PAYREQ-MKT-${Date.now().toString().slice(-8)}`;
    const [providerTenant, receiverTenant] = await Promise.all([
      Tenant.findById(providerTenantId).lean() as any,
      Tenant.findById(receiverTenantId).lean() as any
    ]);

    const paymentRequest = await OrganizationPaymentRequest.create({
      request_code: requestCode,
      receiver_tenant_id: providerTenantId, // Seller entitled to payout
      payer_tenant_id: receiverTenantId, // Buyer paying dues
      payer_name: receiverTenant?.company_name || receiverTenant?.name || "Consumer Organization",
      payer_email: receiverTenant?.billing_email || receiverTenant?.email || "billing@organization.com",
      invoice_id: invoice._id,
      title: `Lead Marketplace Settlement Invoice ${invoiceNumber}`,
      description: `B2B lead settlement payment for ${txns.length} fulfilled lead(s)`,
      base_amount: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      balance_due: totalAmount,
      currency: firstCurrency,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
      allowed_payment_methods: ['card', 'upi', 'netbanking', 'wallet'],
      created_by: (req as any).user?.id
    });

    invoice.payment_request_id = paymentRequest._id;
    await invoice.save();

    // Mark transactions as invoiced
    await B2BSettlementTransaction.updateMany(
      { _id: { $in: txns.map(t => t._id) } },
      { status: "invoiced", invoice_id: invoice._id }
    );

    // Update PlatformCommission records to link the invoice
    await PlatformCommission.updateMany(
      { settlement_transaction_id: { $in: txns.map(t => t._id) } },
      { settlement_invoice_id: invoice._id, payment_request_id: paymentRequest._id, status: 'CALCULATED' }
    );

    // Update bilateral LeadShareAccess to invoiced
    for (const t of txns) {
      await LeadShareAccess.findOneAndUpdate(
        {
          lead_id: t.lead_id,
          owner_tenant_id: t.provider_tenant_id,
          shared_tenant_id: t.receiver_tenant_id
        },
        { marketplace_status: 'invoiced' }
      );
    }

    res.status(200).json({ 
      success: true, 
      message: "B2B Settlement Invoice generated successfully", 
      data: invoice,
      payment_request: paymentRequest 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate invoice" });
  }
};

// 5. Create Verified B2B Payment Order (Payer Action)
export const createB2BPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const payerTenantId = await getTenantId(req);
    const { invoice_id, transaction_id, provider } = req.body;

    if (!payerTenantId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    let invoice: any = null;

    if (invoice_id) {
      invoice = await B2BSettlementInvoice.findById(invoice_id);
    } else if (transaction_id) {
      const txn = await B2BSettlementTransaction.findById(transaction_id);
      if (!txn) {
        res.status(404).json({ success: false, message: "Transaction not found" });
        return;
      }
      if (txn.invoice_id) {
        invoice = await B2BSettlementInvoice.findById(txn.invoice_id);
      } else {
        res.status(400).json({ success: false, message: "Invoice must be generated by the provider before initiating payment" });
        return;
      }
    }

    if (!invoice) {
      res.status(404).json({ success: false, message: "Settlement invoice not found" });
      return;
    }

    // Security check: Only the designated receiver (payer) can pay this invoice
    if (invoice.receiver_tenant_id.toString() !== payerTenantId.toString()) {
      res.status(403).json({ success: false, message: "Unauthorized: You are not the paying organization for this invoice" });
      return;
    }

    if (invoice.status === 'paid' || invoice.balance_due <= 0) {
      res.status(400).json({ success: false, message: "This invoice is already fully paid" });
      return;
    }

    // Ensure payment request exists
    let paymentRequest = await OrganizationPaymentRequest.findById(invoice.payment_request_id);
    if (!paymentRequest) {
      paymentRequest = await OrganizationPaymentRequest.findOne({ invoice_id: invoice._id });
    }

    if (!paymentRequest) {
      const requestCode = `PAYREQ-MKT-${Date.now().toString().slice(-8)}`;
      paymentRequest = await OrganizationPaymentRequest.create({
        request_code: requestCode,
        receiver_tenant_id: invoice.provider_tenant_id,
        payer_tenant_id: invoice.receiver_tenant_id,
        payer_name: (req as any).user?.name || "Consumer Organization",
        payer_email: (req as any).user?.email || "billing@organization.com",
        invoice_id: invoice._id,
        title: `Lead Marketplace Settlement Invoice ${invoice.invoice_number}`,
        description: `B2B lead settlement payment`,
        base_amount: invoice.subtotal || invoice.total_amount,
        tax_amount: invoice.tax_amount || 0,
        total_amount: invoice.total_amount,
        paid_amount: invoice.paid_amount || 0,
        balance_due: invoice.balance_due !== undefined ? invoice.balance_due : invoice.total_amount,
        currency: invoice.currency || 'INR',
        due_date: invoice.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: (invoice.balance_due ?? invoice.total_amount) > 0 ? 'PENDING' : 'PAID',
        payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
        allowed_payment_methods: ['card', 'upi', 'netbanking', 'wallet'],
        created_by: (req as any).user?.id || (req as any).user?._id
      });
      invoice.payment_request_id = paymentRequest._id;
      await invoice.save();
    }

    // Create checkout order through unified OrganizationPaymentService
    const checkoutOrder = await OrganizationPaymentService.createCheckoutOrder(
      paymentRequest._id.toString(),
      {
        payer_name: (req as any).user?.name,
        payer_email: (req as any).user?.email,
        payer_tenant_id: payerTenantId.toString(),
        provider: provider || req.body.preferred_provider
      }
    );

    // Update invoice with order ID
    invoice.razorpay_order_id = checkoutOrder.order_id;
    await invoice.save();

    // Mark transactions as payment_pending
    await B2BSettlementTransaction.updateMany(
      { _id: { $in: invoice.transaction_ids } },
      { status: "payment_pending" }
    );

    res.status(200).json({
      success: true,
      data: {
        ...checkoutOrder,
        invoice_id: invoice._id,
        invoice_number: invoice.invoice_number,
        gross_amount: invoice.total_amount,
        platform_fee: invoice.platform_fee_total,
        receiver_net_amount: invoice.receiver_amount_total
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create payment order" });
  }
};

// 6. Verify & Reconcile B2B Payment (HMAC Signature / Provider Verified)
export const verifyB2BPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payerTenantId = await getTenantId(req);
    const { 
      order_id, 
      payment_id, 
      signature, 
      invoice_id, 
      payment_request_id,
      provider,
      checkout_session_id,
      payment_intent_id
    } = req.body;

    const effectiveOrderId = order_id || checkout_session_id;
    const effectivePaymentId = payment_id || payment_intent_id;

    if (!effectiveOrderId && !effectivePaymentId) {
      res.status(400).json({ success: false, message: "Missing order_id / checkout_session_id or payment_id / payment_intent_id" });
      return;
    }

    // Call unified OrganizationPaymentService to verify and reconcile idempotently
    const reconciliation = await OrganizationPaymentService.verifyAndReconcilePayment({
      provider,
      order_id: effectiveOrderId,
      payment_id: effectivePaymentId,
      signature: signature || '',
      checkout_session_id,
      payment_intent_id,
      payment_request_id
    });

    if (!reconciliation || !reconciliation.success) {
      res.status(400).json({ success: false, message: "Payment signature verification failed" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "B2B Payment verified and marketplace settlement successfully captured!",
      data: reconciliation
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Payment verification failed" });
  }
};

// 7. Dispute Settlement Transaction
export const disputeSettlementTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const { transaction_id } = req.params;
    const { reason } = req.body;

    if (!tId || !transaction_id || !reason) {
      res.status(400).json({ success: false, message: "Missing transaction_id or reason" });
      return;
    }

    const txn = await B2BSettlementTransaction.findOne({
      _id: new mongoose.Types.ObjectId(transaction_id),
      $or: [{ provider_tenant_id: tId }, { receiver_tenant_id: tId }]
    });

    if (!txn) {
      res.status(404).json({ success: false, message: "Settlement transaction not found or access denied" });
      return;
    }

    txn.status = 'disputed';
    txn.dispute_reason = reason;
    await txn.save();

    await PlatformCommission.updateMany(
      { settlement_transaction_id: txn._id },
      { status: 'DISPUTED', disputed_at: new Date(), notes: `Disputed: ${reason}` }
    );

    res.status(200).json({ success: true, message: "Settlement transaction marked as disputed", data: txn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to dispute transaction" });
  }
};

// 8. Fetch Marketplace Commissions (Platform Admin / Organization reporting)
export const getMarketplaceCommissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const u = (req as any).user;
    const isPlatformAdmin = u?.role === 'superadmin' || u?.userRole === 'superadmin' ||
                            u?.role === 'master_super_admin' || u?.userRole === 'master_super_admin';

    const filter: any = {};
    if (!isPlatformAdmin && tId) {
      filter.$or = [{ payer_tenant_id: tId }, { receiver_tenant_id: tId }];
    }

    const commissions = await PlatformCommission.find(filter)
      .populate("payer_tenant_id", "company_name name tenant_code")
      .populate("receiver_tenant_id", "company_name name tenant_code")
      .populate("lead_id", "lead_name status phone")
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, count: commissions.length, data: commissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch platform commissions" });
  }
};
