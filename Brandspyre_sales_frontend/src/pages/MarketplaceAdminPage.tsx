import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Layers,
  Package,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  X,
  ExternalLink,
  Building2,
  Lock
} from 'lucide-react';
import {
  MarketplaceListing,
  MarketplaceSellerProfile,
  EcommerceOrder,
  MarketplaceAdminStats
} from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CrmBadge } from '../components/common/CrmBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { marketplaceService } from '../services/marketplaceService';
import { useAuth } from '../context/AuthContext';

export const MarketplaceAdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { buyer, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<MarketplaceAdminStats>({
    total_sellers: 0,
    verified_sellers: 0,
    total_listings: 0,
    pending_listings: 0,
    published_listings: 0,
    total_orders: 0,
    total_gmv: 0
  });

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [sellers, setSellers] = useState<MarketplaceSellerProfile[]>([]);
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Moderation filter
  const [modFilter, setModFilter] = useState<'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ALL'>('PENDING_APPROVAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal
  const [rejectModal, setRejectModal] = useState<{ isVisible: boolean; listingId: string | null }>({
    isVisible: false,
    listingId: null
  });
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, listData, sellerData, orderData] = await Promise.all([
        marketplaceService.getAdminStats().catch(() => ({
          total_sellers: 0,
          verified_sellers: 0,
          total_listings: 0,
          pending_listings: 0,
          published_listings: 0,
          total_orders: 0,
          total_gmv: 0
        })),
        marketplaceService.getAdminListings(modFilter !== 'ALL' ? modFilter : undefined).catch(() => []),
        marketplaceService.getAdminSellers().catch(() => []),
        marketplaceService.getAdminOrders().catch(() => [])
      ]);

      setStats(statsData);
      setListings(listData || []);
      setSellers(sellerData || []);
      setOrders(orderData || []);
    } catch (err) {
      console.error('Failed to load marketplace admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab, modFilter]);

  const handleApprove = async (id: string) => {
    try {
      await marketplaceService.moderateListing(id, 'APPROVE');
      setListings((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: 'PUBLISHED', is_published: true } : l))
      );
      setStats((prev) => ({
        ...prev,
        pending_listings: Math.max(0, prev.pending_listings - 1),
        published_listings: prev.published_listings + 1
      }));
      alert('Listing approved and published to storefront.');
    } catch (err: any) {
      alert(err.message || 'Failed to approve listing');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal.listingId || !rejectReason.trim()) return;

    setSubmittingReject(true);
    try {
      await marketplaceService.moderateListing(rejectModal.listingId, 'REJECT', rejectReason.trim());
      setListings((prev) =>
        prev.map((l) =>
          l._id === rejectModal.listingId
            ? { ...l, status: 'REJECTED', is_published: false, rejection_reason: rejectReason.trim() }
            : l
        )
      );
      setRejectModal({ isVisible: false, listingId: null });
      setRejectReason('');
      alert('Listing rejected with feedback recorded.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject listing');
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* 1. COMPACT ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-700" />
            <span>Marketplace Platform Administration</span>
          </h1>
          <p className="text-xs text-slate-500">
            Moderate catalog listings, monitor seller compliance, and inspect transaction volumes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="crm-btn-secondary !h-8 !px-3 !text-xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Admin Real Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pending Review</span>
              <span className="text-xl font-bold text-slate-900 block">{stats.pending_listings}</span>
              <span className="text-[11px] text-slate-400">Listings awaiting approval</span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Published Listings</span>
              <span className="text-xl font-bold text-slate-900 block">{stats.published_listings}</span>
              <span className="text-[11px] text-slate-400">Active on storefront</span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Registered Sellers</span>
              <span className="text-xl font-bold text-slate-900 block">{stats.total_sellers}</span>
              <span className="text-[11px] text-slate-400">{stats.verified_sellers} verified</span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Gross Merchandise Value</span>
              <span className="text-xl font-bold text-slate-900 block">₹{stats.total_gmv.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">{stats.total_orders} commercial orders</span>
            </div>
          </div>

          {/* Pending Moderation Queue Callout */}
          {stats.pending_listings > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <span className="font-bold">{stats.pending_listings} listing(s)</span> are currently waiting for admin moderation review.
                </span>
              </div>
              <Link
                to="/admin?tab=moderation"
                className="crm-btn-primary !h-7 !px-3 !text-[11px] !bg-amber-700 hover:!bg-amber-800 shrink-0"
              >
                Review Listings
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 3. MODERATION QUEUE TAB */}
      {activeTab === 'moderation' && (
        <div className="space-y-3.5">
          {/* Controls: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              {(['PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setModFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    modFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search moderation queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md outline-none focus:border-red-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Moderation Table */}
          {filteredListings.length === 0 ? (
            <EmptyState
              title="No Listings in this Queue"
              description="All submitted seller listings have been reviewed, or none match the selected filter."
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Listing Details</th>
                    <th>Price</th>
                    <th>MOQ</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <span className="font-semibold text-slate-900 block">{l.title}</span>
                        {l.description && (
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{l.description}</span>
                        )}
                        {l.rejection_reason && (
                          <span className="text-[11px] text-rose-600 block">Feedback: {l.rejection_reason}</span>
                        )}
                      </td>
                      <td className="font-bold text-slate-900">₹{l.listing_price.toLocaleString()}</td>
                      <td>{l.min_order_quantity}</td>
                      <td><CrmBadge label={l.status} /></td>
                      <td className="text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {l.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => handleApprove(l._id)}
                              className="crm-btn-primary !h-7 !px-2.5 !text-[11px] !bg-emerald-600 hover:!bg-emerald-700"
                              title="Approve Listing"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}
                          {l.status !== 'REJECTED' && (
                            <button
                              onClick={() => setRejectModal({ isVisible: true, listingId: l._id })}
                              className="crm-btn-secondary !h-7 !px-2.5 !text-[11px] text-rose-600 hover:bg-rose-50"
                              title="Reject with feedback"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. REGISTERED SELLERS TAB */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          {sellers.length === 0 ? (
            <EmptyState
              title="No Registered Sellers Found"
              description="Organizations onboarded onto the marketplace will appear here."
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>GSTIN</th>
                    <th>Contact Email</th>
                    <th>Contact Phone</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Onboarded</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((s) => (
                    <tr key={s._id}>
                      <td className="font-semibold text-slate-900">{s.store_name}</td>
                      <td className="font-mono text-xs">{s.gstin || 'Registered'}</td>
                      <td className="text-slate-600 text-xs">{s.business_email || '—'}</td>
                      <td className="text-slate-600 text-xs">{s.business_phone || '—'}</td>
                      <td>
                        <CrmBadge label={s.is_verified ? 'VERIFIED' : 'PENDING'} />
                      </td>
                      <td>
                        <CrmBadge label={s.status} />
                      </td>
                      <td className="text-slate-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. ALL ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              title="No Marketplace Orders Found"
              description="Commercial orders across all sellers will appear here."
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Buyer</th>
                    <th>Payment</th>
                    <th>Subtotal</th>
                    <th>Grand Total</th>
                    <th>Order Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id}>
                      <td className="font-mono font-bold text-slate-900">{ord.order_number}</td>
                      <td>{ord.buyer_name}</td>
                      <td className="text-xs">{ord.payment_method}</td>
                      <td>₹{ord.subtotal.toLocaleString()}</td>
                      <td className="font-bold text-slate-900">₹{ord.grand_total.toLocaleString()}</td>
                      <td><CrmBadge label={ord.status} /></td>
                      <td className="text-slate-500 text-xs">{new Date(ord.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal.isVisible && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Reject Listing
              </h3>
              <button onClick={() => setRejectModal({ isVisible: false, listingId: null })} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rejection Reason / Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason (e.g. Missing technical specs, inaccurate pricing, incorrect department tag)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="crm-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isVisible: false, listingId: null })}
                  className="crm-btn-secondary !h-8 !px-3 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="crm-btn-danger !h-8 !px-4 !text-xs"
                >
                  {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceAdminPage;
