import React, { useState } from "react";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MonitorOff,
  Hand, Settings, MessageSquare, Users, FileText, BarChart2, GitCommit, PenTool, PhoneOff, Lock, Unlock
} from "lucide-react";

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onOpenSettings: () => void;
  
  // Side panel states
  activePanel: "chat" | "participants" | "notes" | "polls" | "breakout" | "whiteboard" | "none";
  setActivePanel: (panel: "chat" | "participants" | "notes" | "polls" | "breakout" | "whiteboard" | "none") => void;

  isHost: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  onLeave: () => void;
  onEndAll: () => void;
  onSendReaction: (reaction: string) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

export default function MeetingControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  handRaised,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onOpenSettings,
  activePanel,
  setActivePanel,
  isHost,
  isLocked,
  onToggleLock,
  onLeave,
  onEndAll,
  onSendReaction,
  isRecording = false,
  onToggleRecording = () => {},
}: MeetingControlsProps) {
  const [showReactions, setShowReactions] = useState(false);

  const togglePanel = (panelName: "chat" | "participants" | "notes" | "polls" | "breakout" | "whiteboard") => {
    if (activePanel === panelName) {
      setActivePanel("none");
    } else {
      setActivePanel(panelName);
    }
  };

  const handleReactionClick = (emoji: string) => {
    onSendReaction(emoji);
    setShowReactions(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between bg-gray-900 border-t border-gray-800 px-6 py-4 gap-4 text-white">
      {/* Device Toggles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMute}
          className={`p-3 rounded-full transition ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-800 hover:bg-gray-700"}`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition ${isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-800 hover:bg-gray-700"}`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition ${isScreenSharing ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700"}`}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>

        <button
          onClick={onToggleHand}
          className={`p-3 rounded-full transition ${handRaised ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-800 hover:bg-gray-700"}`}
          title="Raise Hand"
        >
          <Hand size={20} className={handRaised ? "animate-bounce" : ""} />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          title="Device Settings"
        >
          <Settings size={20} />
        </button>

        {isHost && (
          <button
            onClick={onToggleRecording}
            className={`p-3 rounded-full transition ${isRecording ? "bg-red-600 hover:bg-red-755 animate-pulse" : "bg-gray-800 hover:bg-gray-700"}`}
            title={isRecording ? "Stop Recording" : "Start Recording Meeting"}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-600'}`} />
          </button>
        )}
      </div>

      {/* Feature panels toggles & reactions */}
      <div className="flex items-center gap-2 relative">
        {/* Reactions floating panel */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="px-3.5 py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition text-xs font-semibold"
          >
            Reactions
          </button>
          {showReactions && (
            <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-850 border border-gray-700 rounded-full py-1.5 px-3 flex gap-2 shadow-xl z-50">
              {["👍", "👏", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-lg hover:scale-125 transition duration-150 active:scale-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-800 mx-1" />

        <button
          onClick={() => togglePanel("chat")}
          className={`p-2.5 rounded-lg transition relative ${activePanel === "chat" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          title="Chat"
        >
          <MessageSquare size={18} />
        </button>

        <button
          onClick={() => togglePanel("participants")}
          className={`p-2.5 rounded-lg transition ${activePanel === "participants" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          title="Participants"
        >
          <Users size={18} />
        </button>

        <button
          onClick={() => togglePanel("whiteboard")}
          className={`p-2.5 rounded-lg transition ${activePanel === "whiteboard" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          title="Whiteboard"
        >
          <PenTool size={18} />
        </button>

        <button
          onClick={() => togglePanel("notes")}
          className={`p-2.5 rounded-lg transition ${activePanel === "notes" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          title="Shared Notes"
        >
          <FileText size={18} />
        </button>

        <button
          onClick={() => togglePanel("polls")}
          className={`p-2.5 rounded-lg transition ${activePanel === "polls" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
          title="Polls"
        >
          <BarChart2 size={18} />
        </button>

        {isHost && (
          <button
            onClick={() => togglePanel("breakout")}
            className={`p-2.5 rounded-lg transition ${activePanel === "breakout" ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            title="Breakout Rooms"
          >
            <GitCommit size={18} />
          </button>
        )}
      </div>

      {/* Lock Room & End call controls */}
      <div className="flex items-center gap-3">
        {isHost && (
          <button
            onClick={onToggleLock}
            className={`p-2.5 rounded-lg transition ${isLocked ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            title={isLocked ? "Unlock Meeting" : "Lock Meeting"}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        )}

        <button
          onClick={onLeave}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2.5 rounded text-xs transition"
          title="Leave Meeting"
        >
          Leave
        </button>

        {isHost && (
          <button
            onClick={onEndAll}
            className="bg-red-700 hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded text-xs transition flex items-center gap-1.5"
            title="End Meeting for Everyone"
          >
            <PhoneOff size={14} />
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
