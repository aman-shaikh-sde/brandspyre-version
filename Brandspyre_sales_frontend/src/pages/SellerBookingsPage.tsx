import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { MarketplaceBooking } from '../types';
import marketplaceService from '../services/marketplaceService';

export const SellerBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<MarketplaceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getSellerBookings({
        status: statusFilter
      });
      setBookings(res.bookings);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      await marketplaceService.updateBookingStatus(id, { status });
      setBookings(prev =>
        prev.map(b => (b._id === id ? { ...b, status: status as any } : b))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'REQUESTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
      case 'DEPOSIT_PAID':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAID':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              CALENDAR & SCHEDULING
            </span>
            <span className="text-xs text-gray-500 font-medium">Services, Stays & Appointments</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
            Bookings & Reservations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage incoming schedule appointments, slot bookings, tours, and venue reservations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === st
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {st === 'ALL' ? 'All Bookings' : st}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-purple-50 text-purple-400 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-base">No bookings found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When buyers reserve appointments, tour slots, or stays from your listings, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(bkg => {
            const listing = bkg.listing_id || {};

            return (
              <div
                key={bkg._id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4 hover:border-purple-200 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-purple-700">
                      {bkg.booking_number}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {listing.title || 'Listing Booking'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(bkg.status)}`}>
                      {bkg.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                      ₹{bkg.total?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Schedule details */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Scheduled Time
                    </span>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-medium">
                          {new Date(bkg.start_date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {bkg.end_date && ` - ${new Date(bkg.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                        </span>
                      </div>
                      {bkg.time_slot && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>Slot: {bkg.time_slot}</span>
                        </div>
                      )}
                      {bkg.participants > 1 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                          <span>{bkg.participants} Participants</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buyer details */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Customer Contact
                    </span>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{bkg.buyer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${bkg.buyer_phone}`} className="hover:text-blue-600">
                          {bkg.buyer_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`mailto:${bkg.buyer_email}`} className="hover:text-blue-600">
                          {bkg.buyer_email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-between items-end gap-3">
                    <div className="text-right text-xs">
                      <span className="text-gray-400 block">Payment Status</span>
                      <span className="font-bold text-gray-700">{bkg.payment_status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {bkg.status === 'REQUESTED' && (
                        <>
                          <button
                            disabled={updatingId === bkg._id}
                            onClick={() => handleUpdateStatus(bkg._id, 'CONFIRMED')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-2xs"
                          >
                            Confirm Booking
                          </button>
                          <button
                            disabled={updatingId === bkg._id}
                            onClick={() => handleUpdateStatus(bkg._id, 'CANCELLED')}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {bkg.status === 'CONFIRMED' && (
                        <button
                          disabled={updatingId === bkg._id}
                          onClick={() => handleUpdateStatus(bkg._id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-2xs"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerBookingsPage;
