import apiClient from './apiClient';

const BASE_URL = '/organization-payments';

export const organizationPaymentApi = {
  // Multi-Provider Payment Account Management
  getPaymentAccount: () => apiClient.get(`${BASE_URL}/account`),
  onboardPaymentAccount: (data: any) => apiClient.post(`${BASE_URL}/account/onboard`, data),
  createOnboardingLink: (data: { provider?: string; return_url?: string; refresh_url?: string }) =>
    apiClient.post(`${BASE_URL}/account/onboarding-link`, data),
  refreshPaymentAccount: (provider?: string) =>
    apiClient.post(`${BASE_URL}/account/refresh`, {}, { params: { provider } }),
  disconnectPaymentAccount: (provider?: string) =>
    apiClient.post(`${BASE_URL}/account/disconnect`, {}, { params: { provider } }),
  setDefaultProvider: (provider: 'razorpay' | 'stripe') =>
    apiClient.post(`${BASE_URL}/account/set-default`, { provider }),

  // Marketplace Checkout & Verification (In-App)
  createMarketplaceCheckout: (data: {
    requestId: string;
    payer_name?: string;
    payer_email?: string;
    payer_phone?: string;
    payer_tenant_id?: string;
    provider?: 'razorpay' | 'stripe';
  }) => apiClient.post(`${BASE_URL}/marketplace/checkout`, data),

  verifyMarketplacePayment: (data: {
    provider?: 'razorpay' | 'stripe';
    order_id?: string;
    payment_id?: string;
    signature?: string;
    checkout_session_id?: string;
    payment_intent_id?: string;
    payment_request_id?: string;
  }) => apiClient.post(`${BASE_URL}/marketplace/verify`, data),

  // Payment Requests
  createPaymentRequest: (data: any) => apiClient.post(`${BASE_URL}/requests`, data),
  getPaymentRequests: (params?: any) => apiClient.get(`${BASE_URL}/requests`, { params }),
  getPaymentRequestById: (id: string) => apiClient.get(`${BASE_URL}/requests/${id}`),
  cancelPaymentRequest: (id: string) => apiClient.post(`${BASE_URL}/requests/${id}/cancel`),

  // Payments & Refunds
  getReceivedPayments: (params?: any) => apiClient.get(`${BASE_URL}/received`, { params }),
  getSentPayments: (params?: any) => apiClient.get(`${BASE_URL}/sent`, { params }),
  getPaymentReceipt: (paymentId: string) => apiClient.get(`${BASE_URL}/receipt/${paymentId}`),
  refundPayment: (id: string, data: any) => apiClient.post(`${BASE_URL}/${id}/refund`, data),

  // Dashboard Metrics (Filtered by Range and Provider)
  getDashboard: (range?: string, provider?: string) =>
    apiClient.get(`${BASE_URL}/dashboard`, { params: { range, provider } }),

  // Platform Config
  getPlatformFeeConfig: () => apiClient.get(`${BASE_URL}/platform/config`),
  updatePlatformFeeConfig: (data: any) => apiClient.post(`${BASE_URL}/platform/config`, data),

  // Platform Admin Reconciliation
  getAdminReconciliations: (params?: any) => apiClient.get(`${BASE_URL}/admin/reconciliations`, { params }),
  updateAdjustmentStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient.post(`${BASE_URL}/admin/reconciliations/${id}/status`, data),

  // Public Checkout
  getPublicPaymentRequest: (token: string) => apiClient.get(`${BASE_URL}/public/${token}`),
  createPublicCheckoutOrder: (token: string, data?: any) => apiClient.post(`${BASE_URL}/public/${token}/order`, data || {}),
  verifyPublicPayment: (token: string, data: any) => apiClient.post(`${BASE_URL}/public/${token}/verify`, data),
};

export default organizationPaymentApi;
