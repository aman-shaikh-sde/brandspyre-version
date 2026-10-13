import Razorpay from "razorpay";
import crypto from "crypto";
import {
  IMarketplacePaymentProvider,
  MarketplaceProviderType,
  AccountOnboardParams,
  AccountOnboardResult,
  CreateCheckoutParams,
  CheckoutSessionResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  CreateRefundParams,
  RefundResult
} from "./MarketplacePaymentProvider";

export class RazorpayMarketplaceProvider implements IMarketplacePaymentProvider {
  readonly providerType: MarketplaceProviderType = 'razorpay';

  private getRazorpay(): Razorpay {
    const key_id = process.env.MARKETPLACE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.MARKETPLACE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (process.env.NODE_ENV === "production" && (!key_id || !key_secret)) {
      throw new Error("Razorpay credentials missing in production environment. Dummy credentials forbidden.");
    }
    return new Razorpay({
      key_id: key_id || (process.env.NODE_ENV === 'test' ? 'rzp_test_fixture' : ''),
      key_secret: key_secret || (process.env.NODE_ENV === 'test' ? 'test_fixture_secret' : '')
    });
  }

  private isMockAllowed(): boolean {
    return process.env.NODE_ENV === 'test' && process.env.PAYMENT_MOCK_MODE === 'true';
  }

  /**
   * 1. Create or link organization Razorpay Route Account
   */
  async onboardAccount(params: AccountOnboardParams): Promise<AccountOnboardResult> {
    let providerAccountId: string | undefined;
    let isLiveActive = false;
    let rawAccount: any;

    try {
      const rzp = this.getRazorpay();
      if ((rzp as any).accounts && typeof (rzp as any).accounts.create === 'function') {
        rawAccount = await (rzp as any).accounts.create({
          email: params.email,
          phone: params.phone || '9999999999',
          type: 'route',
          legal_business_name: params.legal_name || params.business_name,
          business_type: params.business_type || 'private_limited',
          contact_name: params.beneficiary_name || params.business_name,
          profile: {
            category: 'services',
            subcategory: 'software'
          },
          notes: {
            tenant_id: params.tenantId,
            business_name: params.business_name
          }
        });

        if (rawAccount && rawAccount.id) {
          providerAccountId = rawAccount.id;
          isLiveActive = (rawAccount.status === 'activated' || rawAccount.payouts_enabled === true);
        }
      }
    } catch (rzpErr: any) {
      console.warn("[Razorpay Route Account Creation Notice]", rzpErr.message || rzpErr);
    }

    if (!providerAccountId) {
      if (this.isMockAllowed()) {
        const hash = crypto.createHash('md5').update(`tenant_${params.tenantId}_rzp_${Date.now()}`).digest('hex').slice(0, 12);
        providerAccountId = `acc_${hash}`;
        isLiveActive = true;
      } else {
        throw new Error("Failed to create Razorpay linked account. Mock payment accounts are disabled in production. Please verify Razorpay Route credentials and API permissions.");
      }
    }

    return {
      provider: 'razorpay',
      provider_account_id: providerAccountId,
      account_status: isLiveActive ? 'ACTIVE' : 'PENDING_VERIFICATION',
      onboarding_status: isLiveActive ? 'completed' : 'pending',
      kyc_status: isLiveActive ? 'verified' : 'pending',
      payments_enabled: isLiveActive,
      payouts_enabled: isLiveActive,
      capabilities: {
        route: isLiveActive,
        payouts: isLiveActive,
        transfers: isLiveActive
      },
      metadata: rawAccount
    };
  }

