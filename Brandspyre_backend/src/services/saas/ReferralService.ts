import mongoose from 'mongoose';
import { 
  Referral, 
  ReferralRequest, 
  ReferralParticipant, 
  ReferralActivity, 
  IReferral, 
  IContactInfo,
  ReferralStatus,
  ReferralVisibility
} from '../../db/ModelSceham/referralSchema';
import { Tenant, UserTenant } from '../../db/ModelSceham/saasSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { B2BSettlementAgreement, B2BSettlementTransaction, B2BSettlementInvoice } from '../../db/ModelSceham/b2bSettlementSchema';
import { PlatformFeeService } from '../payments/PlatformFeeService';
import { PlatformCommission } from '../../db/ModelSceham/platformCommissionSchema';
import crypto from 'crypto';

export interface CreateReferralPayload {
  leadId?: string;
  sourceType?: 'PLATFORM' | 'ORGANIZATION';
  sourceTenantId?: string;
  createdByUserId: string;
  
  title: string;
  description: string;
  industry: string;
  location: string;
  serviceCategories?: string[];
  
  estimatedDealValue: number;
  currency?: string;
  
  leadQuality?: 'HOT' | 'WARM' | 'COLD';
  referralType?: 'BUSINESS_OPPORTUNITY' | 'SALES_LEAD' | 'PARTNERSHIP' | 'SERVICE_REQUEST' | 'PROJECT_OPPORTUNITY' | 'RESELLER_OPPORTUNITY';
  
  referralFee?: number;
  commissionType?: 'FIXED' | 'PERCENTAGE' | 'PER_QUALIFIED' | 'PAY_ON_CONVERSION' | 'REV_SHARE';
  commissionValue?: number;
  
  visibility?: ReferralVisibility;
  eligibleTenantIds?: string[];
  requiresApproval?: boolean;
  maxParticipants?: number;
  contactUnlockPolicy?: 'IMMEDIATE' | 'AFTER_APPROVAL' | 'AFTER_ACCEPTANCE' | 'AFTER_PAYMENT' | 'MANUAL';
  
  contactInfo?: IContactInfo;
  expiresAt?: Date;
  isDraft?: boolean;
}

