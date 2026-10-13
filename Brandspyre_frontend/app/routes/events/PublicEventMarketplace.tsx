import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  MapPin, 
  Search, 
  Tag, 
  Video, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Ticket, 
  Clock 
} from "lucide-react";
import eventService from "~/services/eventService";
import darkHeroImg from "../../assets/hero_dark_skyline.jpg";

const CATEGORIES = [
  "ALL",
  "Technology",
  "Business & Startups",
  "Workshops & Masterclasses",
  "Conferences & Summits",
  "Entertainment & Music",
  "Networking & Social"
];

export default function PublicEventMarketplace() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedType, dateFilter, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getPublicEvents({
        page,
        limit: 9,
        search: search.trim() || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        event_type: selectedType !== "ALL" ? selectedType : undefined,
        date_filter: dateFilter !== "ALL" ? dateFilter : undefined,
        city: city.trim() || undefined
      });

      if (res.success) {
        setEvents(res.data);
        setTotalPages(res.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load public events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      weekday: "short"
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      {/* 🌟 Brandspyre Dark Cinematic Hero Section */}
      <section className="relative pt-14 sm:pt-20 pb-24 sm:pb-32 bg-slate-950 text-white overflow-hidden select-none border-b border-slate-800">
        {/* Background Image: Luxury High-Rise Office with City Skyline at Dusk */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={darkHeroImg}
            alt="Brandspyre modern enterprise events and summits"
            className="w-full h-full object-cover object-center sm:object-top opacity-90 filter brightness-[0.85] contrast-[1.05]"
          />

          {/* Moody Center Dark Vignette for Pristine Typography Contrast */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(2, 6, 23, 0.88) 0%, rgba(2, 6, 23, 0.65) 50%, rgba(2, 6, 23, 0.25) 100%)",
            }}
          />

          {/* Top subtle navbar shadow & bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
        </div>

        {/* Faint Connected Constellation Network Nodes in the Center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25 z-1">
          <svg className="w-[850px] h-[450px]" viewBox="0 0 850 450" fill="none">
            <circle cx="160" cy="200" r="3" fill="#ef4444" />
            <circle cx="300" cy="140" r="2.5" fill="#60a5fa" />
            <circle cx="420" cy="240" r="3" fill="#38bdf8" />
            <circle cx="560" cy="150" r="3" fill="#ef4444" />
            <circle cx="700" cy="220" r="2.5" fill="#60a5fa" />
            <line x1="160" y1="200" x2="300" y2="140" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="300" y1="140" x2="420" y2="240" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="420" y1="240" x2="560" y2="150" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="560" y1="150" x2="700" y2="220" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Eyebrow in Crimson Red */}
          <div className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-red-500">
            Brandspyre Events & Experience Hub
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Discover, Experience & Book <br className="hidden sm:inline" />
            World-Class Events
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Browse premium conferences, professional workshops, summits, and live experiences. Secure instant QR tickets with seamless checkout.
          </p>

          {/* 🔍 Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search events, workshops, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div className="sm:w-48 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <MapPin size={18} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="City (e.g. Mumbai)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Search Events
            </button>
          </form>
        </div>

        {/* Curved Organic Bottom Transition Mask */}
        <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg
            className="relative block w-full h-12 sm:h-16 lg:h-20 text-slate-50 dark:text-slate-950 fill-current"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C380,95 1060,95 1440,0 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* 🏷️ Filter & Category Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-red-600 text-white border-red-600 shadow-sm font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Quick Filter Tabs: Date & Type */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} /> When:
            </span>
            {[
              { id: "ALL", label: "Anytime" },
              { id: "TODAY", label: "Today" },
              { id: "THIS_WEEK", label: "This Week" },
              { id: "UPCOMING", label: "Upcoming" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setDateFilter(tab.id); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  dateFilter === tab.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} /> Format:
            </span>
            {[
              { id: "ALL", label: "All Formats" },
              { id: "PHYSICAL", label: "In-Person" },
              { id: "ONLINE", label: "Online" },
              { id: "HYBRID", label: "Hybrid" }
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => { setSelectedType(fmt.id); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedType === fmt.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🎟️ Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-96" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
              <Ticket size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Published Events Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No matching events found for the selected category and filters. Try adjusting your search keywords.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCity("");
                setSelectedCategory("ALL");
                setSelectedType("ALL");
                setDateFilter("ALL");
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {events.map((evt) => {
              const startingPrice = evt.starting_price ?? 0;
              const isFree = startingPrice === 0;

              return (
                <div
                  key={evt._id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image Banner */}
                    <div className="relative h-48 bg-slate-800 overflow-hidden">
                      {evt.cover_image ? (
                        <img
                          src={evt.cover_image}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center text-slate-500">
                          <Ticket size={48} className="opacity-40" />
                        </div>
                      )}

                      {/* Event Type & Category Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                          {evt.category}
                        </span>
                        {evt.event_type === "ONLINE" && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white flex items-center gap-1">
                            <Video size={11} /> Online
                          </span>
                        )}
                      </div>

                      {evt.is_featured && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                          <Sparkles size={11} /> Featured
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                        <Calendar size={14} />
                        <span>{formatDate(evt.start_date)} • {formatTime(evt.start_date)}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {evt.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {evt.short_summary || evt.description?.replace(/<[^>]*>?/gm, '').slice(0, 120)}
                      </p>

                      <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {evt.event_type === "ONLINE" ? (
                          <>
                            <Video size={13} className="text-emerald-500" />
                            <span>Virtual • {evt.online_details?.platform || "Online Stream"}</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={13} className="text-rose-500" />
                            <span className="truncate">
                              {evt.venue_details?.venue_name ? `${evt.venue_details.venue_name}, ` : ""}
                              {evt.venue_details?.city || "Venue TBA"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Price & CTA */}
                  <div className="p-5 pt-0 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">Starting from</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {isFree ? "Free" : `₹${startingPrice.toLocaleString("en-IN")}`}
                      </p>
                    </div>

                    <Link
                      to={`/explore-events/${evt.slug || evt._id}`}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      Get Tickets <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-8 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:border-red-500 hover:text-red-600 transition"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:border-red-500 hover:text-red-600 transition"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
