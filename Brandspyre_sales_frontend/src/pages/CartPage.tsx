import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Package,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ProductImage } from '../components/common/ProductImage';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    estimatedTax,
    shippingFee,
    grandTotal
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'WELCOME10') {
      const discount = Math.round(subtotal * 0.1);
      setCouponDiscount(discount);
      setCouponApplied(true);
      setCouponMsg('10% Welcome promotion applied successfully!');
    } else {
      setCouponMsg('Invalid promo code. Try WELCOME10');
    }
  };

  const finalTotal = Math.max(0, grandTotal - couponDiscount);
  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Your Shopping Cart is Empty"
          description="Browse certified enterprise products or request purchase quotations directly from suppliers."
          actionText="Browse Procurement Catalog"
          onAction={() => navigate('/catalog')}
        />
      </div>
    );
  }

  // Group items by Seller organization
  const groupedBySeller = cartItems.reduce((acc, item) => {
    const seller = item.product.tenant_id?.company_name || item.product.tenant_id?.name || 'Verified Business Seller';
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Procurement Shopping Cart"
        description={`${totalItemCount} items across ${Object.keys(groupedBySeller).length} supplier packages`}
        breadcrumbs={[
          { label: 'Marketplace', path: '/' },
          { label: 'Catalog', path: '/catalog' },
          { label: 'Cart' }
        ]}
        actions={
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Clear All Items
          </button>
        }
      />

      {/* 2. 2-Column Cart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multi-Seller Package Groups (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {Object.entries(groupedBySeller).map(([sellerName, items], pkgIdx) => (
            <div
              key={sellerName}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
            >
              {/* Package Seller Header */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">Package #{pkgIdx + 1}: {sellerName}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Seller</span>
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {items.length} {items.length === 1 ? 'line item' : 'line items'}
                </span>
              </div>

              {/* Package Line Items */}
              <div className="divide-y divide-slate-100">
                {items.map((it) => {
                  const lineTotal = it.product.selling_price * it.quantity;
                  const availableStock = typeof it.product.available_stock === 'number' ? it.product.available_stock : 100;

                  return (
                    <div key={it.product._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Thumbnail & Title */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <Link to={`/product/${it.product._id}`} className="shrink-0 w-16 h-16 rounded-lg border border-slate-200 overflow-hidden">
                          <ProductImage
                            src={it.product.image_url || it.product.images?.[0]}
                            alt={it.product.name}
                            iconSize="sm"
                            className="w-full h-full"
                            imgClassName="w-full h-full object-contain p-1"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/product/${it.product._id}`}
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-red-700 transition-colors line-clamp-2 leading-snug"
                          >
                            {it.product.name}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span className="font-mono">SKU: {it.product.sku}</span>
                            <span>•</span>
                            <span>Unit: ₹{it.product.selling_price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Price */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                          <button
                            onClick={() => updateQuantity(it.product._id, it.quantity - 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">{it.quantity}</span>
                          <button
                            onClick={() => updateQuantity(it.product._id, it.quantity + 1)}
                            disabled={it.quantity >= availableStock}
                            className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                            ₹{lineTotal.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {it.product.tax_inclusive ? 'Tax incl.' : '+ Taxes'}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(it.product._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Continue Browsing */}
          <div className="pt-2">
            <Link
              to="/catalog"
              className="text-xs font-bold text-red-700 hover:text-red-800 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>← Continue Shopping & Add More Products</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary (4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Commercial Order Summary
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal ({totalItemCount} items)</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Taxes (GST)</span>
                <span className="font-semibold text-slate-900">₹{estimatedTax.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Logistics & Shipping</span>
                <span className="font-semibold text-emerald-700">
                  {shippingFee === 0 ? 'FREE Enterprise Dispatch' : `₹${shippingFee.toLocaleString()}`}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Promotion Discount</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between text-slate-900">
                <div>
                  <span className="text-sm font-bold block">Grand Total</span>
                  <span className="text-[10px] text-slate-400">Includes all applicable duties & taxes</span>
                </div>
                <span className="text-xl font-black text-slate-900">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Promo Code (e.g. WELCOME10)"
                  className="crm-input !h-9 !px-3 !text-xs uppercase"
                />
                <button
                  type="submit"
                  className="crm-btn-secondary !h-9 !px-3 !text-xs shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className={`text-[11px] ${couponApplied ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {couponMsg}
                </p>
              )}
            </form>

            {/* Checkout CTA */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full crm-btn-primary !h-11 !text-sm"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Order Note */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Orders route directly to organization suppliers for verified fulfillment and GST-compliant invoicing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