export class ReferralService {
  /**
   * Helper: Generate unique Referral Code (e.g., REF-100847)
   */
  private static generateReferralCode(): string {
    return `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  /**
   * Helper: Mask sensitive contact information for unauthorized viewers
   */
  public static sanitizeContactInfo(contactInfo?: IContactInfo): IContactInfo {
    return {
      name: 'Contact Details Protected',
      company_name: contactInfo?.company_name || 'Verified Business Opportunity',
      phone: 'XXXXXXXXXX',
      email: 'protected@referral.network',
      notes: 'Contact information will be unlocked upon request approval.'
    };
  }

  /**
   * Check if a given tenant/user is authorized to view raw contact info for a referral
   */
  public static async isAuthorizedForContact(referralId: string | mongoose.Types.ObjectId, tenantId?: string, isPlatformAdmin: boolean = false): Promise<boolean> {
    if (isPlatformAdmin) return true;
    if (!tenantId) return false;

    const referral = await Referral.findById(referralId);
    if (!referral) return false;

    // Owner organization always has contact access
    if (referral.source_tenant_id && referral.source_tenant_id.toString() === tenantId.toString()) {
      return true;
    }

    // Check if tenant is an approved participant
    const participant = await ReferralParticipant.findOne({
      referral_id: referralId,
      receiver_tenant_id: tenantId,
      status: 'ACTIVE',
      contact_access: true
    });

    if (participant) return true;

    // Check if immediate unlock policy applies for published referrals
    if (referral.contact_unlock_policy === 'IMMEDIATE' && referral.status === 'PUBLISHED') {
      return true;
    }

    return false;
  }

  /**
   * 1. CREATE REFERRAL (From CRM Lead or Direct Opportunity)
   */
  static async createReferral(payload: CreateReferralPayload) {
    const referralCode = this.generateReferralCode();
    const status: ReferralStatus = payload.isDraft ? 'DRAFT' : 'PUBLISHED';

    const referral = await Referral.create({
      referral_code: referralCode,
      lead_id: payload.leadId ? new mongoose.Types.ObjectId(payload.leadId) : undefined,
      source_type: payload.sourceType || (payload.sourceTenantId ? 'ORGANIZATION' : 'PLATFORM'),
      source_tenant_id: payload.sourceTenantId ? new mongoose.Types.ObjectId(payload.sourceTenantId) : undefined,
      created_by_user_id: new mongoose.Types.ObjectId(payload.createdByUserId),
      
      title: payload.title,
      description: payload.description,
      industry: payload.industry,
      location: payload.location,
      service_categories: payload.serviceCategories || [],
      
      estimated_deal_value: payload.estimatedDealValue || 0,
      currency: payload.currency || 'INR',
      
      lead_quality: payload.leadQuality || 'HOT',
      referral_type: payload.referralType || 'BUSINESS_OPPORTUNITY',
      
      referral_fee: payload.referralFee || 0,
      commission_type: payload.commissionType || 'FIXED',
      commission_value: payload.commissionValue || 0,
      
      visibility: payload.visibility || 'ALL_VERIFIED_ORGANIZATIONS',
      eligible_tenant_ids: payload.eligibleTenantIds ? payload.eligibleTenantIds.map(id => new mongoose.Types.ObjectId(id)) : [],
      
      requires_approval: payload.requiresApproval !== false,
      max_participants: payload.maxParticipants || 1,
      
      status,
      contact_unlock_policy: payload.contactUnlockPolicy || 'AFTER_APPROVAL',
      contact_info: payload.contactInfo || {},
      
      expires_at: payload.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      published_at: status === 'PUBLISHED' ? new Date() : undefined
    });

    // Log activity
    await ReferralActivity.create({
      referral_id: referral._id,
      action: 'REFERRAL_CREATED',
      actor_user_id: payload.createdByUserId,
      actor_tenant_id: payload.sourceTenantId,
      new_status: status,
      details: `Referral ${referralCode} created as ${status}.`
    });

    return referral;
  }

  /**
   * 2. PUBLISH / UNPUBLISH REFERRAL
   */
  static async togglePublishState(referralId: string, tenantId?: string, isPlatformAdmin = false) {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found.');

    if (!isPlatformAdmin && referral.source_tenant_id?.toString() !== tenantId) {
      throw new Error('Unauthorized: You do not own this referral.');
    }

    const newStatus: ReferralStatus = referral.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    referral.status = newStatus;
    if (newStatus === 'PUBLISHED') referral.published_at = new Date();
    referral.updated_at = new Date();
    await referral.save();

    await ReferralActivity.create({
      referral_id: referral._id,
      action: newStatus === 'PUBLISHED' ? 'REFERRAL_PUBLISHED' : 'REFERRAL_UNPUBLISHED',
      actor_tenant_id: tenantId,
      new_status: newStatus,
      details: `Referral status changed to ${newStatus}.`
    });

    return referral;
  }

  /**
   * 3. DISCOVER MARKETPLACE OPPORTUNITIES (Public Feed with Server-Side Contact Masking)
   */
  static async getMarketplace(requestingTenantId?: string, filters: any = {}) {
    const query: any = {
      status: { $in: ['PUBLISHED', 'REQUESTED'] },
      $or: [
        { expires_at: { $gt: new Date() } },
        { expires_at: { $exists: false } }
      ]
    };

    if (filters.industry) query.industry = new RegExp(filters.industry, 'i');
    if (filters.location) query.location = new RegExp(filters.location, 'i');
    if (filters.leadQuality) query.lead_quality = filters.leadQuality;
    if (filters.referralType) query.referral_type = filters.referralType;
    if (filters.sourceType) query.source_type = filters.sourceType;
    
    if (filters.minDealValue) query.estimated_deal_value = { $gte: Number(filters.minDealValue) };
    if (filters.maxDealValue) {
      query.estimated_deal_value = { ...query.estimated_deal_value, $lte: Number(filters.maxDealValue) };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$and = [
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { industry: searchRegex },
            { location: searchRegex },
            { referral_code: searchRegex }
          ]
        }
      ];
    }

    // Exclude own tenant referrals from marketplace feed if tenantId is provided
    if (requestingTenantId) {
      query.source_tenant_id = { $ne: new mongoose.Types.ObjectId(requestingTenantId) };
    }

    const referrals = await Referral.find(query)
      .sort({ published_at: -1, created_at: -1 })
      .populate('source_tenant_id', 'name company_name logo_url tenant_code industry')
      .lean();

    // Batch check existing requests for requesting tenant
    let requestedReferralIds = new Set<string>();
    if (requestingTenantId) {
      const requests = await ReferralRequest.find({
        requesting_tenant_id: requestingTenantId,
        status: { $in: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'] }
      }).select('referral_id status').lean();
      
      requests.forEach(r => requestedReferralIds.add(r.referral_id.toString()));
    }

    // Server-Side Contact Protection Masking
    return referrals.map((ref: any) => {
      const isAuthorized = false; // Marketplace list never exposes raw contact info
      return {
        ...ref,
        contact_info: this.sanitizeContactInfo(ref.contact_info),
        has_requested: requestedReferralIds.has(ref._id.toString())
      };
    });
  }

  /**
   * 4. GET SINGLE REFERRAL DETAILS (With Authorized Contact Unlock Logic)
   */
  static async getReferralById(referralId: string, tenantId?: string, isPlatformAdmin = false) {
    const referral = await Referral.findById(referralId)
      .populate('source_tenant_id', 'name company_name logo_url tenant_code industry email phone')
      .populate('created_by_user_id', 'firstname lastname email')
      .populate('eligible_tenant_ids', 'name company_name tenant_code')
      .lean() as any;

    if (!referral) throw new Error('Referral opportunity not found.');

    const isAuthorized = await this.isAuthorizedForContact(referralId, tenantId, isPlatformAdmin);
    
    // Check if requesting tenant has sent a request
    let existingRequest = null;
    let participantRecord = null;

    if (tenantId) {
      existingRequest = await ReferralRequest.findOne({
        referral_id: referralId,
        requesting_tenant_id: tenantId
      }).lean();

      participantRecord = await ReferralParticipant.findOne({
        referral_id: referralId,
        receiver_tenant_id: tenantId
      }).populate('processor_user_id', 'firstname lastname email phonenumber').lean();
    }

    const activityTimeline = await ReferralActivity.find({ referral_id: referralId })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    return {
      ...referral,
      contact_info: isAuthorized ? referral.contact_info : this.sanitizeContactInfo(referral.contact_info),
      is_contact_unlocked: isAuthorized,
      my_request: existingRequest,
      participant_details: participantRecord,
      timeline: activityTimeline
    };
  }

  /**
   * 5. REQUEST REFERRAL OPPORTUNITY
   */
  static async requestReferral(referralId: string, requestingTenantId: string, requestingUserId: string, message?: string, proposedTerms?: string) {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral opportunity not found.');

    if (referral.status === 'EXPIRED' || referral.status === 'CLOSED') {
      throw new Error('This referral opportunity is no longer active.');
    }

    if (referral.source_tenant_id?.toString() === requestingTenantId) {
      throw new Error('You cannot request your own referral opportunity.');
    }

    // Check for existing request
    const existing = await ReferralRequest.findOne({
      referral_id: referralId,
      requesting_tenant_id: requestingTenantId
    });

    if (existing && existing.status !== 'CANCELLED' && existing.status !== 'REJECTED') {
      throw new Error('Your organization has already submitted an active request for this opportunity.');
    }

    const reqRecord = await ReferralRequest.create({
      referral_id: referralId,
      requesting_tenant_id: requestingTenantId,
      requesting_user_id: requestingUserId,
      status: 'REQUESTED',
      message: message || 'We are interested in collaborating on this business opportunity.',
      proposed_terms: proposedTerms,
      requested_at: new Date()
    });

    // Update referral status to REQUESTED if still PUBLISHED
    if (referral.status === 'PUBLISHED') {
      referral.status = 'REQUESTED';
      await referral.save();
    }

    await ReferralActivity.create({
      referral_id: referralId,
      action: 'REFERRAL_REQUESTED',
      actor_user_id: requestingUserId,
      actor_tenant_id: requestingTenantId,
      details: `Organization submitted a request for this opportunity.`
    });

    return reqRecord;
  }

  /**
   * 6. APPROVE REFERRAL REQUEST & UNLOCK CONTACT ACCESS
   */
  static async approveRequest(requestId: string, approvingTenantId?: string, approvingUserId?: string, isPlatformAdmin = false) {
    const reqRecord = await ReferralRequest.findById(requestId).populate('referral_id');
    if (!reqRecord) throw new Error('Referral request record not found.');

    const referral = reqRecord.referral_id as any;

    if (!isPlatformAdmin && referral.source_tenant_id?.toString() !== approvingTenantId) {
      throw new Error('Unauthorized: Only the referral owner or platform admin can approve requests.');
    }

    reqRecord.status = 'APPROVED';
    reqRecord.approved_at = new Date();
    await reqRecord.save();

    // Create Participant Access Record
    const participant = await ReferralParticipant.findOneAndUpdate(
      {
        referral_id: referral._id,
        receiver_tenant_id: reqRecord.requesting_tenant_id
      },
      {
        referral_id: referral._id,
        owner_tenant_id: referral.source_tenant_id,
        receiver_tenant_id: reqRecord.requesting_tenant_id,
        owner_user_id: referral.created_by_user_id,
        access_level: 'MANAGE',
        contact_access: true,
        document_access: true,
        status: 'ACTIVE',
        accepted_at: new Date()
      },
      { upsert: true, new: true }
    );

    // Update referral status to APPROVED / ASSIGNED
    referral.status = 'APPROVED';
    referral.updated_at = new Date();
    await referral.save();

    await ReferralActivity.create({
      referral_id: referral._id,
      action: 'REFERRAL_REQUEST_APPROVED',
      actor_user_id: approvingUserId,
      actor_tenant_id: approvingTenantId,
      new_status: 'APPROVED',
      details: `Request approved. Contact details unlocked for requesting organization.`
    });

    return { request: reqRecord, participant };
  }

  /**
   * 7. REJECT REFERRAL REQUEST
   */
  static async rejectRequest(requestId: string, rejectionReason?: string, rejectingTenantId?: string, rejectingUserId?: string, isPlatformAdmin = false) {
    const reqRecord = await ReferralRequest.findById(requestId).populate('referral_id');
    if (!reqRecord) throw new Error('Referral request record not found.');

    const referral = reqRecord.referral_id as any;

    if (!isPlatformAdmin && referral.source_tenant_id?.toString() !== rejectingTenantId) {
      throw new Error('Unauthorized: Only the referral owner or platform admin can reject requests.');
    }

    reqRecord.status = 'REJECTED';
    reqRecord.rejection_reason = rejectionReason || 'Request declined by opportunity owner.';
    reqRecord.rejected_at = new Date();
    await reqRecord.save();

    await ReferralActivity.create({
      referral_id: referral._id,
      action: 'REFERRAL_REQUEST_REJECTED',
      actor_user_id: rejectingUserId,
      actor_tenant_id: rejectingTenantId,
      details: `Request rejected: ${reqRecord.rejection_reason}`
    });

    return reqRecord;
  }

  /**
   * 8. ASSIGN PROCESSOR USER TO REFERRAL
   */
  static async assignProcessor(referralId: string, processorUserId: string, tenantId: string) {
    const participant = await ReferralParticipant.findOne({
      referral_id: referralId,
      receiver_tenant_id: tenantId
    });

    if (!participant) throw new Error('Your organization does not have an active participation record for this referral.');

    participant.processor_user_id = new mongoose.Types.ObjectId(processorUserId);
    participant.updated_at = new Date();
    await participant.save();

    await Referral.findByIdAndUpdate(referralId, { status: 'ASSIGNED', updated_at: new Date() });

    await ReferralActivity.create({
      referral_id: referralId,
      action: 'PROCESSOR_ASSIGNED',
      actor_tenant_id: tenantId,
      new_status: 'ASSIGNED',
      details: `Assigned internal processor user to work on this opportunity.`
    });

    return participant;
  }

  /**
   * 9. UPDATE REFERRAL LIFECYCLE STATUS (Including Automatic Settlement Generation on CONVERTED)
   */
  static async updateStatus(referralId: string, newStatus: ReferralStatus, tenantId?: string, userId?: string, isPlatformAdmin = false) {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found.');

    const prevStatus = referral.status;
    referral.status = newStatus;
    referral.updated_at = new Date();
    
    if (newStatus === 'CLOSED' || newStatus === 'CONVERTED' || newStatus === 'SETTLED') {
      referral.closed_at = new Date();
    }
    await referral.save();

    await ReferralActivity.create({
      referral_id: referral._id,
      action: 'STATUS_CHANGED',
      actor_user_id: userId,
      actor_tenant_id: tenantId,
      prev_status: prevStatus,
      new_status: newStatus,
      details: `Referral status updated from ${prevStatus} to ${newStatus}.`
    });

    // AUTO-TRIGGER B2B SETTLEMENT TRANSACTION UPON CONVERSION
    let settlementTransaction = null;
    if (newStatus === 'CONVERTED') {
      settlementTransaction = await this.generateReferralSettlement(referral._id.toString());
    }

    return { referral, settlementTransaction };
  }

  /**
   * 10. GENERATE B2B SETTLEMENT TRANSACTION FOR CONVERTED REFERRAL
   */
  static async generateReferralSettlement(referralId: string) {
    const referral = await Referral.findById(referralId);
    if (!referral || !referral.source_tenant_id) return null;

    const participant = await ReferralParticipant.findOne({
      referral_id: referralId,
      status: 'ACTIVE'
    });

    if (!participant) return null;

    const providerTenantId = referral.source_tenant_id;
    const receiverTenantId = participant.receiver_tenant_id;

    // Find existing or create default B2B Settlement Agreement
    let agreement = await B2BSettlementAgreement.findOne({
      $or: [
        { provider_tenant_id: providerTenantId, receiver_tenant_id: receiverTenantId },
        { provider_tenant_id: receiverTenantId, receiver_tenant_id: providerTenantId }
      ],
      status: 'active'
    });

    if (!agreement) {
      agreement = await B2BSettlementAgreement.create({
        agreement_code: `AGR-REF-${Math.floor(10000 + Math.random() * 90000)}`,
        provider_tenant_id: providerTenantId,
        receiver_tenant_id: receiverTenantId,
        billing_model: referral.commission_type === 'PERCENTAGE' ? 'rev_share' : 'per_sale',
        rate: referral.referral_fee || referral.commission_value || 0,
        rev_share_percentage: referral.commission_value || 0,
        success_stages: ['CONVERTED', 'SETTLED'],
        status: 'active'
      });
    }

    // Calculate Settlement Gross Amount
    let baseAmount = referral.referral_fee || 0;
    if (referral.commission_type === 'PERCENTAGE' && referral.commission_value > 0) {
      baseAmount = (referral.estimated_deal_value * referral.commission_value) / 100;
    }

    const taxAmount = Math.round(((baseAmount * 18) / 100) * 100) / 100; // 18% GST default
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;
    const idempotencyKey = crypto.createHash('sha256').update(`${providerTenantId}_${receiverTenantId}_${referralId}_CONVERTED`).digest('hex');

    const existingTx = await B2BSettlementTransaction.findOne({ idempotency_key: idempotencyKey });
    if (existingTx) return existingTx;

    // Authoritative platform commission calculation via PlatformFeeService
    const feeResult = await PlatformFeeService.calculateFee(
      totalAmount,
      referral.currency || 'INR',
      agreement.commission_rate_override
    );

    const transactionCode = `TX-REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await B2BSettlementTransaction.create({
      transaction_code: transactionCode,
      agreement_id: agreement._id,
      provider_tenant_id: providerTenantId,
      receiver_tenant_id: receiverTenantId,
      lead_id: referral.lead_id || referral._id,
      idempotency_key: idempotencyKey,
      stage_reached: 'CONVERTED',
      base_amount: baseAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      platform_commission: feeResult.platformFee,
      platform_commission_tax: feeResult.taxOnPlatformFee,
      receiver_net_amount: feeResult.receiverAmount,
      allocated_amount: 0,
      remaining_amount: totalAmount,
      currency: referral.currency || 'INR',
      status: 'unbilled'
    });

    // Create synchronized PlatformCommission record
    const commissionCode = `COMM-REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const platformCommission = await PlatformCommission.create({
      commission_code: commissionCode,
      settlement_transaction_id: transaction._id,
      lead_id: referral.lead_id || referral._id,
      payer_tenant_id: receiverTenantId,
      receiver_tenant_id: providerTenantId,
      gross_amount: totalAmount,
      commission_rate: feeResult.commissionRateApplied,
      commission_amount: feeResult.platformFee,
      commission_tax: feeResult.taxOnPlatformFee,
      total_commission_deduction: feeResult.totalPlatformDeduction,
      commission_collected_amount: 0,
      commission_refunded_amount: 0,
      commission_remaining_amount: feeResult.totalPlatformDeduction,
      receiver_net_amount: feeResult.receiverAmount,
      currency: referral.currency || 'INR',
      status: 'CALCULATED',
      provider: 'razorpay',
      calculated_at: new Date()
    });

    // Link commission ID back to transaction
    transaction.commission_id = platformCommission._id;
    await transaction.save();

    await ReferralActivity.create({
      referral_id: referral._id,
      action: 'SETTLEMENT_GENERATED',
      details: `Settlement transaction ${transaction.transaction_code} generated for gross ₹${totalAmount.toLocaleString('en-IN')} (Platform Fee: ₹${feeResult.totalPlatformDeduction.toLocaleString('en-IN')}, Net Payout: ₹${feeResult.receiverAmount.toLocaleString('en-IN')}).`
    });

    return transaction;
  }

  /**
   * 11. LIST MY PUBLISHED REFERRALS (For Organization)
   */
  static async getMyPublishedReferrals(tenantId: string) {
    const referrals = await Referral.find({ source_tenant_id: tenantId })
      .sort({ created_at: -1 })
      .lean();

    // Enhance each referral with active request counts
    return await Promise.all(
      referrals.map(async (ref) => {
        const requests = await ReferralRequest.find({ referral_id: ref._id })
          .populate('requesting_tenant_id', 'name company_name logo_url tenant_code')
          .populate('requesting_user_id', 'firstname lastname email')
          .lean();

        const participants = await ReferralParticipant.find({ referral_id: ref._id })
          .populate('receiver_tenant_id', 'name company_name tenant_code')
          .populate('processor_user_id', 'firstname lastname email')
          .lean();

        return {
          ...ref,
          request_count: requests.length,
          requests,
          participants
        };
      })
    );
  }

  /**
   * 12. LIST RECEIVED / ASSIGNED REFERRALS (For Organization)
   */
  static async getReceivedReferrals(tenantId: string) {
    const participants = await ReferralParticipant.find({ receiver_tenant_id: tenantId, status: 'ACTIVE' })
      .populate({
        path: 'referral_id',
        populate: { path: 'source_tenant_id', select: 'name company_name logo_url tenant_code' }
      })
      .populate('processor_user_id', 'firstname lastname email phonenumber')
      .sort({ accepted_at: -1 })
      .lean();

    return participants.map((p: any) => {
      const ref = p.referral_id || {};
      return {
        participant_id: p._id,
        referral: ref,
        assigned_processor: p.processor_user_id,
        contact_access: p.contact_access,
        accepted_at: p.accepted_at
      };
    });
  }

  /**
   * 13. REFERRAL NETWORK ANALYTICS
   */
  static async getAnalytics(tenantId?: string, isPlatformAdmin = false) {
    const query: any = {};
    if (!isPlatformAdmin && tenantId) {
      query.$or = [
        { source_tenant_id: tenantId },
        { _id: { $in: await ReferralParticipant.distinct('referral_id', { receiver_tenant_id: tenantId }) } }
      ];
    }

    const totalReferrals = await Referral.countDocuments(query);
    const published = await Referral.countDocuments({ ...query, status: 'PUBLISHED' });
    const requested = await Referral.countDocuments({ ...query, status: 'REQUESTED' });
    const approved = await Referral.countDocuments({ ...query, status: { $in: ['APPROVED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION'] } });
    const converted = await Referral.countDocuments({ ...query, status: { $in: ['CONVERTED', 'SETTLED'] } });

    const totalValueAgg = await Referral.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$estimated_deal_value' }, avgFee: { $avg: '$referral_fee' } } }
    ]);

    const totalDealValue = totalValueAgg[0]?.total || 0;
    const avgReferralFee = totalValueAgg[0]?.avgFee || 0;

    return {
      totalReferrals,
      published,
      requested,
      approved,
      converted,
      conversionRate: totalReferrals > 0 ? Math.round((converted / totalReferrals) * 100) : 0,
      totalDealValue,
      avgReferralFee
    };
  }

  /**
   * 14. GET PARTNER NETWORK OVERVIEW
   */
  static async getPartnerNetwork(tenantId: string) {
    const participants = await ReferralParticipant.find({
      $or: [
        { owner_tenant_id: tenantId },
        { receiver_tenant_id: tenantId }
      ]
    })
      .populate('owner_tenant_id', 'name company_name logo_url tenant_code industry location')
      .populate('receiver_tenant_id', 'name company_name logo_url tenant_code industry location')
      .lean();

    const partnerMap = new Map<string, any>();

    participants.forEach((p: any) => {
      const isOwner = p.owner_tenant_id?._id?.toString() === tenantId;
      const partnerObj = isOwner ? p.receiver_tenant_id : p.owner_tenant_id;
      if (!partnerObj || !partnerObj._id) return;

      const partnerId = partnerObj._id.toString();
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partner_tenant: partnerObj,
          referrals_shared: 0,
          referrals_received: 0,
          active_deals: 0
        });
      }

      const record = partnerMap.get(partnerId);
      if (isOwner) {
        record.referrals_shared += 1;
      } else {
        record.referrals_received += 1;
      }
      if (p.status === 'ACTIVE') record.active_deals += 1;
    });

    return Array.from(partnerMap.values());
  }
  /**
   * 15. GET ALL REFERRAL REQUESTS FOR PLATFORM ADMIN
   */
  static async getAllRequestsForAdmin() {
    const requests = await ReferralRequest.find({})
      .populate('referral_id', 'referral_code title estimated_deal_value referral_fee status source_tenant_id')
      .populate('requesting_tenant_id', 'name company_name logo_url tenant_code')
      .populate('requesting_user_id', 'firstname lastname email phonenumber')
      .sort({ requested_at: -1 })
      .lean();

    return requests;
  }
}

export default ReferralService;
