import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Ticket,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerEventDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await eventService.getOrganizerStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Organizer stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {
    total_events: 0,
    published_events: 0,
    draft_events: 0,
    tickets_sold: 0,
    attendees_checked_in: 0,
    gross_revenue: 0,
    platform_commission_paid: 0,
    net_earned: 0,
    pending_payable_balance: 0,
    currency: "INR"
  };

  const recentEvents = data?.recent_events || [];
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Management Hub"
        description="Host conferences, ticketing, attendee check-in terminal, and financial settlements."
        primaryAction={{
          label: "Create New Event",
          href: "/event-management/events/create",
          icon: <Plus size={16} />
        }}
        secondaryActions={[
          {
            label: "QR Check-in Terminal",
            href: "/event-management/checkin",
            icon: <QrCode size={14} />
          },
          {
            label: "Public Marketplace",
            href: "/explore-events",
            icon: <ExternalLink size={14} />
          }
        ]}
      />

      {/* 📊 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <Calendar size={18} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.total_events}
          </p>
          <p className="text-xs text-slate-400">
            <strong className="text-emerald-500 font-semibold">{metrics.published_events} Live</strong> • {metrics.draft_events} Drafts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Issued</span>
            <Ticket size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.tickets_sold}
          </p>
          <p className="text-xs text-slate-400">
            <strong className="text-indigo-500 font-semibold">{metrics.attendees_checked_in}</strong> checked-in
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Ticket Sales</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{metrics.gross_revenue?.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-400">
            Fee Deductions: ₹{metrics.platform_commission_paid?.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payout Balance</span>
            <CreditCard size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ₹{metrics.pending_payable_balance?.toLocaleString("en-IN")}
          </p>
          <Link to="/event-management/settlements" className="text-xs text-indigo-600 hover:underline font-semibold block">
            View Settlement Statements →
          </Link>
        </div>
      </div>

      {/* 🚀 Quick Actions Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/event-management/events/create"
          className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus size={20} />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Create New Event</h4>
          <p className="text-xs text-slate-500">Launch a physical conference or virtual session with multi-tier ticketing.</p>
        </Link>

        <Link
          to="/event-management/checkin"
          className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCode size={20} />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Mobile QR Check-in</h4>
          <p className="text-xs text-slate-500">Atomic real-time gate scanner terminal for event entrance staff.</p>
        </Link>

        <Link
          to="/event-management/attendees"
          className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users size={20} />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Attendee Directory</h4>
          <p className="text-xs text-slate-500">Manage registration responses, filter tickets, and export CSV reports.</p>
        </Link>
      </div>

      {/* 📋 Recent Events & Recent Bookings Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Events</h3>
            <Link to="/event-management/events" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All ({metrics.total_events})
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No events created yet. Click "Create New Event" to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((evt: any) => (
                <div
                  key={evt._id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{evt.title}</h4>
                      <p className="text-xs text-slate-400">{evt.category} • {new Date(evt.start_date).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      evt.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {evt.status}
                    </span>
                    <Link
                      to={`/event-management/events/${evt._id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Ticket Orders</h3>
            <Link to="/event-management/orders" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No bookings recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((ord: any) => (
                <div
                  key={ord._id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">{ord.customer_name}</p>
                    <p className="text-[11px] text-slate-400">{ord.event_id?.title || "Event"}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      ₹{ord.total_payable?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Net: ₹{ord.net_organizer_payable?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
