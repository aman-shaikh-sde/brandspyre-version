import React from "react";
import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { CTASection } from "../../components/public/CTASection";
import aboutStudioImg from "../../assets/about_studio_team.jpg";

export default function AboutPage() {
  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Header with Collaborative Loft Studio Background */}
      <section className="relative pt-18 pb-16 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
        {/* Studio Background Environment */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div
            className="w-full h-full bg-cover bg-top bg-no-repeat opacity-85 dark:opacity-25"
            style={{
              backgroundImage: `url(${aboutStudioImg})`,
              backgroundAttachment: "fixed",
            }}
          />
          {/* Luminous center mask for maximum typography readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 52%, rgba(255, 255, 255, 0.15) 86%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-slate-950/70 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            About Brandspyre
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            We build business software for connected teams.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Software should eliminate operational friction, not create more data entry.
          </p>
        </div>
      </section>

      {/* Main Editorial Narrative */}
      <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Section 1: Why Brandspyre exists */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Why We Started
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              The frustration of running a business across six disconnected tools.
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Every growing company eventually hits the same roadblock. You start with a simple CRM for sales, an attendance app for staff, a separate system for retail counters, and spreadsheets for project tasks and billing.
              </p>
              <p>
                At first, this feels modular. But over time, each app becomes its own island of information. Sales promises delivery dates without checking project capacity. Operations completes milestones, but finance doesn't know to send the invoice. Staff spend hours copying customer data from one system into another.
              </p>
              <p>
                We built Brandspyre because we believe business teams deserve software that communicates naturally, without fragile integrations or manual spreadsheet reconciliation.
              </p>
            </div>
          </div>

          {/* Section 2: The problem we are solving */}
          <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              What we are solving:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white">Fragmented Software Costs</span>
                <p>Paying 5 to 7 per-user subscriptions across tools that don't share information.</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white">Delayed Invoicing & Cash Flow</span>
                <p>Waiting days for operations and sales to confirm deliverable completion before sending invoices.</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white">Stock & Inventory Disconnect</span>
                <p>Retail storefronts and field teams selling out of stock items because warehouse counts don't sync.</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white">Administrative Overhead</span>
                <p>Manual payroll calculations, lost timesheet entries, and duplicate records across apps.</p>
              </div>
            </div>
          </div>

          {/* Section 3: How we think about business software */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Our Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How we think about building tools for teams.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-slate-900 dark:text-white">Connected by Default</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  When a sales deal is marked won, project workspaces and inventory reservations should trigger automatically.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-slate-900 dark:text-white">Built for Frontline Staff</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Software shouldn't just be an executive surveillance dashboard. It should make daily work faster for staff at every branch.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs sm:text-sm">
                <h4 className="font-bold text-slate-900 dark:text-white">Pay Only for What You Need</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Start with core CRM or HRMS, then activate POS, manufacturing, or commercial billing as your operations scale.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: What we are building */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              The Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              A reliable operating platform that grows with you.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              We are building Brandspyre for the long term. Whether your organization operates from a single regional office or coordinates multi-branch distribution warehouses across the country, our commitment is to provide dependable, fast, and connected business software.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        title="Ready to simplify your business operations?"
        subtitle="Explore our platform capabilities or begin an evaluation today."
      />
    </div>
  );
}
