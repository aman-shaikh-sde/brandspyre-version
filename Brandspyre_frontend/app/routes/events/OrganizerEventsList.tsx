import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  ExternalLink,
  Edit,
  ArrowRight,
  MoreVertical,
  XCircle,
  CheckCircle,
  Tag,
  MapPin,
  Video
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerEventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getOrganizerEvents({
        page,
        limit: 12,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });

      if (res.success) {
        setEvents(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load organizer events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleCancel = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel '${title}'? Existing bookings will be preserved but new ticket sales will be stopped.`)) {
      return;
    }

    try {
      await eventService.cancelEvent(eventId);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel event.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Events"
        description="Manage your event catalog, ticket categories, live registrations, and attendee check-ins."
        primaryAction={{
          label: "Create Event",
          href: "/event-management/events/create",
          icon: <Plus size={16} />
        }}
      />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: "ALL", label: "All Events" },
            { id: "PUBLISHED", label: "Published" },
            { id: "DRAFT", label: "Drafts" },
            { id: "CANCELLED", label: "Cancelled" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-80" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <Calendar size={36} className="mx-auto text-slate-400 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Events Found</h3>
          <p className="text-xs text-slate-500">You don't have any events matching the selected filter.</p>
          <Link
            to="/event-management/events/create"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Event Thumbnail */}
                <div className="relative h-44 bg-slate-800 overflow-hidden">
                  {evt.cover_image ? (
                    <img src={evt.cover_image} alt={evt.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center text-slate-500">
                      <Calendar size={36} />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      evt.status === "PUBLISHED"
                        ? "bg-emerald-600 text-white"
                        : evt.status === "DRAFT"
                        ? "bg-slate-900/80 text-slate-200 backdrop-blur-md"
                        : "bg-rose-600 text-white"
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Calendar size={13} />
                    <span>{new Date(evt.start_date).toLocaleDateString("en-IN")}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {evt.short_summary || evt.description?.replace(/<[^>]*>?/gm, '').slice(0, 100)}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <span>Tickets Sold: <strong>{evt.stats?.tickets_sold || 0}</strong></span>
                    <span>Revenue: <strong>₹{(evt.stats?.gross_revenue || 0).toLocaleString("en-IN")}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to={`/event-management/events/${evt._id}`}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  Manage Hub <ArrowRight size={13} />
                </Link>

                <div className="flex items-center gap-1">
                  {evt.status === "PUBLISHED" && (
                    <Link
                      to={`/explore-events/${evt.slug || evt._id}`}
                      target="_blank"
                      title="Public Link"
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}

                  {evt.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancel(evt._id, evt.title)}
                      title="Cancel Event"
                      className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
