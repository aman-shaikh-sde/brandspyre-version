import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import apiClient from "src/services/apiClient";
import CrmBadge from 'src/component/ui/CrmBadge';
import {
  X,
  Building2,
  Calendar,
  CheckCircle,
  Truck,
  FileText,
  Printer,
  Download,
  AlertCircle,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface PurchaseOrderDetailModalProps {
  po: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function PurchaseOrderDetailModal({ po, isOpen, onClose, onRefresh }: PurchaseOrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !po) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await apiClient.put(
        `/v1/purchases/orders/${po._id}/status`,
        { status: newStatus }
      );
      alert(`PO Status updated to ${newStatus}`);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update PO status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateGRN = async () => {
    try {
      setUpdating(true);
      await apiClient.post(
        `/v1/purchases/orders/${po._id}/grn`,
        {
          warehouseId: po.warehouse_id?._id || po.warehouse_id || '65a000000000000000000001',
          items: po.items.map((i: any) => ({
            product_id: i.product_id._id || i.product_id,
            quantity: i.quantity - (i.received_quantity || 0)
          }))
        }
      );
      alert('Goods Receipt Note (GRN) created & physical stock updated successfully!');
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create GRN');
    } finally {
      setUpdating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:pl-[250px] z-[99999] overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-4xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">{po.order_number}</h2>
              <CrmBadge label={po.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(po.order_date || po.created_at).toLocaleDateString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="px-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Supplier & Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Snapshot</div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">{po.supplier_name || po.supplier_id?.name || 'N/A'}</div>
              <div className="text-slate-500 mt-0.5">GSTIN: {po.supplier_tax_number || 'N/A'}</div>
              <div className="text-slate-500">Contact: {po.supplier_contact || 'N/A'}</div>
              <div className="text-slate-500">{po.billing_address || 'Address not specified'}</div>
            </div>

            <div className="space-y-1 md:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Information</div>
              <div><span className="text-slate-500">Payment Terms:</span> <span className="font-bold text-slate-900 dark:text-white">{po.payment_terms || 'Net 30'}</span></div>
              <div><span className="text-slate-500">Expected Delivery:</span> <span className="font-bold text-slate-900 dark:text-white">{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
              <div><span className="text-slate-500">Buyer / Purchaser:</span> <span className="font-bold text-slate-900 dark:text-white">{po.buyer_name || po.created_by}</span></div>
              <div><span className="text-slate-500">Ref Number:</span> <span className="font-mono font-bold text-red-600">{po.reference_number || 'N/A'}</span></div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Items & Quantities</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Ordered</th>
                    <th className="p-3 text-center">Received</th>
                    <th className="p-3 text-center">Pending</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {po.items.map((item: any, idx: number) => {
                    const pending = item.quantity - (item.received_quantity || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name} ({item.sku})</td>
                        <td className="p-3 text-center font-bold">{item.quantity} {item.uom || 'PCS'}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{item.received_quantity || 0}</td>
                        <td className="p-3 text-center font-bold text-amber-600">{pending}</td>
                        <td className="p-3 text-right font-mono font-bold">₹{(item.unit_cost || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-extrabold font-mono text-emerald-600">₹{(item.total || item.quantity * item.unit_cost).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Panel */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium max-w-sm ml-auto">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(po.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (GST)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(po.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold">
              <span className="text-slate-900 dark:text-white">Grand Total</span>
              <span className="text-emerald-600 font-mono text-base">₹{(po.grand_total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print PO
            </button>
          </div>

          <div className="flex items-center gap-2">
            {po.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('REJECTED')}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Reject
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                >
                  Approve PO
                </button>
              </>
            )}

            {po.status === 'APPROVED' && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('SENT_TO_SUPPLIER')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              >
                Send to Supplier
              </button>
            )}

            {(po.status === 'APPROVED' || po.status === 'SENT_TO_SUPPLIER' || po.status === 'PARTIALLY_RECEIVED') && (
              <button
                disabled={updating}
                onClick={handleCreateGRN}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" /> Create GRN / Receive Goods
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
