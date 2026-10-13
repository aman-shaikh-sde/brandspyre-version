import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL, SOCKET_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

const socketUrl = SOCKET_URL;

interface PeerStream {
  socketId: string;
  userId: number;
  userName: string;
  stream: MediaStream;
  isMuted: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
}

export const useMeeting = (meetingId: string, _legacyUserId?: number, _legacyUserName?: string, _legacyIsHost?: boolean) => {
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const sendersRef = useRef<Record<string, RTCRtpSender[]>>({});

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [waitingStatus, setWaitingStatus] = useState<"admitted" | "waiting" | "rejected" | "none">("none");
  const [waitingGuests, setWaitingGuests] = useState<Array<{ socketId: string; userName: string; userId: number }>>([]);
  
  // Real-time collaborative states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<any[]>([]);
  const [notesContent, setNotesContent] = useState("");
  const [notesVersion, setNotesVersion] = useState(1);
  const [polls, setPolls] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Array<{ socketId: string; reaction: string; id: string }>>([]);
  const [breakoutRoom, setBreakoutRoom] = useState<{ roomId: string; name: string } | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Array<{ id: string; text: string; userName: string }>>([]);

  const [permissions, setPermissions] = useState({
    allowChat: true,
    allowScreenShare: true,
    allowCamera: true,
    allowMic: true,
    isLocked: false
  });

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize Local Media Stream
  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn("Camera/Mic access denied or unavailable:", err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsVideoOff(true);
        return audioStream;
      } catch (err2) {
        console.warn("Audio access also unavailable.");
        return null;
      }
    }
  };

  useEffect(() => {
    if (!meetingId) return;

    const token = useAuthStore.getState().accessToken;

    // 1. Establish Authenticated Socket Connection with JWT handshake
    const socket = io(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    // 2. Initialize streams & join with Server-Authoritative Identity
    initLocalStream().then(() => {
      socket.emit("join-meeting", { meetingId });
    });

    // 3. Waiting Room Status
    socket.on("waiting-room-status", (status: "waiting" | "admitted" | "rejected") => {
      setWaitingStatus(status);
    });

    // 4. Host: Receive requests from guests
    socket.on("waiting-room-request", (guest) => {
      setWaitingGuests(prev => [...prev.filter(g => g.socketId !== guest.socketId), guest]);
    });

    // 5. Meeting Controls Sync
    socket.on("meeting-controls-sync", (controls) => {
      setPermissions(prev => ({ ...prev, ...controls }));
    });

    // 6. Receive Peers List upon join
    socket.on("current-peers", (peerList: any[]) => {
      setWaitingStatus("admitted");
      peerList.forEach((peer) => {
        const pc = createPeerConnection(peer.socketId, peer.userId, peer.userName);
        peersRef.current[peer.socketId] = pc;

        if (localStreamRef.current) {
          const senders = localStreamRef.current.getTracks().map(track => pc.addTrack(track, localStreamRef.current!));
          sendersRef.current[peer.socketId] = senders;
        }

        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", { targetSocketId: peer.socketId, offer: pc.localDescription });
          })
          .catch(err => console.warn("Offer error:", err));
      });
    });

    // 7. A new user joined
    socket.on("user-joined", (peer: any) => {
      const pc = createPeerConnection(peer.socketId, peer.userId, peer.userName);
      peersRef.current[peer.socketId] = pc;

      if (localStreamRef.current) {
        const senders = localStreamRef.current.getTracks().map(track => pc.addTrack(track, localStreamRef.current!));
        sendersRef.current[peer.socketId] = senders;
      }
    });

    // 8. WebRTC Signaling (Offer, Answer, ICE Candidates)
    socket.on("offer", async ({ callerSocketId, offer, userId, userName }) => {
      let pc = peersRef.current[callerSocketId];
      if (!pc) {
        pc = createPeerConnection(callerSocketId, userId, userName);
        peersRef.current[callerSocketId] = pc;
        if (localStreamRef.current) {
          const senders = localStreamRef.current.getTracks().map(track => pc.addTrack(track, localStreamRef.current!));
          sendersRef.current[callerSocketId] = senders;
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { targetSocketId: callerSocketId, answer });
    });

    socket.on("answer", async ({ responderSocketId, answer }) => {
      const pc = peersRef.current[responderSocketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ senderSocketId, candidate }) => {
      const pc = peersRef.current[senderSocketId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // 9. Chat Messaging (Server Identified)
    socket.on("chat-message", (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // 10. Whiteboard strokes & history
    socket.on("whiteboard-stroke", (stroke) => {
      setWhiteboardStrokes(prev => [...prev, stroke]);
    });

    socket.on("whiteboard-history", (history) => {
      if (Array.isArray(history)) setWhiteboardStrokes(history);
    });

    socket.on("whiteboard-clear", () => {
      setWhiteboardStrokes([]);
    });

    // 11. Notes sync
    socket.on("notes-updated", (data: { content: string; version: number }) => {
      if (data?.content !== undefined) setNotesContent(data.content);
      if (data?.version) setNotesVersion(data.version);
    });

    // 12. Polls sync
    socket.on("polls-sync", (syncPolls) => {
      if (Array.isArray(syncPolls)) setPolls(syncPolls);
    });

    socket.on("poll-created", (poll) => {
      setPolls(prev => [poll, ...prev]);
    });

    socket.on("poll-vote-updated", ({ pollId, votes }) => {
      setPolls(prev => prev.map(p => p.poll_id === pollId ? { ...p, votes } : p));
    });

    // 13. Reactions & Captions
    socket.on("reaction-received", ({ id, reaction, userName }) => {
      const rxnId = id || Math.random().toString();
      setReactions(prev => [...prev, { socketId: rxnId, reaction, id: rxnId }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== rxnId));
      }, 4000);
    });

    socket.on("caption-received", (cap) => {
      const capId = cap.id || Math.random().toString();
      setCaptions(prev => [...prev, { ...cap, id: capId }]);
      setTimeout(() => {
        setCaptions(prev => prev.filter(c => c.id !== capId));
      }, 6000);
    });

    // 14. Host controls (forced mute, kick, end)
    socket.on("force-mute", () => {
      toggleMute(true);
    });

    socket.on("kicked-from-meeting", () => {
      leaveMeeting();
      window.location.href = "/meetings?kicked=true";
    });

    socket.on("meeting-ended", () => {
      leaveMeeting();
      window.location.href = "/meetings?ended=true";
    });

    // 15. User Left
    socket.on("user-left", ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      delete sendersRef.current[socketId];
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      leaveMeeting();
    };
  }, [meetingId]);

  // Create WebRTC PeerConnection
  const createPeerConnection = (peerSocketId: string, peerUserId: number, peerUserName: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          targetSocketId: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeers((prev) => {
        const exists = prev.some((p) => p.socketId === peerSocketId);
        if (exists) {
          return prev.map((p) => (p.socketId === peerSocketId ? { ...p, stream: remoteStream } : p));
        }
        return [
          ...prev,
          {
            socketId: peerSocketId,
            userId: peerUserId,
            userName: peerUserName,
            stream: remoteStream,
            isMuted: false,
            videoEnabled: true,
            screenSharing: false,
            handRaised: false,
          },
        ];
      });
    };

    return pc;
  };

  const toggleMute = (forceState?: boolean) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = forceState !== undefined ? forceState : !audioTrack.enabled;
        audioTrack.enabled = !nextState;
        setIsMuted(nextState);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setIsVideoOff(!nextState);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = cameraStream.getVideoTracks()[0];
      localStreamRef.current?.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current?.getTracks()));

      Object.keys(peersRef.current).forEach((pId) => {
        const pc = peersRef.current[pId];
        const senders = sendersRef.current[pId] || [];
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      });

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStreamRef.current.removeTrack(videoTrack);
          }
          localStreamRef.current.addTrack(screenTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }

        Object.keys(peersRef.current).forEach((pId) => {
          const pc = peersRef.current[pId];
          const senders = sendersRef.current[pId] || [];
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen sharing canceled:", err);
      }
    }
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    sendersRef.current = {};

    if (socketRef.current) {
      socketRef.current.emit("leave-meeting");
      socketRef.current.disconnect();
    }
  };

  const emitSocketEvent = (event: string, payload: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, payload);
    }
  };

  return {
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
    notesVersion,
    polls,
    reactions,
    breakoutRoom,
    activeSpeaker,
    captions,
    emitSocketEvent,
  };
};
