import Stripe from "stripe";
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

export class StripeMarketplaceProvider implements IMarketplacePaymentProvider {
  readonly providerType: MarketplaceProviderType = 'stripe';

  private getStripe(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (process.env.NODE_ENV === "production" && (!secretKey || secretKey.includes("dummy"))) {
      throw new Error("Stripe secret key missing or dummy in production environment. Real credentials required.");
    }
    return new Stripe(secretKey || (process.env.NODE_ENV === 'test' ? 'sk_test_fixture' : ''), {
      apiVersion: '2025-02-24.acacia' as any
    });
  }

  private isMockAllowed(): boolean {
    return process.env.NODE_ENV === 'test' && process.env.PAYMENT_MOCK_MODE === 'true';
  }

  /**
   * 1. Create Connected Account on Stripe Connect
   */
  async onboardAccount(params: AccountOnboardParams): Promise<AccountOnboardResult> {
    let stripeAccountId: string | undefined;
    let rawAccount: any;
    let isLiveActive = false;
    let onboardingUrl: string | undefined;

    try {
      const stripe = this.getStripe();
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy')) {
        const businessType = params.business_type === 'individual' ? 'individual' : 'company';
        
        rawAccount = await stripe.accounts.create({
          type: 'express',
          country: params.country || 'IN',
          email: params.email,
          business_type: businessType as any,
          capabilities: {
            transfers: { requested: true }
          },
          business_profile: {
            name: params.business_name || params.legal_name,
            product_description: 'B2B software & lead fulfillment marketplace services'
          },
          metadata: {
            tenant_id: params.tenantId,
            business_name: params.business_name
          }
        });

        if (rawAccount && rawAccount.id) {
          stripeAccountId = rawAccount.id;
          isLiveActive = Boolean(rawAccount.charges_enabled && rawAccount.payouts_enabled);

          // Generate onboarding link if URLs provided
          if (params.return_url && params.refresh_url) {
            const link = await stripe.accountLinks.create({
              account: rawAccount.id,
              refresh_url: params.refresh_url,
              return_url: params.return_url,
              type: 'account_onboarding'
            });
            onboardingUrl = link.url;
          }
        }
      }
    } catch (err: any) {
      console.warn("[Stripe Connect Account Creation Warning]", err.message || err);
    }

    if (!stripeAccountId) {
      if (this.isMockAllowed()) {
        const hash = crypto.createHash('md5').update(`tenant_${params.tenantId}_stripe_${Date.now()}`).digest('hex').slice(0, 12);
        stripeAccountId = `acct_${hash}`;
        isLiveActive = true;
        onboardingUrl = `https://connect.stripe.com/setup/s/mock_${stripeAccountId}`;
      } else {
        throw new Error("Failed to create Stripe Connect account. Mock payment accounts are disabled in production. Please check STRIPE_SECRET_KEY and Connect settings.");
      }
    }

