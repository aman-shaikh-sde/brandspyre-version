import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "src/stores/authStore";
import { useMeeting } from "./hooks/useMeeting";
import MeetingGrid from "./Meeting/MeetingGrid";
import MeetingControls from "./Meeting/MeetingControls";
import ChatPanel from "./Meeting/ChatPanel";
import ParticipantPanel from "./Meeting/ParticipantPanel";
import NotesPanel from "./Meeting/NotesPanel";
import PollsPanel from "./Meeting/PollsPanel";
import BreakoutPanel from "./Meeting/BreakoutPanel";
import Whiteboard from "./Meeting/Whiteboard";
import DeviceSettingsModal from "./Meeting/DeviceSettingsModal";
import { Video, Users, Clock, AlertCircle } from "lucide-react";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";

export default function MeetingRoom() {
  const { id: meetingId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Auth Store
  const token = useAuthStore((state) => state.accessToken);
  const staffId = useAuthStore((state) => state.staff_id);
  const userRole = useAuthStore((state) => state.role);

  const [userName, setUserName] = useState("User");
  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "participants" | "notes" | "polls" | "breakout" | "whiteboard" | "none">("none");
  const [showSettings, setShowSettings] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Time elapsed counter
  const [duration, setDuration] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const recordStartTimeRef = React.useRef<number>(0);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioDestRef = React.useRef<MediaStreamAudioDestinationNode | null>(null);
  const localAudioSourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const peerAudioSourcesRef = React.useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      notify.error("Please log in to join the meeting");
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // Fetch User Info & Meeting Info
  useEffect(() => {
    if (!meetingId || !staffId) return;

    const fetchData = async () => {
      try {
        // Fetch User Profile using canonical BASE_URL
        const userProfileRes = await fetch(`${BASE_URL}/users/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ staff_id: staffId }),
        });

        if (userProfileRes.ok) {
          const userResult = await userProfileRes.json();
          const basic = userResult.data?.basic;
          if (basic) {
            setUserName(`${basic.firstname || ""} ${basic.lastname || ""}`.trim() || "User");
          }
        }

        // Fetch Meeting Details
        const meetingRes = await fetch(`${BASE_URL}/meetings/${meetingId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (meetingRes.ok) {
          const mResult = await meetingRes.json();
          setMeetingDetails(mResult.data);
          setIsLocked(mResult.data?.status === "locked");
        } else {
          notify.error("Meeting not found or has already ended");
          navigate("/meetings");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [meetingId, staffId, token]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine if host — superadmin or meeting creator/host
  const isHost = 
    userRole === "superadmin" || 
    userRole === "Super Admin" || 
    (meetingDetails ? (
      String(meetingDetails.host_user_id) === String(staffId) ||
      String(meetingDetails.created_by) === String(staffId) ||
      (meetingDetails.host_user_id && staffId && Number(meetingDetails.host_user_id) === Number(staffId))
    ) : false);

  // useMeeting WebRTC signaling hook — connects with JWT handshake
  const {
    localStream,
    peers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    leaveMeeting,
    waitingStatus,
    waitingGuests,
    permissions,
    chatMessages,
    whiteboardStrokes,
    notesContent,
    polls,
    reactions,
    breakoutRoom,
    activeSpeaker,
    captions,
    emitSocketEvent,
  } = useMeeting(isLoaded ? (meetingId || "") : "", Number(staffId || 0), userName, isHost);

  // Host Waiting Room admitted/rejected decisions
  const handleAdmitReject = (guestSocketId: string, action: "admit" | "reject") => {
    if (action === "admit") {
      emitSocketEvent("admit-guest", { guestSocketId });
    } else {
      emitSocketEvent("reject-guest", { guestSocketId });
    }
  };

  const handleToggleLock = () => {
    const nextLockState = !isLocked;
    setIsLocked(nextLockState);
    emitSocketEvent("host-control", { action: nextLockState ? "lock" : "unlock" });
    notify.success(nextLockState ? "Meeting is now locked." : "Meeting is unlocked.");
  };

  const handleLeave = () => {
    leaveMeeting();
    navigate("/meetings");
  };

  const handleEndAll = () => {
    emitSocketEvent("host-control", { action: "end-meeting" });
    leaveMeeting();
    navigate("/meetings");
  };

  const handleSendReaction = (reaction: string) => {
    emitSocketEvent("send-reaction", { reaction });
  };

  // Start meeting session recording
  const startRecording = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;
      
      const audioDest = audioCtx.createMediaStreamDestination();
      audioDestRef.current = audioDest;

      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          const localAudioStream = new MediaStream([audioTrack]);
          const source = audioCtx.createMediaStreamSource(localAudioStream);
          source.connect(audioDest);
          localAudioSourceRef.current = source;
        }
      }

      peers.forEach((peer) => {
        if (peer.stream) {
          const audioTrack = peer.stream.getAudioTracks()[0];
          if (audioTrack) {
            try {
              const peerAudioStream = new MediaStream([audioTrack]);
              const source = audioCtx.createMediaStreamSource(peerAudioStream);
              source.connect(audioDest);
              peerAudioSourcesRef.current.set(peer.socketId, source);
            } catch (err) {
              console.error("Error setting up audio source for peer:", peer.userName, err);
            }
          }
        }
      });

      let recordStream = audioDest.stream;
      const localVideoTrack = localStream?.getVideoTracks()[0];
      if (localVideoTrack) {
        recordStream = new MediaStream([
          localVideoTrack,
          ...audioDest.stream.getAudioTracks()
        ]);
      }

      recordedChunksRef.current = [];
      const options = { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm' };
      let recorderOptions = options;
      if (!localVideoTrack) {
        recorderOptions = { mimeType: 'audio/webm' };
      }

      const mediaRecorder = new MediaRecorder(recordStream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const durationSeconds = Math.round((Date.now() - recordStartTimeRef.current) / 1000);
        const blob = new Blob(recordedChunksRef.current, { type: recorderOptions.mimeType });
        
        const formData = new FormData();
        const extension = 'webm';
        const filename = `recording-${meetingId}-${Date.now()}.${extension}`;
        formData.append('file', blob, filename);
        formData.append('duration_seconds', durationSeconds.toString());

        try {
          const response = await fetch(`${BASE_URL}/meetings/${meetingId}/recordings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          if (response.ok) {
            notify.success('Meeting recording saved successfully');
          } else {
            notify.error('Failed to save meeting recording');
          }
        } catch (err) {
          console.error('Error uploading recording:', err);
          notify.error('Error saving meeting recording');
        }

        if (localAudioSourceRef.current) {
          localAudioSourceRef.current.disconnect();
          localAudioSourceRef.current = null;
        }
        peerAudioSourcesRef.current.forEach((src) => src.disconnect());
        peerAudioSourcesRef.current.clear();
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
        audioDestRef.current = null;
      };

      recordStartTimeRef.current = Date.now();
      mediaRecorder.start(1000);
      setIsRecording(true);
      notify.success('Recording started');
    } catch (err) {
      console.error("Failed to start recording:", err);
      notify.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      notify.success('Recording stopped. Uploading file...');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Joining meeting room...</p>
        </div>
      </div>
    );
  }

  // Handle waiting room overlay
  if (waitingStatus === "waiting") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white p-6">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="mx-auto text-red-500 animate-pulse" size={48} />
          <h2 className="text-lg font-bold">Waiting Room</h2>
          <p className="text-sm text-gray-400">
            Please wait, the meeting host has been notified. You will join automatically once approved.
          </p>
          <button
            onClick={() => navigate("/meetings")}
            className="w-full bg-gray-700 hover:bg-gray-600 rounded py-2 text-xs transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (waitingStatus === "rejected") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white p-6">
        <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-lg font-bold">Admission Denied</h2>
          <p className="text-sm text-gray-400">
            The host rejected your request to join this meeting room.
          </p>
          <button
            onClick={() => navigate("/meetings")}
            className="w-full bg-red-700 hover:bg-red-800 rounded py-2 text-xs transition"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 select-none overflow-hidden relative">
      {/* 1. Header Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-red-700/20 p-2.5 rounded-lg border border-red-700/30">
            <Video className="text-red-500 animate-pulse" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-1.5">
              {meetingDetails?.title || "CRM Meeting Room"}
              {breakoutRoom && (
                <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded">
                  {breakoutRoom.name}
                </span>
              )}
            </h1>
            <p className="text-[10px] text-gray-500">ID: {meetingDetails?.meeting_link}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={15} />
            <span>{peers.length + 1} participant{peers.length !== 0 && "s"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Clock size={15} />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Body Grid/Panel wrapper */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden relative">
        {/* Main Video Stream Frame / Whiteboard */}
        <div className="flex-1 min-w-0 h-full relative">
          {activePanel === "whiteboard" ? (
            <Whiteboard
              meetingId={meetingId || ""}
              strokes={whiteboardStrokes}
              emitSocketEvent={emitSocketEvent}
            />
          ) : (
            <MeetingGrid
              localStream={localStream}
              peers={peers}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              activeSpeaker={activeSpeaker}
              layout={peers.length > 2 ? "grid" : "speaker"}
              userName={userName}
            />
          )}

          {/* Floating Live Captions Overlay */}
          {captions.length > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg border border-gray-800 text-xs text-gray-300 max-w-lg text-center z-40 space-y-1">
              {captions.map((cap) => (
                <div key={cap.id}>
                  <strong className="text-red-400">{cap.userName}: </strong>
                  <span>{cap.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Floating Reactions animations overlay */}
          {reactions.map((react) => {
            const peer = peers.find(p => p.socketId === react.socketId);
            const senderName = peer ? peer.userName : userName;
            return (
              <div
                key={react.id}
                className="absolute bottom-20 left-12 bg-black/60 px-2.5 py-1.5 rounded-full border border-gray-700/50 text-white text-xs animate-bounce flex items-center gap-1.5 pointer-events-none z-40"
              >
                <span>{react.reaction}</span>
                <span className="text-[10px] text-gray-300">{senderName}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Sidebar panels */}
        {activePanel !== "none" && activePanel !== "whiteboard" && (
          <div className="w-80 h-full flex-shrink-0 z-10 transition-all duration-300">
            {activePanel === "chat" && (
              <ChatPanel
                meetingId={meetingId || ""}
                chatMessages={chatMessages}
                userName={userName}
                userId={Number(staffId || 0)}
                emitSocketEvent={emitSocketEvent}
              />
            )}
            {activePanel === "participants" && (
              <ParticipantPanel
                meetingId={meetingId || ""}
                peers={peers}
                userId={Number(staffId || 0)}
                userName={userName}
                isHost={isHost}
                waitingGuests={waitingGuests}
                emitSocketEvent={emitSocketEvent}
                onAdmitReject={handleAdmitReject}
              />
            )}
            {activePanel === "notes" && (
              <NotesPanel
                meetingId={meetingId || ""}
                notesContent={notesContent}
                emitSocketEvent={emitSocketEvent}
              />
            )}
            {activePanel === "polls" && (
              <PollsPanel
                meetingId={meetingId || ""}
                polls={polls}
                userId={Number(staffId || 0)}
                isHost={isHost}
                emitSocketEvent={emitSocketEvent}
              />
            )}
            {activePanel === "breakout" && (
              <BreakoutPanel
                peers={peers}
                isHost={isHost}
                emitSocketEvent={emitSocketEvent}
              />
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom controls toolbar */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        handRaised={false}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHand={() => emitSocketEvent("hand-raise", { status: true })}
        onOpenSettings={() => setShowSettings(true)}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        isHost={isHost}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onLeave={handleLeave}
        onEndAll={handleEndAll}
        onSendReaction={handleSendReaction}
        isRecording={isRecording}
        onToggleRecording={isRecording ? stopRecording : startRecording}
      />

      {/* 4. Settings modal dialog */}
      {showSettings && (
        <DeviceSettingsModal
          onClose={() => setShowSettings(false)}
          localStream={localStream}
        />
      )}
    </div>
  );
}
