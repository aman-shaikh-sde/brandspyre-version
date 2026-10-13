import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Building2,
  Package,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  LogOut,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BusinessLayout: React.FC = () => {
  const location = useLocation();
  const { buyer, isAuthenticated, logout } = useAuth();

  const isAdmin = location.pathname.startsWith('/admin');
  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';
  const pathname = location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1. CLEAN ENTERPRISE APP HEADER (Matches Brandspyre ERP) */}
      <header className="bg-white text-slate-900 sticky top-0 z-40 border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo & Section Identifier */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/brandspyre_icon.png"
                alt="Brandspyre"
                className="h-7 w-auto object-contain"
              />
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Brand<span className="text-red-700">spyre</span>
              </span>
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-700" />
                  <span>Platform Administration</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  <Store className="w-3.5 h-3.5 text-slate-700" />
                  <span>Merchant Workspace</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Header Navigation & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storefront return link */}
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Storefront Catalog</span>
            </Link>

            {/* ERP External Link */}
            <a
              href={import.meta.env.VITE_BRANDSPYRE_ERP_URL || 'https://brandspyre.in'}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brandspyre ERP</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* User details / sign out */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {buyer?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-none truncate max-w-[120px]">
                    {buyer?.company_name || 'Organization Member'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. SUB-NAVIGATION TABS BAR (Clean Unterstated Tab Border Layout) */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-semibold">
            {isAdmin ? (
              <>
                <Link
                  to="/admin?tab=overview"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/admin' && activeTab === 'overview'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Platform Overview</span>
                </Link>

                <Link
                  to="/admin?tab=moderation"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/admin' && activeTab === 'moderation'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Listing Moderation</span>
                </Link>

                <Link
                  to="/admin/categories"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname.startsWith('/admin/categories')
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Verticals & Schemas</span>
                </Link>

                <Link
                  to="/admin?tab=sellers"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/admin' && activeTab === 'sellers'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Registered Sellers</span>
                </Link>

                <Link
                  to="/admin?tab=orders"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/admin' && activeTab === 'orders'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Marketplace Orders</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/seller?tab=overview"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller' && activeTab === 'overview'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Overview & KPIs</span>
                </Link>

                <Link
                  to="/seller?tab=listings"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller' && activeTab === 'listings'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Listings</span>
                </Link>

                <Link
                  to="/seller/listings/new"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller/listings/new'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-red-600" />
                  <span>Create Listing</span>
                </Link>

                <Link
                  to="/seller/enquiries"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller/enquiries'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enquiries & Leads</span>
                </Link>

                <Link
                  to="/seller/bookings"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller/bookings'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Bookings & Appointments</span>
                </Link>

                <Link
                  to="/seller?tab=orders"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller' && activeTab === 'orders'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Marketplace Orders</span>
                </Link>

                <Link
                  to="/seller?tab=quotations"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller' && activeTab === 'quotations'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>RFQ Inquiries</span>
                </Link>

                <Link
                  to="/seller?tab=profile"
                  className={`py-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                    pathname === '/seller' && activeTab === 'profile'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Seller Profile</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. BUSINESS MAIN CONTENT WRAPPER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default BusinessLayout;
