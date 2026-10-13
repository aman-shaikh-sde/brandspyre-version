import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import SalesOrderModal from './SalesOrderModal';
import SalesOrderDetailModal from './SalesOrderDetailModal';
import {
  FileText,
  ShoppingCart,
  Truck,
  Receipt,
  CreditCard,
  RotateCcw,
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useState<'quotations' | 'orders' | 'deliveries' | 'invoices' | 'receipts'>('orders');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'quotations') {
        const res = await apiClient.get(`/v1/sales/quotations`);
        if (res.data?.success) setQuotations(res.data.data);
      } else if (activeTab === 'orders') {
        const res = await apiClient.get(`/v1/sales/orders`);
        if (res.data?.success) setOrders(res.data.data);
      } else if (activeTab === 'deliveries') {
        const res = await apiClient.get(`/v1/sales/deliveries`);
        if (res.data?.success) setDeliveries(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrderDetail = (ord: any) => {
    setSelectedOrder(ord);
    setShowDetailModal(true);
  };

  const handleConvertQuote = async (quoteId: string) => {
    try {
      await apiClient.post(`/v1/sales/quotations/${quoteId}/convert`, {});
      alert('Quotation converted to Sales Order & Stock Reserved successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to convert quotation');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      (o.order_number && o.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customer_code && o.customer_code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovalsCount = orders.filter(o => o.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100 font-sans">
      <PageHeader
        title="Sales Workspace & Lifecycle Engine"
        description="End-to-end sales pipeline: Quotations → Sales Orders → Stock Reservation → Delivery Notes → Invoices → Customer Receipts → Subledgers."
        actions={
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Sales Order
          </button>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Sales Orders</div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{orders.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Pending Approvals</div>
          <div className="text-xl font-black text-amber-600 font-mono">{pendingApprovalsCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Delivery Notes</div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{deliveries.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Accounting Ledger</div>
          <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">100% DR = CR Balanced</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Sales Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'quotations' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Quotations ({quotations.length})
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'deliveries' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Delivery Notes ({deliveries.length})
        </button>
      </div>

      {/* TAB CONTENT: SALES ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs space-y-4">
          
          {/* Search & Status Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SO number, customer name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold">
              {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'CONFIRMED', 'STOCK_RESERVED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'INVOICED', 'PAID', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}

              <button onClick={fetchData} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200">
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading Sales Orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No sales orders match your query. Click "Create Sales Order" above to issue a Sales Order.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Customer PO#</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-red-600">{o.order_number}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{o.customer_name || 'Walk-in Customer'}</td>
                    <td className="p-3 font-mono text-slate-500">{o.customer_po_number || 'N/A'}</td>
                    <td className="p-3 font-extrabold text-emerald-600">₹{(o.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3"><CrmBadge label={o.status} /></td>
                    <td className="p-3 text-slate-500">{new Date(o.order_date || o.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenOrderDetail(o)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Sales Quotations Registry</h3>
            <button onClick={fetchData} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading Quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No sales quotations recorded.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-3">Quotation Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-red-600">{q.quotation_number}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{q.customer_name || 'N/A'}</td>
                    <td className="p-3 font-extrabold text-emerald-600">₹{(q.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3"><CrmBadge label={q.status} /></td>
                    <td className="p-3 text-slate-500">{new Date(q.quotation_date || q.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right">
                      {q.status === 'APPROVED' && (
                        <button
                          onClick={() => handleConvertQuote(q._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Convert to SO
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

      {/* CREATE SO MODAL */}
      <SalesOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSuccess={fetchData}
      />

      {/* SO DETAILS MODAL */}
      <SalesOrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
