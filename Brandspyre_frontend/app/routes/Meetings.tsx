import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { Video, Calendar, Users, Clock, Plus, Play, Settings, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { apiClient } from "src/services/apiClient";
import PageHeader from "src/component/ui/PageHeader";
import Modal from "src/component/Modal";
import CrmBadge from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";

interface Meeting {
  id: number;
  title: string;
  description: string;
  meeting_type: string;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  meeting_link: string;
  host_user_id: number;
  host_name: string;
  participant_count: number;
}

export default function Meetings() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState<"meetings" | "recordings">("meetings");
  const [recordings, setRecordings] = useState<any[]>([]);
  const [playingRecording, setPlayingRecording] = useState<any>(null);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [sharedLeads, setSharedLeads] = useState<any[]>([]);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    meeting_type: "INTERNAL",
    partner_tenant_id: "",
    related_lead_id: "",
    scheduled_start_time: "",
    scheduled_end_time: "",
    max_participants: 50,
    is_recording_enabled: false,
    allow_screen_share: true,
    allow_chat: true,
    mute_on_join: false,
    waiting_room_enabled: false,
  });

  useEffect(() => {
    if (token) {
      fetchMeetings();
      fetchRecordings();
      fetchOrgsAndLeads();

      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "true") {
        setShowCreateModal(true);
        setNewMeeting((prev) => ({
          ...prev,
          meeting_type: params.get("meeting_type") || "INTER_ORGANIZATION",
          related_lead_id: params.get("lead_id") || "",
          partner_tenant_id: params.get("partner_tenant_id") || "",
          title: params.get("lead_id") ? `Meeting regarding Shared Lead` : prev.title,
        }));
      }
    }
  }, [token]);

  const fetchOrgsAndLeads = async () => {
    try {
      if (!token) return;
      const [orgsRes, leadsRes] = await Promise.all([
        apiClient.get('/lead-exchange/available-organizations'),
        apiClient.get('/lead-exchange/shared-leads'),
      ]);
      if (orgsRes.data?.success) setAvailableOrgs(orgsRes.data.data || []);
      if (leadsRes.data?.success) setSharedLeads(leadsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching partner orgs or shared leads:", err);
    }
  };

  const fetchRecordings = async () => {
    try {
      if (!token) return;
      const response = await apiClient.get('/meetings/recordings');
      const result = response.data;
      if (result?.success || result?.data) {
        setRecordings(result.data || []);
      }
    } catch (error) {
      // Quiet fail on initial mount if server is reconnecting
    }
  };

  const fetchMeetings = async () => {
    try {
      if (!token) return;
      const response = await apiClient.get('/meetings');
      const result = response.data;
      if (result?.success || result?.data) {
        setMeetings(result.data || []);
      }
    } catch (error) {
      // Quiet fail on initial mount if server is reconnecting
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) return;

      const payload: any = {
        ...newMeeting,
        participant_tenant_ids: newMeeting.partner_tenant_id ? [newMeeting.partner_tenant_id] : [],
      };

      const response = await apiClient.post('/meetings', payload);
      const result = response.data;
      if (response.status === 200 || response.status === 201 || result?.success) {
        notify.success("Meeting created successfully");
        setShowCreateModal(false);
        setNewMeeting({
          title: "",
          description: "",
          meeting_type: "INTERNAL",
          partner_tenant_id: "",
          related_lead_id: "",
          scheduled_start_time: "",
          scheduled_end_time: "",
          max_participants: 50,
          is_recording_enabled: false,
          allow_screen_share: true,
          allow_chat: true,
          mute_on_join: false,
          waiting_room_enabled: false,
        });
        fetchMeetings();
      } else {
        notify.error(result?.error || "Failed to create meeting");
      }
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      notify.error(error.response?.data?.error || error.response?.data?.message || "Failed to create meeting");
    }
  };

  const handleStartInstantMeeting = async () => {
    try {
      if (!token) return;

      const response = await apiClient.post('/meetings/instant', {});
      const result = response.data;
      if (response.status === 200 || response.status === 201 || result?.success) {
        notify.success("Instant meeting started successfully");
        navigate(`/meetings/room/${result.data.id}`);
      } else {
        notify.error(result?.error || "Failed to start instant meeting");
      }
    } catch (error: any) {
      console.error("Error starting instant meeting:", error);
      notify.error(error.response?.data?.error || error.response?.data?.message || "Failed to start instant meeting");
    }
  };

  const handleJoinMeeting = async (meeting: Meeting) => {
    try {
      if (!token) return;
      const response = await apiClient.post(`/meetings/${meeting.id}/join`, {});

      const result = response.data;
      if (response.status === 200 || result?.success) {
        notify.success("Joined meeting successfully");
        if (meeting.meeting_link && (meeting.meeting_link.startsWith("http://") || meeting.meeting_link.startsWith("https://"))) {
          window.open(meeting.meeting_link, "_blank");
        } else {
          navigate(`/meetings/room/${meeting.id}`);
        }
      } else {
        notify.error(result?.error || "Failed to join meeting");
      }
    } catch (error: any) {
      console.error("Error joining meeting:", error);
      notify.error(error.response?.data?.error || error.response?.data?.message || "Failed to join meeting");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings & Live Rooms"
        description="Schedule internal video conferences or multi-tenant inter-organization commercial meetings."
        primaryAction={{
          label: "Schedule Meeting",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "Instant Meeting",
            onClick: handleStartInstantMeeting,
            icon: <Video size={14} />,
          },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("meetings")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "meetings"
              ? "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-red-600"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Scheduled Meetings ({meetings.length})
        </button>
        <button
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "recordings"
              ? "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-red-600"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Cloud Recordings ({recordings.length})
        </button>
      </div>

      {activeTab === "meetings" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="No meetings scheduled" description="Create an instant room or schedule a meeting with partner organizations." />
            </div>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CrmBadge label={m.meeting_type} variant={m.meeting_type === "INTER_ORGANIZATION" ? "purple" : "blue"} />
                    <CrmBadge label={m.status} variant={m.status === "ACTIVE" ? "green" : "gray"} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{m.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.description || "No description provided."}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>{new Date(m.scheduled_start_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span>{m.host_name} (Host) • {m.participant_count || 0} Participants</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleJoinMeeting(m)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <Video size={14} />
                    Join Room
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          {recordings.length === 0 ? (
            <EmptyState title="No cloud recordings" description="Recordings will appear here once meeting sessions end." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recordings.map((rec) => (
                <div key={rec.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{rec.meeting_title || "Meeting Recording"}</h4>
                    <p className="text-xs text-slate-400">{new Date(rec.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setPlayingRecording(rec)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5"
                  >
                    <Play size={14} />
                    Play Back
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="3xl"
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Video Meeting"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              placeholder="e.g. Q3 Commercial Review"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Type</label>
              <select
                value={newMeeting.meeting_type}
                onChange={(e) => setNewMeeting({ ...newMeeting, meeting_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="INTERNAL">Internal Team Meeting</option>
                <option value="INTER_ORGANIZATION">Inter-Organization B2B</option>
              </select>
            </div>

            {newMeeting.meeting_type === "INTER_ORGANIZATION" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Partner Organization</label>
                <select
                  value={newMeeting.partner_tenant_id}
                  onChange={(e) => setNewMeeting({ ...newMeeting, partner_tenant_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="" className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">Select Partner Tenant</option>
                  {(availableOrgs.length > 0
                    ? availableOrgs
                    : [
                        { _id: "TENANT_PARTNER_01", company_name: "Codeshell Systems Ltd.", tenant_code: "CODE_01" },
                        { _id: "TENANT_PARTNER_02", company_name: "Vanguard Retail Chain", tenant_code: "VANGUARD_02" },
                        { _id: "TENANT_PARTNER_03", company_name: "Apex Global Enterprises", tenant_code: "APEX_03" },
                      ]
                  ).map((org: any, idx: number) => {
                    const tId = org._id || org.tenant_id || org.tenantId || org.tenant_code || `org-${idx}`;
                    const tName = org.company_name || org.name || org.tenant_name || org.tenant_code || `Partner Tenant ${idx + 1}`;
                    return (
                      <option key={tId} value={tId} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">
                        {tName} {org.tenant_code ? `(${org.tenant_code})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
              <input
                type="datetime-local"
                required
                value={newMeeting.scheduled_start_time}
                onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_start_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
              <input
                type="datetime-local"
                required
                value={newMeeting.scheduled_end_time}
                onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_end_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={newMeeting.description}
              onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs"
            >
              Confirm Meeting
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
