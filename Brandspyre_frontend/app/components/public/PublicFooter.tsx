import React from "react";
import { Link } from "react-router";
import { BrandLogo } from "./BrandLogo";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800 text-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-14 border-b border-slate-800">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <BrandLogo size="md" subtitle="Business Platform" variant="light" />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Business software for connected teams. CRM, operations, HR, finance, inventory and more — unified into one platform.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Operational Core Active</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/features#crm" className="hover:text-white transition">
                  CRM & Sales
                </Link>
              </li>
              <li>
                <Link to="/features#operations" className="hover:text-white transition">
                  Projects & Operations
                </Link>
              </li>
              <li>
                <Link to="/features#hrms" className="hover:text-white transition">
                  HR & Workforce
                </Link>
              </li>
              <li>
                <Link to="/features#billing" className="hover:text-white transition">
                  Finance & Billing
                </Link>
              </li>
              <li>
                <Link to="/features#inventory" className="hover:text-white transition">
                  Inventory & Stock
                </Link>
              </li>
              <li>
                <Link to="/features#pos" className="hover:text-white transition">
                  Retail Point of Sale
                </Link>
              </li>
              <li>
                <Link to="/explore-events" className="hover:text-white transition">
                  Events & Ticketing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Resources
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/blog" className="hover:text-white transition">
                  Blog & Articles
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white transition">
                  Product Overview
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Workspace Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Company
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Brandspyre
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-white transition">
                  Solutions by Team
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-white transition">
                  Customer Stories
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Get in Touch
                </Link>
              </li>
              <li>
                <Link to="/tenant-registration" className="text-red-400 hover:text-red-300 font-semibold transition">
                  Start Free Trial →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Subtle Brandspyre Hub Reference */}
        <div className="py-6 border-b border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">BRANDSPYRE HUB:</span>
            <span>Learning, Skills & Career Ecosystem</span>
          </div>
          <Link
            to="/about"
            className="text-slate-400 hover:text-slate-200 underline text-xs"
          >
            Learn about our ecosystem
          </Link>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} BRANDSPYRE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-400 transition">
              Privacy Policy
            </Link>
            <Link to="/about" className="hover:text-slate-400 transition">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-slate-400 transition">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
