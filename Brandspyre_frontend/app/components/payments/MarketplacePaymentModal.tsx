import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Info,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { organizationPaymentApi } from 'src/services/organizationPaymentService';
import apiClient from "src/services/apiClient";
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface MarketplacePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentResult: any) => void;
  invoiceId?: string;
  transactionId?: string;
  paymentRequestId?: string;
  invoiceNumber?: string;
  title?: string;
  totalAmount: number;
  platformFee?: number;
  platformTax?: number;
  receiverAmount?: number;
  currency?: string;
  receiverName?: string;
  defaultProvider?: 'razorpay' | 'stripe';
}

export const MarketplacePaymentModal: React.FC<MarketplacePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  transactionId,
  paymentRequestId,
  invoiceNumber,
  title,
  totalAmount,
  platformFee,
  platformTax,
  receiverAmount,
  currency = 'INR',
  receiverName,
  defaultProvider = 'razorpay'
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'razorpay' | 'stripe'>(defaultProvider);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('SELECT');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  // Compute calculated values if not provided
  const gross = totalAmount || 0;
  const calculatedFee = platformFee !== undefined ? platformFee : Math.round(gross * 0.10 * 100) / 100;
  const calculatedTax = platformTax !== undefined ? platformTax : Math.round(calculatedFee * 0.18 * 100) / 100;
  const totalDeduction = Math.round((calculatedFee + calculatedTax) * 100) / 100;
  const netReceiver = receiverAmount !== undefined ? receiverAmount : Math.max(0, Math.round((gross - totalDeduction) * 100) / 100);

  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setErrorMessage('');
      setPaymentSuccessData(null);
      setSelectedProvider(defaultProvider);
      loadRazorpayScript();
    }
  }, [isOpen, defaultProvider]);

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-checkout-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const handlePayNow = async () => {
    setLoading(true);
    setErrorMessage('');
    setStep('PROCESSING');

    try {
      if (selectedProvider === 'razorpay') {
        // 1. Razorpay Route Flow
        let checkoutOrder: any;
        
        if (paymentRequestId) {
          const res = await organizationPaymentApi.createMarketplaceCheckout({
            requestId: paymentRequestId,
            provider: 'razorpay'
          });
          checkoutOrder = res.data?.data || res.data;
        } else {
          // Lead Exchange pay-now endpoint fallback
          const res = await apiClient.post('/lead-exchange/pay-now', {
            invoice_id: invoiceId,
            transaction_id: transactionId,
            provider: 'razorpay'
          });
          const json = res.data;
          if (!json.success && json.success !== undefined) throw new Error(json.message || "Failed to initialize payment.");
          checkoutOrder = json.data || json;
        }

        if (!window.Razorpay) {
          throw new Error("Razorpay SDK failed to load. Please refresh and try again.");
        }

        const options = {
          key: checkoutOrder.publishable_key || checkoutOrder.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQ4Ilwgyi4tFiz',
          amount: checkoutOrder.amount,
          currency: checkoutOrder.currency || 'INR',
          name: 'Brandspyre Marketplace',
          description: `B2B Settlement for ${invoiceNumber || title || 'Lead Fulfillment'}`,
          order_id: checkoutOrder.order_id,
          handler: async (response: any) => {
            try {
              setLoading(true);
              let verifyRes: any;

              if (paymentRequestId) {
                const vRes = await organizationPaymentApi.verifyMarketplacePayment({
                  provider: 'razorpay',
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  payment_request_id: paymentRequestId
                });
                verifyRes = vRes.data;
              } else {
                const vRes = await apiClient.post('/lead-exchange/verify-payment', {
                  provider: 'razorpay',
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  invoice_id: invoiceId
                });
                verifyRes = vRes.data;
              }

              const data = verifyRes?.data?.data || verifyRes?.data || verifyRes;
              setPaymentSuccessData(data);
              setStep('SUCCESS');
              toast.success("Settlement payment captured & reconciled successfully!");
              onSuccess(data);
            } catch (verErr: any) {
              const msg = verErr.response?.data?.message || verErr.message || "Payment verification failed.";
              setErrorMessage(msg);
              setStep('ERROR');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: '',
            email: ''
          },
          theme: {
            color: '#6366F1'
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setStep('SELECT');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // 2. Stripe Connect Destination Charge Flow
        let checkoutData: any;

        if (paymentRequestId) {
          const res = await organizationPaymentApi.createMarketplaceCheckout({
            requestId: paymentRequestId,
            provider: 'stripe'
          });
          checkoutData = res.data?.data || res.data;
        } else {
          const res = await apiClient.post('/lead-exchange/pay-now', {
            invoice_id: invoiceId,
            transaction_id: transactionId,
            provider: 'stripe'
          });
          const json = res.data;
          if (!json.success && json.success !== undefined) throw new Error(json.message || "Failed to initialize Stripe checkout.");
          checkoutData = json.data || json;
        }

        if (checkoutData.checkout_url) {
          // Open Stripe Checkout in new tab or redirect
          const stripeWindow = window.open(checkoutData.checkout_url, '_blank');
          
          toast.success("Stripe Checkout opened in a new tab. Complete your payment there.");
          
          // Poll for completion
          const pollInterval = setInterval(async () => {
            try {
              let verifyRes: any;
              if (paymentRequestId) {
                const vRes = await organizationPaymentApi.verifyMarketplacePayment({
                  provider: 'stripe',
                  order_id: checkoutData.order_id,
                  checkout_session_id: checkoutData.checkout_session_id,
                  payment_request_id: paymentRequestId
                });
                verifyRes = vRes.data;
              } else {
                const vRes = await apiClient.post('/lead-exchange/verify-payment', {
                  provider: 'stripe',
                  order_id: checkoutData.order_id,
                  checkout_session_id: checkoutData.checkout_session_id,
                  invoice_id: invoiceId
                });
                verifyRes = vRes.data;
              }

              if (verifyRes?.success || verifyRes?.data?.success) {
                clearInterval(pollInterval);
                const data = verifyRes?.data?.data || verifyRes?.data || verifyRes;
                setPaymentSuccessData(data);
                setStep('SUCCESS');
                toast.success("Stripe settlement payment verified successfully!");
                onSuccess(data);
                setLoading(false);
              }
            } catch (pollErr) {
              // Keep waiting for customer to complete checkout
            }
          }, 3000);

          // Stop polling after 5 minutes
          setTimeout(() => clearInterval(pollInterval), 300000);
        } else {
          throw new Error("Stripe checkout session URL was not returned.");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Payment initiation failed.";
      setErrorMessage(msg);
      setStep('ERROR');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transition-all text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">B2B Marketplace Settlement</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {invoiceNumber ? `Invoice #${invoiceNumber}` : (title || 'Direct Organization Payout')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {step === 'SELECT' && (
            <>
              {/* Receiver Info */}
              {receiverName && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Beneficiary Organization</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{receiverName}</span>
                </div>
              )}

              {/* Payment Provider Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Razorpay Option */}
                  <div
                    onClick={() => setSelectedProvider('razorpay')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedProvider === 'razorpay'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        Razorpay Route
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedProvider === 'razorpay' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {selectedProvider === 'razorpay' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      UPI, NetBanking, Domestic Cards & Split Route Transfer
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Instant Escrow Split
                    </div>
                  </div>

                  {/* Stripe Option */}
                  <div
                    onClick={() => setSelectedProvider('stripe')}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      selectedProvider === 'stripe'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        Stripe Connect
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedProvider === 'stripe' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {selectedProvider === 'stripe' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Credit/Debit Cards, Global Currencies & Destination Payouts
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      <CreditCard className="w-3.5 h-3.5" /> Destination Charges
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="bg-slate-50/90 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span>Gross Settlement Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">₹{gross.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    Platform Commission (10%)
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-300">₹{calculatedFee.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>GST on Platform Commission (18%)</span>
                  <span className="font-medium text-slate-800 dark:text-slate-300">₹{calculatedTax.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-0.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <span>Total Platform Retained</span>
                  <span>- ₹{totalDeduction.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Beneficiary Net Payout (88.2%)</span>
                  <span>₹{netReceiver.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Payable by You</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-base font-extrabold">₹{gross.toLocaleString('en-IN')} {currency}</span>
                </div>
              </div>
            </>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Securing Checkout Session</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Connecting to {selectedProvider === 'stripe' ? 'Stripe Connect' : 'Razorpay Route'} to authorize settlement funds...
                </p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Settlement Payment Complete!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Receipt #{paymentSuccessData?.receiptNumber || 'RCPT-SUCCESS'} has been generated. Payout and commission allocations have been reconciled.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-left w-full space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Amount Settled:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{gross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Provider:</span>
                  <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{selectedProvider}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'ERROR' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Failed</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={() => setStep('SELECT')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white rounded-xl transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {step === 'SUCCESS' ? 'Close' : 'Cancel'}
          </button>

          {step === 'SELECT' && (
            <button
              onClick={handlePayNow}
              disabled={loading || gross <= 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  Pay ₹{gross.toLocaleString('en-IN')} via {selectedProvider === 'stripe' ? 'Stripe' : 'Razorpay'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {step === 'SUCCESS' && (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePaymentModal;