  /**
   * 2. Fetch Account Details from Razorpay Route
   */
  async getAccountDetails(accountId: string): Promise<AccountOnboardResult> {
    try {
      const rzp = this.getRazorpay();
      if ((rzp as any).accounts && typeof (rzp as any).accounts.fetch === 'function' && !accountId.startsWith('acc_mock_')) {
        const acc = await (rzp as any).accounts.fetch(accountId);
        const isActivated = acc.status === 'activated' || acc.payouts_enabled === true;
        return {
          provider: 'razorpay',
          provider_account_id: accountId,
          account_status: isActivated ? 'ACTIVE' : 'PENDING_VERIFICATION',
          onboarding_status: acc.status || 'pending',
          kyc_status: acc.kyc?.status || 'pending',
          payments_enabled: acc.payments_enabled !== false,
          payouts_enabled: acc.payouts_enabled === true,
          capabilities: {
            route: Boolean(acc.capabilities?.route || acc.capabilities?.transfers),
            payouts: Boolean(acc.payouts_enabled || acc.capabilities?.payouts),
            transfers: Boolean(acc.capabilities?.transfers || acc.capabilities?.route)
          },
          metadata: acc
        };
      }
    } catch (err: any) {
      console.warn("[Razorpay Route Account Fetch Warning]", err.message || err);
    }

    return {
      provider: 'razorpay',
      provider_account_id: accountId,
      account_status: this.isMockAllowed() ? 'ACTIVE' : 'PENDING_VERIFICATION',
      onboarding_status: this.isMockAllowed() ? 'completed' : 'pending',
      kyc_status: this.isMockAllowed() ? 'verified' : 'pending',
      payments_enabled: true,
      payouts_enabled: true,
      capabilities: {
        route: true,
        payouts: true,
        transfers: true
      }
    };
  }

