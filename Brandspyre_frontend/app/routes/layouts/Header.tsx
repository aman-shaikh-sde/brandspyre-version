import { ChevronsLeft, Bell, Menu, Search, User, LogOut, Settings as SettingsIcon, CreditCard, ChevronDown, Sliders } from "lucide-react";
import { useSideBar } from "~/store/useSideBar";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";
import GlobalSearch from "src/component/ui/GlobalSearch";

export const Header = () => {
  const { isOpen, toggle, toggleMobile } = useSideBar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const UserRole = useAuthStore((state) => state.role);
  const token = useAuthStore((state: any) => state.accessToken);
  const staff_id = useAuthStore((state: any) => state.staff_id);

  const [count, setCount] = useState(0);
  const [leaves, setLeaves] = useState(0);
  const [meetings, setMeetings] = useState(0);
  const [newprojects, setNewprojects] = useState(0);
  const [completedmilestones, setCompletemilestones] = useState(0);
  const [partialmilestones, setPartialmilestones] = useState(0);
  const [reportsOpen, setReportsOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [subInfo, setSubInfo] = useState<{ planName: string; daysLeft: number; isTrial: boolean; isGrace: boolean } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient.get(`/saas/subscription/current`)
      .then((res) => {
        const sub = res.data?.data?.subscription;
        const plan = res.data?.data?.plan;
        if (!sub || !plan) return;

        const endDate = new Date(sub.status === 'trial' ? (sub.trial_end_date || sub.end_date) : sub.end_date);
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        setSubInfo({
          planName: plan.plan_name,
          daysLeft,
          isTrial: sub.status === 'trial',
          isGrace: sub.status === 'grace'
        });
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (!event.composedPath().some((el: any) => el?.classList?.contains("reports-dropdown"))) {
        setReportsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchAllCounts = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const requests = [
        apiClient.get(`/project/overview/read?overdue=${today}`, { headers }),
        apiClient.get(`/project/task/read?overdue=${today}`, { headers }),
        apiClient.get(`/project/milestone/read?overdue=${today}`, { headers }),
        apiClient.get(`/project/invoice/read?overdue=${today}`, { headers }),
        apiClient.get(`/campaign/followup/read?status=active`, { headers }),
        apiClient.get(`/users/leavereq/read?status=pending`, { headers }),
        apiClient.get(`/project/overview/read?initiate=initiate`, { headers }),
        apiClient.get(`/project/milestone/read?done=${today}`, { headers }),
        apiClient.get(`/project/milestone/read?partial=${today}`, { headers }),
        apiClient.get(`/doc_meet/read?comm_type=meeting&status=active`, { headers }),
      ];

      const results = await Promise.allSettled(requests);

      const getVal = (res: any) =>
        res.status === "fulfilled" && res.value?.data
          ? res.value.data.totalDocuments ?? res.value.data.total ?? 0
          : 0;

      const pCount = getVal(results[0]);
      const tCount = getVal(results[1]);
      const mCount = getVal(results[2]);
      const payCount = getVal(results[3]);
      const fCount = getVal(results[4]);
      setCount(pCount + tCount + mCount + payCount + fCount);

      setLeaves(getVal(results[5]));
      setNewprojects(getVal(results[6]));
      setCompletemilestones(getVal(results[7]));
      setPartialmilestones(getVal(results[8]));

      if (results[9].status === "fulfilled" && results[9].value?.data) {
        const resData = results[9].value.data;
        if (UserRole === "admin" || UserRole === "superadmin") {
          setMeetings(resData.totalDocuments ?? resData.total ?? 0);
        } else {
          const meetingsList = resData.data ?? [];
          setMeetings(
            meetingsList.filter(
              (m: any) => m.createdby === staff_id || m.participants?.some((p: any) => p.person_id === staff_id)
            ).length
          );
        }
      }
    };

    fetchAllCounts();
  }, [today, token, UserRole, staff_id]);

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
      useAuthStore.getState().clearAuthData();
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 transition-colors shadow-2xs">
        {/* Left Side: Sidebar Toggle & Global Search Trigger */}
        <div className="flex items-center gap-x-3">
          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleMobile}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Toggle */}
          <button
            className="hidden md:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={toggle}
            aria-label="Toggle Sidebar"
          >
            <ChevronsLeft className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} size={18} />
          </button>

          {/* Global Search Button Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all min-w-[200px] lg:min-w-[260px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <span>Search CRM...</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-x-3 lg:gap-x-5 text-xs font-semibold">
          {/* Reports Quick Link */}
          {(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr" || UserRole === "team leader") && (
            <div className="relative reports-dropdown">
              <button
                onClick={() => setReportsOpen((prev) => !prev)}
                className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 transition-colors py-1"
              >
                <span>Reports</span>
                <ChevronDown size={14} />
              </button>

              {reportsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1.5">
                  <button
                    onClick={() => { setReportsOpen(false); navigate("/cumulative"); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Project Reports
                  </button>
                  <button
                    onClick={() => { setReportsOpen(false); navigate("/revised_projects"); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Revision Reports
                  </button>
                  <button
                    onClick={() => { setReportsOpen(false); navigate("/employee_report"); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Employee Reports
                  </button>
                  <button
                    onClick={() => { setReportsOpen(false); navigate("/attandance"); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Attendance Reports
                  </button>
                  <button
                    onClick={() => { setReportsOpen(false); navigate("/account"); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Financial Reports
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Metrics Badges */}
          {leaves > 0 && (
            <button onClick={() => navigate("/leave")} className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-full text-amber-700 dark:text-amber-300">
              <span>Leaves</span>
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">{leaves}</span>
            </button>
          )}

          {newprojects > 0 && (
            <button onClick={() => navigate("/notification?tab=milestone")} className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-full text-blue-700 dark:text-blue-300">
              <span>New Projects</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">{newprojects}</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => navigate("/notification")}
              aria-label="View Notifications"
              className="p-1.5 text-slate-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              <Bell size={19} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          </div>

          {/* Subscription Pill */}
          {subInfo && (
            <div
              onClick={() => navigate("/settings/billing")}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-medium cursor-pointer hover:border-slate-300 transition-all"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${subInfo.isGrace ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[110px]">{subInfo.planName}</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/pricing"); }}
                className="ml-1 px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold rounded-full transition"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-xs border border-red-200 dark:border-red-800/40">
                <User size={14} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline capitalize">
                {UserRole || "Admin"}
              </span>
              <ChevronDown size={14} className="text-slate-400 hidden md:inline" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  Signed in as <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">{UserRole}</span>
                </div>

                <Link
                  to="/account_profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                >
                  <User size={14} className="text-slate-400" />
                  My Profile
                </Link>

                <Link
                  to="/settings/billing"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                >
                  <CreditCard size={14} className="text-slate-400" />
                  Subscription & Billing
                </Link>

                <Link
                  to="/settings/modules"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                >
                  <Sliders size={14} className="text-slate-400" />
                  Module Settings
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                >
                  <SettingsIcon size={14} className="text-slate-400" />
                  System Settings
                </Link>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-left transition font-semibold"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal Dialog */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;