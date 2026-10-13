export type MarketplaceProviderType = 'razorpay' | 'stripe';

export interface AccountOnboardParams {
  tenantId: string;
  business_name: string;
  business_type?: 'individual' | 'partnership' | 'proprietorship' | 'private_limited' | 'public_limited' | 'llp' | 'trust' | 'society' | 'other';
  legal_name?: string;
  email: string;
  phone?: string;
  country?: string;
  currency?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  beneficiary_name?: string;
  gstin?: string;
  pan?: string;
  return_url?: string;
  refresh_url?: string;
}

export interface AccountOnboardResult {
  provider: MarketplaceProviderType;
  provider_account_id: string;
  account_status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'ONBOARDING' | 'PENDING' | 'RESTRICTED' | 'SUSPENDED' | 'REJECTED' | 'DISCONNECTED';
  onboarding_status: string;
  kyc_status: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  charges_enabled?: boolean;
  capabilities: {
    route?: boolean;
    transfers?: boolean;
    payouts?: boolean;
    card_payments?: string;
  };
  onboarding_url?: string;
  details_submitted?: boolean;
  requirements?: any;
  metadata?: Record<string, any>;
}

export interface CreateCheckoutParams {
  paymentRequestId: string;
  requestCode: string;
  title: string;
  description?: string;
  amount: number; // Gross amount in currency units (e.g. INR 10,000)
  currency: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  payerTenantId?: string;
  receiverTenantId: string;
  receiverAccountId?: string;
  receiverAmount: number; // Net amount routed to receiver
  applicationFeeAmount: number; // Platform fee + tax retained
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSessionResult {
  provider: MarketplaceProviderType;
  order_id: string; // Razorpay Order ID or Stripe PaymentIntent ID / Session ID
  checkout_session_id?: string; // Stripe Checkout Session ID
  client_secret?: string; // Stripe PaymentIntent / SetupIntent client secret
  publishable_key?: string; // Client public key
  amount: number; // in smallest currency unit (paise / cents) or base currency
  amount_in_rupees: number;
  currency: string;
  checkout_url?: string; // Hosted checkout link
  request_code: string;
  title: string;
  receiver_name?: string;
  platform_fee: number;
  receiver_amount: number;
  rawData?: any;
}

export interface VerifyPaymentParams {
  order_id?: string;
  payment_id?: string;
  signature?: string;
  checkout_session_id?: string;
  payment_intent_id?: string;
  payment_request_id?: string;
  expectedAmount?: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  provider: MarketplaceProviderType;
  provider_payment_id: string;
  provider_order_id?: string;
  provider_transfer_id?: string;
  provider_fee?: number;
  amount: number; // In currency units (e.g. INR)
  currency: string;
  payment_method?: string;
  status: 'CAPTURED' | 'FAILED' | 'AUTHORIZED' | 'PENDING';
  failure_reason?: string;
  rawPayment?: any;
}

export interface CreateRefundParams {
  paymentId: string;
  providerPaymentId: string;
  amount: number; // Amount in currency units (e.g. INR)
  currency: string;
  reason?: string;
  providerTransferId?: string;
  reverseTransfer?: boolean;
  refundApplicationFee?: boolean;
}

export interface RefundResult {
  success: boolean;
  refund_id: string;
  amount: number;
  currency: string;
  status: string;
  rawData?: any;
}

export interface IMarketplacePaymentProvider {
  readonly providerType: MarketplaceProviderType;

  /**
   * 1. Create or link organization connected account
   */
  onboardAccount(params: AccountOnboardParams): Promise<AccountOnboardResult>;

  /**
   * 2. Generate interactive onboarding / KYC link (e.g. Stripe Connect Account Link)
   */
  createOnboardingLink?(accountId: string, returnUrl: string, refreshUrl: string): Promise<{ url: string }>;

  /**
   * 3. Fetch latest account status & capabilities from provider API
   */
  getAccountDetails(accountId: string): Promise<AccountOnboardResult>;

  /**
   * 4. Create marketplace checkout order or session
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * 5. Verify payment callback or signature server-side
   */
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;

  /**
   * 6. Process refund and reverse transfer/application fee
   */
  processRefund(params: CreateRefundParams): Promise<RefundResult>;

  /**
   * 7. Verify provider webhook signature
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string, headers?: Record<string, any>): boolean;
}
