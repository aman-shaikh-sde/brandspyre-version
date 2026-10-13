import React, { useEffect, useState } from 'react';
import { apiClient } from 'src/services/apiClient';
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import ConfirmDialog from 'src/component/ui/ConfirmDialog';
import { notify } from '~/services/notificationService';
import {
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  Plus,
  ExternalLink,
  CheckCircle,
  Truck,
  Eye,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
  FileSpreadsheet,
  Building2,
  Trash2
} from 'lucide-react';

export default function SellerMarketplaceWorkspace() {
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'quotations' | 'profile'>('listings');
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Listing Modal state
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newListingForm, setNewListingForm] = useState({
    product_id: '',
    title: '',
    description: '',
    listing_price: '',
    compare_price: '',
    min_order_quantity: '1',
    tags: ''
  });
  const [creatingListing, setCreatingListing] = useState(false);

  // Quotation Response Modal
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quoteResponsePrice, setQuoteResponsePrice] = useState('');
  const [quoteResponseNotes, setQuoteResponseNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Confirm Dialog state
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
    variant: 'danger'
  });

  useEffect(() => {
    fetchProfile();
    fetchTabContent();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/marketplace/seller/profile');
      if (res.data?.success) setProfile(res.data.data);
    } catch (err) {
      console.error('Error fetching seller profile:', err);
    }
  };

  const fetchTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const [lRes, pRes] = await Promise.all([
          apiClient.get('/marketplace/seller/listings'),
          apiClient.get('/products?limit=100')
        ]);
        if (lRes.data?.success) setListings(lRes.data.data);
        if (pRes.data?.success) setProducts(pRes.data.items || pRes.data.data || []);
      } else if (activeTab === 'orders') {
        const res = await apiClient.get('/marketplace/seller/orders');
        if (res.data?.success) setOrders(res.data.data);
      } else if (activeTab === 'quotations') {
        const res = await apiClient.get('/marketplace/seller/quotations');
        if (res.data?.success) setQuotations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingListing(true);
    try {
      const payload = {
        product_id: newListingForm.product_id,
        title: newListingForm.title,
        description: newListingForm.description,
        listing_price: Number(newListingForm.listing_price),
        compare_price: newListingForm.compare_price ? Number(newListingForm.compare_price) : undefined,
        min_order_quantity: Number(newListingForm.min_order_quantity) || 1,
        tags: newListingForm.tags.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await apiClient.post('/marketplace/seller/listings', payload);
      if (res.data?.success) {
        notify.success('Listing published on marketplace successfully!');
        setShowAddListingModal(false);
        setNewListingForm({
          product_id: '',
          title: '',
          description: '',
          listing_price: '',
          compare_price: '',
          min_order_quantity: '1',
          tags: ''
        });
        fetchTabContent();
      }
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setCreatingListing(false);
    }
  };

  const handleTogglePublish = async (listingId: string, currentVal: boolean) => {
    try {
      await apiClient.put(`/marketplace/seller/listings/${listingId}`, {
        is_published: !currentVal
      });
      notify.success(`Listing ${!currentVal ? 'published' : 'hidden'} on storefront.`);
      fetchTabContent();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to update listing visibility');
    }
  };

  const handleFulfillOrder = (orderNumber: string, status: string) => {
    setConfirmState({
      isVisible: true,
      title: `Update Order Fulfillment`,
      description: `Are you sure you want to transition order ${orderNumber} to ${status}? This will update buyer tracking.`,
      variant: status === 'DELIVERED' ? 'success' : 'info',
      onConfirm: async () => {
        try {
          await apiClient.post(`/marketplace/seller/orders/${orderNumber}/fulfill`, { status });
          notify.success(`Order ${orderNumber} updated to ${status}.`);
          fetchTabContent();
        } catch (err: any) {
          notify.error(err.response?.data?.error || 'Failed to update fulfillment status');
        } finally {
          setConfirmState(prev => ({ ...prev, isVisible: false }));
        }
      }
    });
  };

  const handleDeleteListing = (listingId: string, title: string) => {
    setConfirmState({
      isVisible: true,
      title: 'Remove Marketplace Listing',
      description: `Are you sure you want to permanently remove "${title}" from the public marketplace?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/marketplace/seller/listings/${listingId}`);
          notify.success('Listing removed successfully.');
          fetchTabContent();
        } catch (err: any) {
          notify.error(err.response?.data?.error || 'Failed to remove listing');
        } finally {
          setConfirmState(prev => ({ ...prev, isVisible: false }));
        }
      }
    });
  };

  const handleRespondQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    setSubmittingQuote(true);
    try {
      await apiClient.post(`/marketplace/seller/quotations/${selectedQuote._id}/respond`, {
        quoted_unit_price: Number(quoteResponsePrice),
        seller_notes: quoteResponseNotes
      });
      notify.success('Official quotation sent to buyer successfully!');
      setSelectedQuote(null);
      fetchTabContent();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to send quote response');
    } finally {
      setSubmittingQuote(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Brandspyre ERP PageHeader */}
      <PageHeader
        title="Marketplace Seller Workspace"
        description="Publish your catalog items to sales.brandspyre.in, receive commercial purchase orders, and reply to wholesale RFQs."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Marketplace Seller' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="https://sales.brandspyre.in"
              target="_blank"
              rel="noopener noreferrer"
              className="crm-btn-secondary"
            >
              <ExternalLink className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>View Storefront</span>
            </a>
            {activeTab === 'listings' && (
              <button
                onClick={() => {
                  if (products.length === 0) fetchTabContent();
                  setShowAddListingModal(true);
                }}
                className="crm-btn-primary"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>New Marketplace Listing</span>
              </button>
            )}
          </div>
        }
      />

      {/* Seller Store Banner Overview */}
      {profile && (
        <div className="crm-card p-5 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 font-bold text-lg flex items-center justify-center border border-red-200 shrink-0">
              {profile.store_name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{profile.store_name}</h2>
                <span className="crm-badge-green text-[10px]">Verified Seller</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Slug: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">{profile.slug}</code> • Contact: {profile.contact_email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm divide-x divide-slate-100 pl-2">
            <div className="text-center px-3">
              <span className="block text-xl font-bold text-slate-900">{listings.length}</span>
              <span className="text-xs text-slate-500">Listings</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-xl font-bold text-emerald-600">{orders.length}</span>
              <span className="text-xs text-slate-500">Orders</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-xl font-bold text-amber-600">{quotations.length}</span>
              <span className="text-xs text-slate-500">RFQs</span>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'listings', label: `Catalog Listings (${listings.length})`, icon: Package },
          { id: 'orders', label: `Marketplace Orders (${orders.length})`, icon: ShoppingCart },
          { id: 'quotations', label: `Purchase Quotes / RFQs (${quotations.length})`, icon: MessageSquare },
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

      {/* Tab 1: Listings */}
      {activeTab === 'listings' && (
        <div className="crm-table-container">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No marketplace listings yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto mb-4">
                Promote your existing products to the public Brandspyre sales network and get ecommerce orders.
              </p>
              <button
                onClick={() => {
                  if (products.length === 0) fetchTabContent();
                  setShowAddListingModal(true);
                }}
                className="crm-btn-primary mx-auto"
              >
                <Plus size={15} className="mr-1.5" />
                <span>Add First Listing</span>
              </button>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Listing Title</th>
                  <th>ERP Master Product</th>
                  <th>Listing Price</th>
                  <th>Moderation Status</th>
                  <th>Public Visibility</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div className="font-semibold text-slate-900">{l.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{l.slug}</div>
                    </td>
                    <td>
                      <div className="text-slate-800 font-medium">{l.product_id?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: {l.product_id?.sku || 'N/A'}</div>
                    </td>
                    <td className="font-semibold text-slate-900">
                      ₹{l.listing_price?.toLocaleString()}
                      {l.compare_price && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          ₹{l.compare_price.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td>
                      <CrmBadge
                        label={l.status === 'PUBLISHED' ? 'Published' : l.status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Rejected'}
                        variant={l.status === 'PUBLISHED' ? 'green' : l.status === 'PENDING_APPROVAL' ? 'amber' : 'red'}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(l._id, l.is_published)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                          l.is_published
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {l.is_published ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteListing(l._id, l.title)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="crm-table-container">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading marketplace orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No marketplace orders received yet</h3>
              <p className="text-xs text-slate-500 mt-1">Orders placed on sales.brandspyre.in will route directly here.</p>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Buyer Contact</th>
                  <th>Items Sold</th>
                  <th>Your Subtotal</th>
                  <th>Status</th>
                  <th className="text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <div className="font-mono font-bold text-slate-900">{o.order_number}</div>
                      <div className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{o.buyer_name}</div>
                      <div className="text-xs text-slate-500">{o.buyer_email} • {o.buyer_phone}</div>
                    </td>
                    <td>
                      <div className="text-xs space-y-1">
                        {(o.items || []).map((it: any, idx: number) => (
                          <div key={idx} className="text-slate-700">
                            <span className="font-semibold text-slate-900">{it.name}</span> × {it.quantity} (₹{it.unit_price})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="font-bold text-slate-900">
                      ₹{(o.seller_order_summary?.subtotal || 0).toLocaleString()}
                    </td>
                    <td>
                      <CrmBadge
                        label={o.seller_order_summary?.status || o.status}
                        variant={
                          (o.seller_order_summary?.status || o.status) === 'DELIVERED'
                            ? 'green'
                            : (o.seller_order_summary?.status || o.status) === 'SHIPPED'
                            ? 'purple'
                            : 'blue'
                        }
                      />
                    </td>
                    <td className="text-right space-x-2">
                      {o.seller_order_summary?.status !== 'DELIVERED' && (
                        <>
                          <button
                            onClick={() => handleFulfillOrder(o.order_number, 'SHIPPED')}
                            className="crm-btn-secondary text-xs h-8 px-2.5"
                          >
                            Mark Shipped
                          </button>
                          <button
                            onClick={() => handleFulfillOrder(o.order_number, 'DELIVERED')}
                            className="crm-btn-primary text-xs h-8 px-2.5"
                          >
                            Mark Delivered
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Purchase Quotations / RFQs */}
      {activeTab === 'quotations' && (
        <div className="crm-table-container">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No quotation requests yet</h3>
              <p className="text-xs text-slate-500 mt-1">Wholesale and commercial inquiries will appear here.</p>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>RFQ Enquiry #</th>
                  <th>Product & Requested Qty</th>
                  <th>Buyer Contact</th>
                  <th>Target Price</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q._id}>
                    <td className="font-mono font-bold text-slate-900">{q.enquiry_number}</td>
                    <td>
                      <div className="font-semibold text-slate-900">{q.product_name}</div>
                      <div className="text-xs text-slate-500">Volume: {q.requested_quantity} units</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{q.buyer_name}</div>
                      <div className="text-xs text-slate-500">{q.buyer_email} • {q.buyer_phone}</div>
                    </td>
                    <td className="font-semibold text-slate-900">
                      ₹{q.target_unit_price ? q.target_unit_price.toLocaleString() : q.catalog_price.toLocaleString()}
                    </td>
                    <td>
                      <CrmBadge
                        label={q.status === 'QUOTED' ? 'Quoted' : q.status === 'SUBMITTED' ? 'New Request' : q.status}
                        variant={q.status === 'QUOTED' ? 'green' : 'amber'}
                      />
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          setSelectedQuote(q);
                          setQuoteResponsePrice(String(q.target_unit_price || q.catalog_price));
                          setQuoteResponseNotes('');
                        }}
                        className="crm-btn-primary text-xs h-8 px-3"
                      >
                        Respond Quote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* New Listing Modal */}
      {showAddListingModal && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowAddListingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              Publish Product to Marketplace
            </h3>
            <p className="text-xs text-slate-500 mb-4">Select an item from your ERP catalog to list on sales.brandspyre.in</p>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Select ERP Product *</label>
                  <a
                    href="/products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                  >
                    Catalog ({products.length} items) &rarr;
                  </a>
                </div>
                {products.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      No products found in your ERP catalog.
                    </div>
                    <p className="text-amber-700">
                      Marketplace listings link to your ERP catalog for inventory tracking. Please add at least one product in Products & Catalog first.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={newListingForm.product_id}
                    onChange={e => {
                      const selected = products.find(p => p._id === e.target.value);
                      setNewListingForm({
                        ...newListingForm,
                        product_id: e.target.value,
                        title: selected?.name || newListingForm.title,
                        description: selected?.description || newListingForm.description,
                        listing_price: selected ? String(selected.selling_price) : newListingForm.listing_price
                      });
                    }}
                    className="crm-input"
                  >
                    <option value="">-- Choose from your catalog ({products.length} available) --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku}) — ₹{p.selling_price}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Public Listing Title *</label>
                <input
                  type="text"
                  required
                  value={newListingForm.title}
                  onChange={e => setNewListingForm({ ...newListingForm, title: e.target.value })}
                  className="crm-input"
                  placeholder="e.g. Industrial Grade High Pressure Gauge"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newListingForm.listing_price}
                    onChange={e => setNewListingForm({ ...newListingForm, listing_price: e.target.value })}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compare/MRP Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newListingForm.compare_price}
                    onChange={e => setNewListingForm({ ...newListingForm, compare_price: e.target.value })}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Public Description</label>
                <textarea
                  rows={3}
                  value={newListingForm.description}
                  onChange={e => setNewListingForm({ ...newListingForm, description: e.target.value })}
                  className="crm-input h-auto py-2 resize-none"
                  placeholder="Highlight key product specifications..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newListingForm.tags}
                  onChange={e => setNewListingForm({ ...newListingForm, tags: e.target.value })}
                  className="crm-input"
                  placeholder="hardware, tools, industrial"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddListingModal(false)}
                  className="crm-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingListing}
                  className="crm-btn-primary"
                >
                  {creatingListing ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Response Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setSelectedQuote(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Respond to Wholesale RFQ</h3>
            <p className="text-xs text-slate-500 mb-4">
              Responding for <span className="font-semibold text-slate-700">{selectedQuote.product_name}</span> (Qty: {selectedQuote.requested_quantity} units)
            </p>
            <form onSubmit={handleRespondQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Quoted Unit Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quoteResponsePrice}
                  onChange={e => setQuoteResponsePrice(e.target.value)}
                  className="crm-input font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={3}
                  value={quoteResponseNotes}
                  onChange={e => setQuoteResponseNotes(e.target.value)}
                  className="crm-input h-auto py-2 resize-none"
                  placeholder="Includes delivery within 5 business days..."
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="crm-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="crm-btn-primary"
                >
                  {submittingQuote ? 'Sending...' : 'Send Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Confirmation Dialog */}
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
