import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "src/stores/authStore";
import useMetaIntegrationStore from "src/stores/MetaIntegrationStore";
import { notify } from "~/services/notificationService";
import Modal from "src/component/Modal";
import { Tabs } from "src/component/ui/Tabs";
import { KPICard } from "src/component/ui/KPICard";
import CrmBadge from "src/component/ui/CrmBadge";
import PageHeader from "src/component/ui/PageHeader";
import {
  Link2,
  Unlink,
  RefreshCw,
  Settings,
  BarChart3,
  Facebook,
  Instagram,
  MessageCircle,
  Megaphone,
  FileText,
  Activity,
  Shield,
  Globe,
  ChevronRight,
  Play,
  Pause,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  MousePointer,
  TrendingUp,
  Building2,
  CreditCard,
  Layers,
} from "lucide-react";

// ===================== Sub-Components =====================

const ConnectionStatusIcon = ({ status }: { status: string }) => {
  if (status === "connected")
    return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "expired")
    return <AlertTriangle size={14} className="text-amber-500" />;
  return <XCircle size={14} className="text-slate-400" />;
};

const MetaAssetCard = ({
  icon,
  title,
  count,
  items,
  emptyMessage,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  items: any[];
  emptyMessage: string;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {title}
          </p>
          <p className="text-xs text-slate-500">{count} connected</p>
        </div>
      </div>
      <CrmBadge
        label={count > 0 ? "Active" : "None"}
        variant={count > 0 ? "green" : "gray"}
      />
    </div>
    {items.length === 0 ? (
      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
        {emptyMessage}
      </p>
    ) : (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
          >
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
              {item.name || item.page_name || item.username || item.id || `Item ${idx + 1}`}
            </span>
            {item.status && (
              <CrmBadge
                label={item.status}
                variant={item.status === "active" || item.status === "connected" ? "green" : "gray"}
              />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const CampaignRow = ({
  campaign,
  onPause,
  onResume,
}: {
  campaign: any;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) => {
  const statusColor =
    campaign.status === "ACTIVE"
      ? "green"
      : campaign.status === "PAUSED"
      ? "amber"
      : "gray";

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-150">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
          {campaign.name}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {campaign.objective?.replace(/_/g, " ")} · ID:{" "}
          {campaign.meta_campaign_id}
        </p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        {campaign.spend > 0 && (
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              ${campaign.spend?.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-slate-400">spent</p>
          </div>
        )}
        {campaign.leads_count > 0 && (
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-blue-600">
              {campaign.leads_count}
            </p>
            <p className="text-[10px] text-slate-400">leads</p>
          </div>
        )}
        <CrmBadge label={campaign.status} variant={statusColor} />
        <div className="flex gap-1.5">
          {campaign.status === "ACTIVE" ? (
            <button
              onClick={() => onPause(campaign.meta_campaign_id || campaign._id)}
              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all"
              title="Pause campaign"
            >
              <Pause size={12} />
            </button>
          ) : (
            <button
              onClick={() =>
                onResume(campaign.meta_campaign_id || campaign._id)
              }
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
              title="Resume campaign"
            >
              <Play size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== Main Component =====================

const MetaIntegration = () => {
  const { accessToken, branchcode } = useAuthStore();
  const {
    isConnected,
    connectionStatus,
    tokenStatus,
    connectedBusinesses,
    connectedAdAccounts,
    connectedPages,
    connectedInstagram,
    connectedWhatsApp,
    availableForms,
    enabledForms,
    campaigns,
    adSets,
    ads,
    analyticsData,
    syncStats,
    syncLogs,
    assetsSummary,
    isLoading,
    error,
    metaCredentials,
    saveMetaCredentials,
    connectMetaAccount,
    disconnectMetaAccount,
    fetchConfig,
    syncAssets,
    fetchBusinesses,
    fetchAdAccounts,
    fetchPages,
    fetchInstagram,
    fetchWhatsApp,
    fetchForms,
    toggleForm,
    fetchCampaigns,
    pauseCampaign,
    resumeCampaign,
    syncCampaigns,
    fetchAnalytics,
    fetchSyncStats,
    fetchSyncLogs,
    clearError,
  } = useMetaIntegrationStore();

  const [activeTab, setActiveTab] = useState("connection");
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");

  const [credentials, setCredentials] = useState({
    meta_app_id: "",
    meta_app_secret: "",
    meta_api_version: "v21.0",
  });

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    objective: "OUTCOME_LEADS",
    daily_budget: "",
    status: "PAUSED",
  });

  useEffect(() => {
    if (accessToken && branchcode) {
      fetchConfig();
      fetchSyncStats();
    }
  }, [accessToken, branchcode]);

  useEffect(() => {
    if (isConnected) {
      if (activeTab === "assets") {
        fetchPages();
        fetchBusinesses();
        fetchAdAccounts();
        fetchInstagram();
        fetchWhatsApp();
      } else if (activeTab === "campaigns") {
        fetchCampaigns();
      } else if (activeTab === "analytics") {
        fetchAnalytics();
      } else if (activeTab === "forms") {
        fetchSyncLogs();
      }
    }
  }, [activeTab, isConnected]);

  useEffect(() => {
    if (error) {
      notify.error(error);
      clearError();
    }
  }, [error]);

  // Handle OAuth callback URL params
  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    const err = url.searchParams.get("error");
    if (status === "connected") {
      notify.success("🎉 Meta account connected successfully! Syncing your assets...");
      fetchConfig();
      fetchSyncStats();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (err) {
      notify.error(`Meta connection failed: ${url.searchParams.get("message") || url.searchParams.get("reason") || err}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const result = await connectMetaAccount(
        credentials.meta_app_id ? credentials : undefined
      );
      if (result?.data?.oauth_url) {
        window.location.href = result.data.oauth_url;
      }
    } catch (err) {
      notify.error("Failed to initiate Meta connection");
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveMetaCredentials(credentials);
      notify.success("Custom Meta App credentials saved");
      setShowCredentialsForm(false);
      await handleConnect();
    } catch (err) {
      notify.error("Failed to save credentials");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMetaAccount();
      notify.success("Disconnected from Meta");
      setShowDisconnectConfirm(false);
    } catch (err) {
      notify.error("Failed to disconnect");
    }
  };

  const handleSyncAssets = async () => {
    setIsSyncing(true);
    try {
      await syncAssets();
      notify.success("Assets synchronized successfully");
    } catch (err) {
      notify.error("Asset sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCampaigns = async () => {
    try {
      await syncCampaigns();
      notify.success("Campaigns synced from Meta");
    } catch (err) {
      notify.error("Campaign sync failed");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await useMetaIntegrationStore
        .getState()
        .createCampaign(newCampaign);
      notify.success("Campaign created in Meta");
      setShowCreateCampaign(false);
      setNewCampaign({ name: "", objective: "OUTCOME_LEADS", daily_budget: "", status: "PAUSED" });
    } catch (err) {
      notify.error("Failed to create campaign");
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await pauseCampaign(id);
      notify.success("Campaign paused");
    } catch {
      notify.error("Failed to pause campaign");
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await resumeCampaign(id);
      notify.success("Campaign resumed");
    } catch {
      notify.error("Failed to resume campaign");
    }
  };

  const handleToggleForm = async (form: any, pageId: string) => {
    try {
      await toggleForm({
        formId: form.id || form.meta_form_id,
        pageId,
        isEnabled: !form.is_enabled,
        pageName: connectedPages.find((p) => p.id === pageId)?.name,
      });
      notify.success(form.is_enabled ? "Form disabled" : "Form enabled");
    } catch {
      notify.error("Failed to update form");
    }
  };

  const tabs = [
    { id: "connection", label: "Connection", icon: <Link2 size={14} /> },
    {
      id: "assets",
      label: "Channels",
      icon: <Layers size={14} />,
      badge: isConnected ? (assetsSummary?.pages || 0) + (assetsSummary?.instagram || 0) + (assetsSummary?.whatsapp || 0) : undefined,
    },
    {
      id: "forms",
      label: "Lead Forms",
      icon: <FileText size={14} />,
      badge: isConnected ? enabledForms.length : undefined,
    },
    {
      id: "campaigns",
      label: "Campaigns",
      icon: <Megaphone size={14} />,
      badge: isConnected ? campaigns.length : undefined,
    },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  ];

  const tokenExpired = tokenStatus === "expired";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meta Marketing & Lead Ads"
        description="Connect Facebook, Instagram and WhatsApp to sync lead ads and manage campaigns directly."
        primaryAction={
          isConnected
            ? {
                label: isSyncing ? "Syncing..." : "Sync Assets",
                onClick: handleSyncAssets,
                icon: <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />,
              }
            : {
                label: "Connect Meta Account",
                onClick: handleConnect,
                icon: <Link2 size={14} />,
              }
        }
      />

      {/* Token Expiry Banner */}
      {isConnected && tokenExpired && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Access token expired.</span> Your Meta connection needs to be re-authorized to continue receiving leads.
          </div>
          <button
            onClick={handleConnect}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ============================== */}
      {/* TAB: CONNECTION                */}
      {/* ============================== */}
      {activeTab === "connection" && (
        <div className="space-y-5">
          {/* Connection Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Meta Business Connection
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize Brandspyre to access your Facebook Business Portfolio
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon status={connectionStatus} />
                <CrmBadge
                  label={isConnected ? (tokenExpired ? "Token Expired" : "Connected") : "Disconnected"}
                  variant={isConnected && !tokenExpired ? "green" : tokenExpired ? "amber" : "gray"}
                />
              </div>
            </div>

            {isConnected ? (
              <div className="space-y-5">
                {/* Assets Summary Grid */}
                {assetsSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { label: "Pages", value: assetsSummary.pages || 0, icon: <Globe size={14} />, color: "blue" },
                      { label: "Ad Accounts", value: assetsSummary.ad_accounts || 0, icon: <CreditCard size={14} />, color: "purple" },
                      { label: "Businesses", value: assetsSummary.businesses || 0, icon: <Building2 size={14} />, color: "slate" },
                      { label: "Instagram", value: assetsSummary.instagram || 0, icon: <Instagram size={14} />, color: "red" },
                      { label: "WhatsApp", value: assetsSummary.whatsapp || 0, icon: <MessageCircle size={14} />, color: "green" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 text-center"
                      >
                        <div className="flex justify-center mb-1 text-slate-500 dark:text-slate-400">
                          {item.icon}
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {item.value}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("assets")}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white shadow-2xs transition flex items-center gap-1.5"
                  >
                    <Layers size={13} /> View Channel Assets
                  </button>
                  <button
                    onClick={handleSyncAssets}
                    disabled={isSyncing}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 transition flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Syncing..." : "Refresh Assets"}
                  </button>
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 transition flex items-center gap-1.5"
                  >
                    <Unlink size={13} /> Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Connect your Meta Business account to capture real-time leads from Facebook & Instagram ad campaigns, manage campaigns, and track marketing ROI — all in one place.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: <Facebook size={12} />, label: "Facebook Lead Ads" },
                    { icon: <Instagram size={12} />, label: "Instagram Leads" },
                    { icon: <MessageCircle size={12} />, label: "WhatsApp Business" },
                    { icon: <Megaphone size={12} />, label: "Campaign Management" },
                  ].map((feature) => (
                    <span
                      key={feature.label}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-semibold"
                    >
                      {feature.icon} {feature.label}
                    </span>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Link2 size={16} /> {isLoading ? "Connecting to Meta..." : "Connect with Meta"}
                  </button>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCredentialsForm(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition flex items-center gap-1.5"
                  >
                    <Settings size={12} /> Advanced: Use Custom Meta Developer App
                  </button>
                </div>
                {metaCredentials && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={11} /> Custom enterprise credentials configured
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sync Stats */}
          {isConnected && syncStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KPICard title="Total Meta Leads" value={syncStats.total || 0} color="blue" icon={<Users size={16} />} />
              <KPICard title="Synced Successfully" value={syncStats.success || 0} color="green" icon={<CheckCircle2 size={16} />} />
              <KPICard title="Failed / Rejected" value={syncStats.failed || 0} color="red" icon={<XCircle size={16} />} />
              <KPICard title="Duplicates Skipped" value={syncStats.duplicate || 0} color="amber" icon={<Shield size={16} />} />
            </div>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB: CHANNEL ASSETS            */}
      {/* ============================== */}
      {activeTab === "assets" && (
        <div className="space-y-5">
          {!isConnected ? (
            <div className="text-center py-16 text-slate-500">
              <Layers size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Connect Meta to view channel assets</p>
              <button onClick={() => setActiveTab("connection")} className="mt-3 text-xs text-blue-600 hover:underline">
                Go to Connection tab →
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  All Meta channel assets connected to your organization
                </p>
                <button
                  onClick={handleSyncAssets}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 text-slate-700 transition"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Refresh All"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <MetaAssetCard
                  icon={<Globe size={15} />}
                  title="Facebook Pages"
                  count={connectedPages.length}
                  items={connectedPages}
                  emptyMessage="No Facebook pages found. Sync to discover connected pages."
                />
                <MetaAssetCard
                  icon={<Instagram size={15} />}
                  title="Instagram Accounts"
                  count={connectedInstagram.length}
                  items={connectedInstagram.map((ig) => ({
                    name: `@${ig.username}`,
                    status: ig.status,
                  }))}
                  emptyMessage="No Instagram professional accounts linked. Pages with Instagram Business accounts will appear here."
                />
                <MetaAssetCard
                  icon={<MessageCircle size={15} />}
                  title="WhatsApp Business"
                  count={connectedWhatsApp.length}
                  items={connectedWhatsApp.map((wa) => ({
                    name: wa.name,
                    status: wa.status,
                  }))}
                  emptyMessage="No WhatsApp Business Accounts (WABA) found. Ensure your Meta Business Manager has WABA connected."
                />
                <MetaAssetCard
                  icon={<Building2 size={15} />}
                  title="Business Managers"
                  count={connectedBusinesses.length}
                  items={connectedBusinesses.map((biz) => ({
                    name: biz.name,
                    status: biz.status,
                  }))}
                  emptyMessage="No Business Managers found. Grant access in Meta Business Settings."
                />
                <MetaAssetCard
                  icon={<CreditCard size={15} />}
                  title="Ad Accounts"
                  count={connectedAdAccounts.length}
                  items={connectedAdAccounts.map((acc) => ({
                    name: acc.name,
                    status: acc.status,
                  }))}
                  emptyMessage="No Ad Accounts found. Connect an ad account in Meta Business Manager."
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB: LEAD FORMS                */}
      {/* ============================== */}
      {activeTab === "forms" && (
        <div className="space-y-5">
          {!isConnected ? (
            <div className="text-center py-16 text-slate-500">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Connect Meta to manage lead forms</p>
            </div>
          ) : (
            <>
              {/* Page Selector */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedPageId}
                  onChange={(e) => {
                    setSelectedPageId(e.target.value);
                    if (e.target.value) fetchForms(e.target.value);
                  }}
                  className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex-1 max-w-xs"
                >
                  <option value="">Select a Facebook Page...</option>
                  {connectedPages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Forms List */}
              {availableForms.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">
                    {selectedPageId
                      ? "No lead forms found for this page. Create lead ad forms in Meta Business Suite."
                      : "Select a page to view its lead forms."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableForms.map((form) => (
                    <div
                      key={form.id || form.meta_form_id}
                      className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {form.name || form.meta_form_name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {form.total_leads_received || 0} leads received
                          {form.last_lead_received_at &&
                            ` · Last: ${new Date(form.last_lead_received_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <CrmBadge
                          label={form.status || (form.is_enabled ? "Active" : "Inactive")}
                          variant={form.is_enabled ? "green" : "gray"}
                        />
                        <button
                          onClick={() => handleToggleForm(form, selectedPageId)}
                          disabled={isLoading}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            form.is_enabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              form.is_enabled ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enabled Forms Summary */}
              {enabledForms.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> {enabledForms.length} form{enabledForms.length !== 1 ? "s" : ""} actively receiving leads via webhook
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB: CAMPAIGNS                 */}
      {/* ============================== */}
      {activeTab === "campaigns" && (
        <div className="space-y-5">
          {!isConnected ? (
            <div className="text-center py-16 text-slate-500">
              <Megaphone size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Connect Meta to manage campaigns</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSyncCampaigns}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 text-slate-700 transition"
                  >
                    <RefreshCw size={12} /> Sync from Meta
                  </button>
                  <button
                    onClick={() => setShowCreateCampaign(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    <Plus size={12} /> New Campaign
                  </button>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">No campaigns found. Sync to discover existing campaigns or create a new one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <CampaignRow
                      key={campaign._id || campaign.meta_campaign_id}
                      campaign={campaign}
                      onPause={handlePauseCampaign}
                      onResume={handleResumeCampaign}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================== */}
      {/* TAB: ANALYTICS                 */}
      {/* ============================== */}
      {activeTab === "analytics" && (
        <div className="space-y-5">
          {!analyticsData ? (
            <div className="text-center py-16 text-slate-500">
              <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">
                {isConnected ? "Loading analytics..." : "Connect Meta to view analytics"}
              </p>
              {isConnected && (
                <button
                  onClick={fetchAnalytics}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  Load analytics →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPICard
                  title="Total Spend"
                  value={`$${analyticsData.summary?.total_spend?.toFixed(2) || "0.00"}`}
                  color="red"
                  icon={<DollarSign size={16} />}
                  subtitle="All-time Meta spend"
                />
                <KPICard
                  title="Total Leads"
                  value={analyticsData.summary?.total_leads || 0}
                  color="blue"
                  icon={<Users size={16} />}
                  subtitle="CRM Meta leads"
                />
                <KPICard
                  title="Cost Per Lead"
                  value={`$${analyticsData.summary?.cost_per_lead?.toFixed(2) || "0.00"}`}
                  color="purple"
                  icon={<MousePointer size={16} />}
                  subtitle="Average CPL"
                />
                <KPICard
                  title="Conversion Rate"
                  value={`${analyticsData.summary?.conversion_rate?.toFixed(1) || 0}%`}
                  color="green"
                  icon={<TrendingUp size={16} />}
                  subtitle="Lead to customer"
                />
              </div>

              {/* Platform Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                  Platform Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                    <Facebook size={20} className="text-blue-600" />
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {analyticsData.platform_breakdown?.facebook || 0}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">Facebook Leads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                    <Instagram size={20} className="text-purple-600" />
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {analyticsData.platform_breakdown?.instagram || 0}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">Instagram Leads</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Performance */}
              {analyticsData.campaigns?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                    Campaign Performance
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left py-2 pr-4 font-semibold text-slate-500">Campaign</th>
                          <th className="text-right py-2 pr-4 font-semibold text-slate-500">Spend</th>
                          <th className="text-right py-2 pr-4 font-semibold text-slate-500">CRM Leads</th>
                          <th className="text-right py-2 font-semibold text-slate-500">CPL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.campaigns.map((c: any) => (
                          <tr
                            key={c.meta_campaign_id}
                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          >
                            <td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-300 truncate max-w-48">
                              {c.name}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-slate-600">
                              ${c.spend?.toFixed(2) || "0.00"}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-semibold text-blue-600">
                              {c.crm_leads}
                            </td>
                            <td className="py-2.5 text-right text-slate-600">
                              ${c.cpl?.toFixed(2) || "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lead Form Performance */}
              {analyticsData.forms?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                    Lead Form Performance
                  </h4>
                  <div className="space-y-2">
                    {analyticsData.forms.map((f: any) => (
                      <div
                        key={f.form_id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {f.form_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{f.page_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">{f.crm_leads}</p>
                            <p className="text-[10px] text-slate-400">CRM leads</p>
                          </div>
                          <CrmBadge
                            label={f.is_enabled ? "Active" : "Inactive"}
                            variant={f.is_enabled ? "green" : "gray"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======================= */}
      {/* MODAL: Custom Credentials */}
      {/* ======================= */}
      <Modal
        isVisible={showCredentialsForm}
        maxWidth="md"
        onClose={() => setShowCredentialsForm(false)}
        title="Custom Meta App Credentials"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleSaveCredentials} className="space-y-4 p-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            By default, Brandspyre uses the platform-level Meta App. Provide your own App ID & Secret only if you have a custom Meta Developer App.
          </p>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Facebook App ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 123456789012345"
              value={credentials.meta_app_id}
              onChange={(e) => setCredentials({ ...credentials, meta_app_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Facebook App Secret
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••••••••••••••••••••••"
              value={credentials.meta_app_secret}
              onChange={(e) => setCredentials({ ...credentials, meta_app_secret: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Graph API Version
            </label>
            <input
              type="text"
              value={credentials.meta_api_version}
              onChange={(e) => setCredentials({ ...credentials, meta_api_version: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCredentialsForm(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================= */}
      {/* MODAL: Disconnect Confirm */}
      {/* ======================= */}
      <Modal
        isVisible={showDisconnectConfirm}
        maxWidth="sm"
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect Meta Account"
        closeOnOutsideClick={false}
      >
        <div className="space-y-4 p-2">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              This will revoke Brandspyre's access to your Meta account, disable all active lead forms, and stop webhook lead delivery. Existing CRM leads are preserved.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDisconnectConfirm(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
            >
              {isLoading ? "Disconnecting..." : "Yes, Disconnect"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ======================= */}
      {/* MODAL: Create Campaign   */}
      {/* ======================= */}
      <Modal
        isVisible={showCreateCampaign}
        maxWidth="md"
        onClose={() => setShowCreateCampaign(false)}
        title="Create Meta Campaign"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4 p-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Lead Generation 2026"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campaign Objective
            </label>
            <select
              value={newCampaign.objective}
              onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OUTCOME_LEADS">Lead Generation (Recommended)</option>
              <option value="OUTCOME_AWARENESS">Brand Awareness</option>
              <option value="OUTCOME_TRAFFIC">Traffic</option>
              <option value="OUTCOME_ENGAGEMENT">Engagement</option>
              <option value="OUTCOME_SALES">Conversions / Sales</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Daily Budget (USD)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 25.00"
              value={newCampaign.daily_budget}
              onChange={(e) => setNewCampaign({ ...newCampaign, daily_budget: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Campaign will be created as PAUSED. Activate from the campaign list after reviewing.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateCampaign(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              {isLoading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MetaIntegration;
