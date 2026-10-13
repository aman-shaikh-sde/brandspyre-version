import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff, Pin } from "lucide-react";

interface PeerStream {
  socketId: string;
  userId: number;
  userName: string;
  stream: MediaStream;
  isMuted: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

interface MeetingGridProps {
  localStream: MediaStream | null;
  peers: PeerStream[];
  isMuted: boolean;
  isVideoOff: boolean;
  activeSpeaker: string | null;
  layout: "grid" | "speaker";
  userName: string;
}

// Separate Video Player component to safely handle source assignment
function VideoPlayer({ stream, muted, autoPlay, playsInline, className }: {
  stream: MediaStream;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      muted={muted}
      autoPlay={autoPlay}
      playsInline={playsInline}
      className={className}
    />
  );
}

export default function MeetingGrid({
  localStream,
  peers,
  isMuted,
  isVideoOff,
  activeSpeaker,
  layout,
  userName,
}: MeetingGridProps) {

  // Speaker View Mode: Highlight active speaker as large block, others smaller
  const getSpeakerFocus = () => {
    if (activeSpeaker) {
      const activePeer = peers.find((p) => p.socketId === activeSpeaker);
      if (activePeer) return activePeer;
    }
    return null;
  };

  const speakerFocus = getSpeakerFocus();

  if (layout === "speaker" && speakerFocus) {
    const remainingPeers = peers.filter((p) => p.socketId !== speakerFocus.socketId);

    return (
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Large active speaker screen */}
        <div className="flex-1 bg-gray-950 rounded-lg overflow-hidden border border-red-500 relative flex items-center justify-center">
          {speakerFocus.videoEnabled ? (
            <VideoPlayer
              stream={speakerFocus.stream}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-xl font-bold text-white uppercase border border-gray-700">
              {speakerFocus.userName.charAt(0)}
            </div>
          )}

          {/* Label overlay */}
          <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-xs font-semibold flex items-center gap-1.5">
            <span>{speakerFocus.userName} (Speaking)</span>
            {speakerFocus.isMuted && <MicOff className="text-red-500" size={12} />}
          </div>
        </div>

        {/* Small thumbnail container for others */}
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-56 h-32 md:h-full p-1 border-t md:border-t-0 md:border-l border-gray-800">
          {/* Local Stream Thumbnail */}
          <div className="w-40 md:w-full aspect-video flex-shrink-0 bg-gray-950 rounded border border-gray-700 relative overflow-hidden flex items-center justify-center">
            {localStream && !isVideoOff ? (
              <VideoPlayer
                stream={localStream}
                muted
                autoPlay
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xs font-semibold text-white uppercase">
                {userName.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
              <span>You</span>
              {isMuted && <MicOff className="text-red-500" size={10} />}
            </div>
          </div>

          {/* Remaining Remote Streams Thumbnails */}
          {remainingPeers.map((peer) => (
            <div key={peer.socketId} className="w-40 md:w-full aspect-video flex-shrink-0 bg-gray-950 rounded border border-gray-700 relative overflow-hidden flex items-center justify-center">
              {peer.videoEnabled ? (
                <VideoPlayer
                  stream={peer.stream}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xs font-semibold text-white uppercase">
                  {peer.userName.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                <span>{peer.userName}</span>
                {peer.isMuted && <MicOff className="text-red-500" size={10} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid View Mode: Evenly-sized boxes
  const totalCount = peers.length + 1;
  const getGridCols = () => {
    if (totalCount <= 1) return "grid-cols-1";
    if (totalCount === 2) return "grid-cols-1 md:grid-cols-2";
    if (totalCount <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3";
  };

  return (
    <div className={`grid ${getGridCols()} gap-4 h-full`}>
      {/* Local Video Stream Card */}
      <div className={`bg-gray-950 rounded-lg overflow-hidden border relative flex items-center justify-center ${activeSpeaker === "local" ? "border-red-500 shadow-lg shadow-red-500/10" : "border-gray-800"}`}>
        {localStream && !isVideoOff ? (
          <VideoPlayer
            stream={localStream}
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-white uppercase">
            {userName.charAt(0)}
          </div>
        )}

        {/* Label Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-xs font-semibold flex items-center gap-1.5">
          <span>{userName} (You)</span>
          {isMuted && <MicOff className="text-red-500" size={12} />}
        </div>
      </div>

      {/* Remote Video Stream Cards */}
      {peers.map((peer) => {
        const isSpeaking = activeSpeaker === peer.socketId;

        return (
          <div
            key={peer.socketId}
            className={`bg-gray-950 rounded-lg overflow-hidden border relative flex items-center justify-center ${isSpeaking ? "border-red-500 shadow-lg shadow-red-500/10" : "border-gray-800"}`}
          >
            {peer.videoEnabled ? (
              <VideoPlayer
                stream={peer.stream}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-white uppercase">
                {peer.userName.charAt(0)}
              </div>
            )}

            {/* Label Overlay */}
            <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded text-white text-xs font-semibold flex items-center gap-1.5">
              <span>{peer.userName}</span>
              {peer.isMuted && <MicOff className="text-red-500" size={12} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
