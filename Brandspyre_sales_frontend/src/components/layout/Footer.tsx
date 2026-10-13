import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Store } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      {/* Structured Link Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img
              src="/brandspyre_icon.png"
              alt="Brandspyre"
              className="h-7 w-auto object-contain brightness-110"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Brand<span className="text-red-500">spyre</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded">
                Sales
              </span>
            </div>
          </div>
          <p className="text-slate-400 leading-relaxed text-xs">
            Commercial marketplace and wholesale procurement hub connecting verified suppliers and business buyers.
          </p>
          <div className="pt-1 text-slate-500">
            Integrated with <a href={import.meta.env.VITE_BRANDSPYRE_ERP_URL || 'https://brandspyre.in'} target="_blank" rel="noreferrer" className="text-red-400 hover:underline font-semibold">Brandspyre ERP</a>.
          </div>
        </div>

        {/* Catalog & Shopping Navigation */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Storefront
          </h4>
          <ul className="space-y-2">
            <li><Link to="/catalog" className="hover:text-white transition-colors">All Products Catalog</Link></li>
            <li><Link to="/account?tab=quotations" className="hover:text-white transition-colors">Request a Bulk Quote (RFQ)</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            <li><Link to="/account?tab=orders" className="hover:text-white transition-colors">Track Orders</Link></li>
            <li><Link to="/account?tab=wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
          </ul>
        </div>

        {/* Merchant & Seller Operations */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Seller & Management
          </h4>
          <ul className="space-y-2">
            <li>
              <Link to="/seller" className="hover:text-white font-medium flex items-center gap-1.5 transition-colors">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Seller Workspace</span>
              </Link>
            </li>
            <li><Link to="/seller?tab=listings" className="hover:text-white transition-colors">Manage Product Listings</Link></li>
            <li><Link to="/seller?tab=orders" className="hover:text-white transition-colors">Fulfill Orders</Link></li>
            <li><Link to="/seller?tab=quotations" className="hover:text-white transition-colors">Buyer Quotations</Link></li>
            <li><Link to="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">Platform Administration</Link></li>
          </ul>
        </div>

        {/* Enterprise ERP Integration */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Enterprise ERP
          </h4>
          <p className="text-slate-400 leading-relaxed text-xs">
            Manage inventory ledgers, purchase workflows, and GST invoicing directly in your ERP account.
          </p>
          <div className="pt-1">
            <a
              href={import.meta.env.VITE_BRANDSPYRE_ERP_URL || 'https://brandspyre.in'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors"
            >
              <span>Launch Brandspyre ERP</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Brandspyre Technologies Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>GST-Compliant Invoicing</span>
            <span>•</span>
            <span>Verified Business Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
