import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import PurchaseOrderModal from './PurchaseOrderModal';
import PurchaseOrderDetailModal from './PurchaseOrderDetailModal';
import {
  ShoppingBag,
  PackageCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function PurchaseWorkspace() {
  const [activeTab, setActiveTab] = useState<'orders' | 'bills'>('orders');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await apiClient.get('/v1/purchases/orders');
        if (res.data?.success) setPurchaseOrders(res.data.data);
      } else if (activeTab === 'bills') {
        const res = await apiClient.get('/v1/purchases');
        if (res.data?.success) setPurchases(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching purchase data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPODetail = (po: any) => {
    setSelectedPO(po);
    setShowDetailModal(true);
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch =
      (po.order_number && po.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (po.supplier_name && po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (po.buyer_name && po.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovalsCount = purchaseOrders.filter(po => po.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100 font-sans">
      <PageHeader
        title="Procurement & 3-Way Match Workspace"
        description="Enterprise procurement engine: Purchase Orders → Approval Engine → 3-Way Match GRN & Vendor Bills → Supplier Payments → Subledgers."
        actions={
          <button
            onClick={() => setShowPOModal(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Purchase Order
          </button>
        }
      />

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Purchase Orders</div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{purchaseOrders.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Pending Approvals</div>
          <div className="text-xl font-black text-amber-600 font-mono">{pendingApprovalsCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">GRN & Vendor Bills</div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{purchases.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">3-Way Match Status</div>
          <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Active Tolerance Policy
          </div>
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
          <ShoppingBag className="w-3.5 h-3.5" /> Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'bills' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" /> GRN & Vendor Bills ({purchases.length})
        </button>
      </div>

      {/* TAB CONTENT: POs */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs space-y-4">
          
          {/* Search & Status Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search PO number, supplier, or buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold">
              {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'].map((st) => (
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
            <div className="p-8 text-center text-slate-400">Loading Purchase Orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No purchase orders match your query. Click "Create Purchase Order" above to issue a PO.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3 font-right">Grand Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">PO Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-red-600">{po.order_number}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{po.supplier_name || po.supplier_id?.name || 'Supplier'}</td>
                    <td className="p-3 text-slate-600">{po.buyer_name || po.created_by}</td>
                    <td className="p-3 font-extrabold text-emerald-600">₹{(po.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3"><CrmBadge label={po.status} /></td>
                    <td className="p-3 text-slate-500">{new Date(po.order_date || po.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenPODetail(po)}
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

      {/* CREATE PO MODAL */}
      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        onSuccess={fetchData}
      />

      {/* PO DETAILS MODAL */}
      <PurchaseOrderDetailModal
        po={selectedPO}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
