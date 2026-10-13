import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import {
  Monitor,
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Sparkles,
  UserCheck
} from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  quantity: number;
  taxRate: number;
}

export default function POSTerminalPage() {
  const { getTerminology } = useOrganizationConfig();
  const term = getTerminology("PRODUCT", "Product");

  const [barcodeInput, setBarcodeInput] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [openingCash, setOpeningCash] = useState(500);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI" | "SPLIT">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Active POS Session
  const loadSession = async () => {
    try {
      const res = await apiClient.get("/pos/session/active");
      if (res.data?.success) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to check active POS session.");
    }
  };

  // 2. Search Products
  const loadProducts = async () => {
    try {
      const res = await apiClient.get(`/products?search=${encodeURIComponent(search)}&limit=20`);
      if (res.data?.success) {
        setProducts(res.data.items || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadSession();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search]);

  // Focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [activeSession]);

  const handleOpenSession = async () => {
    try {
      const res = await apiClient.post("/pos/session/open", { openingCash });
      if (res.data?.success) {
        notify.success("POS Register Session opened!");
        setActiveSession(res.data.data);
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to open session.");
    }
  };

  // Barcode Lookup & Auto Add to Cart
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await apiClient.get(`/products/barcode/${encodeURIComponent(barcodeInput.trim())}`);
      if (res.data?.success && res.data?.data) {
        addToCart(res.data.data);
        setBarcodeInput("");
      } else {
        notify.error(`No product found for barcode '${barcodeInput}'.`);
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || `Barcode '${barcodeInput}' not found.`);
    }
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          barcode: product.barcode,
          price: product.selling_price,
          quantity: 1,
          taxRate: product.tax_rate || 0
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity * item.taxRate) / 100, 0);
  const grandTotal = subtotal + taxAmount;
  const changeAmount = Math.max(0, (paidAmount || grandTotal) - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      notify.error("Cart is empty.");
      return;
    }

    setCheckingOut(true);
    try {
      const payload = {
        sessionId: activeSession._id,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        paidAmount: paidAmount || grandTotal
      };

      const res = await apiClient.post("/pos/checkout", payload);
      if (res.data?.success) {
        notify.success("Sale completed! Receipt generated.");
        setLastReceipt(res.data.data);
        setCart([]);
        loadSession();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePrintReceipt = (receipt: any) => {
    const printWin = window.open("", "_blank", "width=420,height=600");
    if (!printWin) {
      window.print();
      return;
    }

    const itemsHtml = (receipt.items || []).map((item: any) => `
      <tr>
        <td style="padding: 4px 0;">
          <strong>${item.product_name || item.name || 'Product Item'}</strong>
          ${item.sku ? `<br/><span style="font-size: 9px; color: #666;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">₹${Number(item.unit_price || item.price || 0).toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0; font-weight: bold;">₹${Number(item.total || (item.price * item.quantity) || 0).toFixed(2)}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receipt.receipt_number || 'POS'}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 0 auto;
              padding: 12px;
              color: #000;
              font-size: 12px;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 6px 0; }
            th { border-bottom: 1px solid #000; padding-bottom: 4px; text-align: left; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0; font-size: 18px; font-weight: 900;">BRANDSPYRE STORE</h2>
            <div style="font-size: 10px; margin-top: 2px;">Point of Sale Retail Receipt</div>
            <div style="font-size: 10px;">GSTIN: 07AAAAA0000A1Z5</div>
          </div>

          <div class="divider"></div>

          <div>
            <div class="row"><span><strong>Receipt #:</strong></span> <span>${receipt.receipt_number || 'N/A'}</span></div>
            <div class="row"><span><strong>Date:</strong></span> <span>${new Date(receipt.created_at || Date.now()).toLocaleString()}</span></div>
            <div class="row"><span><strong>Payment Mode:</strong></span> <span>${receipt.payment_method || 'CASH'}</span></div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <div>
            <div class="row"><span>Subtotal:</span> <span>₹${Number(receipt.subtotal || receipt.grand_total || 0).toFixed(2)}</span></div>
            <div class="row"><span>Tax Amount:</span> <span>₹${Number(receipt.tax || 0).toFixed(2)}</span></div>
            <div class="divider"></div>
            <div class="row bold" style="font-size: 14px;">
              <span>GRAND TOTAL:</span>
              <span>₹${Number(receipt.grand_total || 0).toFixed(2)}</span>
            </div>
            ${receipt.paid_amount ? `
              <div class="row" style="margin-top: 4px;"><span>Amount Paid:</span> <span>₹${Number(receipt.paid_amount).toFixed(2)}</span></div>
              <div class="row"><span>Change Due:</span> <span>₹${Number(receipt.change_amount || 0).toFixed(2)}</span></div>
            ` : ''}
          </div>

          <div class="divider"></div>

          <div class="text-center" style="margin-top: 12px;">
            <p style="font-size: 11px; margin: 4px 0;" class="bold">*** Thank You For Shopping! ***</p>
            <p style="font-size: 9px; margin: 2px 0;">Please keep this receipt for returns/warranty.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <ModuleGuard requiredModule="POS">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Point of Sale (POS) Register"
          description="Real-time barcode scanning, cart processing, atomic stock deduction, and receipt checkout."
        />

        {/* OPEN SESSION MODAL IF NOT OPEN */}
        {!activeSession ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-md mx-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4 text-red-700">
              <Monitor size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Open POS Register Session</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Enter starting float cash balance to open your cashier register session.
            </p>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm font-bold"
                />
              </div>
              <button
                onClick={handleOpenSession}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                Open Register Session
              </button>
            </div>
          </div>
        ) : (
          /* POS TERMINAL INTERFACE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Products & Barcode Column */}
            <div className="lg:col-span-7 space-y-4">
              {/* Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSubmit} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3 shadow-md">
                <Barcode size={24} className="text-amber-400 flex-shrink-0" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode or type item code..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-mono font-bold text-amber-300 placeholder-slate-500"
                />
                <button type="submit" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg">
                  Add Item
                </button>
              </form>

              {/* Product Grid Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search catalog by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-red-700 dark:hover:border-red-600 transition-all group shadow-xs"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mb-1">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mb-2">{p.sku}</div>
                    <div className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">₹{p.selling_price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Cart & Checkout Column */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                  <ShoppingCart size={18} className="text-red-700" /> Current POS Order Cart
                </h3>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Cart is empty. Scan barcode or tap products to add items.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-500">₹{item.price} x {item.quantity}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 bg-slate-200 dark:bg-slate-800 rounded">
                            <Minus size={12} />
                          </button>
                          <span className="font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 bg-slate-200 dark:bg-slate-800 rounded">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Calculation Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>₹{taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1 border-t">
                    <span>Total Amount</span>
                    <span className="text-red-700 dark:text-red-500">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {(["CASH", "CARD", "UPI"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === mode ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  disabled={checkingOut || cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white font-extrabold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Complete POS Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {lastReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 border shadow-xl text-center space-y-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Receipt #{lastReceipt.receipt_number}</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs text-left space-y-1">
                <div><span className="font-bold">Total:</span> ₹{lastReceipt.grand_total}</div>
                <div><span className="font-bold">Payment Method:</span> {lastReceipt.payment_method}</div>
                <div><span className="font-bold">Date:</span> {new Date(lastReceipt.created_at || Date.now()).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintReceipt(lastReceipt)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  onClick={() => setLastReceipt(null)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 hover:bg-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleGuard>
  );
}
