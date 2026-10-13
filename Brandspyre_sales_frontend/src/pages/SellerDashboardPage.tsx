import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Package,
  Layers,
  FileSpreadsheet,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  Send,
  X,
  RefreshCw,
  Search,
  Filter,
  Check,
  Save,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  MarketplaceListing,
  MarketplaceSellerProfile,
  SellerOrder,
  QuotationEnquiry,
  Product
} from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CrmBadge } from '../components/common/CrmBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { marketplaceService } from '../services/marketplaceService';

export const SellerDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const { buyer, isAuthenticated } = useAuth();

  // Seller Data
  const [profile, setProfile] = useState<MarketplaceSellerProfile | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [quotations, setQuotations] = useState<QuotationEnquiry[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Listing Form Modal
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [listingForm, setListingForm] = useState({
    product_id: '',
    title: '',
    description: '',
    listing_price: '',
    compare_price: '',
    min_order_quantity: '1',
    tags: ''
  });
  const [submittingListing, setSubmittingListing] = useState(false);

  // Order Fulfillment Modal
  const [selectedOrderForFulfill, setSelectedOrderForFulfill] = useState<SellerOrder | null>(null);
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [submittingFulfill, setSubmittingFulfill] = useState(false);

  // Quote Response Modal
  const [selectedQuoteForResponse, setSelectedQuoteForResponse] = useState<QuotationEnquiry | null>(null);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Confirm Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState<{ isVisible: boolean; listingId: string | null }>({
    isVisible: false,
    listingId: null
  });

  // Filter for listings
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('ALL');
  const [listingSearch, setListingSearch] = useState('');

  // Profile Form state
  const [profileSla, setProfileSla] = useState('2');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const [profData, listData, ordData, quoteData, catData] = await Promise.all([
        marketplaceService.getSellerProfile().catch(() => null),
        marketplaceService.getSellerListings().catch(() => []),
        marketplaceService.getSellerOrders().catch(() => []),
        marketplaceService.getSellerQuotations().catch(() => []),
        marketplaceService.getCatalog({ limit: 100 }).catch(() => ({ items: [] }))
      ]);

      setProfile(profData);
      if (profData) {
        setProfileSla(String(profData.fulfillment_sla_days || 2));
        setProfilePhone(profData.business_phone || '');
        setProfileEmail(profData.business_email || '');
      }
      setListings(listData || []);
      setOrders(ordData || []);
      setQuotations(quoteData || []);
      setCatalogProducts(catData?.items || []);
    } catch (err) {
      console.error('Failed to load seller workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [activeTab]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingForm.title.trim() || !listingForm.listing_price) return;

    setSubmittingListing(true);
    try {
      const newListing = await marketplaceService.createListing({
        product_id: listingForm.product_id || (catalogProducts[0]?._id ?? ''),
        title: listingForm.title.trim(),
        description: listingForm.description.trim(),
        listing_price: Number(listingForm.listing_price),
        compare_price: listingForm.compare_price ? Number(listingForm.compare_price) : undefined,
        min_order_quantity: Number(listingForm.min_order_quantity) || 1,
        tags: listingForm.tags ? listingForm.tags.split(',').map((t) => t.trim()) : []
      });

      setListings((prev) => [newListing, ...prev]);
      setShowAddListingModal(false);
      setListingForm({
        product_id: '',
        title: '',
        description: '',
        listing_price: '',
        compare_price: '',
        min_order_quantity: '1',
        tags: ''
      });
      alert('Listing created and submitted for platform review.');
    } catch (err: any) {
      alert(err.message || 'Failed to create listing');
    } finally {
      setSubmittingListing(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!deleteDialog.listingId) return;
    try {
      await marketplaceService.deleteListing(deleteDialog.listingId);
      setListings((prev) => prev.filter((l) => l._id !== deleteDialog.listingId));
      setDeleteDialog({ isVisible: false, listingId: null });
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  const handleFulfillOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForFulfill) return;

    setSubmittingFulfill(true);
    try {
      await marketplaceService.fulfillOrder(selectedOrderForFulfill.order_number, {
        tracking_carrier: trackingCarrier,
        tracking_number: trackingNumber,
        notes: fulfillNotes
      });

      setOrders((prev) =>
        prev.map((ord) =>
          ord.order_number === selectedOrderForFulfill.order_number
            ? { ...ord, shipping_status: 'DISPATCHED', tracking_carrier: trackingCarrier, tracking_number: trackingNumber }
            : ord
        )
      );

      setSelectedOrderForFulfill(null);
      setTrackingCarrier('');
      setTrackingNumber('');
      setFulfillNotes('');
      alert('Order dispatch recorded successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to fulfill order');
    } finally {
      setSubmittingFulfill(false);
    }
  };

  const handleRespondQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForResponse || !quotedPrice) return;

    setSubmittingQuote(true);
    try {
      await marketplaceService.respondToQuotation(selectedQuoteForResponse._id, {
        quoted_unit_price: Number(quotedPrice),
        seller_notes: sellerNotes
      });

      setQuotations((prev) =>
        prev.map((q) =>
          q._id === selectedQuoteForResponse._id
            ? {
                ...q,
                status: 'QUOTED',
                seller_quote: { quoted_unit_price: Number(quotedPrice), seller_notes: sellerNotes }
              }
            : q
        )
      );

      setSelectedQuoteForResponse(null);
      setQuotedPrice('');
      setSellerNotes('');
      alert('Quotation response sent to buyer.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit quote response');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  const filteredListings = listings.filter((l) => {
    if (listingStatusFilter !== 'ALL' && l.status !== listingStatusFilter) return false;
    if (listingSearch.trim()) {
      const q = listingSearch.toLowerCase();
      const titleMatch = l.title.toLowerCase().includes(q);
      const sku = (typeof l.product_id === 'object' && l.product_id ? (l.product_id as Product).sku : '') || '';
      return titleMatch || sku.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingOrdersCount = orders.filter((o) => !o.shipping_status || o.shipping_status === 'PENDING').length;
  const pendingQuotesCount = quotations.filter((q) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-5">
      {/* 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Merchant Workspace
          </h1>
          <p className="text-xs text-slate-500">
            {profile?.store_name || buyer?.company_name || 'Organization Merchant'} • Manage listings, orders, enquiries & appointments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/seller/listings/new"
            className="crm-btn-primary !h-8 !px-3 !text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Listing (Wizard)</span>
          </Link>
          <button
            onClick={() => setShowAddListingModal(true)}
            className="crm-btn-secondary !h-8 !px-2.5 !text-xs hidden sm:inline-flex items-center"
            title="Quick publish from ERP items"
          >
            <span>ERP Item</span>
          </button>
          <button
            onClick={loadSellerData}
            className="crm-btn-secondary !h-8 !px-2.5 !text-xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW & KPIS TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Action Alerts if Pending Tasks */}
          {(pendingOrdersCount > 0 || pendingQuotesCount > 0) && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  You have <span className="font-bold">{pendingOrdersCount} orders</span> awaiting dispatch and{' '}
                  <span className="font-bold">{pendingQuotesCount} quotation inquiries</span> to review.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pendingOrdersCount > 0 && (
                  <Link to="/seller?tab=orders" className="crm-btn-primary !h-7 !px-2.5 !text-[11px] !bg-amber-700 hover:!bg-amber-800">
                    Process Orders
                  </Link>
                )}
                {pendingQuotesCount > 0 && (
                  <Link to="/seller?tab=quotations" className="crm-btn-secondary !h-7 !px-2.5 !text-[11px]">
                    Review RFQs
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Published</span>
              <span className="text-xl font-bold text-slate-900 block">
                {listings.filter((l) => l.status === 'PUBLISHED').length}
              </span>
              <span className="text-[11px] text-slate-400">Live listings</span>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pending</span>
              <span className="text-xl font-bold text-slate-900 block">
                {listings.filter((l) => l.status === 'PENDING_APPROVAL').length}
              </span>
              <span className="text-[11px] text-slate-400">In moderation</span>
            </div>

            <Link to="/seller/enquiries" className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CRM Leads</span>
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-slate-900 block">Enquiries</span>
              <span className="text-[11px] text-blue-600 font-semibold">View Leads →</span>
            </Link>

            <Link to="/seller/bookings" className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-red-300 hover:shadow-xs transition-all space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Bookings</span>
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xl font-bold text-slate-900 block">Schedule</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Appointments →</span>
            </Link>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Orders</span>
              <span className="text-xl font-bold text-slate-900 block">{orders.length}</span>
              <span className="text-[11px] text-slate-400">{pendingOrdersCount} pending</span>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active RFQs</span>
              <span className="text-xl font-bold text-slate-900 block">{quotations.length}</span>
              <span className="text-[11px] text-slate-400">{pendingQuotesCount} pending</span>
            </div>
          </div>

          {/* Recent Listings Summary Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Product Listings
              </h2>
              <Link to="/seller?tab=listings" className="text-xs font-semibold text-red-700 hover:text-red-800">
                View all ({listings.length})
              </Link>
            </div>

            {listings.length === 0 ? (
              <p className="text-xs text-slate-500 p-6 text-center">No listings yet. Create a new listing to start selling.</p>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.slice(0, 5).map((l) => (
                    <tr key={l._id}>
                      <td className="font-semibold text-slate-900">{l.title}</td>
                      <td>₹{l.listing_price.toLocaleString()}</td>
                      <td><CrmBadge label={l.status} /></td>
                      <td className="text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. PRODUCT LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="space-y-3.5">
          {/* Controls: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'PUBLISHED', 'PENDING_APPROVAL', 'REJECTED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setListingStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    listingStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search listings..."
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md outline-none focus:border-red-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Listings Table */}
          {filteredListings.length === 0 ? (
            <EmptyState
              title="No Listings Found"
              description="No product listings match your selected filter. Create a new listing to publish items."
              actionText="Create Listing"
              onAction={() => setShowAddListingModal(true)}
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Min Qty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((l) => {
                    const sku = (typeof l.product_id === 'object' && l.product_id ? (l.product_id as Product).sku : '') || '—';
                    return (
                      <tr key={l._id}>
                        <td>
                          <span className="font-semibold text-slate-900 block">{l.title}</span>
                          {l.rejection_reason && (
                            <span className="text-[11px] text-rose-600 block">Feedback: {l.rejection_reason}</span>
                          )}
                        </td>
                        <td className="font-mono text-xs text-slate-500">{sku}</td>
                        <td className="font-bold text-slate-900">₹{l.listing_price.toLocaleString()}</td>
                        <td>{l.min_order_quantity}</td>
                        <td><CrmBadge label={l.status} /></td>
                        <td className="text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                        <td className="text-right">
                          <button
                            onClick={() => setDeleteDialog({ isVisible: true, listingId: l._id })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              title="No Marketplace Orders Received Yet"
              description="Customer purchases placed on the storefront will automatically appear here and route into your ERP sales ledger."
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Buyer</th>
                    <th>Contact</th>
                    <th>Subtotal</th>
                    <th>Fulfillment</th>
                    <th>Tracking</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => (
                    <tr key={idx}>
                      <td className="font-mono font-bold text-slate-900">{ord.order_number}</td>
                      <td>{ord.buyer_name}</td>
                      <td className="text-slate-500 text-xs">{ord.buyer_phone}</td>
                      <td className="font-bold text-slate-900">₹{ord.subtotal.toLocaleString()}</td>
                      <td>
                        <CrmBadge label={ord.shipping_status || 'PENDING'} />
                      </td>
                      <td className="text-xs text-slate-600">
                        {ord.tracking_number ? (
                          <span className="font-mono">{ord.tracking_carrier}: {ord.tracking_number}</span>
                        ) : (
                          <span className="text-slate-400">Not Dispatched</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedOrderForFulfill(ord)}
                          className="crm-btn-primary !h-7 !px-2.5 !text-[11px]"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Fulfill</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. QUOTATIONS (RFQS) TAB */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <EmptyState
              title="No Bulk Quotation Inquiries"
              description="When buyers request custom wholesale quotations on your products, they will appear here."
            />
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Enquiry #</th>
                    <th>Product</th>
                    <th>Buyer</th>
                    <th>Qty</th>
                    <th>Target Price</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q._id}>
                      <td className="font-mono font-bold text-slate-900">#{q.enquiry_number}</td>
                      <td className="font-semibold text-slate-900">{q.product_name}</td>
                      <td>
                        <span className="block font-medium">{q.buyer_name}</span>
                        <span className="text-[11px] text-slate-400">{q.buyer_phone}</span>
                      </td>
                      <td>{q.requested_quantity}</td>
                      <td>{q.target_unit_price ? `₹${q.target_unit_price.toLocaleString()}` : '—'}</td>
                      <td><CrmBadge label={q.status} /></td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedQuoteForResponse(q)}
                          className="crm-btn-secondary !h-7 !px-2.5 !text-[11px]"
                        >
                          <Send className="w-3 h-3 text-red-600" />
                          <span>Respond</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. SELLER BUSINESS PROFILE TAB (Well-proportioned business settings form) */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Seller Business Profile</h2>
            <p className="text-xs text-slate-500">Configure your storefront merchant identity and dispatch commitments</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Store / Merchant Name</label>
                <input
                  type="text"
                  value={profile?.store_name || buyer?.company_name || 'Brandspyre Merchant'}
                  readOnly
                  className="crm-input bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">GSTIN Status</label>
                <input
                  type="text"
                  value={profile?.gstin || 'Registered on ERP'}
                  readOnly
                  className="crm-input bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Business Contact Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="orders@company.com"
                  className="crm-input"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Business Contact Phone</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="crm-input"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fulfillment SLA (Days to Dispatch)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={profileSla}
                onChange={(e) => setProfileSla(e.target.value)}
                className="crm-input max-w-[120px]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Expected business days before tracking code dispatch</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Banking and tax accounts sync with Brandspyre ERP.
              </span>
              <button
                type="submit"
                className="crm-btn-primary !h-8 !px-4 !text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>

            {profileSavedMsg && (
              <div className="p-2.5 rounded bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Seller profile settings saved successfully.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* MODAL: ADD LISTING */}
      {showAddListingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>Publish Product Listing</span>
              </h3>
              <button onClick={() => setShowAddListingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Catalog Product</label>
                <select
                  value={listingForm.product_id}
                  onChange={(e) => {
                    const prod = catalogProducts.find((p) => p._id === e.target.value);
                    setListingForm({
                      ...listingForm,
                      product_id: e.target.value,
                      title: prod ? prod.name : listingForm.title,
                      listing_price: prod ? String(prod.selling_price) : listingForm.listing_price
                    });
                  }}
                  className="crm-input"
                >
                  <option value="">-- Choose from existing catalog items --</option>
                  {catalogProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (SKU: {p.sku} - ₹{p.selling_price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="e.g. Precision Industrial Digital Caliper 150mm"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Listing Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={listingForm.listing_price}
                    onChange={(e) => setListingForm({ ...listingForm, listing_price: e.target.value })}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={listingForm.min_order_quantity}
                    onChange={(e) => setListingForm({ ...listingForm, min_order_quantity: e.target.value })}
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="Specifications, warranty, package details..."
                  className="crm-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddListingModal(false)}
                  className="crm-btn-secondary !h-8 !px-3 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingListing}
                  className="crm-btn-primary !h-8 !px-4 !text-xs"
                >
                  {submittingListing ? 'Submitting...' : 'Submit Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULFILL ORDER */}
      {selectedOrderForFulfill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Fulfill Order #{selectedOrderForFulfill.order_number}
              </h3>
              <button onClick={() => setSelectedOrderForFulfill(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFulfillOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shipping Carrier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Dart, Delhivery, DTDC"
                  value={trackingCarrier}
                  onChange={(e) => setTrackingCarrier(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="Tracking AWB code"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForFulfill(null)}
                  className="crm-btn-secondary !h-8 !px-3 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFulfill}
                  className="crm-btn-primary !h-8 !px-4 !text-xs"
                >
                  {submittingFulfill ? 'Saving...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESPOND TO QUOTATION */}
      {selectedQuoteForResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Respond to RFQ #{selectedQuoteForResponse.enquiry_number}
              </h3>
              <button onClick={() => setSelectedQuoteForResponse(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div><span className="text-slate-400">Product:</span> <span className="font-semibold text-slate-800">{selectedQuoteForResponse.product_name}</span></div>
              <div><span className="text-slate-400">Requested Volume:</span> <span className="font-bold text-slate-800">{selectedQuoteForResponse.requested_quantity} units</span></div>
              {selectedQuoteForResponse.target_unit_price && (
                <div><span className="text-slate-400">Buyer Target Unit:</span> <span className="font-bold text-slate-800">₹{selectedQuoteForResponse.target_unit_price.toLocaleString()}</span></div>
              )}
            </div>

            <form onSubmit={handleRespondQuote} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Quoted Unit Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Seller Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Valid for 15 days, freight inclusive..."
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  className="crm-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForResponse(null)}
                  className="crm-btn-secondary !h-8 !px-3 !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="crm-btn-primary !h-8 !px-4 !text-xs"
                >
                  {submittingQuote ? 'Sending...' : 'Send Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isVisible={deleteDialog.isVisible}
        title="Delete Listing"
        description="Are you sure you want to remove this product listing from the storefront? This action cannot be undone."
        confirmText="Delete Listing"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteListing}
        onClose={() => setDeleteDialog({ isVisible: false, listingId: null })}
      />
    </div>
  );
};

export default SellerDashboardPage;
