import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';
import { MarketplaceEnquiry } from '../types';
import marketplaceService from '../services/marketplaceService';

export const SellerEnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getSellerEnquiries({
        status: statusFilter,
        search: search || undefined
      });
      setEnquiries(res.enquiries);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleStatusChange = async (enquiryId: string, newStatus: string) => {
    try {
      setUpdatingId(enquiryId);
      await marketplaceService.updateEnquiryStatus(enquiryId, { status: newStatus });
      setEnquiries(prev =>
        prev.map(item => (item._id === enquiryId ? { ...item, status: newStatus as any } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'QUALIFIED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              CRM LEADS BRIDGE
            </span>
            <span className="text-xs text-gray-500 font-medium">Auto-Synced to Brandspyre CRM</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Incoming Buyer Enquiries
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage contact requests, site viewings, test drives, and RFQs generated from your listings.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {st === 'ALL' ? 'All Enquiries' : st}
          </button>
        ))}
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading enquiries...</div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No enquiries found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When buyers contact you or request viewings from your listings, their details and requirements will appear here and in your CRM.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map(enq => {
            const listing = enq.listing_id || {};
            const category = enq.marketplace_category_id || {};

            return (
              <div
                key={enq._id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:border-blue-200 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {enq.enquiry_number}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {category.name || 'General'}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                      {enq.type || 'CONTACT'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(enq.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>

                    {/* Status Select */}
                    <select
                      value={enq.status}
                      disabled={updatingId === enq._id}
                      onChange={e => handleStatusChange(enq._id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${getStatusBadge(
                        enq.status
                      )}`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="CONVERTED">CONVERTED (Won)</option>
                      <option value="CLOSED">CLOSED (Lost)</option>
                    </select>
                  </div>
                </div>

                {/* Main Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Buyer details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {enq.buyer_name?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm block">{enq.buyer_name}</span>
                        {enq.buyer_company && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {enq.buyer_company}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 pl-9">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${enq.buyer_phone}`} className="hover:text-blue-600 font-medium">
                          {enq.buyer_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`mailto:${enq.buyer_email}`} className="hover:text-blue-600">
                          {enq.buyer_email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Message & Requirements */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                      <p className="font-semibold text-gray-900 mb-0.5">Message:</p>
                      {enq.buyer_message}
                    </div>

                    {enq.requirements && Object.keys(enq.requirements).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(enq.requirements).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded font-medium">
                            {k.replace(/_/g, ' ')}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Listing Preview */}
                {listing.title && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>Listing:</span>
                      <span className="font-semibold text-gray-800">{listing.title}</span>
                    </span>

                    <div className="flex items-center gap-3">
                      <a
                        href={`https://wa.me/${enq.buyer_phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                          enq.buyer_name
                        )},%20thank%20you%20for%20your%20enquiry%20regarding%20${encodeURIComponent(
                          listing.title || 'our listing'
                        )}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${enq.buyer_phone}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerEnquiriesPage;
