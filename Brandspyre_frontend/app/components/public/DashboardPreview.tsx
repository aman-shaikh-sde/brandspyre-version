import React, { useState } from "react";
import {
  Users,
  Target,
  FolderKanban,
  Calculator,
  Package,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  ArrowRight,
  Filter,
  Check
} from "lucide-react";

export const DashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"crm" | "projects" | "hrms" | "finance" | "inventory">("crm");

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-left font-sans transition-colors">
      {/* App Frame Header / Top Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Window controls & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
            <Building2 size={13} className="text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Brandsypre Groups</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span>Live Workspace</span>
          </div>
        </div>

        {/* Interactive Module Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("crm")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${activeTab === "crm"
                ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            CRM & Deals
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${activeTab === "projects"
                ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Operations & Tasks
          </button>
          <button
            onClick={() => setActiveTab("hrms")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${activeTab === "hrms"
                ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            HR & Attendance
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${activeTab === "finance"
                ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Commercial Billing
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${activeTab === "inventory"
                ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Inventory & POS
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 min-h-[320px]">
        {/* CRM View */}
        {activeTab === "crm" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">Active Sales Pipeline</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">18 Deals</span>
              </div>
              <div className="text-slate-500 font-medium">Pipeline Value: <span className="font-bold text-slate-900 dark:text-white font-mono">₹38,40,000</span></div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Qualified */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Qualified</span>
                  <span className="text-[11px] text-slate-400 font-mono">6</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Sterling Supplies Ltd</div>
                  <div className="text-[11px] text-slate-500">Multi-warehouse migration</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span>₹4,50,000</span>
                    <span className="text-slate-400">Priya K.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Horizon Dynamics</div>
                  <div className="text-[11px] text-slate-500">POS & Inventory rollout</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span>₹2,80,000</span>
                    <span className="text-slate-400">Arun V.</span>
                  </div>
                </div>
              </div>

              {/* Proposal Sent */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Proposal Sent</span>
                  <span className="text-[11px] text-slate-400 font-mono">5</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Vanguard Retailers</div>
                  <div className="text-[11px] text-slate-500">5 Branch licenses + POS</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span>₹8,20,000</span>
                    <span className="text-slate-400">Priya K.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Nova Packaging</div>
                  <div className="text-[11px] text-slate-500">BOM & Manufacturing OS</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span>₹6,10,000</span>
                    <span className="text-slate-400">Karan M.</span>
                  </div>
                </div>
              </div>

              {/* Negotiation */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Negotiation</span>
                  <span className="text-[11px] text-slate-400 font-mono">4</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Zenith Tech Corp</div>
                  <div className="text-[11px] text-slate-500">Commercial milestone billing</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span>₹11,40,000</span>
                    <span className="text-slate-400">Arun V.</span>
                  </div>
                </div>
              </div>

              {/* Closed Won */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Closed Won</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">3</span>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white">Metro Logistics Hub</div>
                  <div className="text-[11px] text-slate-500">Annual enterprise agreement</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹5,40,000</span>
                    <span className="text-slate-400">Signed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Analytics: Deal Conversion, Revenue Overview, Tasks Due */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Deal Conversion Donut */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Deal Conversion</div>
                  <div className="text-[10px] text-slate-400 mb-2">This Month</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">Won</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-auto">12</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">In Progress</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-auto">4</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">Lost</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-auto">2</span>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-center pr-2">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="3.6"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500"
                      strokeDasharray="68, 100"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono text-slate-900 dark:text-white">68%</span>
                </div>
              </div>

              {/* Revenue Overview Trend */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Revenue Overview</span>
                    <span className="text-[10px] text-slate-400">This Month</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">₹24,80,000</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">+18.5% vs last month</span>
                  </div>
                </div>

                <div className="pt-2">
                  <svg className="w-full h-9" viewBox="0 0 160 36">
                    <path
                      d="M0,30 Q30,26 60,20 T110,12 T160,4"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="4" cy="30" r="2.5" fill="#3b82f6" />
                    <circle cx="60" cy="20" r="2.5" fill="#3b82f6" />
                    <circle cx="110" cy="12" r="2.5" fill="#3b82f6" />
                    <circle cx="156" cy="4" r="2.5" fill="#3b82f6" />
                  </svg>
                </div>
              </div>

              {/* Tasks Due List */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Tasks Due</span>
                  <span className="text-[10px] font-mono text-slate-400">12 Tasks</span>
                </div>
                <div className="space-y-1.5 pt-0.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="truncate">Follow up with Acme Corp</span>
                    </div>
                    <span className="text-red-600 font-semibold text-[10px] whitespace-nowrap">Today</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="truncate">Send proposal to Global Ltd.</span>
                    </div>
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">Tomorrow</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="truncate">Review contract terms</span>
                    </div>
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">2 Sep</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects View */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Active Project Milestones</span>
              <span className="text-slate-500 font-medium">8 Ongoing Engagements</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 font-semibold">Project & Milestone</th>
                    <th className="p-3 font-semibold">Assigned Team</th>
                    <th className="p-3 font-semibold">Due Date</th>
                    <th className="p-3 font-semibold">Deliverable Status</th>
                    <th className="p-3 font-semibold text-right">Payment Release</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Metro Logistics • Milestone 2: Fleet Routing</td>
                    <td className="p-3">Systems Engineering (4)</td>
                    <td className="p-3 font-mono text-slate-500">12 Sep 2026</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Verified</span></td>
                    <td className="p-3 text-right font-mono font-bold">₹1,80,000</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Vanguard Retail • Milestone 1: POS Deployment</td>
                    <td className="p-3">Field Operations (3)</td>
                    <td className="p-3 font-mono text-slate-500">18 Sep 2026</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">In Progress</span></td>
                    <td className="p-3 text-right font-mono font-bold">₹2,40,000</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Apex Supply • Milestone 3: ERP Integration</td>
                    <td className="p-3">Core Integration (5)</td>
                    <td className="p-3 font-mono text-slate-500">25 Sep 2026</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">Upcoming</span></td>
                    <td className="p-3 text-right font-mono font-bold">₹3,20,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HRMS View */}
        {activeTab === "hrms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Staff Attendance & Payroll Ledger</span>
              <span className="text-slate-500 font-medium">All Branches • Today</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 font-semibold">Employee</th>
                    <th className="p-3 font-semibold">Department & Branch</th>
                    <th className="p-3 font-semibold">Shift Check-in</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">August Salary Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Rahul Sharma</td>
                    <td className="p-3">Operations • Mumbai Central</td>
                    <td className="p-3 font-mono text-slate-500">09:04 AM (Biometric)</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Present</span></td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">Disbursed</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Ananya Deshmukh</td>
                    <td className="p-3">Finance • Pune HQ</td>
                    <td className="p-3 font-mono text-slate-500">09:15 AM (Mobile GPS)</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Present</span></td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">Disbursed</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">Siddharth Nair</td>
                    <td className="p-3">Sales • Bangalore Branch</td>
                    <td className="p-3 font-mono text-slate-400">—</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">Approved Leave</span></td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">Disbursed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Finance View */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Commercial Invoices & Settlements</span>
              <span className="text-slate-500 font-medium">GST Compliant Ledger</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 font-semibold">Invoice #</th>
                    <th className="p-3 font-semibold">Client Organization</th>
                    <th className="p-3 font-semibold">Milestone Ref</th>
                    <th className="p-3 font-semibold">Settlement Status</th>
                    <th className="p-3 font-semibold text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">INV-2026-088</td>
                    <td className="p-3 font-medium">Apex Supply Chain Corp</td>
                    <td className="p-3 text-slate-500">Milestone 2 (Signed)</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Paid (UPI/NEFT)</span></td>
                    <td className="p-3 text-right font-mono font-bold">₹2,12,400</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">INV-2026-089</td>
                    <td className="p-3 font-medium">Sterling Supplies Ltd</td>
                    <td className="p-3 text-slate-500">Milestone 1 (Signed)</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">Net 15 Days</span></td>
                    <td className="p-3 text-right font-mono font-bold">₹1,77,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory View */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Multi-Branch Stock Balance</span>
              <span className="text-slate-500 font-medium">Live POS Sync</span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 font-semibold">SKU & Item Name</th>
                    <th className="p-3 font-semibold">Central Warehouse</th>
                    <th className="p-3 font-semibold">Downtown Store POS</th>
                    <th className="p-3 font-semibold">Airport Store POS</th>
                    <th className="p-3 font-semibold text-right">Reorder Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">SKU-IND-402 • Industrial Sensor Hub</td>
                    <td className="p-3 font-mono">420 Units</td>
                    <td className="p-3 font-mono">18 Units</td>
                    <td className="p-3 font-mono">12 Units</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Normal</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">SKU-RET-881 • Barcode Scanner Wireless</td>
                    <td className="p-3 font-mono">85 Units</td>
                    <td className="p-3 font-mono text-amber-600 font-bold">3 Units</td>
                    <td className="p-3 font-mono">8 Units</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">Low Stock Alert</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPreview;
