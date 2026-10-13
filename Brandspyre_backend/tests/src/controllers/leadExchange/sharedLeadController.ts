import { Request, Response } from "express";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import { Lead } from "../../db/ModelSceham/project/campagin";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import { TenantRelationship } from "../../db/ModelSceham/tenantRelationshipSchema";
import { B2BSettlementAgreement, B2BSettlementTransaction, B2BSettlementInvoice } from "../../db/ModelSceham/b2bSettlementSchema";
import { PlatformCommission } from "../../db/ModelSceham/platformCommissionSchema";
import { PlatformFeeService } from "../../services/payments/PlatformFeeService";
import mongoose from "mongoose";
import crypto from "crypto";

const getTenantId = async (req: Request): Promise<mongoose.Types.ObjectId | null> => {
  const id = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req as any).user?.tenantId || (req as any).user?.tenant_id;
  return id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

// Auto-share lead to Parent Company if tenant is a Child subsidiary
export const autoShareWithParentCompany = async (lead: any) => {
  try {
    if (!lead || !lead.tenant_id) return;
    const leadTenantId = lead.tenant_id;

    // Search active parent-child relationship
    const parentRel = await TenantRelationship.findOne({
      $or: [
        { target_tenant_id: leadTenantId, status: "active" },
        { initiator_tenant_id: leadTenantId, status: "active" }
      ]
    }).lean();

    if (parentRel) {
      let parentTenantId = parentRel.initiator_tenant_id;
      if (parentRel.initiator_tenant_id.toString() === leadTenantId.toString()) {
        parentTenantId = parentRel.target_tenant_id;
      }

      if (parentTenantId && parentTenantId.toString() !== leadTenantId.toString()) {
        await LeadShareAccess.findOneAndUpdate(
          {
            lead_id: lead._id,
            shared_tenant_id: parentTenantId
          },
          {
            owner_tenant_id: leadTenantId,
            access_level: "read_update",
            document_permission: "shared",
            share_status: "accepted",
            marketplace_status: "pending",
            granted_at: new Date(),
            $push: {
              activity_history: {
                action: "AUTO_SHARED_TO_PARENT",
                notes: "Lead automatically shared with Parent Company upon ingestion",
                timestamp: new Date()
              }
            }
          },
          { upsert: true, new: true }
        );
        console.log(`[AutoShare] Lead ${lead._id} automatically shared to Parent Org ${parentTenantId}`);
      }
    }
  } catch (err) {
    console.error("[AutoShare] Error auto-sharing lead with parent company:", err);
  }
};

// 1. Fetch Shared Leads (Single Source of Truth)
export const getSharedLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const { status_filter } = req.query;

    const shares = await LeadShareAccess.find({
      $or: [{ shared_tenant_id: tId }, { owner_tenant_id: tId }],
      ...(status_filter ? { share_status: status_filter } : { share_status: { $ne: 'recalled' } })
    })
      .populate({
        path: "lead_id",
        select: "lead_name phone email status comm_type proj_type created_on updated_on campaign_code meta_lead_id branchcode summary"
      })
      .populate("owner_tenant_id", "company_name tenant_code")
      .populate("shared_tenant_id", "company_name tenant_code")
      .populate("processor_user_id", "name email role")
      .populate("settlement_transaction_id")
      .sort({ granted_at: -1 })
      .lean();

    res.status(200).json({ success: true, count: shares.length, data: shares, current_tenant_id: tId.toString() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch shared leads" });
  }
};

// 2. Fetch Available CRM Master Leads for Sharing
export const getAvailableLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const leads = await Lead.find({
      ...(tId ? { $or: [{ tenant_id: tId }, { tenant_id: tId.toString() }] } : {})
    })
      .select("lead_name phone email status campaign_code meta_lead_id created_on")
      .sort({ created_on: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch available leads" });
  }
};

