import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  Building,
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerSettlements() {
  const [summary, setSummary] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [sumRes, setRes] = useStateResult(await Promise.allSettled([
        eventService.getFinancialSummary(),
        eventService.getOrganizerSettlements()
      ]));

      if (sumRes.status === "fulfilled" && sumRes.value.success) {
        setSummary(sumRes.value.data);
      }
      if (setRes.status === "fulfilled" && setRes.value.success) {
        setSettlements(setRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load financial records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for settled promises
  function useStateResult<T extends any[]>(promises: T): T {
    return promises;
  }

  const balance = summary?.balance || summary || {};
  const currency = balance?.currency || "INR";
  const currentPayable = balance?.pending_payable_balance ?? balance?.current_payable_balance ?? 0;
  const lifetimeGross = balance?.total_gross_sales ?? balance?.lifetime_gross_ticket_sales ?? 0;
  const lifetimeCommission = balance?.total_commission_deductions ?? balance?.lifetime_platform_commission ?? 0;
  const lifetimeDisbursed = balance?.total_settled_disbursed ?? balance?.lifetime_settled_amount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settlements & Financial Ledger"
        description="Transparent financial records, platform commission statements, and disbursement tracking."
        rightElement={
          <div className="flex items-center gap-3">
            <Link
              to="/event-management/orders"
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-2xs"
            >
              <Receipt className="w-4 h-4 text-primary-600" /> View Orders Ledger
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Balance</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {currency} {currentPayable.toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Pending next disbursement batch</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Ticket Sales</span>
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {currency} {lifetimeGross.toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Total revenue processed</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commission Deducted</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {currency} {lifetimeCommission.toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Brandspyre platform commission</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Payouts</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {currency} {lifetimeDisbursed.toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Successfully deposited</p>
        </div>
      </div>

      {/* Information Banner on Ledger Integrity */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-blue-900 space-y-1">
          <h4 className="font-bold text-sm text-blue-950">Immutable Double-Entry Ledger Protection</h4>
          <p className="leading-relaxed">
            All ticket revenue, discounts, taxes, and platform commission are calculated on the backend using authoritative
            snapshots and appended as balanced financial entries. Settlements are generated on rolling cycles and disbursed
            directly to your registered bank account.
          </p>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Settlement Statements & Batches</h3>
            <p className="text-xs text-gray-500">History of organizer payout statements generated by platform admin.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-700">No Settlement Batches Yet</h4>
            <p className="text-xs text-gray-400 mt-1">
              Your ticket sales are actively accumulating. The platform administration issues settlements on schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Batch Reference</th>
                  <th className="px-5 py-3.5">Settlement Period</th>
                  <th className="px-5 py-3.5">Gross Orders</th>
                  <th className="px-5 py-3.5">Commission</th>
                  <th className="px-5 py-3.5">Net Payout</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Disbursement Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((st: any) => (
                  <tr key={st._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-primary-600">
                      {st.settlement_number || st._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {new Date(st.period_start).toLocaleDateString()} - {new Date(st.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-900">
                      {st.currency || "INR"} {(st.gross_sales ?? st.gross_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-red-600 font-medium">
                      -{st.currency || "INR"} {(st.total_commission_deducted ?? st.commission_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-emerald-700">
                      {st.currency || "INR"} {(st.net_payout_amount ?? st.net_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-2xs font-semibold px-2.5 py-1 rounded-full ${
                          st.status === "COMPLETED" || st.status === "DISBURSED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : st.status === "APPROVED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : st.status === "PENDING_APPROVAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {st.status === "COMPLETED" ? "DISBURSED" : st.status === "PENDING_APPROVAL" ? "PENDING APPROVAL" : st.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {st.payout_reference ? (
                        <div>
                          <span className="font-mono text-2xs text-gray-700 block">UTR: {st.payout_reference}</span>
                          <span className="text-2xs text-gray-400">
                            {(st.paid_at || st.disbursed_at) ? new Date(st.paid_at || st.disbursed_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Processing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
