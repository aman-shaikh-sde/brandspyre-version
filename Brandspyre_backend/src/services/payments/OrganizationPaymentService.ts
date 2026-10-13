import mongoose from "mongoose";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import { OrganizationPaymentAccount, IOrganizationPaymentAccount } from "../../db/ModelSceham/organizationPaymentAccountSchema";
import { OrganizationPaymentRequest, IOrganizationPaymentRequest } from "../../db/ModelSceham/organizationPaymentRequestSchema";
import { OrganizationPayment, IOrganizationPayment } from "../../db/ModelSceham/organizationPaymentSchema";
import { MarketplacePaymentService } from "./MarketplacePaymentService";
import { MarketplaceProviderType } from "./providers/MarketplacePaymentProvider";

const isMockMode = (): boolean => {
  return process.env.PAYMENT_MOCK_MODE === 'true' || process.env.NODE_ENV === 'test';
};

export class OrganizationPaymentService {
  /**
   * 1. Onboard / Connect Organization Payment Account (Delegates to MarketplacePaymentService)
   */
  static async onboardPaymentAccount(
    tenantId: string,
    accountData: {
      provider?: MarketplaceProviderType;
      business_name: string;
      business_type?: 'individual' | 'partnership' | 'proprietorship' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'other';
      legal_name?: string;
      email: string;
      phone?: string;
      bank_name?: string;
      account_number?: string;
      ifsc_code?: string;
      beneficiary_name?: string;
      gstin?: string;
      pan?: string;
      return_url?: string;
      refresh_url?: string;
    }
  ): Promise<IOrganizationPaymentAccount> {
    return await MarketplacePaymentService.onboardPaymentAccount(tenantId, accountData);
  }

  /**
   * 2. Get Payment Account Status
   */
  static async getPaymentAccount(tenantId: string): Promise<any> {
    return await MarketplacePaymentService.getPaymentAccount(tenantId);
  }

  /**
   * 3. Disconnect Payment Account
   */
  static async disconnectPaymentAccount(
    tenantId: string,
    provider?: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    return await MarketplacePaymentService.disconnectPaymentAccount(tenantId, provider);
  }

  /**
   * 4. Refresh Payment Account
   */
  static async refreshPaymentAccount(
    tenantId: string,
    provider?: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    return await MarketplacePaymentService.refreshPaymentAccount(tenantId, provider);
  }

  /**
   * 5. Set Default Payment Provider
   */
  static async setDefaultProvider(
    tenantId: string,
    provider: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    return await MarketplacePaymentService.setDefaultProvider(tenantId, provider);
  }

