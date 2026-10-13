import React, { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Check,
  Building2,
  FolderKanban,
  Users,
  Calculator,
  Package,
  ShoppingCart,
  Factory,
  Bot
} from "lucide-react";
import { CTASection } from "../../components/public/CTASection";

const MODULE_SECTIONS = [
  {
    id: "crm",
    category: "CRM & Sales",
    headline: "Manage relationships, opportunities, and deals.",
    description: "Brandspyre CRM gives your team complete visibility from initial inquiry through negotiation and signed contract. Standardize deal stages, track correspondence, and generate quotations without disconnected spreadsheets.",
    capabilities: [
      "Visual sales pipeline stages with qualification criteria",
      "Quotation builder with automated tax and discount schedules",
      "Lead conversion tracking and client interaction timelines",
      "Team deal allocation and revenue forecasting"
    ],
    ctaText: "Explore CRM & Sales",
    ctaLink: "/tenant-registration",
    previewType: "crm",
  },
  {
    id: "operations",
    category: "Projects & Operations",
    headline: "Plan work, milestones, and delivery.",
    description: "Bridge the divide between operational delivery and client agreements. Divide client work into deliverables, manage tasks, log billable timesheets, and track milestone sign-offs in one place.",
    capabilities: [
      "Milestone-based delivery schedules tied to financial agreements",
      "Task management with Kanban and list views",
      "Employee timesheet check-in / check-out with hourly logging",
      "Client deliverable repositories and sign-off verification"
    ],
    ctaText: "Explore Projects & Operations",
    ctaLink: "/tenant-registration",
    previewType: "projects",
  },
  {
    id: "hrms",
    category: "HR & Workforce",
    headline: "Manage people, attendance, and payroll.",
    description: "Coordinate workforce operations across branches and facilities. Record biometric and GPS attendance, manage leave requests, organize shift rosters, and generate monthly payroll slips automatically.",
    capabilities: [
      "Biometric and geofenced attendance tracking",
      "Multi-tier leave application and approval workflow",
      "Department shift rosters and rotation management",
      "Automated monthly payroll slip calculation with exportable PDFs"
    ],
    ctaText: "Explore Workforce Management",
    ctaLink: "/tenant-registration",
    previewType: "hrms",
  },
  {
    id: "billing",
    category: "Finance & Commercial Billing",
    headline: "Billing, payments, and commercial workflows.",
    description: "A structured commercial settlement engine designed for B2B agreements. Configure master contracts with success-stage conditions, generate invoices upon signed deliverables, and track payment receipts with complete audit trails.",
    capabilities: [
      "Success-based billing stages tied to milestone deliverables",
      "GST-compliant tax invoices in PDF format",
      "Organization-to-organization settlement ledgers",
      "Payment aging reports and overdue reminders"
    ],
    ctaText: "Explore Commercial Billing",
    ctaLink: "/tenant-registration",
    previewType: "billing",
  },
  {
    id: "inventory",
    category: "Inventory & Warehousing",
    headline: "Multi-branch stock balancing and purchasing.",
    description: "Maintain real-time inventory visibility across central warehouses and retail stores. Automate purchase order generation when stock hits reorder levels, and track inter-branch transit manifests without guesswork.",
    capabilities: [
      "Central warehouse and multi-store stock tracking",
      "Automated reorder point alerts and purchase order drafting",
      "Inter-branch transfer requests and dispatch receipts",
      "Supplier catalogs and vendor payment ledgers"
    ],
    ctaText: "Explore Inventory Management",
    ctaLink: "/tenant-registration",
    previewType: "inventory",
  },
  {
    id: "pos",
    category: "Retail Point of Sale",
    headline: "High-speed checkout with store synchronization.",
    description: "An intuitive touchscreen POS terminal built for retail outlets and trade counters. Handle high-speed barcode scanning, split tenders, cash register sessions, and thermal receipts while synchronizing directly with central inventory.",
    capabilities: [
      "Fast barcode scanning and quick SKU search",
      "Split tender payment support (Cash, Card, UPI)",
      "Daily cash register shift sessions and variance auditing",
      "Instant stock decrement synchronized with warehouse records"
    ],
    ctaText: "Explore Retail POS",
    ctaLink: "/tenant-registration",
    previewType: "pos",
  },
  {
    id: "manufacturing",
    category: "Production & Manufacturing",
    headline: "Bill of Materials and shop-floor work orders.",
    description: "Connect sales orders directly to production routing. Define multi-level Bills of Materials (BOM), dispatch work orders through assembly stages, track component consumption, and allocate actual finished goods costs.",
    capabilities: [
      "Multi-level Bill of Materials (BOM) with waste factors",
      "Stage-by-stage work order routing controls",
      "Automated raw material stock reservation and deduction",
      "Production workforce timesheet and labor tracking"
    ],
    ctaText: "Explore Manufacturing",
    ctaLink: "/tenant-registration",
    previewType: "manufacturing",
  },
  {
    id: "ai",
    category: "Business AI Assistant",
    headline: "Permission-scoped operational intelligence.",
    description: "Query operational data in natural language without data leakage risks. The Brandspyre AI assistant operates strictly within your organization's permission boundary, summarizing monthly performance and drafting client communications.",
    capabilities: [
      "Natural language querying across sales, HR, and project records",
      "Automated operational summaries and executive digests",
      "Strict role-based permission boundary (users only query authorized data)",
      "Instant drafts for customer proposals and follow-ups"
    ],
    ctaText: "Explore Business AI",
    ctaLink: "/tenant-registration",
    previewType: "ai",
  }
];

