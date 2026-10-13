import React from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  Shield,
  Layers,
  ArrowDown
} from "lucide-react";
import { HeroSection } from "../../components/public/HeroSection";
import { BlogCard } from "../../components/public/BlogCard";
import { CTASection } from "../../components/public/CTASection";
import { BASE_URL } from "../../constants/api";

const PRODUCT_MODULES = [
  { name: "CRM & Sales", desc: "Lead capture, pipeline stages, client records, and quotations.", href: "/features#crm" },
  { name: "Projects & Tasks", desc: "Milestones, deliverables, staff timesheets, and task boards.", href: "/features#operations" },
  { name: "HR & Workforce", desc: "Attendance check-in, shift rosters, leave requests, and payroll slips.", href: "/features#hrms" },
  { name: "Commercial Billing", desc: "Success-stage agreements, automated billing, and invoice ledgers.", href: "/features#billing" },
  { name: "Inventory & Warehouses", desc: "Multi-branch stock balancing, purchase orders, and reorder levels.", href: "/features#inventory" },
  { name: "Retail Point of Sale", desc: "Barcode checkout, cash shift balancing, and thermal receipt printing.", href: "/features#pos" },
  { name: "Production & BOM", desc: "Bill of Materials, work orders, and raw material deduction.", href: "/features#manufacturing" },
  { name: "Business AI", desc: "Permission-scoped operational summaries, reports, and search.", href: "/features#ai" },
];