// 3. Share Lead (Single Source of Truth, Auto-accepted by default per client requirement)
export const shareLeadWithTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerTenantId = await getTenantId(req);
    const userId = (req as any).user?.id || (req as any).user?._id || (req as any).user?.userId;
    const { lead_id, target_tenant_id, access_level, document_permission, is_exclusive } = req.body;

    if (!ownerTenantId || !lead_id || !target_tenant_id) {
      res.status(400).json({ success: false, message: "Missing required fields: lead_id, target_tenant_id" });
      return;
    }

    if (ownerTenantId.toString() === target_tenant_id.toString()) {
      res.status(400).json({ success: false, message: "Cannot share a lead with your own organization" });
      return;
    }

    const lead = await Lead.findOne({
      _id: lead_id,
      $or: [
        { tenant_id: ownerTenantId },
        { tenant_id: ownerTenantId.toString() }
      ]
    });

    if (!lead) {
      res.status(404).json({ success: false, message: "Lead not found or access denied" });
      return;
    }

    const auditEntry = {
      action: "SHARED",
      actor_user_id: userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined,
      actor_tenant_id: ownerTenantId,
      new_value: "accepted",
      notes: "Lead shared into target organization (Immediately visible)",
      timestamp: new Date()
    };

    const shareAccess = await LeadShareAccess.findOneAndUpdate(
      {
        lead_id: lead._id,
        shared_tenant_id: new mongoose.Types.ObjectId(target_tenant_id)
      },
      {
        owner_tenant_id: lead.tenant_id || ownerTenantId,
        access_level: access_level || "read_update",
        document_permission: document_permission || "shared",
        is_exclusive: is_exclusive === true,
        share_status: "accepted",
        marketplace_status: "pending",
        shared_by: userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined,
        granted_at: new Date(),
        $push: { activity_history: auditEntry }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Lead shared successfully (Single Source of Truth)", data: shareAccess });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to share lead" });
  }
};

// 4. Assign Processor Employee in Consumer Organization
export const assignSharedLeadProcessor = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const { lead_id } = req.params;
    const { processor_user_id } = req.body;
    const actorUserId = (req as any).user?.userId || (req as any).user?.id;

    if (!tId || !lead_id || !processor_user_id) {
      res.status(400).json({ success: false, message: "Missing required fields: processor_user_id" });
      return;
    }

    const shareAccess = await LeadShareAccess.findOne({
      lead_id: new mongoose.Types.ObjectId(lead_id),
      shared_tenant_id: tId
    });

    if (!shareAccess) {
      res.status(404).json({ success: false, message: "Shared lead access record not found" });
      return;
    }

    const prevProcessor = shareAccess.processor_user_id?.toString() || "unassigned";
    shareAccess.processor_user_id = new mongoose.Types.ObjectId(processor_user_id);
    shareAccess.share_status = "assigned";
    shareAccess.marketplace_status = "working";
    shareAccess.activity_history.push({
      action: "ASSIGNED",
      actor_user_id: actorUserId && mongoose.Types.ObjectId.isValid(actorUserId) ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actor_tenant_id: tId,
      prev_value: prevProcessor,
      new_value: processor_user_id,
      notes: `Lead assigned to processor user ${processor_user_id}`,
      timestamp: new Date()
    });

    await shareAccess.save();

    res.status(200).json({ success: true, message: "Shared lead assigned cleanly to processor employee", data: shareAccess });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to assign shared lead" });
  }
};

