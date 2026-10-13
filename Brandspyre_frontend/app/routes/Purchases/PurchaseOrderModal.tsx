import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiClient from "src/services/apiClient";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Search,
  Building2,
  Calendar,
  DollarSign,
  PackageCheck,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseOrderModal({ isOpen, onClose, onSuccess }: PurchaseOrderModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const [header, setHeader] = useState({
    branchcode: 'DEFAULT',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    currency: 'INR',
    paymentTerms: 'Net 30',
    shippingTerms: '',
    buyerName: '',
    referenceNumber: '',
    supplierReference: '',
    internalNotes: '',
    termsAndConditions: '',
    shippingMethod: '',
    carrier: '',
    deliveryInstructions: '',
    additionalDiscount: 0,
    shippingCharges: 0,
    handlingCharges: 0,
    advancePercent: 0
  });

  const [items, setItems] = useState<any[]>([
    {
      product_id: '',
      sku: '',
      name: '',
      quantity: 1,
      uom: 'PCS',
      unit_cost: 0,
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
      const [supRes, prodRes, whRes] = await Promise.all([
        apiClient.get('/v1/suppliers')
          .catch(() => apiClient.get('/v1/commerce/suppliers'))
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/v1/products')
          .catch(() => apiClient.get('/v1/commerce/products'))
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/v1/inventory/warehouses')
          .catch(() => apiClient.get('/v1/commerce/warehouses'))
          .catch(() => ({ data: { data: [] } }))
      ]);

      const supData = supRes.data?.items || supRes.data?.data || supRes.data?.suppliers || (Array.isArray(supRes.data) ? supRes.data : []);
      const prodData = prodRes.data?.items || prodRes.data?.data || prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
      const whData = whRes.data?.items || whRes.data?.data || whRes.data?.warehouses || (Array.isArray(whRes.data) ? whRes.data : []);

      setSuppliers(Array.isArray(supData) ? supData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
      if (Array.isArray(whData) && whData.length > 0) {
        setWarehouses(whData);
        setHeader(h => ({ ...h, warehouseId: whData[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching PO master data:', err);
    }
  };

  const handleSelectSupplier = (s: any) => {
    setSelectedSupplier(s);
    setHeader(h => ({
      ...h,
      paymentTerms: s.payment_terms || 'Net 30'
    }));
    setShowSupplierDropdown(false);
  };

  const handleSelectProduct = (index: number, p: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: p._id,
      sku: p.sku || 'SKU-001',
      name: p.name,
      unit_cost: p.purchase_price || 0,
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
        unit_cost: 0,
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
    const cost = Number(i.unit_cost) || 0;
    const rawLine = qty * cost;
    const disc = (rawLine * (Number(i.discount_percent) || 0)) / 100;
    const taxable = rawLine - disc;
    const tax = (taxable * (Number(i.tax_rate) || 0)) / 100;

    subtotal += rawLine;
    totalLineDiscounts += disc;
    totalTaxable += taxable;
    totalTax += tax;
  });

  const netTaxable = totalTaxable - Number(header.additionalDiscount);
  const rawGrandTotal = netTaxable + totalTax + Number(header.shippingCharges) + Number(header.handlingCharges);
  const grandTotal = Math.round(rawGrandTotal);

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a Supplier / Vendor.');
      return;
    }
    if (!header.warehouseId) {
      alert('Please select a Receiving Warehouse.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post(
        '/v1/purchases/orders',
        {
          supplierId: selectedSupplier._id,
          branchcode: header.branchcode,
          warehouseId: header.warehouseId,
          orderDate: header.orderDate,
          expectedDeliveryDate: header.expectedDeliveryDate,
          currency: header.currency,
          paymentTerms: header.paymentTerms,
          shippingTerms: header.shippingTerms,
          buyerName: header.buyerName,
          referenceNumber: header.referenceNumber,
          supplierReference: header.supplierReference,
          internalNotes: header.internalNotes,
          termsAndConditions: header.termsAndConditions,
          items: items.map(i => ({
            product_id: i.product_id || '65a000000000000000000002',
            sku: i.sku || 'SKU-001',
            name: i.name || i.productSearch || 'Custom Product Item',
            quantity: Number(i.quantity),
            uom: i.uom,
            unit_cost: Number(i.unit_cost),
            discount_percent: Number(i.discount_percent),
            tax_rate: Number(i.tax_rate)
          })),
          additionalDiscount: Number(header.additionalDiscount),
          shippingCharges: Number(header.shippingCharges),
          handlingCharges: Number(header.handlingCharges),
          advancePercent: Number(header.advancePercent),
          shippingMethod: header.shippingMethod,
          carrier: header.carrier,
          deliveryInstructions: header.deliveryInstructions
        }
      );

      alert('Purchase Order created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter(s =>
    (s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.company_name && s.company_name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.display_name && s.display_name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.supplier_code && s.supplier_code.toLowerCase().includes(supplierSearch.toLowerCase()))
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-slate-900 dark:text-slate-100 font-sans my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Create Purchase Order</h2>
              <p className="text-xs text-slate-500">PO Number will be auto-generated upon creation (PO-2026-XXXXXX)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitPO} className="px-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* SECTION 1: SUPPLIER & HEADER INFO */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-red-600" /> Supplier & Order Header Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supplier Selector */}
              <div className="relative">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier / Vendor <span className="text-red-600">*</span>
                </label>
                <div
                  onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer font-bold"
                >
                  <span className={selectedSupplier ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                    {selectedSupplier ? `${selectedSupplier.name} (${selectedSupplier.supplier_code || 'SUP'})` : 'Search & select supplier...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {showSupplierDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Type supplier name or code..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredSuppliers.length === 0 ? (
                        <div className="p-2 text-slate-400 text-center">No suppliers found</div>
                      ) : (
                        filteredSuppliers.map(s => (
                          <div
                            key={s._id}
                            onClick={() => handleSelectSupplier(s)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                              <div className="text-[10px] text-slate-500">GSTIN: {s.tax_number || 'N/A'} • {s.phone || 'No phone'}</div>
                            </div>
                            <span className="text-[10px] font-bold text-red-600">Balance: ₹{(s.current_balance || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Receiving Warehouse */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receiving Warehouse <span className="text-red-600">*</span>
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

              {/* PO Date & Delivery Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">PO Date</label>
                  <input
                    type="date"
                    value={header.orderDate}
                    onChange={(e) => setHeader({ ...header, orderDate: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={header.expectedDeliveryDate}
                    onChange={(e) => setHeader({ ...header, expectedDeliveryDate: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Payment Terms & Reference */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
                <select
                  value={header.paymentTerms}
                  onChange={(e) => setHeader({ ...header, paymentTerms: e.target.value as any })}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Buyer / Purchaser</label>
                <input
                  type="text"
                  placeholder="Purchaser Name"
                  value={header.buyerName}
                  onChange={(e) => setHeader({ ...header, buyerName: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  placeholder="REF-1001"
                  value={header.referenceNumber}
                  onChange={(e) => setHeader({ ...header, referenceNumber: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier Quote Ref</label>
                <input
                  type="text"
                  placeholder="VEND-QUOTE-88"
                  value={header.supplierReference}
                  onChange={(e) => setHeader({ ...header, supplierReference: e.target.value })}
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
                    <th className="p-3 w-28">Unit Cost (₹)</th>
                    <th className="p-3 w-24">Disc %</th>
                    <th className="p-3 w-24">Tax %</th>
                    <th className="p-3 text-right">Line Amount</th>
                    <th className="p-3 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => {
                    const lineTotal = (item.quantity * item.unit_cost) * (1 - (item.discount_percent / 100)) * (1 + (item.tax_rate / 100));
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
                                        SKU: {p.sku || p.barcode || 'N/A'} • Cost: ₹{p.purchase_price || p.unit_cost || p.cost_price || p.price || 0}
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
                            value={item.unit_cost}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].unit_cost = Number(e.target.value);
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

          {/* SECTION 3: TOTALS & SUMMARY PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Internal Notes & Terms</label>
              <textarea
                rows={3}
                placeholder="Add special instructions or supplier terms..."
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
                <span>Estimated Tax (GST)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold">
                <span className="text-slate-900 dark:text-white">Grand Total</span>
                <span className="text-emerald-600 font-mono text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" /> {submitting ? 'Creating PO...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
