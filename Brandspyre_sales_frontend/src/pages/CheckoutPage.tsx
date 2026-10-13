import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  Building2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Banknote,
  FileText,
  AlertCircle,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import api from '../services/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, estimatedTax, shippingFee, grandTotal, clearCart } = useCart();
  const { buyer } = useAuth();

  // Form State
  const [name, setName] = useState(buyer?.name || '');
  const [email, setEmail] = useState(buyer?.email || '');
  const [phone, setPhone] = useState(buyer?.phone || '');
  const [company, setCompany] = useState(buyer?.company_name || '');
  const [line1, setLine1] = useState(buyer?.addresses?.[0]?.line1 || '');
  const [line2, setLine2] = useState(buyer?.addresses?.[0]?.line2 || '');
  const [city, setCity] = useState(buyer?.addresses?.[0]?.city || '');
  const [state, setState] = useState(buyer?.addresses?.[0]?.state || '');
  const [postalCode, setPostalCode] = useState(buyer?.addresses?.[0]?.postal_code || '');
  const [country, setCountry] = useState(buyer?.addresses?.[0]?.country || 'India');

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_CARD' | 'UPI' | 'B2B_PO'>('ONLINE_CARD');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !line1.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete all required contact and delivery address fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          product_id: item.product._id,
          name: item.product.name,
          quantity: item.quantity
        })),
        shipping_address: {
          line1,
          line2,
          city,
          state,
          postal_code: postalCode,
          country,
          phone
        },
        payment_method: paymentMethod,
        notes,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        buyer_company: company
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data?.success && res.data.data) {
        const orderNumber = res.data.data.order_number;
        const accessToken = res.data.order_access_token || res.data.data.order_access_token;
        if (accessToken) {
          sessionStorage.setItem(`order_token_${orderNumber}`, accessToken);
        }

        // Online Gateway via Razorpay
        if (paymentMethod === 'ONLINE_CARD' || paymentMethod === 'UPI') {
          try {
            const intentRes = await api.post('/payments/create-intent', { orderNumber });
            if (intentRes.data?.success) {
              const { key, orderId, amount, currency, gateway } = intentRes.data;

              if (gateway === 'RAZORPAY' && (window as any).Razorpay) {
                const options = {
                  key,
                  amount,
                  currency: currency || 'INR',
                  name: 'Brandspyre Marketplace',
                  description: `Order #${orderNumber}`,
                  order_id: orderId,
                  prefill: {
                    name,
                    email,
                    contact: phone
                  },
                  theme: {
                    color: '#b91c1c'
                  },
                  handler: async (rzpResponse: any) => {
                    try {
                      const verifyRes = await api.post('/payments/verify', {
                        orderNumber,
                        razorpay_order_id: rzpResponse.razorpay_order_id,
                        razorpay_payment_id: rzpResponse.razorpay_payment_id,
                        razorpay_signature: rzpResponse.razorpay_signature
                      });

                      if (verifyRes.data?.success) {
                        clearCart();
                        const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
                        navigate(`/order/${orderNumber}${tokenQuery}`);
                      } else {
                        setErrorMsg(verifyRes.data?.error || 'Payment signature verification failed. Cart preserved.');
                      }
                    } catch (verifyErr: any) {
                      console.error('Signature verification call error:', verifyErr);
                      setErrorMsg(verifyErr.response?.data?.error || 'Payment verification failed. Your cart was preserved.');
                    } finally {
                      setSubmitting(false);
                    }
                  },
                  modal: {
                    ondismiss: () => {
                      setSubmitting(false);
                      setErrorMsg(`Payment cancelled or dismissed. Order #${orderNumber} has been reserved in pending state. Your cart remains safe.`);
                    }
                  }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
                return;
              } else {
                setErrorMsg('Razorpay payment gateway script not loaded. Please select Cash on Delivery or retry.');
                setSubmitting(false);
                return;
              }
            } else {
              setErrorMsg(intentRes.data?.error || 'Failed to initialize payment gateway.');
              setSubmitting(false);
              return;
            }
          } catch (intentErr: any) {
            setErrorMsg(intentErr.response?.data?.error || 'Failed to create payment intent.');
            setSubmitting(false);
            return;
          }
        }

        // Offline payment (Cash on Delivery or B2B Purchase Order)
        clearCart();
        const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
        navigate(`/order/${orderNumber}${tokenQuery}`);
      } else {
        setErrorMsg(res.data?.error || 'Failed to place order.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'An error occurred during checkout. Please verify details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Commercial Checkout"
        description="Review shipping details and confirm enterprise payment for multi-vendor order routing"
        breadcrumbs={[
          { label: 'Marketplace', path: '/' },
          { label: 'Cart', path: '/cart' },
          { label: 'Checkout' }
        ]}
      />

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Form & Summary Grid */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Contact, Address, Payment Method (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Buyer Contact */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">1</span>
              <span>Buyer Identity & Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Business / Contact Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@company.com"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone / Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company / Organization Name (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Industries Ltd."
                  className="crm-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">2</span>
              <span>Delivery & Invoicing Address</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Address Line 1 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street address, building, premises"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Suite, unit, floor, landmark"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    PIN / Postal Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 400001"
                    className="crm-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method Selection */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">3</span>
              <span>Payment Option</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Online Razorpay */}
              <label
                onClick={() => setPaymentMethod('ONLINE_CARD')}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                  paymentMethod === 'ONLINE_CARD'
                    ? 'border-red-700 bg-red-50/40 text-slate-900 ring-2 ring-red-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'ONLINE_CARD' ? 'text-red-700' : 'text-slate-400'}`} />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'ONLINE_CARD'}
                    onChange={() => setPaymentMethod('ONLINE_CARD')}
                    className="w-4 h-4 text-red-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Online Payment</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">UPI, Cards, NetBanking via Razorpay</p>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-red-700 bg-red-50/40 text-slate-900 ring-2 ring-red-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'COD' ? 'text-red-700' : 'text-slate-400'}`} />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-red-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pay on Delivery (COD)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Settle with carrier upon physical receipt</p>
                </div>
              </label>

              {/* B2B Purchase Order */}
              <label
                onClick={() => setPaymentMethod('B2B_PO')}
                className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                  paymentMethod === 'B2B_PO'
                    ? 'border-red-700 bg-red-50/40 text-slate-900 ring-2 ring-red-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className={`w-5 h-5 ${paymentMethod === 'B2B_PO' ? 'text-red-700' : 'text-slate-400'}`} />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'B2B_PO'}
                    onChange={() => setPaymentMethod('B2B_PO')}
                    className="w-4 h-4 text-red-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">B2B Purchase Order (PO)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Credit terms & enterprise ledger billing</p>
                </div>
              </label>
            </div>

            {/* Delivery Instructions */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Dispatch / Gate Instructions (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific unloading instructions, GST purchase order number, or receiving contact..."
                className="crm-input h-16 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Review Sidebar (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-[11px] text-slate-400 font-normal">{cartItems.length} products</span>
            </h3>

            {/* Item Mini Preview */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
              {cartItems.map((it) => (
                <div key={it.product._id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate flex-1">
                    <span className="font-semibold text-slate-900 block truncate">{it.product.name}</span>
                    <span className="text-[10px] text-slate-500">Qty: {it.quantity} × ₹{it.product.selling_price.toLocaleString()}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    ₹{(it.product.selling_price * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes (GST)</span>
                <span className="font-semibold text-slate-900">₹{estimatedTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Enterprise Dispatch</span>
                <span className="font-semibold text-emerald-700">
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-slate-900">
                <span className="text-sm font-bold">Payable Amount</span>
                <span className="text-xl font-black text-red-700">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full crm-btn-primary !h-12 !text-sm"
              >
                <Lock className="w-4 h-4" />
                <span>{submitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
              </button>
            </div>

            {/* Guarantee */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>HMAC-SHA256 Encrypted Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Direct Multi-Tenant ERP Ledger Bridge</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/cart"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Shopping Cart</span>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
