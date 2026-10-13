import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from "src/services/apiClient";
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
  ShoppingCart,
  Receipt,
  CreditCard
} from 'lucide-react';

interface SalesOrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SalesOrderDetailModal({ order, isOpen, onClose, onRefresh }: SalesOrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await apiClient.put(
        `/v1/sales/orders/${order._id}/status`,
        { status: newStatus }
      );
      alert(`Sales Order status updated to ${newStatus}`);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateDeliveryNote = async () => {
    try {
      setUpdating(true);
      await apiClient.post(
        `/v1/sales/deliveries`,
        {
          salesOrderId: order._id,
          trackingNumber: `TRK-${Date.now()}`,
          carrier: 'Express Freight'
        }
      );
      alert('Delivery Note created & physical stock dispatched!');
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create delivery note');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setUpdating(true);
      await apiClient.post(
        `/v1/sales/invoices`,
        {
          salesOrderId: order._id,
          customerId: order.customer_id?._id || order.customer_id,
          warehouseId: order.warehouse_id?._id || order.warehouse_id,
          subtotal: order.subtotal || order.grand_total,
          tax: order.tax || 0,
          grandTotal: order.grand_total,
          items: order.items
        }
      );
      alert('Sales Invoice created & Double-Entry Accounting journal posted!');
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create invoice');
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
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">{order.order_number}</h2>
              <CrmBadge label={order.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(order.order_date || order.created_at).toLocaleDateString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="px-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Customer & Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Snapshot</div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">{order.customer_name || order.customer_id?.name || 'Walk-in Customer'}</div>
              <div className="text-slate-500 mt-0.5">Code: {order.customer_code || 'CUS-001'} • GSTIN: {order.customer_tax_number || 'N/A'}</div>
              <div className="text-slate-500">Contact: {order.customer_contact || 'N/A'}</div>
              <div className="text-slate-500">{order.billing_address || 'Address not specified'}</div>
            </div>

            <div className="space-y-1 md:text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Details</div>
              <div><span className="text-slate-500">Payment Terms:</span> <span className="font-bold text-slate-900 dark:text-white">{order.payment_terms || 'Net 30'}</span></div>
              <div><span className="text-slate-500">Delivery Date:</span> <span className="font-bold text-slate-900 dark:text-white">{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('en-IN') : 'N/A'}</span></div>
              <div><span className="text-slate-500">Salesperson:</span> <span className="font-bold text-slate-900 dark:text-white">{order.salesperson_name || order.created_by}</span></div>
              <div><span className="text-slate-500">Customer PO#:</span> <span className="font-mono font-bold text-red-600">{order.customer_po_number || 'N/A'}</span></div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Items & Fulfillment Progress</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Ordered</th>
                    <th className="p-3 text-center">Delivered</th>
                    <th className="p-3 text-center">Pending</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item: any, idx: number) => {
                    const pending = item.quantity - (item.delivered_quantity || item.fulfilled_quantity || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name} ({item.sku})</td>
                        <td className="p-3 text-center font-bold">{item.quantity} {item.uom || 'PCS'}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{item.delivered_quantity || item.fulfilled_quantity || 0}</td>
                        <td className="p-3 text-center font-bold text-amber-600">{pending}</td>
                        <td className="p-3 text-right font-mono font-bold">₹{(item.unit_price || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-extrabold font-mono text-emerald-600">₹{(item.total || item.quantity * item.unit_price).toLocaleString('en-IN')}</td>
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
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (GST)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(order.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold">
              <span className="text-slate-900 dark:text-white">Grand Total</span>
              <span className="text-emerald-600 font-mono text-base">₹{(order.grand_total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print Order
            </button>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'PENDING_APPROVAL' && (
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
                  Approve Order
                </button>
              </>
            )}

            {(order.status === 'APPROVED' || order.status === 'DRAFT') && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('CONFIRMED')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm & Reserve Stock
              </button>
            )}

            {(order.status === 'CONFIRMED' || order.status === 'STOCK_RESERVED' || order.status === 'PARTIALLY_DELIVERED') && (
              <button
                disabled={updating}
                onClick={handleCreateDeliveryNote}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-4 h-4" /> Create Delivery Note
              </button>
            )}

            {(order.status === 'FULLY_DELIVERED' || order.status === 'PARTIALLY_DELIVERED') && (
              <button
                disabled={updating}
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" /> Create Sales Invoice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
