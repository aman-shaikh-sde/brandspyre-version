import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Video,
  Clock,
  CheckCircle,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Ticket,
  Package,
  Share2,
  AlertCircle
} from "lucide-react";
import eventService from "~/services/eventService";

export default function PublicEventDetail() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "tickets" | "addons" | "policies">("tickets");

  // Selection state
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, { quantity: number; variant?: string }>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slugOrId) {
      fetchEvent();
    }
  }, [slugOrId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await eventService.getPublicEventDetails(slugOrId!);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load event details:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketQty = (ticketId: string, delta: number, max: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      }
      return { ...prev, [ticketId]: next };
    });
  };

  const updateAddonQty = (addonId: string, delta: number, max: number, variant?: string) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId]?.quantity || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return {
        ...prev,
        [addonId]: { quantity: next, variant: variant || prev[addonId]?.variant }
      };
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!data?.event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Not Available</h2>
        <p className="text-sm text-slate-500 mt-2">This event may have ended or is not currently public.</p>
        <Link to="/explore-events" className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
          Explore Other Events
        </Link>
      </div>
    );
  }

  const { event, tickets = [], addons = [], sessions = [] } = data;

  // Compute order summary
  let totalTicketCount = 0;
  let grossTicketSubtotal = 0;
  for (const [tId, qty] of Object.entries(selectedTickets)) {
    const t = tickets.find((tk: any) => tk._id === tId);
    if (t) {
      totalTicketCount += qty;
      grossTicketSubtotal += t.price * qty;
    }
  }

  let totalAddonCount = 0;
  let grossAddonSubtotal = 0;
  for (const [aId, item] of Object.entries(selectedAddons)) {
    const a = addons.find((ad: any) => ad._id === aId);
    if (a) {
      let unitPrice = a.price;
      if (item.variant && a.variants) {
        const matchVar = a.variants.find((v: any) => v.name === item.variant);
        if (matchVar) unitPrice += matchVar.price_modifier;
      }
      totalAddonCount += item.quantity;
      grossAddonSubtotal += unitPrice * item.quantity;
    }
  }

  const totalAmount = grossTicketSubtotal + grossAddonSubtotal;

  const handleProceedToCheckout = () => {
    // Store cart in sessionStorage for checkout page retrieval
    const cart = {
      event_id: event._id,
      selectedTickets,
      selectedAddons
    };
    sessionStorage.setItem("brandspyre_event_cart", JSON.stringify(cart));
    navigate(`/explore-events/${slugOrId}/checkout`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* 🌟 Event Cover Banner */}
      <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-600 text-white">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-200">
              {event.event_type}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
            {event.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <span>Organized by <strong className="text-white">{event.organizer_name}</strong></span>
          </p>
        </div>
      </div>

      {/* 📅 Date, Time & Location Quick Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Date & Time</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formatDate(event.start_date)} • {formatTime(event.start_date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Location</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {event.event_type === "ONLINE"
                    ? `Online • ${event.online_details?.platform || "Virtual"}`
                    : `${event.venue_details?.venue_name || "Venue"}, ${event.venue_details?.city || ""}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Share2 size={14} /> {copied ? "Link Copied!" : "Share Event"}
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Tabs & Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              {[
                { id: "tickets", label: "Tickets & Passes" },
                { id: "about", label: "About & Schedule" },
                { id: "addons", label: "Add-ons & Extras" },
                { id: "policies", label: "Policies & Terms" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: TICKETS */}
            {activeTab === "tickets" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Ticket Category</h3>
                {tickets.length === 0 ? (
                  <p className="text-sm text-slate-500">No ticket tiers currently available.</p>
                ) : (
                  tickets.map((t: any) => {
                    const isSoldOut = t.available_quantity <= 0 || t.status === "SOLD_OUT";
                    const qty = selectedTickets[t._id] || 0;

                    return (
                      <div
                        key={t._id}
                        className={`p-5 rounded-2xl border transition-all ${
                          qty > 0
                            ? "border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">{t.name}</h4>
                              {isSoldOut ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Sold Out
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  {t.available_quantity} spots left
                                </span>
                              )}
                            </div>

                            {t.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                            )}

                            {t.benefits && t.benefits.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-2">
                                {t.benefits.map((b: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                                    <CheckCircle size={12} className="text-red-600 dark:text-red-400" /> {b}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <div className="text-left sm:text-right">
                              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                {t.price === 0 ? "Free" : `₹${t.price.toLocaleString("en-IN")}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">per attendee</p>
                            </div>

                            {/* Quantity Controls */}
                            {!isSoldOut && (
                              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                  onClick={() => updateTicketQty(t._id, -1, t.max_per_order)}
                                  disabled={qty === 0}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-30 shadow-xs"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateTicketQty(t._id, 1, t.max_per_order)}
                                  disabled={qty >= t.max_per_order}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-30 shadow-xs"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: ABOUT & SCHEDULE */}
            {activeTab === "about" && (
              <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">About the Event</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </div>
                </div>

                {sessions && sessions.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Event Agenda & Sessions</h3>
                    <div className="space-y-3">
                      {sessions.map((s: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-red-600 dark:text-red-400">
                            <span>Day {s.day_number || 1} • {formatTime(s.start_time)} - {formatTime(s.end_time)}</span>
                            {s.room_or_stage && <span className="text-slate-400">{s.room_or_stage}</span>}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h4>
                          {s.description && <p className="text-xs text-slate-500 dark:text-slate-400">{s.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADD-ONS */}
            {activeTab === "addons" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Optional Add-ons & Extras</h3>
                {addons.length === 0 ? (
                  <p className="text-sm text-slate-500">No add-ons available for this event.</p>
                ) : (
                  addons.map((a: any) => {
                    const selected = selectedAddons[a._id];
                    const qty = selected?.quantity || 0;

                    return (
                      <div key={a._id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{a.name}</h4>
                          {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                          {a.variants && a.variants.length > 0 && (
                            <div className="pt-2 flex items-center gap-2">
                              <span className="text-xs text-slate-400">Option:</span>
                              <select
                                value={selected?.variant || a.variants[0]?.name}
                                onChange={(e) => updateAddonQty(a._id, 0, a.max_per_order, e.target.value)}
                                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1"
                              >
                                {a.variants.map((v: any, vIdx: number) => (
                                  <option key={vIdx} value={v.name}>
                                    {v.name} {v.price_modifier ? `(+₹${v.price_modifier})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                          <div className="text-left sm:text-right">
                            <p className="text-base font-extrabold text-slate-900 dark:text-white">
                              ₹{a.price.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                              onClick={() => updateAddonQty(a._id, -1, a.max_per_order)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">{qty}</span>
                            <button
                              onClick={() => updateAddonQty(a._id, 1, a.max_per_order)}
                              disabled={qty >= a.max_per_order}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: POLICIES */}
            {activeTab === "policies" && (
              <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-500" /> Refund & Cancellation Policy
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {event.refund_policy || "Refunds are subject to organizer review."}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Terms & Admission Conditions</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {event.terms_and_conditions || "Standard event terms and guidelines apply."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Sticky Booking Summary Widget */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Order Summary</h3>

              {totalTicketCount === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Ticket size={24} className="mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500">Please select at least 1 ticket to proceed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 text-xs">
                    {Object.entries(selectedTickets).map(([tId, qty]) => {
                      const t = tickets.find((tk: any) => tk._id === tId);
                      if (!t) return null;
                      return (
                        <div key={tId} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                          <span>{t.name} × {qty}</span>
                          <span className="font-semibold">₹{(t.price * qty).toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })}

                    {Object.entries(selectedAddons).map(([aId, item]) => {
                      const a = addons.find((ad: any) => ad._id === aId);
                      if (!a) return null;
                      let unitPrice = a.price;
                      if (item.variant && a.variants) {
                        const mv = a.variants.find((v: any) => v.name === item.variant);
                        if (mv) unitPrice += mv.price_modifier;
                      }
                      return (
                        <div key={aId} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                          <span>{a.name} ({item.variant || "Standard"}) × {item.quantity}</span>
                          <span className="font-semibold">₹{(unitPrice * item.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Total Payable</span>
                    <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
                      {totalAmount === 0 ? "Free" : `₹${totalAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" /> Verified 256-bit encrypted checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
