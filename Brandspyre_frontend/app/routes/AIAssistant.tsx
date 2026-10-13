import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "src/stores/authStore";
import useAIAssistantStore from "src/stores/AIAssistantStore";
import { notify } from "~/services/notificationService";
import {
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Bot,
  User,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Building2,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  Bell,
  Check,
  MessageSquare,
  FileSpreadsheet,
  Users,
  Compass,
  Code2,
  Terminal,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DemoScenario {
  id: string;
  category: string;
  icon: any;
  prompt: string;
  toolUsed: string;
  response: string;
  metrics: Array<{ label: string; value: string; trend: string }>;
  suggestedAction: { label: string; route?: string };
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "revenue",
    category: "Financial Intelligence",
    icon: TrendingUp,
    prompt: "What is our projected revenue for this month and which clients have pending billable milestones?",
    toolUsed: "BillingEngine.queryMilestoneReceivables({ period: 'current_month' })",
    response: "Based on active client contracts across your active branches, projected revenue for this month is ₹14,85,000. Currently, 3 client milestones have passed acceptance deadlines and are ready for invoice generation. No critical SLA disputes are pending.",
    metrics: [
      { label: "Projected Inflow", value: "₹14.85L", trend: "+12.4% vs last mo" },
      { label: "Pending Invoices", value: "3 Milestones", trend: "₹3,40,000" },
      { label: "Dispute Risk", value: "0 Detected", trend: "100% Healthy" },
    ],
    suggestedAction: { label: "Review Billable Transactions", route: "/billing/transactions" },
  },
  {
    id: "leads",
    category: "CRM & Meta Lead Ads",
    icon: Zap,
    prompt: "Analyze newly synced Meta Lead Ads and identify which leads require immediate sales outreach.",
    toolUsed: "LeadMappingService.auditStagnantLeads({ thresholdHours: 24 })",
    response: "Processed 18 Meta leads synced in the last 24 hours. 4 high-value enterprise leads have not been contacted by their assignees within the 2-hour SLA window. I have prepared personalized follow-up notifications for assignees to contact them immediately.",
    metrics: [
      { label: "New Leads (24h)", value: "18 Leads", trend: "100% Meta Synced" },
      { label: "SLA Attention", value: "4 Delayed", trend: "Action Required" },
      { label: "Estimated Value", value: "₹6.20L", trend: "Commercial Pipe" },
    ],
    suggestedAction: { label: "Open CRM Leads Board", route: "/leads" },
  },
  {
    id: "projects",
    category: "Project & Milestone Delivery",
    icon: Layers,
    prompt: "Which project milestones are at risk of missing deadlines next week?",
    toolUsed: "ProjectDeliveryEngine.detectMilestoneAnomalies({ daysAhead: 7 })",
    response: "Identified 2 milestones in 'Commercial Tech Tower' with pending task dependencies. Team velocity indicates a 3-day projected delay unless 2 additional engineers from the available pool are temporarily reallocated.",
    metrics: [
      { label: "Critical Path", value: "2 Milestones", trend: "At Risk" },
      { label: "Suggested Rebalance", value: "+2 Engineers", trend: "Available Pool" },
      { label: "Project Health", value: "88% On Track", trend: "Manageable" },
    ],
    suggestedAction: { label: "Inspect Project Overview", route: "/project" },
  },
  {
    id: "executive",
    category: "Executive Governance",
    icon: ShieldCheck,
    prompt: "Generate an executive operations briefing for Monday morning leadership meeting.",
    toolUsed: "ExecutiveDigest.compileCrossTenantSummary({ format: 'briefing' })",
    response: "Operational briefing compiled: 94.2% employee attendance recorded, total active contracts at ₹1.28 Cr, customer support ticket resolution at 98.4%, and zero compliance violations flagged under Role-Based Access Control policies.",
    metrics: [
      { label: "Fleet Attendance", value: "94.2%", trend: "Above Target" },
      { label: "Contract Book", value: "₹1.28 Cr", trend: "Active Pipeline" },
      { label: "PBAC Audit", value: "Passed", trend: "0 Access Leaks" },
    ],
    suggestedAction: { label: "View Complete Report Analysis", route: "/reportAnaysis" },
  },
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const {
    messages,
    isLoading,
    isOllamaAvailable,
    availableModels,
    sendMessage,
    checkOllamaHealth,
    clearMessages,
  } = useAIAssistantStore();

  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accessToken) {
      checkOllamaHealth();
    }
    // Check if user already joined waitlist
    const savedWaitlist = localStorage.getItem("brandspyre_ai_waitlist");
    if (savedWaitlist) {
      setIsWaitlisted(true);
    }
  }, [accessToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    if (scenario.id === activeScenario.id) return;
    setIsTyping(true);
    setActiveScenario(scenario);
    setTimeout(() => {
      setIsTyping(false);
    }, 450);
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    localStorage.setItem("brandspyre_ai_waitlist", waitlistEmail);
    setIsWaitlisted(true);
    notify.success("You have been added to the Priority AI Assistant Waitlist!");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      const msg = inputMessage;
      setInputMessage("");
      await sendMessage(msg);
    } catch (err) {
      notify.error("Failed to send AI request");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-red-500 selection:text-white pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider uppercase text-slate-800 dark:text-slate-200">
                Enterprise AI Copilot
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-2xs">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Role-Scoped Operational Intelligence & Autonomous Workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
          {!isWaitlisted ? (
            <button
              onClick={() => {
                const el = document.getElementById("waitlist-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Get Notified</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
              <Check className="w-3.5 h-3.5" />
              <span>On Priority Waitlist</span>
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 space-y-12">
        {/* Hero Section */}
        <div className="relative text-center space-y-5 max-w-3xl mx-auto">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/10 dark:bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>Target Launch: Q4 2026 • Private Beta Phase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Meet Your Autonomous{" "}
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Business AI Assistant
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A deeply integrated enterprise copilot connected to your CRM leads, billing ledger, employee attendance, and project delivery pipelines. Query in plain English with zero data leakage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById("interactive-preview");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all group"
            >
              <span>Explore Interactive Demo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("waitlist-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm transition-all"
            >
              <Bell className="w-4 h-4 text-red-600" />
              <span>Join Organization Waitlist</span>
            </button>
          </div>
        </div>

        {/* Interactive Live Copilot Simulation Section */}
        <div id="interactive-preview" className="scroll-mt-20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" />
                <span>Interactive Capability Simulation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a business scenario to experience how the AI Assistant answers in real time.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>PBAC Role-Scoped Boundary Active</span>
            </span>
          </div>

          {/* Scenario Filter Chips */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DEMO_SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = activeScenario.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-red-500 shadow-md ring-1 ring-red-500/20"
                      : "bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                        Active Demo
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {scenario.category}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {scenario.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Preview Window */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
            {/* Console Header */}
            <div className="bg-slate-100/70 dark:bg-slate-950/70 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-500 font-semibold hidden sm:inline">
                  Brandspyre Intelligent Assistant Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Tool Orchestrator Ready
                </span>
              </div>
            </div>

            {/* Simulated Chat Dialogue */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* User Question */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Authorized Operator</span>
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold max-w-2xl leading-relaxed">
                    "{activeScenario.prompt}"
                  </div>
                </div>
              </div>

              {/* Tool Execution Card */}
              <div className="ml-12 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-medium">
                  <Cpu className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Invoked Tool:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-200">
                    {activeScenario.toolUsed}
                  </span>
                </div>
              </div>

              {/* AI Assistant Answer */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      BrandSpyre Business AI
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      Confidence 99.4%
                    </span>
                  </div>

                  {isTyping ? (
                    <div className="flex items-center gap-1.5 p-4 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="ml-2 font-mono text-[11px]">Computing operational parameters...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-red-50/50 to-white dark:from-red-950/20 dark:to-slate-900 border border-red-100 dark:border-red-950/50 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
                        {activeScenario.response}
                      </div>

                      {/* Dynamic Metric Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {activeScenario.metrics.map((metric, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between"
                          >
                            <span className="text-[11px] text-slate-500 font-medium">
                              {metric.label}
                            </span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {metric.value}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {metric.trend}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Direct Action Trigger */}
                      {activeScenario.suggestedAction.route && (
                        <div className="pt-2">
                          <button
                            onClick={() => navigate(activeScenario.suggestedAction.route!)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all group"
                          >
                            <Navigation className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            <span>{activeScenario.suggestedAction.label}</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Architectural Pillars */}
        <div className="space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Engineered For Strict Corporate Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Unlike generic consumer chatbots, BrandSpyre AI is strictly bound by multi-tenant isolation, company hierarchy, and role security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Zero-Training Privacy Guarantee
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your proprietary client data, salary structures, lead details, and invoices are strictly isolated per tenant. No customer information is ever retained or used to train public language models.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Role & Permission-Based Boundaries (RBAC/PBAC)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The AI queries only what the logged-in staff member is permitted to see. A sales executive cannot prompt the AI to reveal financial payroll or confidential executive agreements.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Autonomous Workflow Execution
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Move from insight to action in one step. Instruct the AI to draft client quotes, auto-generate joining letters, flag delinquent invoices, or reassign stagnant Meta Lead Ads to active agents.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Predictive Risk & Anomaly Detection
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Continuous background auditing identifies delayed project milestones, client review deadlines, and cash flow bottlenecks before they incur penalties or client dissatisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Waitlist / Early Access Card */}
        <div
          id="waitlist-section"
          className="scroll-mt-24 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-red-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Sparkle circles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wider uppercase text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Priority Enrollment Open</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Be First To Power Your Business With AI
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We are rolling out private beta access in batches to verified Brandspyre organization tenants. Join the priority waitlist to activate the AI Assistant for your workspace as soon as slots open.
            </p>

            {isWaitlisted ? (
              <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm inline-flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>You are on the Priority Beta Access list! We'll notify you on activation.</span>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter organization email..."
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Bell className="w-4 h-4" />
                  <span>Request Priority Access</span>
                </button>
              </form>
            )}

            <p className="text-[11px] text-slate-400">
              Zero configuration required. All existing plans receive early beta access upon rollout.
            </p>
          </div>
        </div>

        {/* Developer Sandbox Mode Accordion */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 transition-all">
          <button
            onClick={() => setShowDeveloperMode(!showDeveloperMode)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Self-Hosted Developer Testing Console (Ollama Local Node)</span>
            </div>
            {showDeveloperMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDeveloperMode && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Local Service Status:</span>
                  {isOllamaAvailable ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Connected ({availableModels[0] || "llama3"})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                      Offline (Ollama service not running locally)
                    </span>
                  )}
                </div>
                <button
                  onClick={checkOllamaHealth}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Node</span>
                </button>
              </div>

              {isOllamaAvailable ? (
                <div className="space-y-3 pt-2">
                  <div className="h-60 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    {messages.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">
                        Developer mode ready. Enter a test prompt below to query local Ollama model directly.
                      </p>
                    ) : (
                      messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg text-xs ${
                            m.role === "user"
                              ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ml-8"
                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 mr-8 border border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1">
                            {m.role}
                          </span>
                          {m.content}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Send raw prompt to local Llama 3..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-lg"
                    >
                      {isLoading ? "Thinking..." : "Send"}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  To test raw LLM inference in developer mode, start Ollama on your machine (<code className="font-mono text-red-600">ollama serve</code>) with <code className="font-mono text-red-600">llama3</code> installed. Business users in production will automatically connect to Brandspyre Cloud Inference upon rollout.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
