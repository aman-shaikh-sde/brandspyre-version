import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  FileSpreadsheet,
  Heart,
  User,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { EcommerceOrder, QuotationEnquiry, Product } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CrmBadge } from '../components/common/CrmBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ProductImage } from '../components/common/ProductImage';
import { marketplaceService } from '../services/marketplaceService';

export const BuyerDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  const { buyer, isAuthenticated, updateProfile, setIsAuthModalOpen } = useAuth();
  const { addToCart } = useCart();
  const { wishlistProducts, toggleWishlist } = useWishlist();

  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [quotations, setQuotations] = useState<QuotationEnquiry[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState(buyer?.name || '');
  const [profilePhone, setProfilePhone] = useState(buyer?.phone || '');
  const [profileCompany, setProfileCompany] = useState(buyer?.company_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Fetch orders and quotations
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await marketplaceService.getMyOrders();
          setOrders(data);
        } catch (e) {
          console.error('Failed to load buyer orders:', e);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    } else if (activeTab === 'quotations') {
      const fetchQuotes = async () => {
        setLoadingQuotes(true);
        try {
          const data = await marketplaceService.getMyQuotations();
          setQuotations(data);
        } catch (e) {
          console.error('Failed to load buyer quotations:', e);
        } finally {
          setLoadingQuotes(false);
        }
      };
      fetchQuotes();
    }
  }, [isAuthenticated, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await updateProfile({
        name: profileName,
        phone: profilePhone,
        company_name: profileCompany
      });
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleTabChange = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to Your Buyer Account</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Access your purchase order tracking, wholesale RFQ responses, saved wishlist items, and billing details.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="crm-btn-primary inline-flex !h-10 text-xs mx-auto"
        >
          <span>Sign In / Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header matching Brandspyre CRM standards */}
      <PageHeader
        title="Buyer Account & Procurement Portal"
        description={`Welcome back, ${buyer?.name} (${buyer?.email})`}
        breadcrumbs={[
          { label: 'Marketplace', path: '/' },
          { label: 'Buyer Portal' }
        ]}
      />

      {/* 2. Conventional Account Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px text-xs font-semibold">
        <button
          onClick={() => handleTabChange('orders')}
          className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-red-700 text-red-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('quotations')}
          className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'quotations'
              ? 'border-red-700 text-red-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quotations & RFQs ({quotations.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('wishlist')}
          className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'wishlist'
              ? 'border-red-700 text-red-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Wishlist ({wishlistProducts.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`px-3.5 py-2.5 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-red-700 text-red-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {/* A. MY ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No Orders Placed Yet"
              description="You have not placed any commercial orders on the marketplace. Discover verified products in our catalog."
              actionText="Explore Catalog"
              onAction={() => (window.location.href = '/catalog')}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">#{ord.order_number}</span>
                        <CrmBadge label={ord.payment_status} />
                        <CrmBadge label={ord.status} />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Placed on {new Date(ord.created_at).toLocaleDateString()} • Payment via {ord.payment_method}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block leading-tight">
                          ₹{ord.grand_total.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">{ord.items.length} items</span>
                      </div>
                      <Link
                        to={`/order/${ord.order_number}`}
                        className="crm-btn-secondary !h-8 !px-3 !text-xs shrink-0"
                      >
                        <span>Details & Receipt</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Line Items Preview */}
                  <div className="p-4 sm:p-5 divide-y divide-slate-100">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                        <div className="truncate flex-1">
                          <span className="font-semibold text-slate-900 block truncate">{it.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Qty: {it.quantity} × ₹{it.unit_price.toLocaleString()}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          ₹{it.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* B. MY QUOTATIONS (RFQS) TAB */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {loadingQuotes ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : quotations.length === 0 ? (
            <EmptyState
              title="No Quotations Requested"
              description="You have not requested any bulk wholesale purchase quotations yet. Request custom pricing on any product page."
              actionText="Browse Catalog"
              onAction={() => (window.location.href = '/catalog')}
            />
          ) : (
            <div className="space-y-4">
              {quotations.map((q) => (
                <div
                  key={q._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">RFQ #{q.enquiry_number}</span>
                        <CrmBadge label={q.status} />
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Submitted on {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600 block">
                        Requested Volume: <span className="font-bold text-slate-900">{q.requested_quantity} units</span>
                      </span>
                      {q.target_unit_price && (
                        <span className="text-[11px] text-slate-400">
                          Target Unit Price: ₹{q.target_unit_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{q.product_name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Catalog Price: ₹{q.catalog_price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Seller Quote Response if available */}
                  {q.seller_quote && q.seller_quote.quoted_unit_price && (
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-blue-900">
                        <span>Supplier Quoted Price: ₹{q.seller_quote.quoted_unit_price.toLocaleString()} / unit</span>
                        <span>Total: ₹{(q.seller_quote.quoted_total || q.seller_quote.quoted_unit_price * q.requested_quantity).toLocaleString()}</span>
                      </div>
                      {q.seller_quote.seller_notes && (
                        <p className="text-blue-800 text-[11px] pt-1">
                          Vendor Notes: {q.seller_quote.seller_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {q.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      Inquiry Specifications: {q.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* C. SAVED WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <EmptyState
              title="Your Wishlist is Empty"
              description="Save items you are interested in procuring for fast access and bulk reordering."
              actionText="Explore Products"
              onAction={() => (window.location.href = '/catalog')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlistProducts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="w-full aspect-[4/3] rounded-lg border border-slate-100 overflow-hidden bg-slate-50">
                      <ProductImage
                        src={p.image_url || p.images?.[0]}
                        alt={p.name}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain p-2"
                      />
                    </div>
                    <Link
                      to={`/product/${p._id}`}
                      className="text-xs font-bold text-slate-900 hover:text-red-700 line-clamp-2 transition-colors block"
                    >
                      {p.name}
                    </Link>
                    <span className="text-sm font-extrabold text-slate-900 block">
                      ₹{p.selling_price.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => addToCart(p, 1)}
                      className="crm-btn-primary !h-8 !px-2 !text-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(p)}
                      className="crm-btn-secondary !h-8 !px-2 !text-xs text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* D. ACCOUNT SETTINGS TAB */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Organization Buyer Profile
          </h3>

          {profileMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="crm-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={buyer?.email || ''}
                className="crm-input bg-slate-50 cursor-not-allowed opacity-75"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Primary login email cannot be changed.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="crm-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Enterprise Name</label>
              <input
                type="text"
                value={profileCompany}
                onChange={(e) => setProfileCompany(e.target.value)}
                placeholder="e.g. Acme Tech Corporation"
                className="crm-input"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="crm-btn-primary !h-10 !px-5 !text-xs"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboardPage;