export default function MarketingHome() {
  const [latestPosts, setLatestPosts] = React.useState<any[]>([]);
  const [featuredQuote, setFeaturedQuote] = React.useState<any>(null);
  const [loadingPosts, setLoadingPosts] = React.useState(true);

  React.useEffect(() => {
    // Fetch latest 3 blogs
    fetch(`${BASE_URL}/public/blog?limit=3`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setLatestPosts(data.data);
        }
      })
      .catch((err) => console.warn("Failed to load homepage blogs:", err))
      .finally(() => setLoadingPosts(false));

    // Fetch featured customer quote
    fetch(`${BASE_URL}/public/testimonials?featured=true&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setFeaturedQuote(data.data[0]);
        }
      })
      .catch((err) => console.warn("Failed to load featured quote:", err));
  }, []);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Product Introduction & Department Workflow Flow */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 sm:mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Connected Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              One platform. Different teams. Connected workflows.
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              When departments use separate software tools, work gets lost in handoffs. Brandspyre connects every stage of your business operations in real time.
            </p>
          </div>

          {/* Clean Visual Workflow Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 lg:gap-4 text-xs font-medium">
            <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 relative">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Step 01</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales & CRM</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Deal won and commercial proposal approved.</p>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">→</div>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 relative">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Step 02</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Projects</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Milestones and task workspaces initialize automatically.</p>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">→</div>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 relative">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Step 03</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Purchasing</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Required items and supplier orders trigger without manual reentry.</p>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">→</div>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 relative">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Step 04</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inventory</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Stock reservations and dispatch manifests balance across branches.</p>
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">→</div>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Step 05</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Billing</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Invoices and client settlement ledgers generate from verified deliverables.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Capabilities (Alternating Layouts with Real Product Previews) */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Capability 1: CRM & Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Revenue & Client Relationships
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                CRM & Sales
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage relationships, opportunities, and client deals in one clear view. Track deals through structured pipeline stages, log communications, and generate professional proposals without switching apps.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Visual pipeline stages with custom qualification criteria</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Integrated quotation builder with automated GST calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Complete client touchpoint history and agreement archives</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/features#crm"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                >
                  <span>Explore CRM workflows</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Realistic Product UI Snippet: Deal Pipeline */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Active Opportunity Ledger</span>
                <span className="font-mono text-slate-400">Pipeline: ₹34,20,000</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Apex Supply Chain Corp</div>
                    <div className="text-[11px] text-slate-500">Stage: Contract Review • Rep: Priya K.</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">₹8,50,000</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">80% Probability</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Sterling Fabricators</div>
                    <div className="text-[11px] text-slate-500">Stage: Solution Proposal • Rep: Arun V.</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">₹6,20,000</div>
                    <div className="text-[10px] text-slate-500">60% Probability</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Vanguard Retail Networks</div>
                    <div className="text-[11px] text-slate-500">Stage: Agreement Signed • Rep: Karan M.</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">₹12,40,000</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Closed Won</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Operations & Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Realistic Product UI Snippet: Milestones */}
            <div className="order-2 lg:order-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Project Milestone Execution</span>
                <span className="font-mono text-slate-400">Metro Logistics Client</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Milestone 1: Architectural Audit</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">Completed</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Signed off by Client Rep • 42 billable hours logged</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Milestone 2: Multi-Branch Rollout</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">In Progress</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Target Date: 18 Sep • 3 tasks remaining</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Milestone 3: Final Acceptance</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">Upcoming</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Scheduled upon Milestone 2 validation</div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Execution & Delivery
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Operations & Projects
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Plan projects, assign tasks, and track deliveries alongside financial milestones. Connect hours worked directly to client agreements so every deliverable is accounted for.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Milestone-based delivery linked to commercial release stages</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Employee timesheet check-in / check-out with hourly logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Collaborative project account ledgers and deliverable sign-offs</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/features#operations"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                >
                  <span>Explore operations workflows</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Capability 3: HR & Workforce */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                People Operations
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                HR & Workforce
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage your team from hiring to monthly payroll. Record staff attendance across branches, coordinate leave requests, and generate statutory payroll slips without separate HR software.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Biometric and geofenced attendance tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Department shift rosters and leave approval hierarchies</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Automated salary slip calculation with exportable PDFs</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/features#hrms"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                >
                  <span>Explore HRMS workflows</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Realistic Product UI Snippet: HRMS */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Workforce Operations</span>
                <span className="font-mono text-slate-400">Today • 48 Staff</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Branch 1: Central Operations</div>
                    <div className="text-[11px] text-slate-500">22 / 22 Checked in on time</div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Present</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Branch 2: Downtown Retail</div>
                    <div className="text-[11px] text-slate-500">14 Checked in • 1 Approved Leave</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Shift Active</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Monthly Payroll Processing</div>
                    <div className="text-[11px] text-slate-500">August salary slips verified</div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Ready to Disburse</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Finance & Commercial Billing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Realistic Product UI Snippet: Invoices */}
            <div className="order-2 lg:order-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Commercial Settlement Ledger</span>
                <span className="font-mono text-slate-400">Direct B2B Settlements</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Invoice #INV-2026-104</div>
                    <div className="text-[11px] text-slate-500">Apex Supply • Milestone 2 Billing</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">₹2,40,000</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Invoice #INV-2026-108</div>
                    <div className="text-[11px] text-slate-500">Horizon Dynamics • Initial Milestone</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 dark:text-white">₹1,80,000</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Net 15 Days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Commercial Engine
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Finance & Billing
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect client agreements directly to billing stages. Automatically generate GST-compliant invoices when project milestones are signed off, and reconcile client accounts without manual spreadsheet formulas.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Success-stage invoicing tied to deliverable completion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Automated tax and GST calculation with PDF generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-slate-400" />
                  <span>Direct client payment status tracking and aging ledgers</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/features#billing"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                >
                  <span>Explore billing workflows</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Business Operations Statement (The Disconnected Tools Problem) */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Operational Reality
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Your business shouldn't run across disconnected tools.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Most companies don't fail from lack of effort — they slow down because each department operates in its own silo. Sales uses one app, operations uses another, HR logs attendance on a separate device, and finance spends days reconciling invoices by hand.
              </p>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Brandspyre replaces this software sprawl with a single, synchronized platform where data moves freely between teams.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                <span className="text-red-600 font-bold">✕ Disconnected SaaS Stack</span>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400 pt-2">
                  <li>• Paying 5-7 separate subscription fees per seat</li>
                  <li>• Sales quotes don't sync with warehouse inventory</li>
                  <li>• Staff attendance isolated from project timesheets</li>
                  <li>• Month-end billing takes days of manual CSV exports</li>
                  <li>• Conflicting data across department spreadsheets</li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-2">
                <span className="text-red-700 dark:text-red-400 font-bold">✓ BRANDSPYRE Connected Platform</span>
                <ul className="space-y-2 text-slate-700 dark:text-slate-300 pt-2">
                  <li>• One unified platform for all core business functions</li>
                  <li>• Closed deals trigger project workspaces and inventory</li>
                  <li>• Verified attendance feeds directly into timesheets</li>
                  <li>• Milestone approvals generate client invoices instantly</li>
                  <li>• Real-time visibility across all branch locations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Product Modules Architecture List */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Platform Architecture
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Modular tools built on the same foundation.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Start with the modules your business needs today, and activate specialized capabilities as your teams expand.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCT_MODULES.map((mod, idx) => (
              <Link
                key={idx}
                to={mod.href}
                className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                    {mod.name}
                  </h4>
                  <span className="text-slate-300 dark:text-slate-700 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">→</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {mod.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Security & Governance */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Enterprise Governance
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data control, tenant isolation, and granular access.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enterprise software requires clear boundaries. Brandspyre isolates corporate data at the database level and enforces strict role-based permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Tenant Isolation</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Every organization's database records are strictly scoped by tenant identifier. Data cannot leak between organizations or subsidiary workspaces.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Role & Permission Control</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Define custom roles with granular read, write, and approval permissions. Frontline staff see only what their responsibilities require.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Audit Trails & Logs</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Financial adjustments, contract stage updates, and sensitive personnel actions are timestamped and logged with user attribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Customer Experience Quote */}
      <section className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer Experience
          </p>
          <blockquote className="text-xl sm:text-2xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            &ldquo;{featuredQuote?.testimonial_quote || "Connecting our project milestones directly to client billing eliminated our month-end reconciliation delays. Our operations and finance teams now work from the exact same numbers."}&rdquo;
          </blockquote>
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-900 dark:text-white">
              {featuredQuote ? `${featuredQuote.person_name} (${featuredQuote.person_role})` : "Operations Director"}
            </span>
            <span className="mx-2">•</span>
            <span>{featuredQuote ? featuredQuote.company_name || featuredQuote.sector : "Multi-Branch Logistics & Distribution"}</span>
          </div>
        </div>
      </section>

      {/* 8. Latest Insights (Blog) */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Articles & Perspectives
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Latest Insights
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
            >
              <span>View all articles</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6" />
              ))}
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <BlogCard
                  key={post.slug || post._id}
                  post={{
                    slug: post.slug,
                    title: post.title,
                    excerpt: post.excerpt,
                    category: post.category_name,
                    author: {
                      name: post.author_name,
                      role: post.author_role,
                    },
                    date: post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recent",
                    readTime: `${post.read_time_minutes || 5} min read`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              New insights coming soon.
            </div>
          )}
        </div>
      </section>

      {/* 9. Final CTA */}
      <CTASection
        title="Ready to simplify the way your business operates?"
        subtitle="Set up your organization workspace or talk with our team."
        primaryButtonLabel="Get Started"
        primaryButtonHref="/tenant-registration"
        secondaryButtonLabel="Talk to us"
        secondaryButtonHref="/contact"
      />
    </div>
  );
}
