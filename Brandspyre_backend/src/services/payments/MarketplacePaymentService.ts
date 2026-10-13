import mongoose from "mongoose";
import crypto from "crypto";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import { OrganizationPaymentAccount, IOrganizationPaymentAccount } from "../../db/ModelSceham/organizationPaymentAccountSchema";
import { OrganizationPaymentRequest, IOrganizationPaymentRequest } from "../../db/ModelSceham/organizationPaymentRequestSchema";
import { OrganizationPayment, IOrganizationPayment } from "../../db/ModelSceham/organizationPaymentSchema";
import { PlatformFeeService } from "./PlatformFeeService";
import { B2BSettlementInvoice, B2BSettlementTransaction, B2BSettlementAgreement } from "../../db/ModelSceham/b2bSettlementSchema";
import { PaymentAllocation } from "../../db/ModelSceham/paymentAllocationSchema";
import { PlatformCommission } from "../../db/ModelSceham/platformCommissionSchema";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import { Lead } from "../../db/ModelSceham/project/campagin";
import { CustomerLedger } from "../../db/ModelSchema/commerce/CustomerLedger";
import { ChartOfAccounts, JournalEntry, JournalEntryLine } from "../../db/ModelSceham/accountingSchema";
import { Notification } from "../../db/ModelSceham/Notification/notification";

import { IMarketplacePaymentProvider, MarketplaceProviderType } from "./providers/MarketplacePaymentProvider";
import { RazorpayMarketplaceProvider } from "./providers/RazorpayMarketplaceProvider";
import { StripeMarketplaceProvider } from "./providers/StripeMarketplaceProvider";

const isMockMode = (): boolean => {
  return process.env.PAYMENT_MOCK_MODE === 'true' || process.env.NODE_ENV === 'test';
};

export class MarketplacePaymentService {
  private static razorpayProvider: IMarketplacePaymentProvider = new RazorpayMarketplaceProvider();
  private static stripeProvider: IMarketplacePaymentProvider = new StripeMarketplaceProvider();

  /**
   * Resolve provider instance by type
   */
  static getProvider(type: MarketplaceProviderType = 'razorpay'): IMarketplacePaymentProvider {
    if (type === 'stripe') {
      return this.stripeProvider;
    }
    return this.razorpayProvider;
  }

  /**
   * 1. Onboard Payment Account for specific provider (Razorpay or Stripe)
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
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error("Organization not found.");
    }

    const targetProvider: MarketplaceProviderType = accountData.provider || 'razorpay';
    const providerInstance = this.getProvider(targetProvider);

    let existing = await OrganizationPaymentAccount.findOne({ tenant_id: tenantId });
    
    // Call provider onboarding
    const providerResult = await providerInstance.onboardAccount({
      tenantId: tenant._id.toString(),
      business_name: accountData.business_name || tenant.company_name || tenant.name,
      business_type: accountData.business_type || 'private_limited',
      legal_name: accountData.legal_name || accountData.business_name || tenant.name,
      email: accountData.email || tenant.billing_email || 'billing@organization.com',
      phone: accountData.phone || '',
      bank_name: accountData.bank_name,
      account_number: accountData.account_number,
      ifsc_code: accountData.ifsc_code,
      beneficiary_name: accountData.beneficiary_name,
      gstin: accountData.gstin,
      pan: accountData.pan,
      return_url: accountData.return_url,
      refresh_url: accountData.refresh_url
    });

    const maskedAccNum = accountData.account_number && accountData.account_number.length > 4
      ? `****${accountData.account_number.slice(-4)}`
      : '****1234';

    if (!existing) {
      existing = new OrganizationPaymentAccount({
        tenant_id: tenant._id,
        default_provider: targetProvider,
        provider: targetProvider,
        provider_account_id: providerResult.provider_account_id,
        account_status: providerResult.account_status,
        onboarding_status: providerResult.onboarding_status,
        kyc_status: providerResult.kyc_status,
        business_name: accountData.business_name || tenant.company_name || tenant.name,
        business_type: accountData.business_type || 'private_limited',
        legal_name: accountData.legal_name || accountData.business_name || tenant.name,
        email: accountData.email || tenant.billing_email || 'billing@organization.com',
        phone: accountData.phone || '',
        country: 'IN',
        currency: 'INR',
        bank_account_status: providerResult.account_status === 'ACTIVE' ? 'verified' : 'pending',
        bank_details: {
          bank_name: accountData.bank_name || 'HDFC Bank',
          account_number_masked: maskedAccNum,
          ifsc_code: accountData.ifsc_code || 'HDFC0000240',
          beneficiary_name: accountData.beneficiary_name || accountData.business_name
        },
        gstin: accountData.gstin || tenant.gst_number || '',
        pan: accountData.pan || tenant.pan_number || '',
        capabilities: {
          route: Boolean(providerResult.capabilities.route),
          payouts: Boolean(providerResult.capabilities.payouts),
          transfers: Boolean(providerResult.capabilities.transfers)
        },
        payments_enabled: providerResult.payments_enabled,
        payouts_enabled: providerResult.payouts_enabled,
        activated_at: providerResult.account_status === 'ACTIVE' ? new Date() : undefined
      });
    }

    // Update specific provider subdocument
    if (targetProvider === 'razorpay') {
      existing.razorpay = {
        account_id: providerResult.provider_account_id,
        status: providerResult.account_status,
        kyc_status: providerResult.kyc_status,
        payments_enabled: providerResult.payments_enabled,
        payouts_enabled: providerResult.payouts_enabled,
        capabilities: {
          route: Boolean(providerResult.capabilities.route),
          payouts: Boolean(providerResult.capabilities.payouts),
          transfers: Boolean(providerResult.capabilities.transfers)
        },
        activated_at: providerResult.account_status === 'ACTIVE' ? new Date() : undefined,
        metadata: providerResult.metadata
      };
    } else if (targetProvider === 'stripe') {
      existing.stripe = {
        account_id: providerResult.provider_account_id,
        status: providerResult.account_status,
        onboarding_status: providerResult.onboarding_status,
        charges_enabled: providerResult.payments_enabled,
        payouts_enabled: providerResult.payouts_enabled,
        details_submitted: providerResult.details_submitted || false,
        requirements: providerResult.requirements,
        capabilities: {
          card_payments: providerResult.capabilities.card_payments || 'inactive',
          transfers: providerResult.capabilities.transfers ? 'active' : 'inactive'
        },
        activated_at: providerResult.account_status === 'ACTIVE' ? new Date() : undefined,
        onboarding_url: providerResult.onboarding_url,
        metadata: providerResult.metadata
      };
    }

    // If default provider, update legacy root fields as well
    if (existing.default_provider === targetProvider || !existing.provider_account_id) {
      existing.provider = targetProvider;
      existing.provider_account_id = providerResult.provider_account_id;
      existing.account_status = providerResult.account_status;
      existing.onboarding_status = providerResult.onboarding_status;
      existing.kyc_status = providerResult.kyc_status;
      existing.payments_enabled = providerResult.payments_enabled;
      existing.payouts_enabled = providerResult.payouts_enabled;
      existing.capabilities = {
        route: Boolean(providerResult.capabilities.route),
        payouts: Boolean(providerResult.capabilities.payouts),
        transfers: Boolean(providerResult.capabilities.transfers)
      };
      if (providerResult.account_status === 'ACTIVE') {
        existing.activated_at = new Date();
      }
    }

    existing.updated_at = new Date();
    await existing.save();
    return existing;
  }

  /**
   * 2. Create Onboarding Link for Stripe Connect
   */
  static async createOnboardingLink(
    tenantId: string,
    provider: MarketplaceProviderType,
    returnUrl: string,
    refreshUrl: string
  ): Promise<{ url: string }> {
    const account = await OrganizationPaymentAccount.findOne({ tenant_id: tenantId });
    if (!account) {
      throw new Error("Payment account not found. Please initiate onboarding first.");
    }

    const providerInstance = this.getProvider(provider);
    if (provider === 'stripe') {
      const accountId = account.stripe?.account_id || account.provider_account_id;
      if (!accountId) {
        throw new Error("Stripe account ID not found for this organization.");
      }
      if (providerInstance.createOnboardingLink) {
        return await providerInstance.createOnboardingLink(accountId, returnUrl, refreshUrl);
      }
    }

    return { url: '' };
  }