import featuresHubImg from "../../assets/features_operations_hub.jpg";

export default function FeaturesPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const visibleSections = activeFilter === "all"
    ? MODULE_SECTIONS
    : MODULE_SECTIONS.filter((s) => s.id === activeFilter);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Page Header with High-Tech Operations Command Center Background */}
      <section className="relative pt-18 pb-16 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
        {/* Operations Hub Background Environment */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div
            className="w-full h-full bg-cover bg-top bg-no-repeat opacity-85 dark:opacity-25"
            style={{
              backgroundImage: `url(${featuresHubImg})`,
              backgroundAttachment: "fixed",
            }}
          />
          {/* Luminous center mask for maximum typography readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 36%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 52%, rgba(255, 255, 255, 0.15) 86%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-slate-950/70 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Platform Capabilities
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white max-w-2xl">
            Features
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Everything your teams need. Nothing disconnected.
          </p>

          {/* Quick Jump Filter Bar */}
          <div className="pt-6 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${activeFilter === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              All Modules ({MODULE_SECTIONS.length})
            </button>
            {MODULE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveFilter(sec.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${activeFilter === sec.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                {sec.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Feature Sections */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {visibleSections.map((sec, index) => {
          const isReversed = index % 2 === 1;

          return (
            <section
              key={sec.id}
              id={sec.id}
              className="py-20 sm:py-24 bg-white dark:bg-slate-950 transition-colors"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${isReversed ? "lg:grid-flow-dense" : ""
                  }`}>
                  {/* Narrative Column */}
                  <div className={`lg:col-span-5 space-y-5 ${isReversed ? "lg:col-start-8" : ""}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                      {sec.category}
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {sec.headline}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sec.description}
                    </p>

                    <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {sec.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <Link
                        to={sec.ctaLink}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                      >
                        <span>{sec.ctaText}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* UI Preview Column */}
                  <div className={`lg:col-span-7 ${isReversed ? "lg:col-start-1" : ""}`}>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 shadow-xs space-y-4">
                      {/* Window Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <span>{sec.category}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">Live Module</span>
                      </div>

                      {/* Mockup Content Based on Type */}
                      {sec.previewType === "crm" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Apex Supply Chain Corp</div>
                              <div className="text-[11px] text-slate-500">Contact: Rajesh S. • Proposal Stage</div>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">₹8,50,000</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Metro Logistics Hub</div>
                              <div className="text-[11px] text-slate-500">Contact: Arun P. • Negotiation Stage</div>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">₹5,40,000</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Horizon Strategic Partners</div>
                              <div className="text-[11px] text-slate-500">Contact: Devina R. • Won Deal</div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹14,00,000</span>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "projects" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 dark:text-white">Milestone 1: Architectural Audit</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Approved</span>
                            </div>
                            <div className="text-[11px] text-slate-500">Deliverable signed off • 42 billable hours logged</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 dark:text-white">Milestone 2: Multi-Branch Rollout</span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">In Progress</span>
                            </div>
                            <div className="text-[11px] text-slate-500">Due 18 Sep • 3 tasks remaining in sprint</div>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "hrms" && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500">Today's Attendance</span>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">46 / 48</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Biometric verified</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500">Monthly Payroll Run</span>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">Verified</p>
                            <span className="text-[10px] text-slate-400">52 slips generated</span>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "billing" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Invoice #INV-2026-084</div>
                              <div className="text-[11px] text-slate-500">Apex Supply • Milestone 2 Billing</div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-slate-900 dark:text-white">₹1,85,000</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">GST Settled</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "inventory" && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500">Central Warehouse</span>
                            <p className="font-bold text-slate-900 dark:text-white font-mono">1,840 Units</p>
                            <span className="text-[10px] text-slate-400">Normal operating levels</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-slate-500">Branch Transfers</span>
                            <p className="font-bold text-slate-900 dark:text-white font-mono">2 In Transit</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Manifest logged</span>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "pos" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Register Session #412</div>
                              <div className="text-[11px] text-slate-500">Retail Terminal 1 • Cashier: Priya S.</div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-slate-900 dark:text-white">₹42,800</div>
                              <div className="text-[10px] text-slate-400">32 checkouts today</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "manufacturing" && (
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">Work Order #WO-890</div>
                              <div className="text-[11px] text-slate-500">BOM: Industrial Unit B • Stage 2 Assembly</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                              Materials Deducted
                            </span>
                          </div>
                        </div>
                      )}

                      {sec.previewType === "ai" && (
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                          <div className="text-slate-500 font-mono text-[11px]">&gt; Query: "Summarize pending milestone invoices for this week"</div>
                          <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                            Found 2 invoices totaling ₹3,25,000 due within 7 days. All deliverables have been marked as verified by the project lead.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Final Call to Action */}
      <CTASection
        title="Ready to see Brandspyre in action?"
        subtitle="Set up your organization workspace with an instant 14-day evaluation."
      />
    </div>
  );
}
