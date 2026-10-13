import { useEffect, useState } from "react";
import { Calendar, ClipboardCheck, Users as UsersIcon } from "lucide-react";
import { CgFileDocument } from "react-icons/cg";
import { FaUsers } from "react-icons/fa";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

import EditMeetingModal from "./EditMeetingModal";


import { useLocation , useParams  } from "react-router-dom";

const MomViewPage = () => {
  const [participants, setParticipants] = useState([]);

  const { state } = useLocation();
  // const meeting = state?.meetings; // 👈 meeting object passed from ClientMom

  const { id } = useParams();

   const [meeting, setMeeting] = useState<any>(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userRole = useAuthStore((state) => state.role);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<any>(null);

  // fetch meeting, participants, and targets in parallel
  const fetchMeetingData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [meetingRes, participantsRes, targetsRes] = await Promise.all([
        apiClient.get(`/getmeetingbyid?id=${id}`),
        apiClient.get(`/doc_meet/participant/read?meet_id=${id}`),
        apiClient.get(`/doc_meet/target/read?meet_id=${id}`),
      ]);

      setMeeting(meetingRes.data.data);
      setParticipants(participantsRes.data.data || []);
      setTargets(targetsRes.data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load meeting details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingData();
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) return;

    const fetchLiveStatus = async () => {
      try {
        const res = await apiClient.get(`/meetings/${id}/active-status`);
        setLiveStatus(res.data.data);
      } catch (err) {
        console.error("Error fetching live status:", err);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (loading) return <p className="text-center mt-10">Loading meeting details...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!meeting) return <p className="text-center mt-10">Meeting not found</p>;



  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500 dark:text-gray-400">
        Loading meeting details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>


        
          <h1 className="text-2xl font-bold text-red-700 dark:text-white">Minutes of Meeting</h1>
          <p className="text-gray-500 dark:text-gray-400">ID: {id || "N/A"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-5 w-5 mr-1.5" />
            {formatDate(meeting?.start_date_time)}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <FaUsers className="h-5 w-5 mr-1.5" />
            {participants.length} attendees
          </div>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700/80 pb-4 mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meeting?.title || "Meeting Details"}</h2>
          <div className="mt-2 flex items-center text-sm text-gray-650 dark:text-gray-300">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              meeting?.status === 'in_progress' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30' :
              meeting?.status === 'scheduled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/30' :
              'bg-gray-50 text-gray-750 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
            }`}>
              {meeting?.status ? meeting.status.replace('_', ' ').toUpperCase() : "N/A"}
            </span>
            <span className="mx-2">•</span>
            <span>
              {formatDateTime(meeting?.start_date_time)} - {formatDateTime(meeting?.end_date_time)}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg mr-4">
              <CgFileDocument className="h-6 w-6 text-red-700 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Meeting Details</h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Branch:</p>
                  <p className="text-gray-700 dark:text-gray-300">{meeting?.branchcode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Project:</p>
                  <p className="text-gray-700 dark:text-gray-300">{meeting?.project_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By:</p>
                  <p className="text-gray-700 dark:text-gray-300">{meeting?.createdby || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Status:</p>
                  <p className="text-gray-700 dark:text-gray-300 capitalize">{meeting?.doc_status || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Participants
            </h4>
            <div className="space-y-3">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{participant.person_id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {participant.role} • {participant.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Added: {new Date(participant.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No participants found</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Targets
            </h4>
            <div className="space-y-3">
              {targets.length > 0 ? (
                targets.map((target) => (
                  <div key={target.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{target.target_id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {target.type}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Added: {new Date(target.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No targets found</p>
              )}
            </div>
          </div>

          {meeting?.notes && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Meeting Notes / MOM
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{meeting.notes}</p>
              </div>
            </div>
          )}

          {meeting?.meet_link && (
            <div className="mt-6 p-5 border border-red-200 dark:border-gray-700 bg-red-50/50 dark:bg-gray-800/40 rounded-xl">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="relative flex h-3.5 w-3.5 mr-2">
                  {liveStatus?.active ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gray-400"></span>
                  )}
                </span>
                Built-in Online Video Meeting Room
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5 text-sm">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Room Status</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize mt-0.5">
                    {liveStatus?.active ? "Live / In Progress" : "Scheduled"}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Live Attendees</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {liveStatus?.participantCount ?? 0} active user(s)
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Waiting Room</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {liveStatus?.waitingRoomEnabled ? "Locked (Approval Req)" : "Open (Auto-join)"}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recording Status</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {liveStatus?.isRecording ? "🔴 Recording Active" : "Not Recording"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Start Meeting Button (Creator/Host or Superadmin) */}
                {(String(meeting.createdby) === String(staff_id) || userRole === "superadmin") && (
                  <a
                    href={meeting.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center transition"
                  >
                    Start Meeting (Host)
                  </a>
                )}

                {/* Join Meeting Button (All invited participants) */}
                <a
                  href={meeting.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium text-sm flex items-center transition"
                >
                  Join Meeting
                </a>

                {/* Copy Link Button */}
                <button
                  onClick={() => {
                    const joinUrl = `${window.location.origin}${meeting.meet_link}`;
                    navigator.clipboard.writeText(joinUrl);
                    alert("Meeting join link copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition"
                >
                  Copy Join Link
                </button>
              </div>
            </div>
          )}
        </div>
          {meeting?.doc && meeting.doc.length > 0 && (
  <div className="mt-6">
    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
      <CgFileDocument className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
      Documents
    </h4>
    <div className="space-y-2">
      {meeting.doc.map((document) => (
        // <a
        //   key={document.id}
        //   href={document.url}
        //   target="_blank"
        //   rel="noopener noreferrer"
        //   className="block p-2 bg-gray-50 dark:bg-gray-700/30 rounded-md text-blue-600 dark:text-blue-400 hover:underline"
        // >
        //   {document.url}
        // </a>
        <a
  key={document.id}
  href={`${BASE_URL.replace("/api", "")}/documents/${document.url}`}
  target="_blank"
  rel="noopener noreferrer"
  className="block p-2 bg-gray-50 dark:bg-gray-700/30 rounded-md text-blue-600 dark:text-blue-400 hover:underline"
>
  {document.url}
</a>

      ))}
    </div>
  </div>
)}
      </div>




      <div className="mt-6 flex justify-end gap-3">
        {(String(meeting?.createdby) === String(staff_id) || userRole === "superadmin") && (
          <button 
            onClick={() => setIsEditOpen(true)}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium text-sm flex items-center transition"
          >
            Edit Minutes
          </button>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <EditMeetingModal 
              onUpdated={() => {
                fetchMeetingData();
                setIsEditOpen(false);
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          </div>
        </div>
      )}
    
    {/*</div>*/}
    </div>



  );
};

export default MomViewPage;