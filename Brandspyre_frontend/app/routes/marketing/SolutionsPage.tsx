import React, { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { CTASection } from "../../components/public/CTASection";

const SOLUTIONS_DATA = [
  {
    id: "growing-businesses",
    audience: "For Growing Businesses",
    headline: "Stop software sprawl before it slows your business down.",
    problem: "Early-stage and scaling companies quickly accumulate 4 to 6 separate software subscriptions. Disconnected data requires manual CSV exports, duplicate data entry, and escalating per-seat software fees.",
    workflow: "Brandspyre provides a single operational backbone from day one. When a deal closes, task workspaces, invoices, and staff assignments initialize in the same system.",
    modules: ["CRM", "Projects", "HRMS", "Billing"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Start with Core Modules"
  },
  {
    id: "sales-teams",
    audience: "For Sales Teams",
    headline: "Close opportunities with full delivery and quotation alignment.",
    problem: "Sales reps often sell without visibility into current project capacity or inventory levels, leading to unrealistic delivery commitments and disputed quotations.",
    workflow: "Sales pipelines connect directly to inventory reservations and service schedules. Quotes convert immediately into project milestones and invoices once approved.",
    modules: ["CRM & Pipelines", "Quotation Builder", "Client Profiles"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Deploy Sales Pipeline"
  },
  {
    id: "operations-teams",
    audience: "For Operations Teams",
    headline: "Deliver client commitments on time with verified milestones.",
    problem: "Operational teams frequently manage complex deliverables on disconnected task boards, creating friction with client stakeholders over milestone completion and billable hours.",
    workflow: "Work is structured into verifiable milestone gates with digital deliverable archives. Timesheets link directly to billable project accounts for total transparency.",
    modules: ["Projects & Milestones", "Task Kanban", "Staff Timesheets"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Set Up Operations"
  },
  {
    id: "hr-teams",
    audience: "For HR & People Teams",
    headline: "Manage staff attendance, leave, and payroll without extra apps.",
    problem: "Human resources staff waste days calculating monthly salaries from separate biometric machines, leave spreadsheets, and overtime rosters.",
    workflow: "Biometric and GPS check-ins feed directly into leave calendars and automated monthly payroll slip generation, eliminating manual payroll reconciliation.",
    modules: ["HRMS", "Shift Rosters", "Attendance", "Payroll"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Explore Workforce Suite"
  },
  {
    id: "finance-teams",
    audience: "For Finance & Billing Teams",
    headline: "Automate commercial billing based on verified deliverables.",
    problem: "Finance departments spend days arguing with clients over hours billed, or waiting weeks for project managers to confirm whether milestones were finished.",
    workflow: "Invoices generate automatically when clients sign off on milestone deliverables, complete with GST compliance and direct B2B settlement tracking.",
    modules: ["Commercial Billing", "GST Invoices", "Payment Ledgers"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Configure Billing Engine"
  },
  {
    id: "retail",
    audience: "For Retail & Multi-Branch Outlets",
    headline: "Keep storefront checkouts fast and central inventory accurate.",
    problem: "Multi-branch retailers struggle with stock discrepancies between store counters and central warehouses, causing checkout delays and lost sales.",
    workflow: "High-speed touchscreen POS terminals scan barcodes, tender payments, and decrement inventory in real time across all branch locations.",
    modules: ["Retail POS", "Warehouse Balancing", "Purchase Orders"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Explore Retail POS"
  },
  {
    id: "manufacturing",
    audience: "For Manufacturing & Plants",
    headline: "Trace raw materials from Bill of Materials to finished goods.",
    problem: "Shop floor managers use outdated spreadsheets for Bills of Materials, resulting in unexpected raw material stockouts and inaccurate finished goods costing.",
    workflow: "Work orders route through assembly stages, automatically reserving and deducting raw materials while calculating exact labor and unit production costs.",
    modules: ["Bill of Materials (BOM)", "Work Orders", "Raw Material Deduction"],
    ctaLink: "/tenant-registration",
    ctaLabel: "Deploy Manufacturing OS"
  }
];

export default function SolutionsPage() {
  const [selectedAudience, setSelectedAudience] = useState<string>("all");

  const visibleSolutions = selectedAudience === "all"
    ? SOLUTIONS_DATA
    : SOLUTIONS_DATA.filter((s) => s.id === selectedAudience);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Header */}
      <section className="pt-16 pb-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Audience & Team Solutions
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white max-w-3xl">
            Solutions Built for the Way Your Teams Operate
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Whether you are managing retail storefronts, assembly plants, or professional client services,
            Brandspyre connects your departmental workflows.
          </p>

          {/* Quick Filter */}
          <div className="pt-6 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setSelectedAudience("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                selectedAudience === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Audiences ({SOLUTIONS_DATA.length})
            </button>
            {SOLUTIONS_DATA.map((sol) => (
              <button
                key={sol.id}
                onClick={() => setSelectedAudience(sol.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  selectedAudience === sol.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {sol.audience}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Sections */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {visibleSolutions.map((sol) => (
          <section key={sol.id} id={sol.id} className="py-16 sm:py-20 bg-white dark:bg-slate-950 transition-colors">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                  {sol.audience}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {sol.headline}
                </h2>
              </div>

              {/* 3-part Core Answers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* What problem does Brandspyre solve? */}
                <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    What Problem Does It Solve?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sol.problem}
                  </p>
                </div>

                {/* How does the workflow improve? */}
                <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    How Does The Workflow Improve?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sol.workflow}
                  </p>
                </div>
              </div>

              {/* Modules involved + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-slate-500">Modules involved:</span>
                  {sol.modules.map((mod, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs"
                    >
                      {mod}
                    </span>
                  ))}
                </div>

                <Link
                  to={sol.ctaLink}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 transition"
                >
                  <span>{sol.ctaLabel}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Final CTA */}
      <CTASection
        title="Find the right setup for your organization"
        subtitle="Our onboarding wizard configures your workspace modules based on your selected business type."
      />
    </div>
  );
}