  /**
   * 3. Refresh Provider Account Status
   */
  static async refreshPaymentAccount(
    tenantId: string,
    provider?: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    const account = await OrganizationPaymentAccount.findOne({ tenant_id: tenantId });
    if (!account) return null;

    const targetProvider = provider || account.default_provider || 'razorpay';
    const providerInstance = this.getProvider(targetProvider);

    const accountId = targetProvider === 'stripe'
      ? account.stripe?.account_id
      : (account.razorpay?.account_id || account.provider_account_id);

    if (accountId) {
      const latest = await providerInstance.getAccountDetails(accountId);

      if (targetProvider === 'stripe') {
        if (!account.stripe) {
          account.stripe = {
            account_id: accountId,
            status: latest.account_status,
            charges_enabled: latest.payments_enabled,
            payouts_enabled: latest.payouts_enabled
          };
        } else {
          account.stripe.status = latest.account_status;
          account.stripe.charges_enabled = latest.payments_enabled;
          account.stripe.payouts_enabled = latest.payouts_enabled;
          account.stripe.onboarding_status = latest.onboarding_status;
          account.stripe.kyc_status = latest.kyc_status;
        }
      } else {
        if (!account.razorpay) {
          account.razorpay = {
            account_id: accountId,
            status: latest.account_status,
            payments_enabled: latest.payments_enabled,
            payouts_enabled: latest.payouts_enabled
          };
        } else {
          account.razorpay.status = latest.account_status;
          account.razorpay.payments_enabled = latest.payments_enabled;
          account.razorpay.payouts_enabled = latest.payouts_enabled;
          account.razorpay.kyc_status = latest.kyc_status;
        }
      }

      if (account.default_provider === targetProvider) {
        account.account_status = latest.account_status;
        account.payments_enabled = latest.payments_enabled;
        account.payouts_enabled = latest.payouts_enabled;
      }

      account.updated_at = new Date();
      await account.save();
    }

    return account;
  }

  /**
   * 4. Disconnect Specific Provider Account
   */
  static async disconnectPaymentAccount(
    tenantId: string,
    provider?: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    const account = await OrganizationPaymentAccount.findOne({ tenant_id: tenantId });
    if (!account) return null;

    const targetProvider = provider || account.default_provider || 'razorpay';

    if (targetProvider === 'razorpay' && account.razorpay) {
      account.razorpay.status = 'DISCONNECTED';
      account.razorpay.payments_enabled = false;
      account.razorpay.payouts_enabled = false;
    } else if (targetProvider === 'stripe' && account.stripe) {
      account.stripe.status = 'DISCONNECTED';
      account.stripe.charges_enabled = false;
      account.stripe.payouts_enabled = false;
    }

    if (account.default_provider === targetProvider) {
      // Check if alternative provider is connected and active
      const otherProvider = targetProvider === 'razorpay' ? 'stripe' : 'razorpay';
      const otherStatus = otherProvider === 'stripe' ? account.stripe?.status : account.razorpay?.status;

      if (otherStatus === 'ACTIVE') {
        account.default_provider = otherProvider;
        account.provider = otherProvider;
        account.account_status = 'ACTIVE';
        account.payments_enabled = true;
        account.payouts_enabled = true;
      } else {
        account.account_status = 'DISCONNECTED';
        account.payments_enabled = false;
        account.payouts_enabled = false;
      }
    }

    account.updated_at = new Date();
    await account.save();
    return account;
  }

  /**
   * 5. Set Default Marketplace Payment Provider
   */
  static async setDefaultProvider(
    tenantId: string,
    provider: MarketplaceProviderType
  ): Promise<IOrganizationPaymentAccount | null> {
    const account = await OrganizationPaymentAccount.findOne({ tenant_id: tenantId });
    if (!account) throw new Error("Payment account not found.");

    account.default_provider = provider;
    account.provider = provider;
    
    const activeSub = provider === 'stripe' ? account.stripe : account.razorpay;
    if (activeSub) {
      account.account_status = activeSub.status;
      account.payments_enabled = Boolean(provider === 'stripe' ? (activeSub as any).charges_enabled : activeSub.payments_enabled);
      account.payouts_enabled = Boolean(activeSub.payouts_enabled);
      account.provider_account_id = activeSub.account_id || account.provider_account_id;
    }

    account.updated_at = new Date();
    await account.save();
    return account;
  }

  /**
   * 6. Get Payment Account Details
   */
  static async getPaymentAccount(tenantId: string): Promise<any> {
    return await OrganizationPaymentAccount.findOne({ tenant_id: tenantId }).lean();
  }

