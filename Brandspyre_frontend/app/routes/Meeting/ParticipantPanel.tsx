import React from "react";
import { Users, MicOff, ShieldAlert, Pin, UserMinus, Check, X, Shield } from "lucide-react";

interface ParticipantPanelProps {
  meetingId: string;
  peers: any[];
  userId: number;
  userName: string;
  isHost: boolean;
  waitingGuests: any[];
  emitSocketEvent: (event: string, payload: any) => void;
  onAdmitReject: (guestSocketId: string, action: "admit" | "reject") => void;
}

export default function ParticipantPanel({
  meetingId,
  peers,
  userId,
  userName,
  isHost,
  waitingGuests,
  emitSocketEvent,
  onAdmitReject,
}: ParticipantPanelProps) {
  
  const handleMutePeer = (socketId: string) => {
    emitSocketEvent("host-mute-peer", { targetSocketId: socketId });
  };

  const handleKickPeer = (socketId: string) => {
    emitSocketEvent("host-kick-peer", { targetSocketId: socketId });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white overflow-y-auto">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
        <Users className="text-red-500" size={18} />
        <h3 className="font-semibold text-sm">Participants ({peers.length + 1})</h3>
      </div>

      {/* Waiting Room Requests (Only Visible to Host) */}
      {isHost && waitingGuests.length > 0 && (
        <div className="mb-4 space-y-2.5">
          <h4 className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">Waiting Room</h4>
          <div className="space-y-1.5">
            {waitingGuests.map((guest) => (
              <div
                key={guest.socketId}
                className="flex items-center justify-between bg-red-950/20 border border-red-900/40 rounded p-2 text-xs"
              >
                <span>{guest.userName}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onAdmitReject(guest.socketId, "admit")}
                    className="p-1 rounded bg-green-700 hover:bg-green-800 transition text-white"
                    title="Admit"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => onAdmitReject(guest.socketId, "reject")}
                    className="p-1 rounded bg-red-700 hover:bg-red-800 transition text-white"
                    title="Reject"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Participants List */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Active</h4>

        {/* Local user */}
        <div className="flex items-center justify-between bg-gray-900/40 border border-gray-700/30 rounded p-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">{userName} (You)</span>
            {isHost && (
              <span className="flex items-center gap-0.5 text-[9px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full border border-red-900/60">
                <Shield size={8} /> Host
              </span>
            )}
          </div>
        </div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <div
            key={peer.socketId}
            className="flex items-center justify-between bg-gray-900/20 border border-gray-700/20 rounded p-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span>{peer.userName}</span>
              {peer.handRaised && (
                <span className="text-[10px]" title="Hand Raised">
                  ✋
                </span>
              )}
            </div>

            {/* Host actions on remote peers */}
            {isHost && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleMutePeer(peer.socketId)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition"
                  title="Mute Participant"
                >
                  <MicOff size={13} />
                </button>
                <button
                  onClick={() => handleKickPeer(peer.socketId)}
                  className="p-1 rounded hover:bg-gray-700 text-red-500 hover:text-red-400 transition"
                  title="Remove Participant"
                >
                  <UserMinus size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