// 5. Update Stage & Auto-Evaluate B2B Settlement Engine
export const updateSharedLeadStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const sharedTenantId = await getTenantId(req);
    const { lead_id } = req.params;
    const { status, summary } = req.body;
    const actorUserId = (req as any).user?.userId || (req as any).user?.id;

    if (!sharedTenantId || !lead_id || !status) {
      res.status(400).json({ success: false, message: "Missing required fields: status" });
      return;
    }

    const shareAccess = await LeadShareAccess.findOne({
      lead_id: new mongoose.Types.ObjectId(lead_id),
      $or: [{ shared_tenant_id: sharedTenantId }, { owner_tenant_id: sharedTenantId }]
    });

    if (!shareAccess) {
      res.status(403).json({ success: false, message: "No permissions granted for this shared lead" });
      return;
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      res.status(404).json({ success: false, message: "Master lead record not found" });
      return;
    }

    const prevStatus = lead.status;
    lead.status = status;
    if (summary) lead.summary = summary;
    lead.updated_on = new Date();
    await lead.save();

    // Log status change audit entry
    shareAccess.activity_history.push({
      action: "STATUS_CHANGED",
      actor_user_id: actorUserId && mongoose.Types.ObjectId.isValid(actorUserId) ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actor_tenant_id: sharedTenantId,
      prev_value: prevStatus,
      new_value: status,
      notes: summary || `Stage updated to ${status}`,
      timestamp: new Date()
    });

    // =========================================================================
    // SECURITY & BUSINESS RULE: Exact Bilateral Settlement Agreement Evaluation
    // NEVER fall back to arbitrary agreements. Must strictly match provider & receiver.
    // =========================================================================
    const agreement = await B2BSettlementAgreement.findOne({
      provider_tenant_id: shareAccess.owner_tenant_id,
      receiver_tenant_id: shareAccess.shared_tenant_id,
      status: "active"
    });

    if (!agreement) {
      // No active agreement between these two organizations -> Lead progresses in CRM, but 0 billing obligation is created
      shareAccess.share_status = "working";
      shareAccess.marketplace_status = "working";
      await shareAccess.save();

      res.status(200).json({ 
        success: true, 
        message: `Lead stage updated to '${status}'. Note: No active settlement agreement between organizations. Lead is not billable.`,
        agreement_status: "NO_ACTIVE_SETTLEMENT_AGREEMENT",
        data: lead 
      });
      return;
    }

    // Determine contractual success stages configured in the agreement
    const configuredStages = (
      agreement.success_criteria?.successful_stages?.length
        ? agreement.success_criteria.successful_stages
        : (agreement.success_stages?.length ? agreement.success_stages : [])
    );

    if (!configuredStages || configuredStages.length === 0) {
      shareAccess.share_status = "working";
      shareAccess.marketplace_status = "working";
      await shareAccess.save();

      res.status(200).json({ 
        success: true, 
        message: `Lead stage updated to '${status}'. Note: Active agreement has no success criteria configured. Lead is not billable.`,
        agreement_status: "NO_SUCCESS_STAGES_CONFIGURED",
        data: lead 
      });
      return;
    }

    const successStages = configuredStages.map((s: string) => s.toLowerCase().trim());
    const isSuccessfulStage = successStages.includes(status.toLowerCase().trim());

    if (!isSuccessfulStage) {
      // Stage changed (e.g. Qualified, Contacted, In-Progress), but NOT the agreed fulfillment condition
      shareAccess.share_status = "working";
      shareAccess.marketplace_status = "working";
      await shareAccess.save();

      res.status(200).json({ 
        success: true, 
        message: `Lead stage updated to '${status}'. Progressing towards fulfillment.`,
        marketplace_status: "working",
        data: lead 
      });
      return;
    }

    // =========================================================================
    // SUCCESS CRITERIA SATISFIED: Create Billable Settlement Transaction & Pending Commission
    // =========================================================================
    shareAccess.share_status = "completed";
    shareAccess.marketplace_status = "billable";

    const baseAmount = agreement.rate || 1000;
    const cgst = (baseAmount * (agreement.cgst_pct || 9)) / 100;
    const sgst = (baseAmount * (agreement.sgst_pct || 9)) / 100;
    const grossAmount = baseAmount + cgst + sgst;

    // Calculate Brandspyre marketplace commission via centralized PlatformFeeService
    const feeResult = await PlatformFeeService.calculateFee(
      grossAmount,
      agreement.currency || 'INR',
      agreement.commission_rate_override
    );

    // Deterministic Idempotency Key: agreement + provider + receiver + lead + billable_event_type + stage
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${agreement._id}_${shareAccess.owner_tenant_id}_${shareAccess.shared_tenant_id}_${lead._id}_LEAD_FULFILLMENT_${status.toLowerCase().trim()}`)
      .digest("hex");

    const txn = await B2BSettlementTransaction.findOneAndUpdate(
      { idempotency_key: idempotencyKey },
      {
        $setOnInsert: {
          transaction_code: `B2B-TXN-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`,
          agreement_id: agreement._id,
          provider_tenant_id: shareAccess.owner_tenant_id,
          receiver_tenant_id: shareAccess.shared_tenant_id,
          lead_id: lead._id,
          stage_reached: status,
          billable_event_type: 'LEAD_FULFILLMENT',
          base_amount: baseAmount,
          tax_amount: cgst + sgst,
          total_amount: grossAmount,
          platform_commission: feeResult.platformFee,
          platform_commission_tax: feeResult.taxOnPlatformFee,
          receiver_net_amount: feeResult.receiverAmount,
          allocated_amount: 0,
          remaining_amount: grossAmount,
          currency: agreement.currency || "INR",
          is_approved: !agreement.requires_approval,
          status: "unbilled"
        }
      },
      { upsert: true, new: true }
    );

    // Record Pending Platform Commission in the audit ledger
    const commissionCode = `COMM-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    await PlatformCommission.findOneAndUpdate(
      { settlement_transaction_id: txn._id },
      {
        $setOnInsert: {
          commission_code: commissionCode,
          lead_id: lead._id,
          settlement_transaction_id: txn._id,
          payer_tenant_id: shareAccess.shared_tenant_id,
          receiver_tenant_id: shareAccess.owner_tenant_id,
          gross_amount: grossAmount,
          commission_rate: feeResult.commissionRateApplied,
          commission_amount: feeResult.platformFee,
          commission_tax: feeResult.taxOnPlatformFee,
          total_commission_deduction: feeResult.totalPlatformDeduction,
          commission_collected_amount: 0,
          commission_remaining_amount: feeResult.totalPlatformDeduction,
          receiver_net_amount: feeResult.receiverAmount,
          currency: agreement.currency || "INR",
          status: 'PENDING'
        }
      },
      { upsert: true, new: true }
    );

    shareAccess.settlement_transaction_id = txn._id;
    await shareAccess.save();

    res.status(200).json({ 
      success: true, 
      message: `Lead successfully fulfilled! Billable settlement created (Gross: ₹${grossAmount.toLocaleString()}, Platform Fee: ₹${feeResult.platformFee.toLocaleString()}, Receiver Net: ₹${feeResult.receiverAmount.toLocaleString()}).`,
      marketplace_status: "billable",
      settlement_transaction: txn,
      data: lead 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update shared lead stage" });
  }
};

