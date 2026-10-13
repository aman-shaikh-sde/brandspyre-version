import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  Building2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import { EcommerceOrder } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CrmBadge } from '../components/common/CrmBadge';
import { marketplaceService } from '../services/marketplaceService';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<EcommerceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;
      setLoading(true);
      try {
        const token =
          searchParams.get('token') ||
          sessionStorage.getItem(`order_token_${orderNumber}`) ||
          undefined;

        const data = await marketplaceService.getOrderByNumber(orderNumber, token);
        if (data) {
          setOrder(data);
          if (data.order_access_token) {
            sessionStorage.setItem(`order_token_${orderNumber}`, data.order_access_token);
          }
        }
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Retrieving verified order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Could not locate order #{orderNumber}. If this was a guest checkout, verify that you are using the secure confirmation link.
        </p>
        <Link to="/catalog" className="crm-btn-primary inline-flex !h-9 text-xs mx-auto">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'PAID';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={`Order #${order.order_number}`}
        description={`Placed on ${new Date(order.created_at).toLocaleDateString()} at ${new Date(order.created_at).toLocaleTimeString()}`}
        breadcrumbs={[
          { label: 'Marketplace', path: '/' },
          { label: 'My Orders', path: '/account?tab=orders' },
          { label: order.order_number }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="crm-btn-secondary !h-9 !px-3 !text-xs print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Invoice / Receipt</span>
            </button>
            <Link
              to="/catalog"
              className="crm-btn-primary !h-9 !px-3 !text-xs print:hidden"
            >
              <span>Continue Shopping</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* 2. Success Status Banner */}
      <div className={`p-6 rounded-2xl border text-center space-y-3 ${
        isPaid
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-amber-50/70 border-amber-200'
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
          isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
        }`}>
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isPaid ? 'Payment Confirmed & Order Placed' : 'Order Placed (Payment Pending / COD)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">
            Your multi-vendor order has been partitioned and routed to each seller's Brandspyre ERP sales ledger for dispatch.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-2xs">
            <span>Master Order #:</span>
            <span className="text-red-700">{order.order_number}</span>
          </div>
          <CrmBadge label={order.payment_status} />
        </div>
      </div>

      {/* 3. Visual Stepper Timeline */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
          <Clock className="w-4 h-4 text-red-600" />
          <span>Fulfillment Progress Tracking</span>
        </h3>

        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
          <div className="space-y-1">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto font-bold text-xs">
              ✓
            </div>
            <span className="font-bold text-slate-800 block text-[11px]">Order Recorded</span>
            <span className="text-[10px] text-slate-400">Inventory Reserved</span>
          </div>

          <div className="space-y-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto font-bold text-xs ${
              isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isPaid ? '✓' : '•'}
            </div>
            <span className="font-bold text-slate-800 block text-[11px]">Payment</span>
            <span className="text-[10px] text-slate-400">{order.payment_method}</span>
          </div>

          <div className="space-y-1">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto font-bold text-xs">
              3
            </div>
            <span className="font-semibold text-slate-600 block text-[11px]">Seller ERP Processing</span>
            <span className="text-[10px] text-slate-400">Packaging</span>
          </div>

          <div className="space-y-1">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto font-bold text-xs">
              4
            </div>
            <span className="font-semibold text-slate-600 block text-[11px]">Dispatched</span>
            <span className="text-[10px] text-slate-400">Carrier Transit</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Seller Package Breakdown */}
      {order.seller_orders && order.seller_orders.length > 0 && (
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
            <Truck className="w-4 h-4 text-red-600" />
            <span>Seller ERP Sales Orders ({order.seller_orders.length} Dispatches)</span>
          </h3>

          <div className="space-y-3">
            {order.seller_orders.map((so, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-900">{so.tenant_name || `Seller #${idx + 1}`}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ERP Sales Order Ref: <span className="font-semibold text-slate-800">{so.order_number}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">₹{so.subtotal.toLocaleString()}</span>
                  <CrmBadge label={so.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Purchased Items List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
          Items Ordered ({order.items.length})
        </div>
        <div className="divide-y divide-slate-100">
          {order.items.map((it, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 block truncate">{it.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">SKU: {it.sku}</span>
                {it.tenant_name && (
                  <span className="text-[11px] text-slate-500 block mt-0.5">Fulfiller: {it.tenant_name}</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-slate-900 block text-sm">₹{it.total.toLocaleString()}</span>
                <span className="text-[11px] text-slate-500">{it.quantity} × ₹{it.unit_price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Breakdown Table */}
        <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">₹{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Taxes (GST)</span>
            <span className="font-semibold text-slate-900">₹{order.tax_total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Logistics & Shipping</span>
            <span className="font-semibold text-emerald-700">
              {order.shipping_fee === 0 ? 'FREE Enterprise Dispatch' : `₹${order.shipping_fee.toLocaleString()}`}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount</span>
              <span>-₹{order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-slate-900 font-bold text-sm">
            <span>Total Paid</span>
            <span className="text-base text-red-700">₹{order.grand_total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 6. Delivery Address & Recipient Card */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>Delivery Destination</span>
          </h4>
          <p className="text-slate-700 font-semibold">{order.buyer_name}</p>
          <p className="text-slate-600">{order.shipping_address.line1}</p>
          {order.shipping_address.line2 && <p className="text-slate-600">{order.shipping_address.line2}</p>}
          <p className="text-slate-600">{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</p>
          <p className="text-slate-600 font-medium pt-1">Phone: {order.buyer_phone}</p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>Commercial Invoicing Details</span>
          </h4>
          <p className="text-slate-700 font-semibold">{order.buyer_company || order.buyer_name}</p>
          <p className="text-slate-600">Email: {order.buyer_email}</p>
          <p className="text-slate-600">Payment Channel: <span className="font-semibold text-slate-800">{order.payment_method}</span></p>
          <p className="text-slate-600">Payment Status: <span className="font-semibold text-slate-800">{order.payment_status}</span></p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