  /**
   * 7. Centralized Marketplace Payment Eligibility Validation
   */
  static async validateMarketplacePaymentEligibility(
    request: any,
    providerType: MarketplaceProviderType = 'razorpay'
  ): Promise<{
    invoice: any;
    payeeAccount: any;
  }> {
    if (!request || request.payment_type !== 'LEAD_MARKETPLACE_SETTLEMENT') {
      return { invoice: null, payeeAccount: null };
    }

    if (request.status === 'PAID' || request.balance_due <= 0) {
      throw new Error("Payment request has already been paid in full.");
    }

    if (request.status === 'CANCELLED' || request.status === 'EXPIRED') {
      throw new Error(`Cannot pay for a payment request with status '${request.status}'.`);
    }

    if (!request.invoice_id) {
      throw new Error("Marketplace payment request is missing linked settlement invoice.");
    }

    const invoice = await B2BSettlementInvoice.findById(request.invoice_id);
    if (!invoice || invoice.balance_due <= 0) {
      throw new Error("Linked settlement invoice is invalid or already fully paid.");
    }

    if (!invoice.transaction_ids || invoice.transaction_ids.length === 0) {
      throw new Error("No settlement transactions linked to this marketplace invoice.");
    }

    // Authoritative verification of underlying transactions
    for (const txnId of invoice.transaction_ids) {
      const txn = await B2BSettlementTransaction.findById(txnId);
      if (!txn) {
        throw new Error(`Settlement transaction ${txnId} not found.`);
      }

      if (!['unbilled', 'invoiced', 'payment_pending'].includes(txn.status)) {
        throw new Error(`Transaction ${txn.transaction_code} is in status '${txn.status}' and cannot be paid.`);
      }

      const [agreement] = await Promise.all([
        B2BSettlementAgreement.findOne({
          _id: txn.agreement_id,
          provider_tenant_id: txn.provider_tenant_id,
          receiver_tenant_id: txn.receiver_tenant_id,
          status: 'active'
        })
      ]);

      if (!agreement) {
        throw new Error(`Payment blocked: Missing active bilateral agreement for transaction ${txn.transaction_code}.`);
      }
    }

    // Validate Payee (Provider / Seller entitled to payout) payment account on selected provider
    const payeeAccount = await OrganizationPaymentAccount.findOne({
      tenant_id: invoice.provider_tenant_id
    });

    if (!isMockMode()) {
      if (!payeeAccount) {
        throw new Error("Payment blocked: The receiving organization has not set up a payment account. Please ask them to connect Razorpay or Stripe.");
      }

      if (providerType === 'stripe') {
        const stripeDetails = payeeAccount.stripe;
        if (!stripeDetails?.account_id || stripeDetails.status !== 'ACTIVE' || !stripeDetails.payouts_enabled) {
          throw new Error("Payment cannot be completed yet. The receiving organization has not completed Stripe Connect account verification. Please ask them to connect/verify Stripe.");
        }
      } else {
        const rzpDetails = payeeAccount.razorpay || payeeAccount;
        const rzpAccountId = rzpDetails.account_id || payeeAccount.provider_account_id;
        const isActive = (payeeAccount.razorpay?.status === 'ACTIVE' || payeeAccount.account_status === 'ACTIVE') && payeeAccount.payouts_enabled;

        if (!rzpAccountId || !isActive) {
          throw new Error("Payment cannot be completed yet. The receiving organization has not completed Razorpay Route verification. Please ask them to connect/verify Razorpay.");
        }
      }
    }

    return { invoice, payeeAccount };
  }

