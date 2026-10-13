import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Package,
  Users,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Share2,
  Trash2,
  Edit,
  Tag,
  ShoppingBag
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerEventManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "addons" | "attendees" | "orders">("overview");

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    total_inventory: 100,
    min_per_order: 1,
    max_per_order: 10,
    sales_start: "",
    sales_end: "",
    benefits: ""
  });

  // Add-on Modal State
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonForm, setAddonForm] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    total_inventory: 50,
    max_per_order: 5,
    category: "MERCHANDISE"
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const evRes = await eventService.getEvent(id);

      if (evRes.success) {
        // getEvent returns { event, tickets, addons, sessions } inside data
        const resData = evRes.data;
        if (resData.event) {
          // Nested response format
          setEvent(resData.event);
          setTickets(resData.tickets || []);
          setAddons(resData.addons || []);
          setSessions(resData.sessions || []);
        } else {
          // Flat response format (event object directly)
          setEvent(resData);
          // Still need to fetch tickets/addons/sessions separately
          const [tickRes, addRes, sessRes] = await Promise.all([
            eventService.getTickets(id),
            eventService.getAddons(id),
            eventService.getSessions(id)
          ]);
          if (tickRes.success) setTickets(tickRes.data || []);
          if (addRes.success) setAddons(addRes.data || []);
          if (sessRes.success) setSessions(sessRes.data || []);
        }
      }

      // Load event-specific orders & attendees safely
      try {
        const [ordRes, attRes] = await Promise.all([
          eventService.getOrganizerOrders({ event_id: id, limit: 50 }),
          eventService.getOrganizerAttendees({ event_id: id, limit: 50 })
        ]);
        if (ordRes.success) {
          setOrders(ordRes.data?.orders || ordRes.orders || (Array.isArray(ordRes.data) ? ordRes.data : []));
        }
        if (attRes.success) {
          setAttendees(attRes.data?.attendees || attRes.attendees || (Array.isArray(attRes.data) ? attRes.data : []));
        }
      } catch (subErr) {
        console.warn("Could not load event orders/attendees:", subErr);
      }
    } catch (err: any) {
      console.error("Error loading event:", err);
      setStatusMessage({ type: "error", text: "Failed to load event information." });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (tickets.length === 0) {
      setStatusMessage({ type: "error", text: "You must create at least one ticket type before publishing." });
      return;
    }
    try {
      setActionLoading(true);
      const res = await eventService.publishEvent(id);
      if (res.success) {
        setStatusMessage({ type: "success", text: "Event successfully published to the public marketplace!" });
        loadEventData();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.response?.data?.message || "Failed to publish event." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to cancel this event? Sales will halt and affected attendees must be refunded.")) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await eventService.cancelEvent(id);
      if (res.success) {
        setStatusMessage({ type: "success", text: "Event has been cancelled." });
        loadEventData();
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.response?.data?.message || "Failed to cancel event." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      const payload = {
        ...ticketForm,
        price: Number(ticketForm.price),
        total_inventory: Number(ticketForm.total_inventory),
        min_per_order: Number(ticketForm.min_per_order),
        max_per_order: Number(ticketForm.max_per_order),
        benefits: ticketForm.benefits.split(",").map((s) => s.trim()).filter(Boolean)
      };
      const res = await eventService.createTicket(id, payload);
      if (res.success) {
        setShowTicketModal(false);
        setTicketForm({
          name: "",
          description: "",
          price: 0,
          currency: "INR",
          total_inventory: 100,
          min_per_order: 1,
          max_per_order: 10,
          sales_start: "",
          sales_end: "",
          benefits: ""
        });
        const tickRes = await eventService.getTickets(id);
        if (tickRes.success) setTickets(tickRes.data || []);
        setStatusMessage({ type: "success", text: "Ticket tier added successfully." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.response?.data?.message || "Failed to add ticket tier." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      const payload = {
        ...addonForm,
        price: Number(addonForm.price),
        total_inventory: Number(addonForm.total_inventory),
        max_per_order: Number(addonForm.max_per_order)
      };
      const res = await eventService.createAddon(id, payload);
      if (res.success) {
        setShowAddonModal(false);
        setAddonForm({
          name: "",
          description: "",
          price: 0,
          currency: "INR",
          total_inventory: 50,
          max_per_order: 5,
          category: "MERCHANDISE"
        });
        const addRes = await eventService.getAddons(id);
        if (addRes.success) setAddons(addRes.data || []);
        setStatusMessage({ type: "success", text: "Add-on added successfully." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.response?.data?.message || "Failed to add add-on." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
        <p className="text-gray-500 mt-1">The requested event could not be found or you do not have permission to view it.</p>
        <Link
          to="/event-management/events"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/explore-events/${event.slug || event._id}`;

  return (
    <div className="space-y-6">
      {/* Back button & top alerts */}
      <div className="flex items-center justify-between">
        <Link
          to="/event-management/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> All Events
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/event-management/checkin"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
          >
            <QrCode className="w-4 h-4" /> Terminal Check-in
          </Link>
          {event.status === "PUBLISHED" && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary-600 text-primary-600 hover:bg-primary-50 text-sm font-medium rounded-lg"
            >
              <ExternalLink className="w-4 h-4" /> View Public Page
            </a>
          )}
          {event.status === "DRAFT" && (
            <button
              onClick={handlePublish}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Publish Event
            </button>
          )}
          {event.status === "PUBLISHED" && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded-lg disabled:opacity-50"
            >
              Cancel Event
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
      )}

      {/* Hero Banner / Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="relative h-44 bg-gradient-to-r from-primary-800 via-indigo-900 to-purple-900 flex items-end p-6">
          {event.cover_image && (
            <img
              src={event.cover_image}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
          )}
          <div className="relative z-10 flex flex-wrap items-center justify-between w-full gap-4 text-white">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-white/20 backdrop-blur-sm">
                  {event.category || "General"}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    event.status === "PUBLISHED"
                      ? "bg-green-500/80 text-white"
                      : event.status === "DRAFT"
                      ? "bg-yellow-500/80 text-white"
                      : "bg-red-500/80 text-white"
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.start_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.event_type === "ONLINE"
                    ? "Online Stream"
                    : [event.venue_details?.venue_name, event.venue_details?.city].filter(Boolean).join(", ") ||
                      event.venue_name ||
                      "Physical Venue"}
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-right">
              <p className="text-xs text-white/70">Public Discovery Link</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  setStatusMessage({ type: "success", text: "Public event link copied to clipboard!" });
                }}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-gray-900 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-100"
              >
                <Share2 className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Agenda", icon: Calendar },
            { id: "tickets", label: `Ticket Tiers (${tickets.length})`, icon: Ticket },
            { id: "addons", label: `Add-ons (${addons.length})`, icon: Package },
            { id: "attendees", label: `Attendees (${attendees.length})`, icon: Users },
            { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Tickets Sold</span>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {event.stats?.tickets_sold ?? 0}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Gross Revenue</span>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ₹{(event.stats?.gross_revenue ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Orders Placed</span>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {event.stats?.total_orders ?? orders.length ?? 0}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Checked-in</span>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {event.stats?.checked_in_count ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Event Description</h3>
              <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>

            {sessions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Agenda & Schedule</h3>
                <div className="space-y-4">
                  {sessions.map((sess: any) => (
                    <div key={sess._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-4">
                      <div className="p-2.5 bg-white rounded-lg shadow-2xs text-primary-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{sess.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(sess.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {new Date(sess.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {sess.description && <p className="text-xs text-gray-600 mt-2">{sess.description}</p>}
                        {sess.speakers?.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Speakers:</span>{" "}
                            {sess.speakers.map((s: any) => s.name).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Venue & Logistics</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Event Format</span>
                  <span className="font-medium text-gray-800">{event.event_type}</span>
                </div>
                {(event.venue_details?.venue_name || event.venue_name) && (
                  <div>
                    <span className="text-xs text-gray-400 block">Venue Name</span>
                    <span className="font-medium text-gray-800">{event.venue_details?.venue_name || event.venue_name}</span>
                  </div>
                )}
                {(event.venue_details?.address || event.venue_details?.city || event.address) && (
                  <div>
                    <span className="text-xs text-gray-400 block">Address</span>
                    <span className="font-medium text-gray-800">
                      {[
                        event.venue_details?.address,
                        event.venue_details?.city,
                        event.venue_details?.state,
                        event.venue_details?.country
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        (typeof event.address === "object"
                          ? [event.address?.street, event.address?.city, event.address?.state].filter(Boolean).join(", ")
                          : event.address)}
                    </span>
                  </div>
                )}
                {(event.online_details?.meeting_link || event.meeting_link) && (
                  <div>
                    <span className="text-xs text-gray-400 block">Online Meeting Link</span>
                    <a
                      href={event.online_details?.meeting_link || event.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate block"
                    >
                      {event.online_details?.meeting_link || event.meeting_link}
                    </a>
                  </div>
                )}
                {event.organizer_name && (
                  <div>
                    <span className="text-xs text-gray-400 block">Organizer</span>
                    <span className="font-medium text-gray-800">{event.organizer_name} ({event.organizer_email})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Event Policies</h3>
              <div className="space-y-3 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-800 block">Refund Policy</span>
                  {event.refund_policy || "Organizer policy applies."}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 block">Terms & Conditions</span>
                  {event.terms_and_conditions || "Standard platform ticket terms apply."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tickets */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Manage ticket tiers, pricing, and individual inventory quotas.</p>
            <button
              onClick={() => setShowTicketModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Ticket Tier
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Ticket className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">No ticket tiers created yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create at least one ticket tier so attendees can register.</p>
              <button
                onClick={() => setShowTicketModal(true)}
                className="mt-3 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold"
              >
                Add First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((tick: any) => {
                const sold = tick.sold_quantity ?? tick.sold_inventory ?? 0;
                const total = tick.total_inventory || (sold + (tick.available_quantity || 0)) || 1;
                const pct = Math.min(100, Math.round((sold / total) * 100));

                return (
                  <div key={tick._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                          {tick.price === 0 || tick.is_free ? "FREE TICKET" : `${tick.currency || 'INR'} ${tick.price}`}
                        </span>
                        <h4 className="text-base font-bold text-gray-900 mt-2">{tick.name}</h4>
                      </div>
                      <span className="text-xs font-medium text-gray-500 uppercase">{tick.status || "ACTIVE"}</span>
                    </div>

                    {tick.description && <p className="text-xs text-gray-500 line-clamp-2">{tick.description}</p>}

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Sold: {sold} / {total}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>

                    {tick.benefits?.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                        {tick.benefits.slice(0, 3).map((b: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="truncate">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Add-ons */}
      {activeTab === "addons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Offer optional merchandise, meals, workshops, or parking passes.</p>
            <button
              onClick={() => setShowAddonModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Add-on Item
            </button>
          </div>

          {addons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">No add-ons created yet.</p>
              <p className="text-xs text-gray-400 mt-1">Enhance ticket sales with merchandise, lunch passes, and VIP perks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addons.map((add: any) => (
                <div key={add._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {add.category || "ADD-ON"}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {add.currency || 'INR'} {add.price}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{add.name}</h4>
                  {add.description && <p className="text-xs text-gray-500">{add.description}</p>}
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex justify-between">
                    <span>Sold: {add.sold_quantity ?? add.sold_inventory ?? 0}</span>
                    <span>Total Quota: {add.total_inventory || add.available_quantity || "Unlimited"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Attendees */}
      {activeTab === "attendees" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Registered Attendees ({attendees.length})</h3>
            <Link
              to="/event-management/attendees"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Open Full Directory →
            </Link>
          </div>
          {attendees.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No attendees have registered for this event yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Attendee</th>
                    <th className="px-4 py-3">Ticket Category</th>
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Check-in Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendees.map((att: any) => (
                    <tr key={att._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{att.attendee_name}</div>
                        <div className="text-xs text-gray-500">{att.attendee_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                        {att.ticket_type_id?.name || "General"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{att.ticket_number}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                            att.checkin_status === "CHECKED_IN"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {att.checkin_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Orders */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Event Booking Orders ({orders.length})</h3>
            <Link to="/event-management/orders" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Open Full Orders Ledger →
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No orders placed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Gross Total</th>
                    <th className="px-4 py-3">Net Organizer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((ord: any) => (
                    <tr key={ord._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-primary-600 font-semibold">{ord.order_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ord.customer_name}</div>
                        <div className="text-xs text-gray-500">{ord.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-900">
                        {ord.currency || 'INR'} {(ord.total_payable ?? ord.total_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-green-700">
                        {ord.currency || 'INR'} {(ord.net_organizer_payable ?? ord.organizer_payable_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                            ord.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : ord.status === "REFUNDED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(ord.created_at || ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create Ticket Tier</h3>
              <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Pass, Early Bird, General"
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What is included with this ticket?"
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Price (0 for Free) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ticketForm.price}
                    onChange={(e) => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Inventory Quota *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ticketForm.total_inventory}
                    onChange={(e) => setTicketForm({ ...ticketForm, total_inventory: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Benefits (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front row seat, Free drink, Swag bag"
                  value={ticketForm.benefits}
                  onChange={(e) => setTicketForm({ ...ticketForm, benefits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Save Ticket Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add-on Modal */}
      {showAddonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add Add-on Item</h3>
              <button onClick={() => setShowAddonModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateAddon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Add-on Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official T-Shirt, Buffet Lunch, Parking Pass"
                  value={addonForm.name}
                  onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={addonForm.category}
                    onChange={(e) => setAddonForm({ ...addonForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="MERCHANDISE">Merchandise</option>
                    <option value="MEAL">Meal</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="PARKING">Parking</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Price *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addonForm.price}
                    onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Total Available *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addonForm.total_inventory}
                  onChange={(e) => setAddonForm({ ...addonForm, total_inventory: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddonModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Save Add-on
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