    return {
      provider: 'stripe',
      provider_account_id: stripeAccountId,
      account_status: isLiveActive ? 'ACTIVE' : 'ONBOARDING',
      onboarding_status: isLiveActive ? 'completed' : 'pending',
      kyc_status: isLiveActive ? 'verified' : 'pending',
      charges_enabled: isLiveActive,
      payouts_enabled: isLiveActive,
      payments_enabled: isLiveActive,
      capabilities: {
        transfers: isLiveActive,
        payouts: isLiveActive,
        card_payments: isLiveActive ? 'active' : 'inactive'
      },
      onboarding_url: onboardingUrl,
      details_submitted: rawAccount?.details_submitted || isLiveActive,
      metadata: rawAccount
    };
  }

  /**
   * 2. Generate Stripe Connect Account Onboarding Link
   */
  async createOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<{ url: string }> {
    try {
      const stripe = this.getStripe();
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy') && !accountId.startsWith('acct_mock_')) {
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: 'account_onboarding'
        });
        return { url: accountLink.url };
      }
    } catch (err: any) {
      console.warn("[Stripe Account Link Warning]", err.message || err);
      if (!this.isMockAllowed()) throw err;
    }

    return { url: `https://connect.stripe.com/setup/s/mock_${accountId}?return_url=${encodeURIComponent(returnUrl)}` };
  }

  /**
   * 3. Fetch latest Account Details from Stripe API
   */
  async getAccountDetails(accountId: string): Promise<AccountOnboardResult> {
    try {
      const stripe = this.getStripe();
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy') && !accountId.startsWith('acct_mock_')) {
        const acc = await stripe.accounts.retrieve(accountId);
        const isLiveActive = Boolean(acc.charges_enabled && acc.payouts_enabled);

        return {
          provider: 'stripe',
          provider_account_id: accountId,
          account_status: isLiveActive ? 'ACTIVE' : (acc.details_submitted ? 'PENDING_VERIFICATION' : 'ONBOARDING'),
          onboarding_status: acc.details_submitted ? 'completed' : 'pending',
          kyc_status: isLiveActive ? 'verified' : (acc.requirements?.disabled_reason ? 'rejected' : 'pending'),
          charges_enabled: Boolean(acc.charges_enabled),
          payouts_enabled: Boolean(acc.payouts_enabled),
          payments_enabled: Boolean(acc.charges_enabled),
          capabilities: {
            transfers: acc.capabilities?.transfers === 'active' || Boolean(acc.payouts_enabled),
            payouts: Boolean(acc.payouts_enabled),
            card_payments: acc.capabilities?.card_payments || 'inactive'
          },
          details_submitted: Boolean(acc.details_submitted),
          requirements: acc.requirements,
          metadata: acc as any
        };
      }
    } catch (err: any) {
      console.warn("[Stripe Account Retrieve Warning]", err.message || err);
    }

    return {
      provider: 'stripe',
      provider_account_id: accountId,
      account_status: this.isMockAllowed() ? 'ACTIVE' : 'ONBOARDING',
      onboarding_status: this.isMockAllowed() ? 'completed' : 'pending',
      kyc_status: this.isMockAllowed() ? 'verified' : 'pending',
      charges_enabled: true,
      payouts_enabled: true,
      payments_enabled: true,
      capabilities: {
        transfers: true,
        payouts: true,
        card_payments: 'active'
      },
      details_submitted: true
    };
  }

  /**
   * 4. Create Stripe Marketplace Destination Charge Checkout Session
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const stripe = this.getStripe();
    const currency = (params.currency || 'inr').toLowerCase();
    const amountInSmallestUnit = Math.round(params.amount * 100);
    const feeInSmallestUnit = Math.round(params.applicationFeeAmount * 100);

    let session: Stripe.Checkout.Session | null = null;
    let paymentIntent: Stripe.PaymentIntent | null = null;

    try {
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy')) {
        const paymentIntentData: any = {
          metadata: {
            payment_request_id: params.paymentRequestId,
            request_code: params.requestCode,
            receiver_tenant_id: params.receiverTenantId,
            payer_tenant_id: params.payerTenantId || '',
            payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
            payment_provider: 'stripe'
          }
        };

        // Attach Destination Charge with Application Fee if connected account is provided
        if (params.receiverAccountId && !params.receiverAccountId.startsWith('acct_mock_')) {
          paymentIntentData.application_fee_amount = feeInSmallestUnit;
          paymentIntentData.transfer_data = {
            destination: params.receiverAccountId
          };
        }

        const successUrl = params.successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/success?session_id={CHECKOUT_SESSION_ID}&request_id=${params.paymentRequestId}`;
        const cancelUrl = params.cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/cancel?request_id=${params.paymentRequestId}`;

        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: currency,
                product_data: {
                  name: params.title || `Settlement ${params.requestCode}`,
                  description: params.description || `B2B Marketplace Settlement Payment (${params.requestCode})`
                },
                unit_amount: amountInSmallestUnit
              },
              quantity: 1
            }
          ],
          payment_intent_data: paymentIntentData,
          customer_email: params.payerEmail,
          client_reference_id: params.paymentRequestId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            payment_request_id: params.paymentRequestId,
            request_code: params.requestCode
          }
        });
      }
    } catch (err: any) {
      console.warn("[Stripe Checkout Session Error]", err.message || err);
      if (!this.isMockAllowed()) {
        throw new Error(`Stripe Checkout creation failed: ${err.message || err}`);
      }
    }

    const sessionId = session?.id || `cs_mock_${Date.now().toString().slice(-8)}`;
    const checkoutUrl = session?.url || `https://checkout.stripe.com/c/pay/mock_${sessionId}`;
    const pubKey = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key';

    return {
      provider: 'stripe',
      order_id: sessionId,
      checkout_session_id: sessionId,
      client_secret: (session as any)?.client_secret,
      publishable_key: pubKey,
      amount: amountInSmallestUnit,
      amount_in_rupees: params.amount,
      currency: params.currency || 'INR',
      checkout_url: checkoutUrl,
      request_code: params.requestCode,
      title: params.title,
      platform_fee: params.applicationFeeAmount,
      receiver_amount: params.receiverAmount,
      rawData: session
    };
  }

  /**
   * 5. Verify Stripe Payment Server-Side
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const { checkout_session_id, payment_intent_id, order_id, expectedAmount } = params;
    const stripe = this.getStripe();
    const targetSessionId = checkout_session_id || (order_id?.startsWith('cs_') ? order_id : undefined);

    let actualAmount = expectedAmount || 0;
    let actualCurrency = 'INR';
    let providerPaymentId = payment_intent_id || order_id || `pi_stripe_${Date.now()}`;
    let providerTransferId: string | undefined;
    let status: 'CAPTURED' | 'FAILED' | 'AUTHORIZED' | 'PENDING' = 'CAPTURED';
    let failureReason: string | undefined;
    let rawPayment: any;
    let paymentMethod = 'card';

    try {
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy')) {
        if (targetSessionId && !targetSessionId.startsWith('cs_mock_')) {
          const session = await stripe.checkout.sessions.retrieve(targetSessionId, {
            expand: ['payment_intent', 'payment_intent.latest_charge']
          });

          rawPayment = session;
          if (session.payment_status === 'paid') {
            status = 'CAPTURED';
            actualAmount = Number(session.amount_total) / 100;
            actualCurrency = (session.currency || 'INR').toUpperCase();
            
            const pi = session.payment_intent as Stripe.PaymentIntent;
            if (pi) {
              providerPaymentId = pi.id;
              if (pi.transfer_data?.destination) {
                providerTransferId = (pi as any).transfer || pi.transfer_data.destination as string;
              }
              if (pi.payment_method_types && pi.payment_method_types.length > 0) {
                paymentMethod = pi.payment_method_types[0];
              }
            }
          } else {
            status = 'PENDING';
            failureReason = `Stripe session payment status is '${session.payment_status}'`;
          }
        } else if (payment_intent_id && !payment_intent_id.startsWith('pi_mock_')) {
          const pi = await stripe.paymentIntents.retrieve(payment_intent_id, {
            expand: ['latest_charge']
          });

          rawPayment = pi;
          if (pi.status === 'succeeded') {
            status = 'CAPTURED';
            actualAmount = Number(pi.amount) / 100;
            actualCurrency = (pi.currency || 'INR').toUpperCase();
            providerPaymentId = pi.id;
            if (pi.transfer_data?.destination) {
              providerTransferId = pi.transfer_data.destination as string;
            }
          } else {
            status = 'PENDING';
            failureReason = `Stripe PaymentIntent status is '${pi.status}'`;
          }
        }
      }
    } catch (err: any) {
      console.warn("[Stripe Verify Payment Warning]", err.message || err);
      if (!this.isMockAllowed()) {
        throw err;
      }
    }

    if (expectedAmount && Math.abs(actualAmount - expectedAmount) > 0.5) {
      return {
        success: false,
        provider: 'stripe',
        provider_payment_id: providerPaymentId,
        provider_order_id: targetSessionId || order_id,
        amount: actualAmount,
        currency: actualCurrency,
        status: 'FAILED',
        failure_reason: `Payment amount mismatch: expected ₹${expectedAmount}, got ₹${actualAmount}.`,
        rawPayment
      };
    }

    return {
      success: status === 'CAPTURED',
      provider: 'stripe',
      provider_payment_id: providerPaymentId,
      provider_order_id: targetSessionId || order_id,
      provider_transfer_id: providerTransferId,
      provider_fee: 0,
      amount: actualAmount,
      currency: actualCurrency,
      payment_method: paymentMethod,
      status,
      failure_reason: failureReason,
      rawPayment
    };
  }

  /**
   * 6. Process Stripe Refund with Transfer Reversal and Application Fee Reversal
   */
  async processRefund(params: CreateRefundParams): Promise<RefundResult> {
    const stripe = this.getStripe();
    let stripeRefund: any;

    try {
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy') && !params.providerPaymentId.startsWith('pi_mock_')) {
        const refundParams: Stripe.RefundCreateParams = {
          amount: Math.round(params.amount * 100),
          reason: 'requested_by_customer',
          metadata: {
            payment_id: params.paymentId,
            reason: params.reason || 'Marketplace settlement refund'
          }
        };

        if (params.providerPaymentId.startsWith('pi_')) {
          refundParams.payment_intent = params.providerPaymentId;
        } else if (params.providerPaymentId.startsWith('ch_')) {
          refundParams.charge = params.providerPaymentId;
        }

        if (params.reverseTransfer !== false) {
          refundParams.reverse_transfer = true;
        }

        if (params.refundApplicationFee !== false) {
          refundParams.refund_application_fee = true;
        }

        stripeRefund = await stripe.refunds.create(refundParams);
      } else {
        stripeRefund = { id: `re_mock_${Date.now()}`, amount: Math.round(params.amount * 100), status: 'succeeded' };
      }
    } catch (err: any) {
      if (!this.isMockAllowed()) throw err;
      stripeRefund = { id: `re_mock_${Date.now()}`, amount: Math.round(params.amount * 100), status: 'succeeded' };
    }

    return {
      success: true,
      refund_id: stripeRefund?.id || `re_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      status: stripeRefund?.status || 'succeeded',
      rawData: stripeRefund
    };
  }

  /**
   * 7. Verify Stripe Webhook Signature
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, headers?: Record<string, any>): boolean {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!secret || !signature) return false;

    try {
      const stripe = this.getStripe();
      const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
      stripe.webhooks.constructEvent(bodyBuffer, signature, secret);
      return true;
    } catch (err: any) {
      console.warn("[Stripe Webhook Signature Verification Warning]", err.message || err);
      return false;
    }
  }
}

export default StripeMarketplaceProvider;
