import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  QrCode,
  Tag,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerAttendeesList() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

  const [selectedEventId, setSelectedEventId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchAttendees(1);
  }, [selectedEventId, statusFilter]);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getOrganizerEvents({ limit: 100 });
      if (res.success) {
        setEvents(res.data?.events || res.events || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const fetchAttendees = async (page = 1) => {
    try {
      setLoading(true);
      const res = await eventService.getOrganizerAttendees({
        page,
        limit: pagination.limit,
        event_id: selectedEventId || undefined,
        search: searchQuery || undefined
      });
      if (res.success) {
        const attendeeList = res.data?.attendees || res.attendees || (Array.isArray(res.data) ? res.data : []);
        const pag = res.pagination || res.data?.pagination || {};
        setAttendees(attendeeList);
        setPagination((prev) => ({
          ...prev,
          page: pag.page || prev.page,
          limit: pag.limit || prev.limit,
          total: pag.total ?? attendeeList.length,
          total_pages: pag.total_pages || pag.pages || 1
        }));
      }
    } catch (err) {
      console.error("Failed to fetch attendees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttendees(1);
  };

  const exportCSV = () => {
    if (attendees.length === 0) return;
    const headers = [
      "Ticket Number",
      "Attendee Name",
      "Email",
      "Phone",
      "Event",
      "Ticket Tier",
      "Check-in Status",
      "Checked In At"
    ];
    const rows = attendees.map((a) => [
      `"${a.ticket_number || ""}"`,
      `"${a.attendee_name || ""}"`,
      `"${a.attendee_email || ""}"`,
      `"${a.attendee_phone || ""}"`,
      `"${a.event_id?.title || ""}"`,
      `"${a.ticket_type_id?.name || "General"}"`,
      `"${a.checkin_status || ""}"`,
      `"${a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = attendees.filter((a) => {
    if (!statusFilter) return true;
    return a.checkin_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendee Directory"
        description="View registered ticket holders, manage badge credentials, and export attendee lists."
        rightElement={
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              disabled={attendees.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-gray-500" /> Export CSV
            </button>
            <Link
              to="/event-management/checkin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              <QrCode className="w-4 h-4" /> Live Check-in Terminal
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by attendee name, email, or ticket #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white max-w-[200px]"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Check-in Statuses</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="ISSUED">Not Checked In</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">No Attendees Found</h3>
            <p className="text-xs text-gray-400 mt-1">There are no attendees matching the specified filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Attendee</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5">Ticket Tier</th>
                  <th className="px-5 py-3.5">Ticket Code</th>
                  <th className="px-5 py-3.5">Check-in Status</th>
                  <th className="px-5 py-3.5">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendees.map((att: any) => (
                  <tr key={att._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{att.attendee_name}</div>
                      {att.company && <div className="text-2xs text-gray-400">{att.company}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-600 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-gray-400" /> {att.attendee_email}
                      </div>
                      {att.attendee_phone && (
                        <div className="text-2xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-gray-400" /> {att.attendee_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-800 font-medium max-w-[180px] truncate">
                      {att.event_id?.title || "Event"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700">
                        {att.ticket_type_id?.name || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600 font-bold">{att.ticket_number}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full ${
                          att.checkin_status === "CHECKED_IN"
                            ? "bg-green-100 text-green-700"
                            : att.status === "REFUNDED" || att.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {att.checkin_status === "CHECKED_IN" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Checked In
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-gray-400" /> {att.checkin_status}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {att.checked_in_at ? (
                        new Date(att.checked_in_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short"
                        })
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <span>
              Showing {attendees.length} of {pagination.total} attendees
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchAttendees(pagination.page - 1)}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchAttendees(pagination.page + 1)}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
