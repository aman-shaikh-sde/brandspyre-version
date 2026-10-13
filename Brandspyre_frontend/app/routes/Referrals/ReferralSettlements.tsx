import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import {
  CreditCard,
  CheckCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import MarketplacePaymentModal from '../../components/payments/MarketplacePaymentModal';

export default function ReferralSettlements() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalData, setPaymentModalData] = useState<any>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const [agrRes, txRes] = await Promise.all([
        apiClient.get(`/lead-exchange/agreements`),
        apiClient.get(`/lead-exchange/transactions`)
      ]);

      if (agrRes.data?.success) setAgreements(agrRes.data.data);
      if (txRes.data?.success) setTransactions(txRes.data.data);
    } catch (err) {
      console.error('Error fetching settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (tx: any) => {
    setPaymentModalData({
      invoiceId: tx.invoice_id?._id || tx.invoice_id,
      transactionId: tx._id,
      paymentRequestId: tx.invoice_id?.payment_request_id?._id || tx.invoice_id?.payment_request_id,
      invoiceNumber: tx.invoice_id?.invoice_number || tx.transaction_code,
      title: `Referral Settlement for ${tx.transaction_code}`,
      totalAmount: tx.total_amount || 0,
      platformFee: tx.platform_commission || Math.round((tx.total_amount || 0) * 0.10 * 100) / 100,
      platformTax: tx.platform_commission_tax || Math.round((tx.total_amount || 0) * 0.018 * 100) / 100,
      receiverAmount: tx.receiver_net_amount || Math.round((tx.total_amount || 0) * 0.882 * 100) / 100,
      receiverName: tx.provider_tenant_id?.company_name || tx.provider_tenant_id?.name || "Referral Provider",
      currency: tx.currency || 'INR'
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider">
          Multi-Provider Settlement Ledger (Razorpay + Stripe)
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
          Referral Earnings & Settlement Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated 10% platform commission calculation, transparent GST breakdown, and direct multi-gateway organization payouts
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
            Commission & Referral Fee Transactions
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {transactions.length} Total Transaction(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                <th className="p-3">Tx Code</th>
                <th className="p-3">Beneficiary (Provider)</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Gross Payable</th>
                <th className="p-3">Platform Fee (10%)</th>
                <th className="p-3">GST on Fee (18%)</th>
                <th className="p-3">Net Payout (88.2%)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Loading settlement ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No referral settlement transactions recorded yet. When a referral status becomes <strong>CONVERTED</strong>, transactions will auto-populate here with 10% platform fee calculations!
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const fee = tx.platform_commission || Math.round((tx.total_amount || 0) * 0.10 * 100) / 100;
                  const tax = tx.platform_commission_tax || Math.round(fee * 0.18 * 100) / 100;
                  const net = tx.receiver_net_amount || Math.max(0, Math.round(((tx.total_amount || 0) - (fee + tax)) * 100) / 100);
                  const isPaid = tx.status === 'paid' || tx.status === 'settled';

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.transaction_code}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.provider_tenant_id?.company_name || tx.provider_tenant_id?.name || "Provider Organization"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] uppercase">
                          {tx.stage_reached || 'CONVERTED'}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        ₹{(tx.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">
                        ₹{fee.toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-500">
                        ₹{tax.toLocaleString()}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{net.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleOpenPayment(tx)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <CreditCard size={14} />
                            <span>Pay Settlement</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                            <CheckCircle size={14} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketplace Payment Modal */}
      {paymentModalData && (
        <MarketplacePaymentModal
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          onSuccess={() => {
            setPaymentModalData(null);
            fetchSettlements();
          }}
          {...paymentModalData}
        />
      )}
    </div>
  );
}