// 6. Get Complete Settlement & Payment Eligibility Status for a Shared Lead
export const getSharedLeadSettlementStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const { id } = req.params;

    if (!tId || !id) {
      res.status(400).json({ success: false, message: "Missing lead id" });
      return;
    }

    const idObj = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    if (!idObj) {
      res.status(400).json({ success: false, message: "Invalid lead id format" });
      return;
    }

    const shareAccess = await LeadShareAccess.findOne({
      $and: [
        { $or: [{ _id: idObj }, { lead_id: idObj }] },
        { $or: [{ shared_tenant_id: tId }, { owner_tenant_id: tId }] }
      ]
    })
      .populate("owner_tenant_id", "company_name tenant_code")
      .populate("shared_tenant_id", "company_name tenant_code")
      .populate({
        path: "settlement_transaction_id",
        populate: { path: "invoice_id" }
      });

    if (!shareAccess) {
      res.status(404).json({ success: false, message: "Shared lead access record not found" });
      return;
    }

    const txn = shareAccess.settlement_transaction_id as any;
    const isPayer = tId.toString() === shareAccess.shared_tenant_id._id.toString();

    const agreement = await B2BSettlementAgreement.findOne({
      provider_tenant_id: shareAccess.owner_tenant_id._id,
      receiver_tenant_id: shareAccess.shared_tenant_id._id,
      status: "active"
    }).lean();

    // Payment is eligible ONLY if:
    // 1. Transaction exists and is invoiced or payment_pending
    // 2. Invoice is issued / balance_due > 0
    // 3. User is the paying organization (Consumer/shared_tenant_id)
    const paymentEligible = Boolean(
      isPayer &&
      txn &&
      (txn.status === 'invoiced' || txn.status === 'payment_pending') &&
      txn.invoice_id &&
      txn.invoice_id.status !== 'paid' &&
      txn.invoice_id.balance_due > 0
    );

    res.status(200).json({
      success: true,
      data: {
        share_status: shareAccess.share_status,
        marketplace_status: shareAccess.marketplace_status,
        has_agreement: Boolean(agreement),
        agreement: agreement || null,
        transaction: txn || null,
        invoice: txn?.invoice_id || null,
        is_payer: isPayer,
        payment_eligible: paymentEligible
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch settlement status" });
  }
};

// 7. Recall Shared Lead (Provider Action)
export const recallSharedLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const providerTenantId = await getTenantId(req);
    const { lead_id } = req.params;
    const { reason } = req.body;
    const actorUserId = (req as any).user?.userId || (req as any).user?.id;

    if (!providerTenantId || !lead_id) {
      res.status(400).json({ success: false, message: "Missing lead_id parameter" });
      return;
    }

    const shareAccess = await LeadShareAccess.findOne({
      lead_id: new mongoose.Types.ObjectId(lead_id),
      owner_tenant_id: providerTenantId
    });

    if (!shareAccess) {
      res.status(404).json({ success: false, message: "Sharing access record not found or access denied" });
      return;
    }

    shareAccess.share_status = "recalled";
    shareAccess.recall_reason = reason || "Recalled by Provider Organization";
    shareAccess.activity_history.push({
      action: "RECALLED",
      actor_user_id: actorUserId && mongoose.Types.ObjectId.isValid(actorUserId) ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actor_tenant_id: providerTenantId,
      notes: reason || "Lead access recalled by provider",
      timestamp: new Date()
    });

    await shareAccess.save();

    res.status(200).json({ success: true, message: "Shared lead access recalled cleanly", data: shareAccess });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to recall shared lead" });
  }
};

