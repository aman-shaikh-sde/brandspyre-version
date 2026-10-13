import React, { useState, useEffect } from "react";
import { Search, X, Folder, Users, Phone, Calendar, Briefcase, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    projects: any[];
    leads: any[];
    employees: any[];
    meetings: any[];
  }>({ projects: [], leads: [], employees: [], meetings: [] });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || !token) {
      setResults({ projects: [], leads: [], employees: [], meetings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [projRes, leadRes, empRes] = await Promise.allSettled([
          apiClient.get(`/project/overview/read?search=${encodeURIComponent(query)}`, { headers }),
          apiClient.get(`/campaign/leads/read?search=${encodeURIComponent(query)}`, { headers }),
          apiClient.get(`/users/read?search=${encodeURIComponent(query)}`, { headers }),
        ]);

        const projects = projRes.status === "fulfilled" ? (projRes.value.data.data || []).slice(0, 3) : [];
        const leads = leadRes.status === "fulfilled" ? (leadRes.value.data.data || []).slice(0, 3) : [];
        const employees = empRes.status === "fulfilled" ? (empRes.value.data.data || []).slice(0, 3) : [];

        setResults({ projects, leads, employees, meetings: [] });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    results.projects.length > 0 ||
    results.leads.length > 0 ||
    results.employees.length > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={18} className="text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, leads, employees, meetings... (Press Esc to exit)"
            className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 text-xs">
          {loading && (
            <div className="p-4 text-center text-slate-400 animate-pulse">
              Searching enterprise records...
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="p-6 text-center text-slate-400">
              <Command size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Quick Search</p>
              <p className="text-[11px] text-slate-400 mt-1">Type any keyword to locate projects, leads, contacts or accounts.</p>
            </div>
          )}

          {!loading && query.trim() && !hasResults && (
            <div className="p-6 text-center text-slate-400">
              <p className="font-medium text-slate-600 dark:text-slate-300">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Check spelling or try a different term.</p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="space-y-4">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <p className="px-2 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">Projects</p>
                  <div className="space-y-1 mt-1">
                    {results.projects.map((p) => (
                      <button
                        key={p._id || p.project_id}
                        onClick={() => handleSelect(`/project/${p._id || p.project_id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                      >
                        <div className="flex items-center gap-2">
                          <Folder size={16} className="text-red-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{p.proj_name || p.project_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{p.proj_type || "Project"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads */}
              {results.leads.length > 0 && (
                <div>
                  <p className="px-2 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">Leads</p>
                  <div className="space-y-1 mt-1">
                    {results.leads.map((l) => (
                      <button
                        key={l._id || l.lead_id}
                        onClick={() => handleSelect(`/leadsview/${l._id || l.lead_id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                      >
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-blue-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{l.lead_name || l.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{l.phone}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees */}
              {results.employees.length > 0 && (
                <div>
                  <p className="px-2 py-1 font-semibold text-[10px] uppercase tracking-wider text-slate-400">Employees</p>
                  <div className="space-y-1 mt-1">
                    {results.employees.map((e) => (
                      <button
                        key={e._id || e.staff_id}
                        onClick={() => handleSelect(`/employee_profile/${e._id || e.staff_id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
                      >
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-emerald-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{e.firstname} {e.lastname}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{e.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
