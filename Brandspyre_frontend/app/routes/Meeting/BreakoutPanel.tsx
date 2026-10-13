import React, { useState } from "react";
import { GitCommit, Plus, Play, StopCircle } from "lucide-react";
import { notify } from "~/services/notificationService";
interface BreakoutPanelProps {
  peers: any[];
  isHost: boolean;
  emitSocketEvent: (event: string, payload: any) => void;
}

export default function BreakoutPanel({ peers, isHost, emitSocketEvent }: BreakoutPanelProps) {
  const [numRooms, setNumRooms] = useState(2);
  const [activeBreakouts, setActiveBreakouts] = useState<any[]>([]);

  const handleStartBreakouts = () => {
    if (peers.length === 0) {
      notify.error("No other participants in the call to assign.");
      return;
    }

    const rooms: any[] = [];
    for (let i = 0; i < numRooms; i++) {
      rooms.push({
        roomId: `breakout-room-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: `Breakout Room ${i + 1}`,
        participants: [],
      });
    }

    // Auto-distribute participants evenly
    peers.forEach((peer, idx) => {
      const roomIdx = idx % numRooms;
      rooms[roomIdx].participants.push(peer.socketId);
    });

    emitSocketEvent("breakout-create", { rooms });
    setActiveBreakouts(rooms);
    notify.success(`Started ${numRooms} Breakout Rooms!`);
  };

  const handleEndBreakouts = () => {
    emitSocketEvent("breakout-end", {});
    setActiveBreakouts([]);
    notify.success("Ended all Breakout Rooms!");
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
        <GitCommit className="text-purple-500" size={18} />
        <h3 className="font-semibold text-sm">Breakout Rooms</h3>
      </div>

      {!isHost ? (
        <div className="text-center py-12 text-xs text-gray-500">
          Only the host can configure breakout rooms.
        </div>
      ) : activeBreakouts.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-purple-950/20 border border-purple-900/40 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-purple-400">Breakout Rooms Active</h4>
            <div className="space-y-2">
              {activeBreakouts.map((room) => (
                <div key={room.roomId} className="bg-gray-900/50 p-2.5 rounded text-xs space-y-1">
                  <span className="font-semibold">{room.name}</span>
                  <div className="text-[10px] text-gray-400">
                    {room.participants.length} assigned participants
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleEndBreakouts}
            className="w-full flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 text-white rounded py-2 text-xs transition"
          >
            <StopCircle size={14} />
            End Breakout Rooms
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Number of Rooms</label>
            <input
              type="number"
              min={2}
              max={10}
              value={numRooms}
              onChange={(e) => setNumRooms(Math.max(2, Number(e.target.value)))}
              className="w-full bg-gray-950 text-sm border border-gray-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleStartBreakouts}
            className="w-full flex items-center justify-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded py-2 text-xs transition"
          >
            <Play size={14} />
            Auto Assign & Start Rooms
          </button>
        </div>
      )}
    </div>
  );
}