  /**
   * 6. Create Organization Payment Request
   */
  static async createPaymentRequest(
    receiverTenantId: string,
    requestData: {
      title: string;
      description?: string;
      payer_name: string;
      payer_email: string;
      payer_phone?: string;
      payer_tenant_id?: string;
      payer_client_id?: string;
      invoice_id?: string;
      sales_order_id?: string;
      project_id?: string;
      base_amount: number;
      tax_amount?: number;
      currency?: string;
      due_date?: Date;
      allowed_payment_methods?: string[];
      notes?: string;
      payment_type?: string;
      preferred_provider?: MarketplaceProviderType;
      created_by?: string;
    }
  ): Promise<IOrganizationPaymentRequest> {
    const account = await OrganizationPaymentAccount.findOne({
      tenant_id: receiverTenantId,
      account_status: 'ACTIVE'
    });

    if (!account && !isMockMode()) {
      throw new Error("Organization must configure and activate a verified payment account before creating payment requests.");
    }

    const baseAmount = Number(requestData.base_amount);
    const taxAmount = Number(requestData.tax_amount || 0);
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

    if (totalAmount <= 0) {
      throw new Error("Payment request amount must be greater than 0.");
    }

    const requestCode = `PAYREQ-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const request = await OrganizationPaymentRequest.create({
      request_code: requestCode,
      receiver_tenant_id: new mongoose.Types.ObjectId(receiverTenantId),
      payer_name: requestData.payer_name,
      payer_email: requestData.payer_email,
      payer_phone: requestData.payer_phone,
      payer_tenant_id: requestData.payer_tenant_id ? new mongoose.Types.ObjectId(requestData.payer_tenant_id) : undefined,
      payer_client_id: requestData.payer_client_id ? new mongoose.Types.ObjectId(requestData.payer_client_id) : undefined,
      invoice_id: requestData.invoice_id ? new mongoose.Types.ObjectId(requestData.invoice_id) : undefined,
      sales_order_id: requestData.sales_order_id ? new mongoose.Types.ObjectId(requestData.sales_order_id) : undefined,
      project_id: requestData.project_id ? new mongoose.Types.ObjectId(requestData.project_id) : undefined,
      title: requestData.title,
      description: requestData.description,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      balance_due: totalAmount,
      currency: requestData.currency || 'INR',
      due_date: requestData.due_date,
      status: 'PENDING',
      payment_type: requestData.payment_type || 'GENERAL_B2B_PAYMENT',
      preferred_provider: requestData.preferred_provider || account?.default_provider || 'razorpay',
      allowed_payment_methods: requestData.allowed_payment_methods || ['card', 'upi', 'netbanking', 'wallet'],
      notes: requestData.notes,
      created_by: requestData.created_by ? new mongoose.Types.ObjectId(requestData.created_by) : undefined
    });

    return request;
  }

  /**
   * 7. Get Payment Requests
   */
  static async getPaymentRequests(
    tenantId: string,
    filters: {
      type?: 'received' | 'sent';
      status?: string;
      payment_type?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: IOrganizationPaymentRequest[]; total: number; page: number; pages: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.type === 'sent') {
      query.payer_tenant_id = new mongoose.Types.ObjectId(tenantId);
    } else {
      query.receiver_tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.payment_type) {
      query.payment_type = filters.payment_type;
    }

    const [data, total] = await Promise.all([
      OrganizationPaymentRequest.find(query)
        .populate('receiver_tenant_id', 'company_name name tenant_code')
        .populate('payer_tenant_id', 'company_name name tenant_code')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrganizationPaymentRequest.countDocuments(query)
    ]);

    return {
      data: data as any,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * 8. Create Checkout Order / Session (Multi-Provider)
   */
  static async createCheckoutOrder(
    requestId: string,
    payerData?: {
      payer_name?: string;
      payer_email?: string;
      payer_phone?: string;
      payer_tenant_id?: string;
      provider?: MarketplaceProviderType;
    }
  ): Promise<any> {
    return await MarketplacePaymentService.createCheckoutOrder(requestId, {
      provider: payerData?.provider,
      payerData
    });
  }

  /**
   * 9. Verify & Reconcile Payment Signature
   */
  static async verifyAndReconcilePayment(paymentData: {
    provider?: MarketplaceProviderType;
    order_id?: string;
    payment_id?: string;
    signature?: string;
    checkout_session_id?: string;
    payment_intent_id?: string;
    payment_request_id?: string;
  }) {
    return await MarketplacePaymentService.verifyAndReconcilePayment(paymentData);
  }

  /**
   * 10. Idempotent Reconciliation Engine
   */
  static async reconcileCapturedPayment(paymentData: any) {
    return await MarketplacePaymentService.reconcileCapturedPayment(paymentData);
  }

  /**
   * 11. Process Refund
   */
  static async processRefund(paymentId: string, refundData: { amount?: number; reason?: string }) {
    return await MarketplacePaymentService.processRefund(paymentId, refundData);
  }

  /**
   * 12. Dashboard Metrics (Multi-Provider)
   */
  static async getDashboardMetrics(tenantId: string, range: string = 'all', provider: string = 'all') {
    return await MarketplacePaymentService.getDashboardMetrics(tenantId, range, provider);
  }

  /**
   * 13. Admin Reconciliations
   */
  static async getAdminReconciliations(filters: {
    status?: string;
    provider?: string;
    transfer_status?: string;
    refund_status?: string;
    reconciliation_required?: string | boolean;
    adjustment_status?: string;
    tenant_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.provider && filters.provider !== 'all') {
      query.provider = filters.provider;
    }

    if (filters.transfer_status && filters.transfer_status !== 'all') {
      if (filters.transfer_status === 'SETTLED') query.status = 'SETTLED';
      else if (filters.transfer_status === 'TRANSFER_FAILED') query.status = 'TRANSFER_FAILED';
      else if (filters.transfer_status === 'PENDING') query.status = 'CAPTURED';
    }

    if (filters.refund_status && filters.refund_status !== 'all') {
      query.status = filters.refund_status;
    }

    if (filters.adjustment_status && filters.adjustment_status !== 'all') {
      query.receiver_adjustment_status = filters.adjustment_status;
    }

    if (filters.reconciliation_required === true || filters.reconciliation_required === 'true') {
      query.$or = [
        { receiver_adjustment_required: true },
        { status: 'RECONCILIATION_REQUIRED' },
        { status: 'TRANSFER_FAILED' }
      ];
    }

    if (filters.tenant_id && mongoose.Types.ObjectId.isValid(filters.tenant_id)) {
      query.$or = [
        { receiver_tenant_id: new mongoose.Types.ObjectId(filters.tenant_id) },
        { payer_tenant_id: new mongoose.Types.ObjectId(filters.tenant_id) }
      ];
    }

    if (filters.start_date || filters.end_date) {
      query.created_at = {};
      if (filters.start_date) query.created_at.$gte = new Date(filters.start_date);
      if (filters.end_date) query.created_at.$lte = new Date(filters.end_date);
    }

    const [payments, total] = await Promise.all([
      OrganizationPayment.find(query)
        .populate('receiver_tenant_id', 'company_name name tenant_code')
        .populate('payer_tenant_id', 'company_name name tenant_code')
        .populate('payment_request_id', 'title request_code payment_type invoice_id')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrganizationPayment.countDocuments(query)
    ]);

    return {
      data: payments as any,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * 14. Update Adjustment Status
   */
  static async updateAdjustmentStatus(
    paymentId: string,
    adjustmentData: {
      status: 'NOT_REQUIRED' | 'PENDING_RECONCILIATION' | 'UNDER_REVIEW' | 'ADJUSTMENT_REQUESTED' | 'ADJUSTMENT_RECEIVED' | 'COMPLETED' | 'FAILED';
      notes?: string;
      actor_id?: string;
    }
  ) {
    const payment = await OrganizationPayment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment record not found.");
    }

    payment.receiver_adjustment_status = adjustmentData.status;
    if (adjustmentData.status === 'COMPLETED' || adjustmentData.status === 'ADJUSTMENT_RECEIVED') {
      payment.receiver_adjustment_required = false;
    }
    
    if (!payment.metadata) payment.metadata = {};
    if (!payment.metadata.adjustment_audit) payment.metadata.adjustment_audit = [];
    
    payment.metadata.adjustment_audit.push({
      status: adjustmentData.status,
      notes: adjustmentData.notes,
      actor_id: adjustmentData.actor_id,
      timestamp: new Date()
    });

    payment.updated_at = new Date();
    await payment.save();

    return payment;
  }

  /**
   * 15. Public Checkout: Resolve Payment Request by Token
   */
  static async getPaymentRequestByToken(token: string) {
    return await MarketplacePaymentService.getPaymentRequestByToken(token);
  }

  /**
   * 16. Public Checkout: Verify and Capture
   */
  static async verifyAndCapturePayment(
    token: string,
    orderId: string,
    paymentId: string,
    signature: string,
    provider: MarketplaceProviderType = 'razorpay'
  ) {
    return await MarketplacePaymentService.verifyAndReconcilePayment({
      provider,
      order_id: orderId,
      payment_id: paymentId,
      signature,
      payment_request_id: token
    });
  }
}

export default OrganizationPaymentService;