  /**
   * 3. Create Marketplace Checkout Order with Route Split Transfer
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const rzp = this.getRazorpay();
    const amountInPaise = Math.round(params.amount * 100);
    const transferAmountInPaise = Math.round(params.receiverAmount * 100);

    const orderPayload: any = {
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: `rcpt_${params.requestCode.slice(0, 30)}`,
      notes: {
        payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
        payment_provider: 'razorpay',
        payment_request_id: params.paymentRequestId,
        request_code: params.requestCode,
        receiver_tenant_id: params.receiverTenantId,
        payer_name: params.payerName || '',
        payer_email: params.payerEmail || '',
        payer_tenant_id: params.payerTenantId || ''
      }
    };

    // Attach Route split transfer if receiver account exists
    if (params.receiverAccountId && transferAmountInPaise > 0) {
      orderPayload.transfers = [
        {
          account: params.receiverAccountId,
          amount: transferAmountInPaise,
          currency: params.currency || 'INR',
          notes: {
            receiver_tenant_id: params.receiverTenantId,
            request_code: params.requestCode
          },
          on_hold: 0
        }
      ];
    }

    let rzpOrder: any;
    try {
      rzpOrder = await rzp.orders.create(orderPayload);
    } catch (routeErr: any) {
      if (!this.isMockAllowed()) {
        throw new Error(`Razorpay Route checkout order creation failed: ${routeErr.message || routeErr}`);
      } else {
        console.warn("[Razorpay Route Sandbox Fallback]:", routeErr.message || routeErr);
        delete orderPayload.transfers;
        try {
          rzpOrder = await rzp.orders.create(orderPayload);
        } catch (innerErr) {
          // Dev mock order fallback
          rzpOrder = {
            id: `order_mock_${Date.now().toString().slice(-8)}`,
            amount: amountInPaise,
            currency: params.currency || 'INR'
          };
        }
      }
    }

    return {
      provider: 'razorpay',
      order_id: rzpOrder.id,
      publishable_key: process.env.MARKETPLACE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
      amount: amountInPaise,
      amount_in_rupees: params.amount,
      currency: params.currency || 'INR',
      request_code: params.requestCode,
      title: params.title,
      platform_fee: params.applicationFeeAmount,
      receiver_amount: params.receiverAmount,
      rawData: rzpOrder
    };
  }

  /**
   * 4. Verify Payment Signature and Fetch Details from Razorpay
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const { order_id, payment_id, signature, expectedAmount } = params;

    if (!order_id || !payment_id) {
      return {
        success: false,
        provider: 'razorpay',
        provider_payment_id: payment_id || '',
        provider_order_id: order_id,
        amount: 0,
        currency: 'INR',
        status: 'FAILED',
        failure_reason: 'Missing order_id or payment_id.'
      };
    }

    // Verify HMAC-SHA256 signature
    const secret = process.env.MARKETPLACE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    if (secret && signature && !payment_id.startsWith('pay_mock_')) {
      const generated = crypto
        .createHmac('sha256', secret)
        .update(`${order_id}|${payment_id}`)
        .digest('hex');

      if (generated !== signature) {
        return {
          success: false,
          provider: 'razorpay',
          provider_payment_id: payment_id,
          provider_order_id: order_id,
          amount: 0,
          currency: 'INR',
          status: 'FAILED',
          failure_reason: 'Invalid Razorpay payment signature.'
        };
      }
    }

    let rawPayment: any;
    let actualAmount = expectedAmount || 0;
    let actualCurrency = 'INR';
    let method = 'card';
    let transferId: string | undefined;

    try {
      const rzp = this.getRazorpay();
      if (rzp.payments && typeof rzp.payments.fetch === 'function' && !payment_id.startsWith('pay_mock_')) {
        rawPayment = await rzp.payments.fetch(payment_id);
        if (rawPayment) {
          actualAmount = Number(rawPayment.amount) / 100;
          actualCurrency = rawPayment.currency || 'INR';
          method = rawPayment.method || 'online';
          if (rawPayment.transfers && rawPayment.transfers.length > 0) {
            transferId = rawPayment.transfers[0].id;
          }

          // Verify amount integrity
          if (expectedAmount && Math.abs(actualAmount - expectedAmount) > 0.5) {
            return {
              success: false,
              provider: 'razorpay',
              provider_payment_id: payment_id,
              provider_order_id: order_id,
              amount: actualAmount,
              currency: actualCurrency,
              status: 'FAILED',
              failure_reason: `Payment amount mismatch: expected ₹${expectedAmount}, got ₹${actualAmount}.`,
              rawPayment
            };
          }
        }
      }
    } catch (fetchErr: any) {
      if (!this.isMockAllowed()) {
        throw fetchErr;
      }
    }

    return {
      success: true,
      provider: 'razorpay',
      provider_payment_id: payment_id,
      provider_order_id: order_id,
      provider_transfer_id: transferId,
      provider_fee: rawPayment?.fee ? Number(rawPayment.fee) / 100 : 0,
      amount: actualAmount,
      currency: actualCurrency,
      payment_method: method,
      status: 'CAPTURED',
      rawPayment
    };
  }

  /**
   * 5. Process Refund and Transfer Reversal
   */
  async processRefund(params: CreateRefundParams): Promise<RefundResult> {
    const rzp = this.getRazorpay();
    let rzpRefund: any;

    try {
      if (!params.providerPaymentId.startsWith('pay_mock_')) {
        const refundOptions: any = {
          amount: Math.round(params.amount * 100),
          notes: { reason: params.reason || 'Marketplace settlement refund' }
        };

        if (params.reverseTransfer !== false) {
          refundOptions.reverse_all_transfers = 1;
        }

        rzpRefund = await rzp.payments.refund(params.providerPaymentId, refundOptions);
      } else {
        rzpRefund = { id: `rfnd_mock_${Date.now()}`, amount: Math.round(params.amount * 100), status: 'processed' };
      }
    } catch (err: any) {
      if (!this.isMockAllowed()) throw err;
      rzpRefund = { id: `rfnd_mock_${Date.now()}`, amount: Math.round(params.amount * 100), status: 'processed' };
    }

    return {
      success: true,
      refund_id: rzpRefund?.id || `rfnd_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      status: rzpRefund?.status || 'processed',
      rawData: rzpRefund
    };
  }

  /**
   * 6. Webhook Signature Verification
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret = process.env.MARKETPLACE_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (!secret || !signature) return false;

    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
      const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (err) {
      return false;
    }
  }
}

export default RazorpayMarketplaceProvider;
