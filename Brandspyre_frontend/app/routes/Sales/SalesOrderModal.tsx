import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from "src/services/apiClient";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Search,
  Building2,
  Calendar,
  DollarSign,
  ShoppingCart,
  ShieldCheck,
  ChevronDown,
  UserCheck
} from 'lucide-react';

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalesOrderModal({ isOpen, onClose, onSuccess }: SalesOrderModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [header, setHeader] = useState({
    branchcode: 'DEFAULT',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    currency: 'INR',
    paymentTerms: 'Net 30',
    salespersonName: '',
    customerPoNumber: '',
    referenceNumber: '',
    shippingMethod: '',
    carrier: '',
    deliveryInstructions: '',
    internalNotes: '',
    termsAndConditions: '',
    additionalDiscount: 0,
    shippingCharges: 0,
    handlingCharges: 0,
    otherCharges: 0
  });

  const [items, setItems] = useState<any[]>([
    {
      product_id: '',
      sku: '',
      name: '',
      quantity: 1,
      uom: 'PCS',
      unit_price: 0,
      discount_percent: 0,
      tax_rate: 18,
      productSearch: '',
      showProductDropdown: false
    }
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

  const fetchMasterData = async () => {
    try {
      const [custRes, prodRes, whRes] = await Promise.all([
        apiClient.get(`/v1/sales/client/read`)
          .catch(() => apiClient.get(`/v1/clients`))
          .catch(() => apiClient.get(`/v1/customers`))
          .catch(() => ({ data: { data: [] } })),
        apiClient.get(`/v1/products`)
          .catch(() => apiClient.get(`/v1/commerce/products`))
          .catch(() => ({ data: { data: [] } })),
        apiClient.get(`/v1/inventory/warehouses`)
          .catch(() => apiClient.get(`/v1/commerce/warehouses`))
          .catch(() => ({ data: { data: [] } }))
      ]);

      const cData = custRes.data?.items || custRes.data?.data || custRes.data?.clients || custRes.data?.customers || (Array.isArray(custRes.data) ? custRes.data : []);
      const pData = prodRes.data?.items || prodRes.data?.data || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
      const wData = whRes.data?.items || whRes.data?.data || whRes.data?.warehouses || (Array.isArray(whRes.data) ? whRes.data : []);

      setCustomers(Array.isArray(cData) ? cData : []);
      setProducts(Array.isArray(pData) ? pData : []);
      if (Array.isArray(wData) && wData.length > 0) {
        setWarehouses(wData);
        setHeader(h => ({ ...h, warehouseId: wData[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching SO master data:', err);
    }
  };

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setHeader(h => ({
      ...h,
      paymentTerms: c.payment_terms || 'Net 30'
    }));
    setShowCustomerDropdown(false);
  };

  const handleSelectProduct = (index: number, p: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: p._id,
      sku: p.sku || 'SKU-001',
      name: p.name,
      unit_price: p.selling_price || p.price || 0,
      tax_rate: p.tax_rate || 18,
      productSearch: p.name,
      showProductDropdown: false
    };
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        product_id: '',
        sku: '',
        name: '',
        quantity: 1,
        uom: 'PCS',
        unit_price: 0,
        discount_percent: 0,
        tax_rate: 18,
        productSearch: '',
        showProductDropdown: false
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDuplicateItemRow = (index: number) => {
    const itemToDup = { ...items[index] };
    setItems([...items, itemToDup]);
  };

  // Live Calculations
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let totalTaxable = 0;
  let totalTax = 0;

  items.forEach(i => {
    const qty = Number(i.quantity) || 0;
    const rate = Number(i.unit_price) || 0;
    const rawLine = qty * rate;
    const disc = (rawLine * (Number(i.discount_percent) || 0)) / 100;
    const taxable = rawLine - disc;
    const tax = (taxable * (Number(i.tax_rate) || 0)) / 100;

    subtotal += rawLine;
    totalLineDiscounts += disc;
    totalTaxable += taxable;
    totalTax += tax;
  });

  const netTaxable = totalTaxable - Number(header.additionalDiscount);
  const rawGrandTotal = netTaxable + totalTax + Number(header.shippingCharges) + Number(header.handlingCharges) + Number(header.otherCharges);
  const grandTotal = Math.round(rawGrandTotal);

  const handleSubmitSO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a Customer.');
      return;
    }
    if (!header.warehouseId) {
      alert('Please select a Warehouse.');
      return;
    }

    try {
      setSubmitting(true);
      // Create sales order via apiClient

      await apiClient.post(`/v1/sales/orders`, {
        customerId: header.customerId,
        warehouseId: header.warehouseId,
        paymentTerms: header.paymentTerms,
        deliveryMethod: header.deliveryMethod,
        billingAddress: header.billingAddress,
        shippingAddress: header.shippingAddress,
        notes: header.notes,
        items: items.map(it => ({
          productId: it.productId,
          sku: it.sku,
          name: it.name,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discountPercent: Number(it.discountPercent || 0),
          taxRate: Number(it.tax_rate || 18)
        })),
        shippingCharges: Number(header.shippingCharges),
        handlingCharges: Number(header.handlingCharges),
        otherCharges: Number(header.otherCharges),
        creditLimit: Number(selectedCustomer.credit_limit || 100000),
        currentOutstanding: Number(selectedCustomer.outstanding_balance || 0)
      });

      alert('Sales Order created & Inventory Stock Reserved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create Sales Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c => {
    const name = c.name || c.company_name || c.client_name || '';
    const code = c.code || '';
    return name.toLowerCase().includes(customerSearch.toLowerCase()) || code.toLowerCase().includes(customerSearch.toLowerCase());
  });

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-slate-900 dark:text-slate-100 font-sans my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-red-600" /> Create Production Sales Order
            </h2>
            <p className="text-xs text-slate-500">Sales Order Number will be auto-generated (SO-2026-XXXXXX) with stock reservation</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitSO} className="px-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* SECTION 1: CUSTOMER & HEADER INFO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-red-600" /> Customer & Order Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Selector */}
              <div className="relative">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer <span className="text-red-600">*</span>
                </label>
                <div
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer font-bold"
                >
                  <span className={selectedCustomer ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                    {selectedCustomer ? `${selectedCustomer.name || selectedCustomer.company_name} (${selectedCustomer.code || 'CUS'})` : 'Search & select customer...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type customer name or code..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-slate-400 text-center">No customers found</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <div
                            key={c._id}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{c.name || c.company_name}</div>
                              <div className="text-[10px] text-slate-500">Code: {c.code || 'CUS'} • GSTIN: {c.tax_number || 'N/A'}</div>
                            </div>
                            <span className="text-[10px] font-bold text-red-600">Balance: ₹{(c.outstanding_balance || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Warehouse Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stock Warehouse <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={header.warehouseId}
                  onChange={(e) => setHeader({ ...header, warehouseId: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              {/* Order Date & Expected Delivery */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Order Date</label>
                  <input
                    type="date"
                    value={header.orderDate}
                    onChange={(e) => setHeader({ ...header, orderDate: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={header.expectedDeliveryDate}
                    onChange={(e) => setHeader({ ...header, expectedDeliveryDate: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Payment Terms, Customer PO# & Reference */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
                <select
                  value={header.paymentTerms}
                  onChange={(e) => setHeader({ ...header, paymentTerms: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer PO Number</label>
                <input
                  type="text"
                  placeholder="CUST-PO-991"
                  value={header.customerPoNumber}
                  onChange={(e) => setHeader({ ...header, customerPoNumber: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold font-mono text-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Salesperson</label>
                <input
                  type="text"
                  placeholder="Sales Executive"
                  value={header.salespersonName}
                  onChange={(e) => setHeader({ ...header, salespersonName: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shipping Method</label>
                <input
                  type="text"
                  placeholder="Air Freight / Surface"
                  value={header.shippingMethod}
                  onChange={(e) => setHeader({ ...header, shippingMethod: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC LINE ITEMS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Product Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-xl font-bold flex items-center gap-1 hover:bg-red-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3 w-1/3">Product Catalog Item</th>
                    <th className="p-3 w-20">UOM</th>
                    <th className="p-3 w-24">Qty</th>
                    <th className="p-3 w-28">Rate (₹)</th>
                    <th className="p-3 w-24">Disc %</th>
                    <th className="p-3 w-24">Tax %</th>
                    <th className="p-3 text-right">Line Amount</th>
                    <th className="p-3 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => {
                    const lineTotal = (item.quantity * item.unit_price) * (1 - (item.discount_percent / 100)) * (1 + (item.tax_rate / 100));
                    const q = (item.productSearch || '').toLowerCase().trim();
                    const filteredProds = products.filter(p => {
                      if (!q) return true;
                      return (
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.title && p.title.toLowerCase().includes(q)) ||
                        (p.product_name && p.product_name.toLowerCase().includes(q)) ||
                        (p.sku && p.sku.toLowerCase().includes(q)) ||
                        (p.barcode && p.barcode.toLowerCase().includes(q))
                      );
                    });

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 relative">
                          <input
                            type="text"
                            placeholder="Type or select product..."
                            value={item.productSearch || ''}
                            onFocus={() => {
                              const updated = [...items];
                              updated[idx].showProductDropdown = true;
                              setItems(updated);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setItems(current => {
                                  const updated = [...current];
                                  if (updated[idx]) updated[idx].showProductDropdown = false;
                                  return updated;
                                });
                              }, 200);
                            }}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].productSearch = e.target.value;
                              updated[idx].name = e.target.value;
                              updated[idx].showProductDropdown = true;
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                          />

                          {item.showProductDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto">
                              {filteredProds.length === 0 ? (
                                <div className="p-2.5 text-center text-xs font-medium text-slate-400">
                                  No matching products found
                                </div>
                              ) : (
                                filteredProds.map(p => (
                                  <div
                                    key={p._id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectProduct(idx, p);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white">
                                        {p.name || p.title || p.product_name || 'Unnamed Product'}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        SKU: {p.sku || p.barcode || 'N/A'} • Price: ₹{p.selling_price || p.unit_price || p.price || 0}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-2.5">
                          <select
                            value={item.uom}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].uom = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                          >
                            <option value="PCS">PCS</option>
                            <option value="KG">KG</option>
                            <option value="LTR">LTR</option>
                            <option value="BOX">BOX</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].quantity = Number(e.target.value);
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].unit_price = Number(e.target.value);
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-mono font-bold"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].discount_percent = Number(e.target.value);
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            max="28"
                            value={item.tax_rate}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].tax_rate = Number(e.target.value);
                              setItems(updated);
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                          />
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-600 font-mono">
                          ₹{Math.round(lineTotal).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-center flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateItemRow(idx)}
                            title="Duplicate Row"
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            title="Remove Row"
                            className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: SUMMARY & TOTALS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Internal Notes & Terms</label>
              <textarea
                rows={3}
                placeholder="Add special instructions or delivery terms..."
                value={header.internalNotes}
                onChange={(e) => setHeader({ ...header, internalNotes: e.target.value })}
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Line Discounts</span>
                <span className="font-mono font-bold text-red-600">-₹{totalLineDiscounts.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Taxable Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{totalTaxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated GST</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold">
                <span className="text-slate-900 dark:text-white">Grand Total</span>
                <span className="text-emerald-600 font-mono text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 pb-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" /> {submitting ? 'Creating SO...' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
