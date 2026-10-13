import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Star,
  ChevronRight,
  Share2,
  Heart,
  MessageSquare,
  ShoppingCart,
  Send,
  FileSpreadsheet,
  AlertCircle,
  Tag,
  ArrowLeft,
  Info
} from 'lucide-react';
import { UniversalListing, MarketplaceCategory } from '../types';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { EnquiryModal } from '../components/common/EnquiryModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import marketplaceService from '../services/marketplaceService';

export const ListingDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();

  const [listing, setListing] = useState<UniversalListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modals & Action States
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
  const [participants, setParticipants] = useState(1);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const data = await marketplaceService.getProductDetails(slug);
        if (data) {
          setListing(data as unknown as UniversalListing);
        } else {
          setError('Listing not found or has been delisted.');
        }
      } catch (err: any) {
        console.error('Failed to load listing:', err);
        setError(err.message || 'Error fetching listing details.');
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [slug]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!listing || !bookingDate) return;

    try {
      setBookingSubmitting(true);
      setBookingError(null);
      await marketplaceService.createBooking({
        listing_id: listing._id || (listing as any).id,
        buyer_name: listing.tenant_id?.name || 'Customer',
        buyer_email: 'buyer@marketplace.in',
        buyer_phone: '9876543210',
        start_date: bookingDate,
        time_slot: bookingTimeSlot || undefined,
        participants: participants > 1 ? participants : undefined
      });
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-7 aspect-4/3 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-1/2" />
            <div className="h-32 bg-slate-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Listing Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'This listing could not be found or has been removed.'}</p>
        <Link to="/catalog" className="crm-btn-primary inline-flex !h-9 !text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Marketplace Catalog
        </Link>
      </div>
    );
  }

  const category = typeof listing.marketplace_category_id === 'object' ? (listing.marketplace_category_id as MarketplaceCategory) : null;
  const flow = category?.transaction_flow || 'ENQUIRY';
  const categoryData = listing.category_data?.data || {};
  const images = (listing.images && listing.images.length > 0) ? listing.images : (listing.image_url ? [listing.image_url] : []);
  const seller = listing.tenant_id;
  const sellerName = seller?.company_name || seller?.name || 'Verified Merchant';
  const isFavorited = isInWishlist(listing._id || (listing as any).id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Breadcrumb Path */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-red-700 transition-colors font-medium">Home</Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link to="/catalog" className="hover:text-red-700 transition-colors font-medium">Catalog</Link>
        {category && (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <Link
              to={`/catalog?category=${category._id}`}
              className="hover:text-red-700 transition-colors font-medium"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-md">{listing.title}</span>
      </nav>

      {/* 2. Main Dual-Column Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery & Visual Showcase */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-4/3 rounded-2xl bg-slate-900 border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex] || images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-8">
                <Tag className="w-16 h-16 stroke-[1.2] text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-500">No image uploaded</span>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                  {category.name}
                </span>
              )}
              {listing.listing_type && listing.listing_type !== 'STANDARD' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                  {listing.listing_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(listing as any)}
              className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white/95 text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>

            {/* Location Tag */}
            {listing.location?.city && (
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>
                  {listing.location.city}{listing.location.state ? `, ${listing.location.state}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-red-600 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy/Enquire/Book Action Box & Specs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            {/* Seller Organization Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">{sellerName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Business</span>
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {listing.title}
            </h1>

            {/* Pricing Component */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-baseline gap-2">
                <PriceDisplay
                  pricing={listing.pricing || {
                    mode: 'FIXED',
                    amount: listing.listing_price || 0,
                    currency: 'INR',
                    unit: 'PER_UNIT'
                  }}
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                />
              </div>

              {/* ACTION CALLOUT BY WORKFLOW */}
              {flow === 'ENQUIRY' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Direct enquiry routes immediately into this seller's Brandspyre CRM lead pipeline.
                  </p>
                  <button
                    onClick={() => setIsEnquiryModalOpen(true)}
                    className="crm-btn-primary !h-11 !text-sm w-full flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Direct Enquiry</span>
                  </button>
                </div>
              )}

              {flow === 'BOOKING' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {bookingSuccess ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Booking request sent! The business will confirm shortly.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Select Date *</label>
                          <input
                            type="date"
                            required
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Time Slot</label>
                          <select
                            value={bookingTimeSlot}
                            onChange={(e) => setBookingTimeSlot(e.target.value)}
                            className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-red-600"
                          >
                            <option value="">Any time</option>
                            <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                            <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                            <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                          </select>
                        </div>
                      </div>

                      {bookingError && (
                        <p className="text-xs text-rose-600 font-medium">{bookingError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        className="crm-btn-primary !h-11 !text-sm w-full flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{bookingSubmitting ? 'Requesting...' : 'Request Appointment'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {(flow === 'RFQ' || (flow as string) === 'REQUEST_FOR_QUOTE') && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Custom wholesale RFQ. Submit target unit prices and contract delivery timeline.
                  </p>
                  <button
                    onClick={() => setIsEnquiryModalOpen(true)}
                    className="crm-btn-primary !h-11 !text-sm w-full flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Request Quotation (RFQ)</span>
                  </button>
                </div>
              )}

              {flow === 'ECOMMERCE' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Quantity:</span>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-8 text-center text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => addToCart(listing as any, quantity)}
                      className="crm-btn-primary !h-11 !text-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => setIsEnquiryModalOpen(true)}
                      className="crm-btn-secondary !h-11 !text-sm flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      <span>Enquire</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Trust Badges */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  <span>CRM Verified Business</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct Seller Communication</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Specifications & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Description & Dynamic Vertical Attributes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Overview & Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description || 'No detailed description provided by the seller.'}
            </p>
          </div>

          {/* Dynamic Vertical Specifications */}
          {Object.keys(categoryData).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Industry Specifications ({category?.name})</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(categoryData).map(([key, value]) => {
                  if (value === undefined || value === null || value === '') return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const formattedVal = Array.isArray(value)
                    ? value.join(', ')
                    : typeof value === 'boolean'
                    ? (value ? 'Yes' : 'No')
                    : String(value);

                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                        {label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {formattedVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Details */}
          {listing.location && (listing.location.address || listing.location.city) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Listing Location</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-700 space-y-1">
                {listing.location.address && <p>{listing.location.address}</p>}
                <p>
                  {[listing.location.city, listing.location.state, listing.location.postal_code, listing.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Seller Profile Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              About the Business
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{sellerName}</h4>
                <p className="text-xs text-slate-500">Brandspyre CRM Verified</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This organization operates through Brandspyre's Multi-Tenant SaaS platform. Enquiries, RFQs, and booking requests route directly to their live operations desk.
            </p>

            <button
              onClick={() => setIsEnquiryModalOpen(true)}
              className="crm-btn-secondary !h-9 !text-xs w-full flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact Organization</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        listing={listing}
      />
    </div>
  );
};

export default ListingDetailPage;
