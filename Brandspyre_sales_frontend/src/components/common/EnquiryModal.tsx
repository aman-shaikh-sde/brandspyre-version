import React, { useState } from 'react';
import { X, Send, CheckCircle2, Building, Mail, Phone, User, MessageSquare } from 'lucide-react';
import { UniversalListing } from '../../types';
import { PriceDisplay } from './PriceDisplay';
import marketplaceService from '../../services/marketplaceService';

interface EnquiryModalProps {
  isOpen: boolean;
  listing: UniversalListing;
  onClose: () => void;
  defaultType?: 'CONTACT' | 'VIEWING' | 'TEST_DRIVE' | 'CONSULTATION' | 'QUOTE_REQUEST';
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  listing,
  onClose,
  defaultType = 'CONTACT'
}) => {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    buyer_company: '',
    buyer_message: '',
    type: defaultType,
    preferred_date: '',
    consent: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ enquiry_number: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.buyer_name || !formData.buyer_email || !formData.buyer_phone || !formData.buyer_message) {
      setError('Please fill in your name, email, phone number, and message.');
      return;
    }

    try {
      setLoading(true);
      const res = await marketplaceService.submitEnquiry({
        listing_id: listing._id,
        buyer_name: formData.buyer_name,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone,
        buyer_company: formData.buyer_company || undefined,
        buyer_message: formData.buyer_message,
        type: formData.type,
        requirements: formData.preferred_date ? { preferred_date: formData.preferred_date } : undefined
      });

      setSuccessResult(res || { enquiry_number: 'SUBMITTED' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/70">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Contact Seller / Enquire</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your enquiry will be sent directly to the seller CRM</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Enquiry Submitted!</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Reference: <span className="font-mono font-semibold text-blue-600">{successResult.enquiry_number}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                  The verified seller has been notified and will reach out to your phone/email shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Listing preview banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200/60">
                <img
                  src={listing.images?.[0] || listing.image_url || 'https://placehold.co/100x100?text=Listing'}
                  alt={listing.title}
                  className="w-12 h-12 rounded-lg object-cover bg-white border"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{listing.title}</h4>
                  <PriceDisplay pricing={listing.pricing} price={listing.listing_price} size="sm" />
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              {/* Enquiry Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Enquiry Purpose</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'CONTACT', label: 'Message Seller' },
                    { id: 'VIEWING', label: 'Site / Viewing' },
                    { id: 'TEST_DRIVE', label: 'Test Drive' },
                    { id: 'CONSULTATION', label: 'Consultation' },
                    { id: 'QUOTE_REQUEST', label: 'Bulk / RFQ' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.id as any })}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        formData.type === t.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.buyer_name}
                      onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.buyer_phone}
                      onChange={e => setFormData({ ...formData, buyer_phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.buyer_email}
                      onChange={e => setFormData({ ...formData, buyer_email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Optional"
                      value={formData.buyer_company}
                      onChange={e => setFormData({ ...formData, buyer_company: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {['VIEWING', 'TEST_DRIVE', 'CONSULTATION'].includes(formData.type) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={e => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Message / Requirements *</label>
                <div className="relative">
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your requirements, schedule, or questions for the seller..."
                    value={formData.buyer_message}
                    onChange={e => setFormData({ ...formData, buyer_message: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                  />
                </div>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-500 select-none">
                <input
                  type="checkbox"
                  required
                  checked={formData.consent}
                  onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>I agree to allow the seller to contact me regarding this enquiry via phone, email, or WhatsApp.</span>
              </label>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Enquiry to Seller</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
