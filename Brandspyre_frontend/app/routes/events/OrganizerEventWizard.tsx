import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Video,
  Ticket,
  Package,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

const CATEGORIES = [
  "Technology",
  "Business & Startups",
  "Workshops & Masterclasses",
  "Conferences & Summits",
  "Entertainment & Music",
  "Networking & Social"
];

export default function OrganizerEventWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // STEP 1: Basic Details
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technology");
  const [shortSummary, setShortSummary] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"PHYSICAL" | "ONLINE" | "HYBRID">("PHYSICAL");
  const [coverImage, setCoverImage] = useState("");

  // Venue & Online
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [onlinePlatform, setOnlinePlatform] = useState("Zoom");
  const [meetingLink, setMeetingLink] = useState("");

  // Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Organizer Public Info
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");

  // STEP 2: Sessions / Schedule
  const [sessions, setSessions] = useState<Array<{
    title: string;
    description: string;
    day_number: number;
    start_time: string;
    end_time: string;
    speaker_name: string;
  }>>([]);

  // STEP 3: Initial Ticket Tier
  const [tickets, setTickets] = useState<Array<{
    name: string;
    description: string;
    price: number;
    total_inventory: number;
    min_per_order: number;
    max_per_order: number;
    benefits: string;
  }>>([
    {
      name: "General Admission",
      description: "Standard event pass with full session access.",
      price: 0,
      total_inventory: 100,
      min_per_order: 1,
      max_per_order: 5,
      benefits: "Access to all keynotes, Coffee break networking"
    }
  ]);

  // STEP 4: Add-ons
  const [addons, setAddons] = useState<Array<{
    name: string;
    description: string;
    price: number;
    total_inventory: number;
  }>>([]);

  // STEP 5: Registration Questions
  const [questions, setQuestions] = useState<Array<{
    id: string;
    label: string;
    field_type: 'TEXT' | 'EMAIL' | 'PHONE' | 'SELECT' | 'CHECKBOX' | 'NUMBER';
    options: string;
    is_required: boolean;
  }>>([]);

  // STEP 6: Policies
  const [refundPolicy, setRefundPolicy] = useState("Refunds allowed up to 48 hours prior to event start.");
  const [termsAndConditions, setTermsAndConditions] = useState("Standard admission policy and attendee conduct rules apply.");

  // Helpers
  const addSessionRow = () => {
    setSessions(prev => [
      ...prev,
      {
        title: "Session Keynote",
        description: "",
        day_number: 1,
        start_time: startDate || new Date().toISOString().slice(0, 16),
        end_time: endDate || new Date().toISOString().slice(0, 16),
        speaker_name: ""
      }
    ]);
  };

  const removeSessionRow = (idx: number) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  const addTicketRow = () => {
    setTickets(prev => [
      ...prev,
      {
        name: "VIP Pass",
        description: "Priority seating and VIP lounge access.",
        price: 999,
        total_inventory: 50,
        min_per_order: 1,
        max_per_order: 5,
        benefits: "VIP seating, Dedicated check-in counter"
      }
    ]);
  };

  const removeTicketRow = (idx: number) => {
    if (tickets.length <= 1) return;
    setTickets(prev => prev.filter((_, i) => i !== idx));
  };

  const addAddonRow = () => {
    setAddons(prev => [
      ...prev,
      {
        name: "Workshop Pass",
        description: "Hands-on afternoon masterclass.",
        price: 499,
        total_inventory: 30
      }
    ]);
  };

  const removeAddonRow = (idx: number) => {
    setAddons(prev => prev.filter((_, i) => i !== idx));
  };

  const addQuestionRow = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        label: "Company / Organization Name",
        field_type: "TEXT",
        options: "",
        is_required: true
      }
    ]);
  };

  const removeQuestionRow = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Form Submission
  const handleFinalSubmit = async (publishImmediately: boolean) => {
    setErrorMessage("");

    if (!title.trim() || !startDate || !endDate || !organizerName.trim() || !organizerEmail.trim()) {
      setErrorMessage("Please complete all required fields (Title, Organizer Name, Organizer Email, Start & End Dates).");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create Event Draft
      const eventPayload = {
        title: title.trim(),
        category,
        short_summary: shortSummary,
        description,
        event_type: eventType,
        cover_image: coverImage,
        venue_details: eventType !== "ONLINE" ? {
          venue_name: venueName,
          address,
          city
        } : undefined,
        online_details: eventType !== "PHYSICAL" ? {
          platform: onlinePlatform,
          meeting_link: meetingLink
        } : undefined,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        timezone,
        organizer_name: organizerName || "Brandspyre Organizer",
        organizer_email: organizerEmail,
        refund_policy: refundPolicy,
        terms_and_conditions: termsAndConditions,
        registration_questions: questions.map(q => ({
          id: q.id,
          label: q.label,
          field_type: q.field_type,
          options: q.options ? q.options.split(",").map(s => s.trim()) : [],
          is_required: q.is_required,
          applies_per_ticket: true
        }))
      };

      const eventRes = await eventService.createEvent(eventPayload);
      if (!eventRes.success) {
        setErrorMessage(eventRes.message || "Failed to create event.");
        setSubmitting(false);
        return;
      }

      const eventId = eventRes.data._id;

      // 2. Add Tickets
      for (const t of tickets) {
        await eventService.createTicket(eventId, {
          name: t.name,
          description: t.description,
          price: t.price,
          total_inventory: t.total_inventory,
          min_per_order: t.min_per_order,
          max_per_order: t.max_per_order,
          benefits: t.benefits ? t.benefits.split(",").map(b => b.trim()) : []
        });
      }

      // 3. Add Addons
      for (const a of addons) {
        await eventService.createAddon(eventId, {
          name: a.name,
          description: a.description,
          price: a.price,
          total_inventory: a.total_inventory
        });
      }

      // 4. Add Sessions
      for (const s of sessions) {
        await eventService.createSession(eventId, {
          title: s.title,
          description: s.description,
          day_number: s.day_number,
          start_time: s.start_time,
          end_time: s.end_time,
          speakers: s.speaker_name ? [{ name: s.speaker_name }] : []
        });
      }

      // 5. Publish if requested
      if (publishImmediately) {
        await eventService.publishEvent(eventId);
      }

      navigate(`/event-management/events/${eventId}`);
    } catch (err: any) {
      console.error("Wizard error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "An error occurred during event creation.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Event Creation Wizard"
        description="Follow the steps to configure event details, ticket categories, schedule, and registration rules."
        secondaryActions={[
          {
            label: "Back to Events",
            href: "/event-management/events",
            icon: <ArrowLeft size={14} />
          }
        ]}
      />

      {/* Steps Progress Indicator */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between overflow-x-auto">
        {[
          { num: 1, title: "Details" },
          { num: 2, title: "Schedule" },
          { num: 3, title: "Tickets" },
          { num: 4, title: "Add-ons" },
          { num: 5, title: "Questions" },
          { num: 6, title: "Policies" }
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              currentStep === s.num
                ? "bg-indigo-600 text-white"
                : currentStep > s.num
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === s.num
                ? "bg-white text-indigo-600 font-bold"
                : currentStep > s.num
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}>
              {s.num}
            </span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {/* STEP 1: Basic Event Details */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 1: Event Overview</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI & SaaS Global Leadership Summit 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Event Format *</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  <option value="PHYSICAL">In-Person (Physical Venue)</option>
                  <option value="ONLINE">Online (Virtual Webcast)</option>
                  <option value="HYBRID">Hybrid (Physical + Virtual)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Short Summary</label>
              <input
                type="text"
                placeholder="Catchy 1-line event summary for marketplace cards..."
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Detailed event agenda, highlights, speakers, and topics covered..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cover Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/event-banner.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            {/* Organizer Public Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Organizer / Host Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brandspyre Events"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Organizer Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. events@brandspyre.com"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Venue or Online Details */}
            {eventType !== "ONLINE" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-500">Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Convention Center"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {eventType !== "PHYSICAL" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-xs font-medium text-slate-500">Virtual Platform</label>
                  <input
                    type="text"
                    placeholder="Zoom / Google Meet"
                    value={onlinePlatform}
                    onChange={(e) => setOnlinePlatform(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              Next: Schedule <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Schedule & Sessions */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 2: Agenda & Sessions</h3>
            <button
              onClick={addSessionRow}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No individual sessions added yet. Optional — you can skip this step for single-track events.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Session #{idx + 1}</span>
                    <button onClick={() => removeSessionRow(idx)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Session Title"
                        value={s.title}
                        onChange={(e) => {
                          const copy = [...sessions];
                          copy[idx].title = e.target.value;
                          setSessions(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Speaker Name"
                        value={s.speaker_name}
                        onChange={(e) => {
                          const copy = [...sessions];
                          copy[idx].speaker_name = e.target.value;
                          setSessions(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              Next: Ticket Types <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Ticket Types */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 3: Tickets & Inventory</h3>
            <button
              onClick={addTicketRow}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add Ticket Category
            </button>
          </div>

          <div className="space-y-4">
            {tickets.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Tier #{idx + 1}</span>
                  {tickets.length > 1 && (
                    <button onClick={() => removeTicketRow(idx)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500">Tier Name *</label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const copy = [...tickets];
                        copy[idx].name = e.target.value;
                        setTickets(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500">Price (₹ 0 = Free) *</label>
                    <input
                      type="number"
                      min={0}
                      value={t.price}
                      onChange={(e) => {
                        const copy = [...tickets];
                        copy[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                        setTickets(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500">Total Capacity *</label>
                    <input
                      type="number"
                      min={1}
                      value={t.total_inventory}
                      onChange={(e) => {
                        const copy = [...tickets];
                        copy[idx].total_inventory = Math.max(1, parseInt(e.target.value) || 1);
                        setTickets(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Included Benefits (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Keynote access, Lunch pass, Networking kit"
                    value={t.benefits}
                    onChange={(e) => {
                      const copy = [...tickets];
                      copy[idx].benefits = e.target.value;
                      setTickets(copy);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              Next: Add-ons <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Add-ons */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 4: Optional Add-ons & Merchandise</h3>
            <button
              onClick={addAddonRow}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add Extra
            </button>
          </div>

          {addons.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No add-ons configured yet. Optional — click "Add Extra" to offer workshops, merchandise, or parking.
            </p>
          ) : (
            <div className="space-y-3">
              {addons.map((a, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add-on #{idx + 1}</span>
                    <button onClick={() => removeAddonRow(idx)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500">Name</label>
                      <input
                        type="text"
                        value={a.name}
                        onChange={(e) => {
                          const copy = [...addons];
                          copy[idx].name = e.target.value;
                          setAddons(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={a.price}
                        onChange={(e) => {
                          const copy = [...addons];
                          copy[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                          setAddons(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Inventory</label>
                      <input
                        type="number"
                        min={1}
                        value={a.total_inventory}
                        onChange={(e) => {
                          const copy = [...addons];
                          copy[idx].total_inventory = parseInt(e.target.value) || 100;
                          setAddons(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              Next: Registration Form <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Registration Questions */}
      {currentStep === 5 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 5: Attendee Questions</h3>
            <button
              onClick={addQuestionRow}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus size={14} /> Add Custom Field
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Standard fields (Name, Email) are included automatically. Add company, designation, meal preference, or t-shirt size questions here.
          </p>

          {questions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No extra questions added. Attendee names and emails will be collected by default.
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Question #{idx + 1}</span>
                    <button onClick={() => removeQuestionRow(idx)} className="text-rose-500 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-500">Field Label</label>
                      <input
                        type="text"
                        value={q.label}
                        onChange={(e) => {
                          const copy = [...questions];
                          copy[idx].label = e.target.value;
                          setQuestions(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500">Input Type</label>
                      <select
                        value={q.field_type}
                        onChange={(e) => {
                          const copy = [...questions];
                          copy[idx].field_type = e.target.value as any;
                          setQuestions(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="TEXT">Text Field</option>
                        <option value="SELECT">Dropdown Menu</option>
                        <option value="NUMBER">Number</option>
                      </select>
                    </div>
                  </div>

                  {q.field_type === "SELECT" && (
                    <div>
                      <label className="text-[11px] text-slate-500">Dropdown Options (comma separated)</label>
                      <input
                        type="text"
                        placeholder="Option A, Option B, Option C"
                        value={q.options}
                        onChange={(e) => {
                          const copy = [...questions];
                          copy[idx].options = e.target.value;
                          setQuestions(copy);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.is_required}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[idx].is_required = e.target.checked;
                        setQuestions(copy);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Required field</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(6)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              Next: Policies & Publish <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Policies & Final Confirmation */}
      {currentStep === 6 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Step 6: Policies & Launch</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Refund & Cancellation Policy</label>
              <textarea
                rows={2}
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Terms & Conditions of Admission</label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} /> Platform Commission & Settlement Protection
              </p>
              <p>
                Platform commissions are applied authoritatively per order and stored immutably. Net proceeds will accumulate in your organization settlement balance.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentStep(5)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold w-full sm:w-auto"
            >
              Back
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 w-full sm:w-auto"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <CheckCircle2 size={16} /> Publish & Launch Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
