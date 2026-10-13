import { useState, useEffect, useRef } from "react";
import Modal from "src/component/Modal";
import { Printer, Loader2 } from "lucide-react";
import { organizationPaymentApi } from "src/services/organizationPaymentService";

interface Props {
  paymentId: string | null;
  onClose: () => void;
}

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentReceiptModal({ paymentId, onClose }: Props) {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paymentId) { setPayment(null); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await organizationPaymentApi.getPaymentReceipt(paymentId);
        setPayment(res.data?.data || null);
      } catch { setPayment(null); }
      finally { setLoading(false); }
    };
    fetch();
  }, [paymentId]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt ${payment?.receipt_number || ""}</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1f2937; max-width: 700px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; font-weight: 600; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h2 { margin: 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>${printRef.current.innerHTML}
      <div class="footer"><p>This is an automated computer-generated receipt issued via Razorpay Route.</p></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const receiver = payment?.receiver_tenant_id && typeof payment.receiver_tenant_id === "object" ? payment.receiver_tenant_id : null;
  const request = payment?.payment_request_id && typeof payment.payment_request_id === "object" ? payment.payment_request_id : null;

  return (
    <Modal isVisible={!!paymentId} onClose={onClose} title="Official Payment Receipt" maxWidth="2xl">
      {loading ? (
        <div className="flex justify-center items-center py-10 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Generating receipt...
        </div>
      ) : !payment ? (
        <p className="text-center text-slate-500 py-6">Receipt record not found.</p>
      ) : (
        <div className="space-y-4 p-2 text-xs">
          <div ref={printRef} className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{receiver?.company_name || receiver?.name || "Organization"}</h3>
              {receiver?.billing_email && <p className="text-slate-500 text-[11px]">{receiver.billing_email}</p>}
              <div className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                PAYMENT RECEIPT
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
              <div><span className="text-slate-400 block">Receipt Number</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.receipt_number}</span></div>
              <div><span className="text-slate-400 block">Transaction Code</span><span className="font-mono text-slate-800 dark:text-slate-200">{payment.transaction_code}</span></div>
              <div><span className="text-slate-400 block">Payment Date</span><span className="font-medium text-slate-800 dark:text-slate-200">{payment.captured_at ? new Date(payment.captured_at).toLocaleString() : new Date(payment.created_at).toLocaleString()}</span></div>
              <div><span className="text-slate-400 block">Status</span><span className="font-bold text-emerald-600 uppercase">{payment.status}</span></div>
              {request?.payer_name && <div><span className="text-slate-400 block">Paid By</span><span className="font-semibold text-slate-800 dark:text-slate-200">{request.payer_name}</span></div>}
              {payment.payment_method && <div><span className="text-slate-400 block">Method</span><span className="uppercase text-slate-800 dark:text-slate-200">{payment.payment_method}</span></div>}
              {payment.provider_payment_id && <div className="col-span-2"><span className="text-slate-400 block">Razorpay Payment ID</span><span className="font-mono text-slate-800 dark:text-slate-200">{payment.provider_payment_id}</span></div>}
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Item Description</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-3 py-2 font-medium">Gross Payment Collected</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">{fmt(payment.amount)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-500">Platform Commission Fee</td>
                    <td className="px-3 py-2 text-right text-slate-500">- {fmt(payment.platform_fee)}</td>
                  </tr>
                  {payment.tax_on_platform_fee > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-slate-500">GST on Platform Fee (18%)</td>
                      <td className="px-3 py-2 text-right text-slate-500">- {fmt(payment.tax_on_platform_fee)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">Net Receiver Payout</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600 text-sm">{fmt(payment.receiver_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {receiver?.gst_number && (
              <div className="text-[11px] text-slate-400 pt-1">
                GSTIN: {receiver.gst_number} {receiver.pan_number ? ` • PAN: ${receiver.pan_number}` : ""}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5" onClick={handlePrint}>
              <Printer size={13} /> Print Receipt
            </button>
            <button className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
