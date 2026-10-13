import React, { useEffect, useState } from 'react';
import { apiClient } from 'src/services/apiClient';
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import ConfirmDialog from 'src/component/ui/ConfirmDialog';
import { notify } from '~/services/notificationService';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Store,
  DollarSign,
  ShoppingCart,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';

export default function PlatformMarketplaceManagement() {
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'sellers'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalOrders: 0, totalListings: 0, activeSellers: 0, grossMerchandiseVolume: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Rejection reason modal
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    isVisible: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isVisible: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'info'
  });

  useEffect(() => {
    fetchStats();
    fetchTabData();
  }, [activeTab, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/marketplace/admin/stats');
      if (res.data?.success) setStats(res.data.data);
    } catch (e) {}
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const res = await apiClient.get('/marketplace/admin/listings', {
          params: { status: statusFilter }
        });
        if (res.data?.success) setListings(res.data.data);
      } else if (activeTab === 'orders') {
        const res = await apiClient.get('/marketplace/admin/orders');
        if (res.data?.success) setOrders(res.data.data);
      } else if (activeTab === 'sellers') {
        const res = await apiClient.get('/marketplace/admin/sellers');
        if (res.data?.success) setSellers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (listingId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    if (action === 'REJECT') {
      setRejectingListingId(listingId);
      setRejectionReason('Does not meet marketplace listing quality criteria.');
      return;
    }

    const actionText = action === 'APPROVE' ? 'approve and publish' : 'suspend';
    setConfirmState({
      isVisible: true,
      title: `${action === 'APPROVE' ? 'Approve' : 'Suspend'} Marketplace Listing`,
      description: `Are you sure you want to ${actionText} this listing on sales.brandspyre.in?`,
      variant: action === 'APPROVE' ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          await apiClient.post(`/marketplace/admin/listings/${listingId}/moderate`, { action });
          notify.success(`Listing status updated to ${action}.`);
          fetchTabData();
          fetchStats();
        } catch (err: any) {
          notify.error(err.response?.data?.error || 'Failed to moderate listing');
        } finally {
          setConfirmState(prev => ({ ...prev, isVisible: false }));
        }
      }
    });
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingListingId) return;
    setIsSubmittingRejection(true);
    try {
      await apiClient.post(`/marketplace/admin/listings/${rejectingListingId}/moderate`, {
        action: 'REJECT',
        rejection_reason: rejectionReason
      });
      notify.success('Listing rejected with feedback sent to seller.');
      setRejectingListingId(null);
      setRejectionReason('');
      fetchTabData();
      fetchStats();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to reject listing');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Brandspyre ERP PageHeader */}
      <PageHeader
        title="Marketplace Platform Administration"
        description="Supervise public listings, verify seller compliance, and inspect global orders for sales.brandspyre.in"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Administration' },
          { label: 'Marketplace Oversight' }
        ]}
      />

      {/* Standardized Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales (GMV)</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{Number(stats.grossMerchandiseVolume || 0).toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="crm-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="crm-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Listings</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalListings}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="crm-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sellers</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.activeSellers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Store className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'listings', label: 'Listings Moderation', icon: Package },
          { id: 'orders', label: 'Global Orders', icon: ShoppingCart },
          { id: 'sellers', label: 'Sellers Network', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-red-50 text-red-700 border border-red-200/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Listings Moderation */}
      {activeTab === 'listings' && (
        <div className="crm-table-container">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 uppercase">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="crm-input h-8 py-1 text-xs w-auto bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="PUBLISHED">Published</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No listings found matching the selected filter.</div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Listing Title</th>
                  <th>Seller Organization</th>
                  <th>Price</th>
                  <th>Current Status</th>
                  <th className="text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div className="font-semibold text-slate-900">{l.title}</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: {l.product_id?.sku || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{l.tenant_id?.company_name || l.tenant_id?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{l.tenant_id?.billing_email || ''}</div>
                    </td>
                    <td className="font-semibold text-slate-900">₹{l.listing_price?.toLocaleString()}</td>
                    <td>
                      <CrmBadge
                        label={l.status === 'PUBLISHED' ? 'Published' : l.status === 'PENDING_APPROVAL' ? 'Pending Approval' : l.status === 'SUSPENDED' ? 'Suspended' : 'Rejected'}
                        variant={l.status === 'PUBLISHED' ? 'green' : l.status === 'PENDING_APPROVAL' ? 'amber' : 'red'}
                      />
                    </td>
                    <td className="text-right space-x-1.5">
                      {l.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handleModerate(l._id, 'APPROVE')}
                          className="crm-btn-primary text-xs h-7 px-2.5 inline-flex"
                        >
                          Approve
                        </button>
                      )}
                      {l.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleModerate(l._id, 'REJECT')}
                          className="crm-btn-danger text-xs h-7 px-2.5 inline-flex"
                        >
                          Reject
                        </button>
                      )}
                      {l.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleModerate(l._id, 'SUSPEND')}
                          className="crm-btn-secondary text-xs h-7 px-2.5 inline-flex"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Global Orders */}
      {activeTab === 'orders' && (
        <div className="crm-table-container">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No marketplace orders recorded yet.</div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Buyer Contact</th>
                  <th>Grand Total</th>
                  <th>Payment Method</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="font-mono font-bold text-slate-900">{o.order_number}</td>
                    <td>
                      <div className="font-medium text-slate-900">{o.buyer_name}</div>
                      <div className="text-xs text-slate-500">{o.buyer_email}</div>
                    </td>
                    <td className="font-bold text-slate-900">₹{o.grand_total?.toLocaleString()}</td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {o.payment_method} ({o.payment_status})
                      </span>
                    </td>
                    <td>
                      <CrmBadge
                        label={o.status}
                        variant={o.status === 'DELIVERED' ? 'green' : o.status === 'SHIPPED' ? 'purple' : 'blue'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sellers Network */}
      {activeTab === 'sellers' && (
        <div className="crm-table-container">
          {sellers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No registered sellers found.</div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Organization</th>
                  <th>Slug Identifier</th>
                  <th>Contact Email</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map(s => (
                  <tr key={s._id}>
                    <td className="font-semibold text-slate-900">{s.store_name}</td>
                    <td>{s.tenant_id?.company_name || s.tenant_id?.name || 'N/A'}</td>
                    <td className="font-mono text-xs text-slate-500">{s.slug}</td>
                    <td className="text-slate-600">{s.contact_email}</td>
                    <td>
                      <CrmBadge label="Verified Seller" variant="green" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingListingId && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setRejectingListingId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reject Marketplace Listing</h3>
            <p className="text-xs text-slate-500 mb-4">Provide a constructive reason for rejection to assist the seller in correcting their listing.</p>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Feedback *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="crm-input h-auto py-2 resize-none"
                  placeholder="Explain why the listing cannot be approved..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingListingId(null)}
                  className="crm-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRejection}
                  className="crm-btn-danger"
                >
                  {isSubmittingRejection ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isVisible={confirmState.isVisible}
        onClose={() => setConfirmState(prev => ({ ...prev, isVisible: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
      />
    </div>
  );
}