// 8. Reject Shared Lead (Consumer Action)
export const rejectSharedLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const consumerTenantId = await getTenantId(req);
    const { lead_id } = req.params;
    const { reason } = req.body;
    const actorUserId = (req as any).user?.userId || (req as any).user?.id;

    if (!consumerTenantId || !lead_id) {
      res.status(400).json({ success: false, message: "Missing lead_id parameter" });
      return;
    }

    const shareAccess = await LeadShareAccess.findOne({
      lead_id: new mongoose.Types.ObjectId(lead_id),
      shared_tenant_id: consumerTenantId
    });

    if (!shareAccess) {
      res.status(404).json({ success: false, message: "Sharing access record not found or access denied" });
      return;
    }

    shareAccess.share_status = "rejected";
    shareAccess.rejection_reason = reason || "Rejected by Consumer Organization";
    shareAccess.activity_history.push({
      action: "REJECTED",
      actor_user_id: actorUserId && mongoose.Types.ObjectId.isValid(actorUserId) ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      actor_tenant_id: consumerTenantId,
      notes: reason || "Lead rejected by consumer organization",
      timestamp: new Date()
    });

    await shareAccess.save();

    res.status(200).json({ success: true, message: "Shared lead rejected cleanly", data: shareAccess });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to reject shared lead" });
  }
};

// 9. Lead Exchange Analytics
export const getLeadExchangeAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const [providerShares, consumerShares, settlements] = await Promise.all([
      LeadShareAccess.find({ owner_tenant_id: tId }).lean(),
      LeadShareAccess.find({ shared_tenant_id: tId }).lean(),
      B2BSettlementTransaction.find({
        $or: [{ provider_tenant_id: tId }, { receiver_tenant_id: tId }]
      }).lean()
    ]);

    const leadsShared = providerShares.length;
    const convertedLeads = providerShares.filter(s => s.share_status === 'converted' || s.share_status === 'completed' || s.marketplace_status === 'settled').length;
    const activePartners = new Set(providerShares.map(s => s.shared_tenant_id.toString())).size;

    const leadsReceived = consumerShares.length;
    const leadsAccepted = consumerShares.filter(s => s.share_status === 'accepted' || s.share_status === 'assigned' || s.share_status === 'working' || s.share_status === 'converted' || s.share_status === 'completed').length;
    const assignedLeads = consumerShares.filter(s => s.processor_user_id).length;

    const totalSettlementAmount = settlements.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const paidSettlements = settlements.filter(t => t.status === 'paid' || t.status === 'settled');
    const totalPaidAmount = paidSettlements.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        provider_analytics: {
          leads_shared: leadsShared,
          converted_leads: convertedLeads,
          active_partners: activePartners
        },
        consumer_analytics: {
          leads_received: leadsReceived,
          leads_accepted: leadsAccepted,
          assigned_leads: assignedLeads
        },
        settlement_analytics: {
          total_transactions: settlements.length,
          total_amount: totalSettlementAmount,
          paid_transactions: paidSettlements.length,
          paid_amount: totalPaidAmount,
          pending_transactions: settlements.length - paidSettlements.length
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch analytics" });
  }
};