  /**
   * 8. Unified Marketplace Checkout Order / Session Creator
   */
  static async createCheckoutOrder(
    requestId: string,
    options?: {
      provider?: MarketplaceProviderType;
      payerData?: {
        payer_name?: string;
        payer_email?: string;
        payer_phone?: string;
        payer_tenant_id?: string;
      };
      successUrl?: string;
      cancelUrl?: string;
    }
  ): Promise<any> {
    const request = mongoose.Types.ObjectId.isValid(requestId)
      ? await OrganizationPaymentRequest.findById(requestId)
      : await OrganizationPaymentRequest.findOne({
          $or: [
            { payment_link_token: requestId },
            { request_code: requestId }
          ]
        });

    if (!request) {
      throw new Error("Payment request not found.");
    }

    // Determine target provider
    const config = await PlatformFeeService.getConfig();
    const selectedProvider: MarketplaceProviderType = options?.provider || 
      request.preferred_provider || 
      config.default_marketplace_provider || 
      'razorpay';

    // Verify provider is enabled on platform
    if (selectedProvider === 'stripe' && !config.stripe_enabled) {
      throw new Error("Stripe marketplace payments are currently disabled on the platform.");
    }
    if (selectedProvider === 'razorpay' && !config.razorpay_enabled) {
      throw new Error("Razorpay marketplace payments are currently disabled on the platform.");
    }

    // Validate eligibility & receiving organization account
    const { invoice, payeeAccount } = await this.validateMarketplacePaymentEligibility(request, selectedProvider);

    const receiverTenant = await Tenant.findById(request.receiver_tenant_id);
    if (!receiverTenant) {
      throw new Error("Receiving organization not found.");
    }

    // Immutable financial snapshot
    let platformFee = 0;
    let taxOnPlatformFee = 0;
    let receiverAmount = request.balance_due;

    if (request.payment_type === 'LEAD_MARKETPLACE_SETTLEMENT' && invoice) {
      const ratio = request.total_amount > 0 ? (request.balance_due / request.total_amount) : 1;
      platformFee = Math.round((invoice.platform_fee_total || 0) * ratio * 100) / 100;
      taxOnPlatformFee = Math.round((invoice.platform_tax_total || 0) * ratio * 100) / 100;
      receiverAmount = Math.round((invoice.receiver_amount_total || (invoice.total_amount - invoice.platform_fee_total)) * ratio * 100) / 100;
    } else {
      const feeCalc = await PlatformFeeService.calculateFee(request.balance_due, request.currency);
      platformFee = feeCalc.platformFee;
      taxOnPlatformFee = feeCalc.taxOnPlatformFee;
      receiverAmount = feeCalc.receiverAmount;
    }

    const totalPlatformDeduction = platformFee + taxOnPlatformFee;

    // Strict Amount Invariant Verification
    if (Math.abs(request.balance_due - (receiverAmount + totalPlatformDeduction)) > 0.05) {
      throw new Error(`Financial invariant violation: Gross ₹${request.balance_due} != Receiver ₹${receiverAmount} + Deduction ₹${totalPlatformDeduction}.`);
    }

    const receiverAccountId = selectedProvider === 'stripe'
      ? payeeAccount?.stripe?.account_id
      : (payeeAccount?.razorpay?.account_id || payeeAccount?.provider_account_id);

    const providerInstance = this.getProvider(selectedProvider);

    const checkoutResult = await providerInstance.createCheckout({
      paymentRequestId: request._id.toString(),
      requestCode: request.request_code,
      title: request.title,
      description: request.description,
      amount: request.balance_due,
      currency: request.currency || 'INR',
      payerName: options?.payerData?.payer_name || request.payer_name,
      payerEmail: options?.payerData?.payer_email || request.payer_email,
      payerPhone: options?.payerData?.payer_phone || request.payer_phone,
      payerTenantId: options?.payerData?.payer_tenant_id || request.payer_tenant_id?.toString(),
      receiverTenantId: request.receiver_tenant_id.toString(),
      receiverAccountId,
      receiverAmount,
      applicationFeeAmount: totalPlatformDeduction,
      successUrl: options?.successUrl,
      cancelUrl: options?.cancelUrl
    });

    const transactionCode = `TXN-ORG-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `RCPT-${Date.now().toString().slice(-8)}`;
    const idempotencyKey = crypto.createHash('sha256')
      .update(`${request._id}_${checkoutResult.order_id}_${request.balance_due}_${selectedProvider}`)
      .digest('hex');

    await OrganizationPayment.create({
      transaction_code: transactionCode,
      receiver_tenant_id: request.receiver_tenant_id,
      payer_tenant_id: options?.payerData?.payer_tenant_id ? new mongoose.Types.ObjectId(options.payerData.payer_tenant_id) : request.payer_tenant_id,
      payment_request_id: request._id,
      invoice_id: request.invoice_id,
      sales_order_id: request.sales_order_id,
      project_id: request.project_id,
      amount: request.balance_due,
      currency: request.currency,
      platform_fee: platformFee,
      tax_on_platform_fee: taxOnPlatformFee,
      receiver_amount: receiverAmount,
      provider: selectedProvider,
      provider_order_id: checkoutResult.order_id,
      provider_checkout_id: checkoutResult.checkout_session_id,
      status: 'CREATED',
      receipt_number: receiptNumber,
      idempotency_key: idempotencyKey,
      initiated_at: new Date()
    });

    request.selected_provider = selectedProvider;
    request.active_order_id = checkoutResult.order_id;
    await request.save();

    return {
      ...checkoutResult,
      receiver_name: receiverTenant.company_name || receiverTenant.name,
      platform_fee: platformFee,
      tax_on_platform_fee: taxOnPlatformFee,
      total_platform_deduction: totalPlatformDeduction,
      receiver_amount: receiverAmount
    };
  }

  /**
   * 9. Verify & Reconcile Payment Signature Server-Side
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
    const orderId = paymentData.order_id || paymentData.checkout_session_id;
    let payment = await OrganizationPayment.findOne({
      $or: [
        { provider_order_id: orderId },
        { provider_checkout_id: orderId },
        { provider_payment_id: paymentData.payment_id }
      ].filter(Boolean)
    });

    let request: any;
    if (payment) {
      request = await OrganizationPaymentRequest.findById(payment.payment_request_id);
    } else if (paymentData.payment_request_id) {
      request = mongoose.Types.ObjectId.isValid(paymentData.payment_request_id)
        ? await OrganizationPaymentRequest.findById(paymentData.payment_request_id)
        : await OrganizationPaymentRequest.findOne({
            $or: [
              { payment_link_token: paymentData.payment_request_id },
              { request_code: paymentData.payment_request_id }
            ]
          });
    }

    if (!request) {
      throw new Error("Associated payment request record not found.");
    }

    const providerType = paymentData.provider || payment?.provider || request.selected_provider || 'razorpay';
    const providerInstance = this.getProvider(providerType);

    // Verify payment with provider
    const verifyResult = await providerInstance.verifyPayment({
      order_id: paymentData.order_id || payment?.provider_order_id,
      payment_id: paymentData.payment_id,
      signature: paymentData.signature,
      checkout_session_id: paymentData.checkout_session_id || payment?.provider_checkout_id,
      payment_intent_id: paymentData.payment_intent_id,
      payment_request_id: request._id.toString(),
      expectedAmount: payment ? payment.amount : request.balance_due
    });

    if (!verifyResult.success) {
      if (payment) {
        payment.status = 'FAILED';
        payment.failure_reason = verifyResult.failure_reason || 'Payment verification failed.';
        await payment.save();
      }
      throw new Error(verifyResult.failure_reason || "Payment verification failed.");
    }

    return await this.reconcileCapturedPayment({
      provider: providerType,
      order_id: verifyResult.provider_order_id || orderId,
      payment_id: verifyResult.provider_payment_id,
      payment_request_id: request._id.toString(),
      amount: verifyResult.amount,
      payment_method: verifyResult.payment_method,
      transfer_id: verifyResult.provider_transfer_id,
      provider_fee: verifyResult.provider_fee
    });
  }

  /**
   * 10. Idempotent Reconciliation Engine (Used by Webhooks & Callbacks)
   */
  static async reconcileCapturedPayment(paymentData: {
    provider?: MarketplaceProviderType;
    order_id?: string;
    payment_id: string;
    payment_request_id?: string;
    amount?: number;
    payment_method?: string;
    transfer_id?: string;
    provider_fee?: number;
    provider_signature?: string;
  }) {
    const { order_id, payment_id, payment_request_id, payment_method, transfer_id, provider_fee, provider_signature } = paymentData;

    let payment = await OrganizationPayment.findOne({
      $or: [
        { provider_order_id: order_id },
        { provider_checkout_id: order_id },
        { provider_payment_id: payment_id }
      ].filter(Boolean)
    });

    if (!payment && payment_request_id) {
      payment = await OrganizationPayment.findOne({ payment_request_id, status: 'CREATED' });
    }

    if (!payment) {
      console.warn(`[Reconcile] No OrganizationPayment found for order_id: ${order_id}, payment_id: ${payment_id}`);
      return { success: false, message: "Transaction record not found" };
    }

    // IDEMPOTENCY: If already captured or settled, return without duplicate side-effects
    if (payment.status === 'CAPTURED' || payment.status === 'SETTLED') {
      return {
        success: true,
        alreadyProcessed: true,
        paymentId: payment._id,
        receiptNumber: payment.receipt_number,
        status: payment.status
      };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();
      payment.status = 'CAPTURED';
      payment.provider_payment_id = payment_id;
      if (paymentData.provider) payment.provider = paymentData.provider;
      if (provider_signature) payment.provider_signature = provider_signature;
      if (transfer_id) payment.provider_transfer_id = transfer_id;
      if (payment_method) payment.payment_method = payment_method;
      if (provider_fee !== undefined) payment.provider_fee = provider_fee;
      payment.captured_at = now;
      payment.updated_at = now;
      await payment.save({ session });

      // Update Payment Request
      const request = await OrganizationPaymentRequest.findById(payment.payment_request_id).session(session);
      if (request) {
        const newPaidAmount = (request.paid_amount || 0) + payment.amount;
        const newBalance = Math.max(0, request.total_amount - newPaidAmount);

        request.paid_amount = newPaidAmount;
        request.balance_due = newBalance;
        request.status = newBalance <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';
        request.updated_at = now;
        await request.save({ session });

        // Invoice & Lead Marketplace Integration
        if (request.invoice_id) {
          const invoice = await B2BSettlementInvoice.findById(request.invoice_id).session(session);
          if (invoice) {
            const invPaid = (invoice.paid_amount || 0) + payment.amount;
            const invBalance = Math.max(0, invoice.total_amount - invPaid);
            invoice.paid_amount = invPaid;
            invoice.balance_due = invBalance;
            invoice.status = invBalance <= 0.01 ? 'paid' : 'partially_paid';
            if (payment.provider === 'stripe') {
              invoice.razorpay_payment_id = payment_id; // backward-compat field
            } else {
              invoice.razorpay_payment_id = payment_id;
            }
            invoice.paid_at = now;
            invoice.updated_at = now;
            await invoice.save({ session });

            // Check if allocations already exist to prevent duplicate allocation
            const existingAllocations = await PaymentAllocation.find({ payment_id: payment._id }).session(session);

            if (existingAllocations.length === 0 && invoice.transaction_ids && invoice.transaction_ids.length > 0) {
              let unallocatedPayment = payment.amount;
              const txns = await B2BSettlementTransaction.find({ _id: { $in: invoice.transaction_ids } })
                .sort({ created_at: 1 })
                .session(session);

              for (const txn of txns) {
                if (unallocatedPayment <= 0) break;
                if (txn.status === 'paid' || txn.status === 'settled') continue;

                const remainingForTxn = Math.max(0, txn.total_amount - (txn.allocated_amount || 0));
                if (remainingForTxn <= 0) continue;

                const allocation = Math.min(unallocatedPayment, remainingForTxn);

                if (allocation > 0) {
                  const ratio = txn.total_amount > 0 ? (allocation / txn.total_amount) : 1;
                  const allocFee = Math.round((txn.platform_commission || 0) * ratio * 100) / 100;
                  const allocTax = Math.round((txn.platform_commission_tax || 0) * ratio * 100) / 100;
                  const allocReceiver = Math.round((allocation - allocFee - allocTax) * 100) / 100;

                  // Invariant checks
                  if (allocReceiver < 0) {
                    throw new Error(`Financial invariant violated: Negative allocated receiver amount ₹${allocReceiver}.`);
                  }
                  if (Math.abs(allocation - (allocFee + allocTax + allocReceiver)) > 0.02) {
                    throw new Error("Financial invariant violated: Allocation component sum does not equal total allocation.");
                  }

                  // 1. Create PaymentAllocation record
                  const allocCode = `ALOC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
                  await PaymentAllocation.create([{
                    allocation_code: allocCode,
                    payment_id: payment._id,
                    payment_request_id: request._id,
                    invoice_id: invoice._id,
                    settlement_transaction_id: txn._id,
                    lead_id: txn.lead_id,
                    provider_tenant_id: txn.provider_tenant_id,
                    receiver_tenant_id: txn.receiver_tenant_id,
                    allocated_amount: allocation,
                    allocated_platform_fee: allocFee,
                    allocated_platform_tax: allocTax,
                    allocated_receiver_amount: allocReceiver,
                    currency: txn.currency || 'INR',
                    status: 'ALLOCATED',
                    created_at: now,
                    updated_at: now
                  }], { session });

                  // 2. Update Settlement Transaction aggregate cache
                  txn.allocated_amount = (txn.allocated_amount || 0) + allocation;
                  txn.remaining_amount = Math.max(0, txn.total_amount - txn.allocated_amount);
                  
                  if (!txn.allocations) txn.allocations = [];
                  txn.allocations.push({
                    payment_id: payment._id,
                    allocated_amount: allocation,
                    allocation_date: now
                  });

                  const isFullyPaid = txn.remaining_amount <= 0.01;
                  txn.status = isFullyPaid ? 'paid' : 'payment_pending';
                  if (isFullyPaid) txn.payment_id = payment._id;
                  txn.updated_at = now;
                  await txn.save({ session });

                  // 3. Proportional Commission Collection
                  const comm = await PlatformCommission.findOne({ settlement_transaction_id: txn._id }).session(session);
                  if (comm) {
                    const propDeduction = allocFee + allocTax;
                    comm.commission_collected_amount = (comm.commission_collected_amount || 0) + propDeduction;
                    comm.commission_remaining_amount = Math.max(0, comm.total_commission_deduction - comm.commission_collected_amount);
                    comm.status = isFullyPaid || comm.commission_remaining_amount <= 0.01 ? 'COLLECTED' : 'PARTIALLY_COLLECTED';
                    comm.collected_at = now;
                    comm.payment_id = payment._id;
                    comm.provider_payment_id = payment_id;
                    comm.provider = payment.provider;
                    
                    if (!comm.payment_allocations) comm.payment_allocations = [];
                    comm.payment_allocations.push({
                      payment_id: payment._id,
                      allocated_commission: allocFee,
                      allocated_tax: allocTax,
                      allocated_total: propDeduction,
                      allocation_date: now
                    });

                    comm.updated_at = now;
                    await comm.save({ session });
                  }

                  unallocatedPayment -= allocation;
                }
              }
            }
          }
        }

        // Customer Ledger Integration
        if (request.payer_client_id) {
          try {
            const opKey = crypto.createHash('sha256')
              .update(`cust_ledger_${payment._id}_${now.getTime()}`)
              .digest('hex');

            const lastLedger = await CustomerLedger.findOne({
              tenant_id: payment.receiver_tenant_id,
              customer_id: request.payer_client_id
            }).sort({ transaction_date: -1 }).session(session);

            const prevBalance = lastLedger ? lastLedger.running_balance : 0;
            const newRunningBalance = prevBalance - payment.amount;

            await CustomerLedger.create([{
              tenant_id: payment.receiver_tenant_id,
              customer_id: request.payer_client_id,
              transaction_date: now,
              voucher_type: 'CUSTOMER_PAYMENT',
              voucher_number: payment.receipt_number,
              reference_id: payment.transaction_code,
              debit_amount: 0,
              credit_amount: payment.amount,
              running_balance: newRunningBalance,
              description: `Payment received for ${request.title} (${request.request_code}) via ${payment.provider.toUpperCase()}`,
              branchcode: 'DEFAULT',
              operation_key: opKey,
              created_at: now
            }], { session });
          } catch (ledgerErr) {
            console.warn("[Ledger Sync Warning]", ledgerErr);
          }
        }

        // Double-Entry Marketplace Accounting Integration
        try {
          const accountingRef = `JE-PMT-CAPTURED-${payment._id}`;
          const existingJournal = await JournalEntry.findOne({ reference: accountingRef }).session(session);

          if (!existingJournal) {
            const entryNumber = `JE-PMT-${Date.now().toString().slice(-6)}`;
            const [cashAcc, arAcc, apAcc, revAcc, taxAcc] = await Promise.all([
              ChartOfAccounts.findOne({ account_code: '1110' }).session(session),
              ChartOfAccounts.findOne({ account_code: '1120' }).session(session),
              ChartOfAccounts.findOne({ account_code: '2110' }).session(session),
              ChartOfAccounts.findOne({ account_code: '4100' }).session(session),
              ChartOfAccounts.findOne({ account_code: '2120' }).session(session)
            ]);

            if (cashAcc) {
              const isMarketplace = request.payment_type === 'LEAD_MARKETPLACE_SETTLEMENT';

              const [journal] = await JournalEntry.create([{
                tenant_id: payment.receiver_tenant_id,
                entry_number: entryNumber,
                entry_date: now,
                reference: accountingRef,
                description: `Payment receipt for ${request.title} (${payment.provider.toUpperCase()})`,
                total_debit: payment.amount,
                total_credit: payment.amount,
                status: 'posted',
                branchcode: 'DEFAULT',
                created_by: 'system',
                created_at: now,
                updated_at: now
              }], { session });

              // Line 1: Debit Cash / Clearing
              await JournalEntryLine.create([{
                tenant_id: payment.receiver_tenant_id,
                journal_entry_id: journal._id,
                account_id: cashAcc._id,
                description: `Gross receipt for ${payment.receipt_number}`,
                debit_amount: payment.amount,
                credit_amount: 0,
                line_order: 1,
                created_at: now
              }], { session });

              if (isMarketplace && apAcc && revAcc) {
                // Line 2: Credit Receiver Payable
                await JournalEntryLine.create([{
                  tenant_id: payment.receiver_tenant_id,
                  journal_entry_id: journal._id,
                  account_id: apAcc._id,
                  description: `Marketplace Receiver Payable (Net payout)`,
                  debit_amount: 0,
                  credit_amount: payment.receiver_amount,
                  line_order: 2,
                  created_at: now
                }], { session });

                // Line 3: Credit Platform Commission Revenue
                await JournalEntryLine.create([{
                  tenant_id: payment.receiver_tenant_id,
                  journal_entry_id: journal._id,
                  account_id: revAcc._id,
                  description: `Marketplace Commission Revenue`,
                  debit_amount: 0,
                  credit_amount: payment.platform_fee,
                  line_order: 3,
                  created_at: now
                }], { session });

                // Line 4: Credit Commission GST Payable
                if (payment.tax_on_platform_fee > 0 && taxAcc) {
                  await JournalEntryLine.create([{
                    tenant_id: payment.receiver_tenant_id,
                    journal_entry_id: journal._id,
                    account_id: taxAcc._id,
                    description: `GST on Marketplace Commission`,
                    debit_amount: 0,
                    credit_amount: payment.tax_on_platform_fee,
                    line_order: 4,
                    created_at: now
                  }], { session });
                }
              } else if (arAcc) {
                await JournalEntryLine.create([{
                  tenant_id: payment.receiver_tenant_id,
                  journal_entry_id: journal._id,
                  account_id: arAcc._id,
                  description: `AR clearance for ${payment.receipt_number}`,
                  debit_amount: 0,
                  credit_amount: payment.amount,
                  line_order: 2,
                  created_at: now
                }], { session });
              }
            }
          }
        } catch (acctErr) {
          console.warn("[Accounting Sync Warning]", acctErr);
        }

        // Notification
        try {
          await Notification.create([{
            tenant_id: payment.receiver_tenant_id,
            from: "system",
            type: "payment",
            action: "payment_captured",
            content: `Payment of ₹${payment.amount.toLocaleString()} received via ${payment.provider.toUpperCase()} for ${request.title} (${payment.receipt_number}).`,
            isnotify: true,
            created_on: now
          }], { session });
        } catch (notifErr) {
          console.warn("[Notification Warning]", notifErr);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        paymentId: payment._id,
        receiptNumber: payment.receipt_number,
        transactionCode: payment.transaction_code,
        status: 'CAPTURED',
        provider: payment.provider,
        amount: payment.amount,
        platformFee: payment.platform_fee,
        receiverAmount: payment.receiver_amount
      };
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("[Marketplace Reconciliation Error]", error);
      throw error;
    }
  }

  /**
   * 11. Process Refund & Reverse Marketplace Commissions (Unified)
   */
  static async processRefund(
    paymentId: string,
    refundData: {
      amount?: number;
      reason?: string;
    }
  ) {
    const payment = await OrganizationPayment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment transaction not found.");
    }

    if (payment.status !== 'CAPTURED' && payment.status !== 'SETTLED' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new Error(`Cannot refund transaction with status '${payment.status}'.`);
    }

    const refundAmount = refundData.amount || (payment.amount - payment.refunded_amount);
    if (refundAmount <= 0 || (payment.refunded_amount + refundAmount) > payment.amount) {
      throw new Error("Invalid refund amount.");
    }

    const isTransferred = payment.status === 'SETTLED' || Boolean(payment.provider_transfer_id);
    const providerInstance = this.getProvider(payment.provider);

    const providerRefund = await providerInstance.processRefund({
      paymentId: payment._id.toString(),
      providerPaymentId: payment.provider_payment_id || payment.provider_order_id,
      amount: refundAmount,
      currency: payment.currency,
      reason: refundData.reason,
      providerTransferId: payment.provider_transfer_id,
      reverseTransfer: isTransferred,
      refundApplicationFee: true
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const now = new Date();
      payment.refunded_amount += refundAmount;
      payment.status = payment.refunded_amount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      payment.refunds.push({
        refund_id: providerRefund.refund_id,
        amount: refundAmount,
        currency: payment.currency,
        reason: refundData.reason,
        status: 'processed',
        created_at: now
      });

      let unreversedRefund = refundAmount;
      let totalReversedReceiver = 0;
      let totalReversedFee = 0;
      let totalReversedTax = 0;

      const allocations = await PaymentAllocation.find({ payment_id: payment._id })
        .sort({ created_at: -1 })
        .session(session);

      for (const alloc of allocations) {
        if (unreversedRefund <= 0) break;
        const revGross = Math.min(alloc.allocated_amount, unreversedRefund);

        if (revGross > 0) {
          const ratio = alloc.allocated_amount > 0 ? (revGross / alloc.allocated_amount) : 1;
          const revFee = Math.round((alloc.allocated_platform_fee || 0) * ratio * 100) / 100;
          const revTax = Math.round((alloc.allocated_platform_tax || 0) * ratio * 100) / 100;
          const revTotalDeduction = revFee + revTax;
          const revReceiver = Math.round((revGross - revTotalDeduction) * 100) / 100;

          alloc.allocated_amount -= revGross;
          alloc.allocated_platform_fee = Math.max(0, alloc.allocated_platform_fee - revFee);
          alloc.allocated_platform_tax = Math.max(0, alloc.allocated_platform_tax - revTax);
          alloc.allocated_receiver_amount = Math.max(0, alloc.allocated_receiver_amount - revReceiver);
          alloc.status = alloc.allocated_amount <= 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
          alloc.updated_at = now;
          await alloc.save({ session });

          totalReversedReceiver += revReceiver;
          totalReversedFee += revFee;
          totalReversedTax += revTax;

          // Rollback transaction allocation
          const txn = await B2BSettlementTransaction.findById(alloc.settlement_transaction_id).session(session);
          if (txn) {
            txn.allocated_amount = Math.max(0, (txn.allocated_amount || 0) - revGross);
            txn.remaining_amount = Math.max(0, txn.total_amount - txn.allocated_amount);
            txn.status = txn.allocated_amount <= 0.01 ? 'invoiced' : 'payment_pending';
            txn.updated_at = now;
            await txn.save({ session });

            // Reconcile LeadShareAccess
            const leadShare = await LeadShareAccess.findOne({
              lead_id: txn.lead_id,
              owner_tenant_id: txn.provider_tenant_id,
              shared_tenant_id: txn.receiver_tenant_id
            }).session(session);

            if (leadShare && (leadShare.marketplace_status === 'settled' || leadShare.marketplace_status === 'paid')) {
              leadShare.marketplace_status = txn.allocated_amount <= 0.01 ? 'refunded' : 'payment_pending';
              await leadShare.save({ session });
            }
          }

          // Proportional Commission Reversal
          const comm = await PlatformCommission.findOne({ settlement_transaction_id: alloc.settlement_transaction_id }).session(session);
          if (comm) {
            comm.commission_refunded_amount = (comm.commission_refunded_amount || 0) + revTotalDeduction;
            comm.commission_collected_amount = Math.max(0, (comm.commission_collected_amount || 0) - revTotalDeduction);
            comm.commission_remaining_amount = Math.max(0, comm.total_commission_deduction - comm.commission_collected_amount);
            comm.status = comm.commission_collected_amount <= 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
            comm.refunded_at = now;
            comm.updated_at = now;
            await comm.save({ session });
          }

          unreversedRefund -= revGross;
        }
      }

      if (isTransferred && totalReversedReceiver > 0) {
        payment.receiver_adjustment_required = true;
        payment.receiver_adjustment_amount = (payment.receiver_adjustment_amount || 0) + totalReversedReceiver;
        payment.receiver_adjustment_status = 'PENDING_RECONCILIATION';
      }

      payment.updated_at = now;
      await payment.save({ session });

      // Reconcile Invoice & Payment Request
      const request = await OrganizationPaymentRequest.findById(payment.payment_request_id).session(session);
      if (request) {
        request.paid_amount = Math.max(0, (request.paid_amount || 0) - refundAmount);
        request.balance_due = Math.max(0, request.total_amount - request.paid_amount);
        request.status = request.paid_amount <= 0 ? 'PENDING' : 'PARTIALLY_PAID';
        request.updated_at = now;
        await request.save({ session });

        if (request.invoice_id) {
          const invoice = await B2BSettlementInvoice.findById(request.invoice_id).session(session);
          if (invoice) {
            invoice.paid_amount = Math.max(0, (invoice.paid_amount || 0) - refundAmount);
            invoice.balance_due = Math.max(0, invoice.total_amount - invoice.paid_amount);
            invoice.status = invoice.paid_amount <= 0 ? 'issued' : 'partially_paid';
            invoice.updated_at = now;
            await invoice.save({ session });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      return payment;
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("[Refund Error]", err);
      throw err;
    }
  }

  /**
   * 12. Multi-Provider Dashboard Metrics
   */
  static async getDashboardMetrics(
    tenantId: string,
    range: string = 'all',
    providerFilter: string = 'all'
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId);
    const paymentQuery: any = { receiver_tenant_id: tId };
    const sentQuery: any = { payer_tenant_id: tId };
    const commReceivedQuery: any = { receiver_tenant_id: tId };
    const commPaidQuery: any = { payer_tenant_id: tId };

    if (providerFilter && providerFilter !== 'all') {
      paymentQuery.provider = providerFilter;
      sentQuery.provider = providerFilter;
      commReceivedQuery.provider = providerFilter;
      commPaidQuery.provider = providerFilter;
    }

    const [
      receivedPayments,
      sentPayments,
      requestsReceived,
      commissionsReceived,
      commissionsPaid,
      settlements
    ] = await Promise.all([
      OrganizationPayment.find(paymentQuery).lean(),
      OrganizationPayment.find(sentQuery).lean(),
      OrganizationPaymentRequest.find({ receiver_tenant_id: tId }).lean(),
      PlatformCommission.find(commReceivedQuery).lean(),
      PlatformCommission.find(commPaidQuery).lean(),
      B2BSettlementTransaction.find({ $or: [{ provider_tenant_id: tId }, { receiver_tenant_id: tId }] }).lean()
    ]);

    const capturedOrSettled = receivedPayments.filter(p => p.status === 'CAPTURED' || p.status === 'SETTLED');
    const totalGrossGMV = capturedOrSettled.reduce((sum, p) => sum + p.amount, 0);

    const platformCommissionCollected = commissionsReceived.reduce((sum, c) => sum + (c.commission_collected_amount || 0), 0);
    const platformCommissionSettled = commissionsReceived.filter(c => c.status === 'SETTLED').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const platformTaxCollected = commissionsReceived.reduce((sum, c) => sum + (c.commission_tax || 0), 0);

    const receiverSettled = receivedPayments.filter(p => p.status === 'SETTLED').reduce((sum, p) => sum + (p.receiver_amount || 0), 0);
    const receiverPayable = receivedPayments.filter(p => p.status === 'CAPTURED').reduce((sum, p) => sum + (p.receiver_amount || 0), 0);

    const refundedPayments = receivedPayments.filter(p => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED');
    const refundedMarketplacePayment = refundedPayments.reduce((sum, p) => sum + (p.refunded_amount || 0), 0);

    const disputedPayments = receivedPayments.filter(p => p.status === 'DISPUTED');
    const disputedMarketplacePayment = disputedPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalSpent = sentPayments.filter(p => p.status === 'CAPTURED' || p.status === 'SETTLED').reduce((sum, p) => sum + p.amount, 0);
    const pendingRequests = requestsReceived.filter(r => r.status === 'PENDING' || r.status === 'PARTIALLY_PAID');
    const pendingMarketplacePayment = pendingRequests.reduce((sum, r) => sum + (r.balance_due || 0), 0);

    return {
      provider: providerFilter,
      revenue: {
        gross_gmv: totalGrossGMV,
        platform_commission_collected: platformCommissionCollected,
        platform_commission_settled: platformCommissionSettled,
        commission_tax: platformTaxCollected,
        receiver_payable: receiverPayable,
        receiver_settled: receiverSettled,
        pending_marketplace_payment: pendingMarketplacePayment,
        refunded_marketplace_payment: refundedMarketplacePayment,
        disputed_marketplace_payment: disputedMarketplacePayment,
        net_received: receiverSettled + receiverPayable,
        total_spent: totalSpent,
        pending_dues: pendingMarketplacePayment
      },
      marketplace: {
        total_settlement_transactions: settlements.length,
        settled_transactions: settlements.filter(s => s.status === 'paid' || s.status === 'settled').length,
        pending_transactions: settlements.filter(s => s.status === 'unbilled' || s.status === 'invoiced' || s.status === 'payment_pending').length,
        disputed_transactions: settlements.filter(s => s.status === 'disputed').length,
        platform_commission_paid: commissionsPaid.reduce((sum, c) => sum + (c.commission_collected_amount || c.commission_amount || 0), 0),
        platform_commission_collected: platformCommissionCollected,
        platform_commission_settled: platformCommissionSettled
      },
      counts: {
        received_transactions: receivedPayments.length,
        sent_transactions: sentPayments.length,
        total_requests: requestsReceived.length,
        pending_requests: pendingRequests.length
      }
    };
  }

  /**
   * 13. Public Checkout: Resolve Payment Request with Multi-Provider Details
   */
  static async getPaymentRequestByToken(token: string) {
    let request: any = await OrganizationPaymentRequest.findOne({
      $or: [
        { payment_link_token: token },
        { request_code: token }
      ]
    })
      .populate('receiver_tenant_id', 'company_name name tenant_code logo')
      .populate('payer_tenant_id', 'company_name name tenant_code')
      .lean();

    if (!request) {
      throw new Error("Payment link is invalid or has expired.");
    }

    const { invoice, payeeAccount } = await this.validateMarketplacePaymentEligibility(request, 'razorpay');

    let platformFee = 0;
    let taxOnFee = 0;
    let receiverNetAmount = request.balance_due;

    if (request.payment_type === 'LEAD_MARKETPLACE_SETTLEMENT' && invoice) {
      const ratio = request.total_amount > 0 ? (request.balance_due / request.total_amount) : 1;
      platformFee = Math.round((invoice.platform_fee_total || 0) * ratio * 100) / 100;
      taxOnFee = Math.round((invoice.platform_tax_total || 0) * ratio * 100) / 100;
      receiverNetAmount = Math.round((invoice.receiver_amount_total || (invoice.total_amount - invoice.platform_fee_total)) * ratio * 100) / 100;
    } else {
      const feeCalc = await PlatformFeeService.calculateFee(request.balance_due, request.currency);
      platformFee = feeCalc.platformFee;
      taxOnFee = feeCalc.taxOnPlatformFee;
      receiverNetAmount = feeCalc.receiverAmount;
    }

    const receiverObj = {
      _id: (request.receiver_tenant_id as any)?._id,
      name: (request.receiver_tenant_id as any)?.company_name || (request.receiver_tenant_id as any)?.name || 'Organization',
      tenant_code: (request.receiver_tenant_id as any)?.tenant_code,
      logo: (request.receiver_tenant_id as any)?.logo
    };

    const config = await PlatformFeeService.getConfig();

    return {
      request: {
        _id: request._id,
        request_id: request._id,
        request_code: request.request_code,
        title: request.title,
        description: request.description,
        total_amount: request.total_amount,
        paid_amount: request.paid_amount,
        balance_due: request.balance_due,
        currency: request.currency || 'INR',
        status: request.status,
        due_date: request.due_date,
        payer_name: request.payer_name,
        payer_email: request.payer_email,
        payer_phone: request.payer_phone,
        payment_type: request.payment_type,
        preferred_provider: request.preferred_provider || payeeAccount?.default_provider || config.default_marketplace_provider
      },
      available_providers: {
        razorpay: config.razorpay_enabled && Boolean(payeeAccount?.razorpay?.account_id || payeeAccount?.provider_account_id),
        stripe: config.stripe_enabled && Boolean(payeeAccount?.stripe?.account_id)
      },
      receiver: receiverObj,
      request_id: request._id,
      request_code: request.request_code,
      title: request.title,
      description: request.description,
      total_amount: request.total_amount,
      paid_amount: request.paid_amount,
      balance_due: request.balance_due,
      currency: request.currency || 'INR',
      status: request.status,
      due_date: request.due_date,
      receiver_name: receiverObj.name,
      payer_name: request.payer_name,
      payer_email: request.payer_email,
      platform_fee: platformFee,
      tax_on_platform_fee: taxOnFee,
      total_platform_deduction: platformFee + taxOnFee,
      receiver_net_amount: receiverNetAmount,
      payment_type: request.payment_type
    };
  }
}

export default MarketplacePaymentService;
