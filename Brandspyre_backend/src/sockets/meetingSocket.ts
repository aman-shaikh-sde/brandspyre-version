import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { 
  Meeting, 
  MeetingParticipant, 
  MeetingChatMessage, 
  MeetingPoll, 
  MeetingPollVote, 
  MeetingNotes, 
  BreakoutRoom 
} from "../db/ModelSceham/meetingSchema";
import { MeetingAccessService, ResolvedUserContext } from "../services/meetings/MeetingAccessService";
import { verifyAccessToken } from "../middleware/token";

export interface AuthenticatedSocket extends Socket {
  user?: ResolvedUserContext;
  userId?: number;
  userName?: string;
  tenantId?: string;
  userRole?: string;
  meetingId?: number;
  isHost?: boolean;
  isApproved?: boolean;
}

interface ParticipantInfo {
  socketId: string;
  userId: number;
  userName: string;
  tenantId: string;
  isHost: boolean;
  handRaised: boolean;
  cameraOn: boolean;
  micOn: boolean;
  screenSharing: boolean;
  breakoutRoomId?: string;
  isApproved: boolean;
}

export const activeRooms: Record<string, {
  meetingNumberId: number;
  hostSocketId?: string;
  isLocked: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowCamera: boolean;
  allowMic: boolean;
  whiteboardData: any[];
  sharedNotes: string;
  notesVersion: number;
  participants: Record<string, ParticipantInfo>; // socketId -> ParticipantInfo
}> = {};

export const setupMeetingSockets = (io: Server) => {
  // ----------------------------------------------------
  // 1. SOCKET.IO HANDSHAKE JWT AUTHENTICATION MIDDLEWARE
  // ----------------------------------------------------
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error("Authentication required: No bearer token provided in socket handshake"));
      }

      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      const decoded = await verifyAccessToken(token);
      if (!decoded) {
        return next(new Error("Authentication failed: Invalid or expired token"));
      }

      const userContext = await MeetingAccessService.resolveUserContext(decoded);
      if (!userContext) {
        return next(new Error("Authentication failed: User context or tenant could not be resolved"));
      }

      socket.user = userContext;
      socket.userId = userContext.psn;
      socket.userName = userContext.userName;
      socket.tenantId = userContext.tenantId;
      socket.userRole = userContext.userRole;

      next();
    } catch (err: any) {
      next(new Error(`Socket authentication error: ${err.message}`));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket Authenticated] ID: ${socket.id}, User: ${socket.userName} (PSN: ${socket.userId}, Tenant: ${socket.tenantId})`);

    // ----------------------------------------------------
    // 2. JOIN MEETING (SERVER-AUTHORITATIVE CHECK)
    // ----------------------------------------------------
    socket.on("join-meeting", async ({ meetingId }: { meetingId: string | number }) => {
      try {
        if (!socket.user || !socket.userId) {
          socket.emit("join-error", "Unauthorized: Socket is not authenticated.");
          return;
        }

        const midStr = String(meetingId);
        const query = mongoose.Types.ObjectId.isValid(midStr)
          ? { _id: new mongoose.Types.ObjectId(midStr) }
          : (!isNaN(Number(midStr)) ? { $or: [{ meeting_id: Number(midStr) }, { id: Number(midStr) }] } : null);

        if (!query) {
          socket.emit("join-error", "Invalid meeting ID format.");
          return;
        }

        const meeting = await Meeting.findOne(query) as any;
        if (!meeting) {
          socket.emit("join-error", "Meeting does not exist.");
          return;
        }

        // Validate Join Access via central MeetingAccessService
        const accessCheck = await MeetingAccessService.canJoinMeeting(meeting, socket.user);
        if (!accessCheck.authorized) {
          socket.emit("join-error", accessCheck.reason || "Access Denied: You are not authorized to join this meeting.");
          return;
        }

        const numericMeetingId = meeting.meeting_id;
        const roomKey = String(numericMeetingId);

        socket.meetingId = numericMeetingId;
        socket.isHost = accessCheck.isHost;
        socket.isApproved = accessCheck.isApproved;

        // Initialize active room in memory if not already created
        if (!activeRooms[roomKey]) {
          activeRooms[roomKey] = {
            meetingNumberId: numericMeetingId,
            isLocked: false,
            allowChat: meeting.allow_chat !== false,
            allowScreenShare: meeting.allow_screen_share !== false,
            allowCamera: true,
            allowMic: !meeting.mute_on_join,
            whiteboardData: [],
            sharedNotes: "",
            notesVersion: 1,
            participants: {}
          };

          // Load latest notes from MongoDB
          const existingNotes = await MeetingNotes.findOne({ meeting_id: numericMeetingId }).lean() as any;
          if (existingNotes) {
            activeRooms[roomKey].sharedNotes = existingNotes.content || "";
            activeRooms[roomKey].notesVersion = existingNotes.notes_version || 1;
          }
        }

        const room = activeRooms[roomKey];

        if (socket.isHost) {
          room.hostSocketId = socket.id;
        }

        // Lock check
        if (room.isLocked && !socket.isHost) {
          socket.emit("join-error", "This meeting has been locked by the host.");
          return;
        }

        // Waiting Room Enforcement
        if (!socket.isApproved && !socket.isHost) {
          room.participants[socket.id] = {
            socketId: socket.id,
            userId: socket.userId,
            userName: socket.userName || "Guest",
            tenantId: socket.tenantId || "",
            isHost: false,
            handRaised: false,
            cameraOn: true,
            micOn: true,
            screenSharing: false,
            isApproved: false
          };

          socket.emit("waiting-room-status", "waiting");
          
          if (room.hostSocketId) {
            io.to(room.hostSocketId).emit("waiting-room-request", {
              socketId: socket.id,
              userId: socket.userId,
              userName: socket.userName
            });
          }
          return;
        }

        // Participant is approved: Add to Socket.IO room
        socket.join(roomKey);

        room.participants[socket.id] = {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName || "Participant",
          tenantId: socket.tenantId || "",
          isHost: socket.isHost,
          handRaised: false,
          cameraOn: true,
          micOn: !meeting.mute_on_join,
          screenSharing: false,
          isApproved: true
        };

        // Persist/Update MeetingParticipant in MongoDB
        const now = new Date();
        await MeetingParticipant.findOneAndUpdate(
          { meeting_id: numericMeetingId, user_id: socket.userId },
          {
            $set: {
              tenant_id: socket.tenantId ? new mongoose.Types.ObjectId(socket.tenantId) : undefined,
              response_status: 'ACCEPTED',
              is_host: socket.isHost,
              join_time: now,
              video_enabled: true,
              is_muted: meeting.mute_on_join === true,
              updated_at: now
            },
            $setOnInsert: {
              invited_at: now,
              created_at: now
            }
          },
          { upsert: true, new: true }
        );

        // Transition meeting status to IN_PROGRESS if currently SCHEDULED
        if (meeting.status === 'SCHEDULED' || meeting.status === 'scheduled') {
          await Meeting.updateOne(
            { _id: meeting._id },
            { $set: { status: 'IN_PROGRESS', actual_start_time: now, updated_at: now } }
          );
        }

        // Notify joining participant
        socket.emit("waiting-room-status", "admitted");

        // Send active peer list to new participant
        const peersList = Object.values(room.participants)
          .filter(p => p.socketId !== socket.id && p.isApproved)
          .map(p => ({
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            isHost: p.isHost,
            cameraOn: p.cameraOn,
            micOn: p.micOn,
            screenSharing: p.screenSharing,
            handRaised: p.handRaised,
            breakoutRoomId: p.breakoutRoomId
          }));

        socket.emit("current-peers", peersList);

        // Send existing room state
        socket.emit("whiteboard-history", room.whiteboardData);
        socket.emit("notes-updated", { content: room.sharedNotes, version: room.notesVersion });
        socket.emit("meeting-controls-sync", {
          allowChat: room.allowChat,
          allowScreenShare: room.allowScreenShare,
          allowCamera: room.allowCamera,
          allowMic: room.allowMic,
          isLocked: room.isLocked
        });

        // Load and send active polls from MongoDB
        const activePolls = await MeetingPoll.find({ meeting_id: numericMeetingId, is_active: true }).lean();
        socket.emit("polls-sync", activePolls);

        // Broadcast new user joined to existing approved participants
        socket.to(roomKey).emit("user-joined", {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          isHost: socket.isHost,
          cameraOn: true,
          micOn: !meeting.mute_on_join
        });

      } catch (err: any) {
        console.error("[Socket join-meeting Error]", err);
        socket.emit("join-error", "Failed to join meeting room.");
      }
    });

    // ----------------------------------------------------
    // 3. WAITING ROOM ADMISSION / REJECTION (HOST ONLY)
    // ----------------------------------------------------
    socket.on("admit-guest", async ({ guestSocketId }: { guestSocketId: string }) => {
      if (!socket.isHost || !socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      const room = activeRooms[roomKey];
      if (!room || !room.participants[guestSocketId]) return;

      const guest = room.participants[guestSocketId];
      guest.isApproved = true;

      const guestSocket = io.sockets.sockets.get(guestSocketId) as AuthenticatedSocket;
      if (guestSocket) {
        guestSocket.join(roomKey);
        guestSocket.isApproved = true;
        guestSocket.emit("waiting-room-status", "admitted");

        // Send state to guest
        const peersList = Object.values(room.participants)
          .filter(p => p.socketId !== guestSocketId && p.isApproved)
          .map(p => ({
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            isHost: p.isHost
          }));

        guestSocket.emit("current-peers", peersList);
        guestSocket.emit("whiteboard-history", room.whiteboardData);
        guestSocket.emit("notes-updated", { content: room.sharedNotes, version: room.notesVersion });

        // Broadcast to existing room
        socket.to(roomKey).emit("user-joined", {
          socketId: guest.socketId,
          userId: guest.userId,
          userName: guest.userName,
          isHost: false
        });
      }
    });

    socket.on("reject-guest", ({ guestSocketId }: { guestSocketId: string }) => {
      if (!socket.isHost || !socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      const room = activeRooms[roomKey];
      if (room && room.participants[guestSocketId]) {
        delete room.participants[guestSocketId];
        io.to(guestSocketId).emit("waiting-room-status", "rejected");
      }
    });

    // ----------------------------------------------------
    // 4. WEBRTC SIGNALING (AUTHENTICATED PEER RELAY)
    // ----------------------------------------------------
    socket.on("offer", ({ targetSocketId, offer }: { targetSocketId: string; offer: any }) => {
      if (!socket.meetingId) return;
      io.to(targetSocketId).emit("offer", {
        callerSocketId: socket.id,
        offer,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on("answer", ({ targetSocketId, answer }: { targetSocketId: string; answer: any }) => {
      if (!socket.meetingId) return;
      io.to(targetSocketId).emit("answer", {
        responderSocketId: socket.id,
        answer
      });
    });

    socket.on("ice-candidate", ({ targetSocketId, candidate }: { targetSocketId: string; candidate: any }) => {
      if (!socket.meetingId) return;
      io.to(targetSocketId).emit("ice-candidate", {
        senderSocketId: socket.id,
        candidate
      });
    });

    // ----------------------------------------------------
    // 5. CHAT MESSAGING (PERSISTENT & SERVER-IDENTIFIED)
    // ----------------------------------------------------
    socket.on("chat-message", async (data: { message: string; isPrivate?: boolean; recipientId?: number }) => {
      try {
        if (!socket.meetingId || !socket.userId) return;
        const roomKey = String(socket.meetingId);
        const room = activeRooms[roomKey];

        if (!room || !room.allowChat) {
          socket.emit("chat-error", "Chat is currently disabled by host.");
          return;
        }

        const cleanMsg = String(data.message || "").trim();
        if (!cleanMsg) return;

        const now = new Date();

        // Persist to MongoDB
        const chatDoc = await MeetingChatMessage.create({
          meeting_id: socket.meetingId,
          tenant_id: socket.tenantId ? new mongoose.Types.ObjectId(socket.tenantId) : undefined,
          user_id: socket.userId,
          sender_user_id: socket.userId,
          sender_tenant_id: socket.tenantId ? new mongoose.Types.ObjectId(socket.tenantId) : undefined,
          message: cleanMsg,
          is_private: Boolean(data.isPrivate),
          recipient_id: data.recipientId,
          created_at: now
        });

        const broadcastPayload = {
          id: chatDoc._id.toString(),
          meeting_id: socket.meetingId,
          sender_user_id: socket.userId,
          sender_name: socket.userName,
          message: cleanMsg,
          is_private: Boolean(data.isPrivate),
          recipient_id: data.recipientId,
          created_at: now.toISOString()
        };

        if (data.isPrivate && data.recipientId) {
          // Send only to specific recipient socket(s) and sender
          const targetSockets = Object.values(room.participants)
            .filter(p => p.userId === data.recipientId)
            .map(p => p.socketId);

          targetSockets.forEach(sId => io.to(sId).emit("chat-message", broadcastPayload));
          socket.emit("chat-message", broadcastPayload);
        } else {
          io.to(roomKey).emit("chat-message", broadcastPayload);
        }
      } catch (chatErr) {
        console.error("[Chat Error]", chatErr);
      }
    });

    // ----------------------------------------------------
    // 6. REALTIME WHITEBOARD (PERSISTENT STROKES)
    // ----------------------------------------------------
    socket.on("whiteboard-stroke", (strokeData: any) => {
      if (!socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      const room = activeRooms[roomKey];
      if (!room) return;

      room.whiteboardData.push(strokeData);
      socket.to(roomKey).emit("whiteboard-stroke", strokeData);
    });

    socket.on("whiteboard-clear", () => {
      if (!socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      const room = activeRooms[roomKey];
      if (!room) return;

      if (!socket.isHost) {
        socket.emit("error-message", "Only the host can clear the whiteboard.");
        return;
      }

      room.whiteboardData = [];
      io.to(roomKey).emit("whiteboard-clear");
    });

    // ----------------------------------------------------
    // 7. COLLABORATIVE NOTES (VERSION-CONTROLLED MONGODB)
    // ----------------------------------------------------
    socket.on("notes-edit", async (data: { content: string; version?: number }) => {
      try {
        if (!socket.meetingId || !socket.userId) return;
        const roomKey = String(socket.meetingId);
        const room = activeRooms[roomKey];
        if (!room) return;

        const newContent = String(data.content || "");
        room.sharedNotes = newContent;
        room.notesVersion += 1;

        // Persist to MongoDB with version control
        await MeetingNotes.findOneAndUpdate(
          { meeting_id: socket.meetingId },
          {
            $set: {
              content: newContent,
              notes_version: room.notesVersion,
              last_updated_by: socket.userId,
              updated_at: new Date()
            }
          },
          { upsert: true, new: true }
        );

        socket.to(roomKey).emit("notes-updated", {
          content: room.sharedNotes,
          version: room.notesVersion,
          last_updated_by: socket.userName
        });
      } catch (err) {
        console.error("[Notes Sync Error]", err);
      }
    });

    // ----------------------------------------------------
    // 8. POLLS & VOTING (STRICT MONGODB PERSISTENCE)
    // ----------------------------------------------------
    socket.on("poll-create", async (data: { question: string; options: string[]; allowMultiple?: boolean }) => {
      try {
        if (!socket.meetingId || !socket.userId) return;
        if (!socket.isHost) {
          socket.emit("error-message", "Only meeting host can create polls.");
          return;
        }

        const cleanQuestion = String(data.question || "").trim();
        const cleanOptions = Array.isArray(data.options) ? data.options.map(o => String(o).trim()).filter(Boolean) : [];

        if (!cleanQuestion || cleanOptions.length < 2) {
          socket.emit("error-message", "Poll requires a question and at least 2 options.");
          return;
        }

        const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const pollDoc = await MeetingPoll.create({
          meeting_id: socket.meetingId,
          poll_id: pollId,
          question: cleanQuestion,
          options: cleanOptions,
          votes: {},
          allow_multiple: Boolean(data.allowMultiple),
          is_active: true,
          created_by: socket.userId,
          created_at: new Date(),
          updated_at: new Date()
        });

        const roomKey = String(socket.meetingId);
        io.to(roomKey).emit("poll-created", pollDoc);
      } catch (pollErr) {
        console.error("[Poll Create Error]", pollErr);
      }
    });

    socket.on("poll-vote", async (data: { pollId: string; optionIndex: number | number[] }) => {
      try {
        if (!socket.meetingId || !socket.userId) return;
        const { pollId, optionIndex } = data;

        const poll = await MeetingPoll.findOne({ meeting_id: socket.meetingId, poll_id: pollId, is_active: true });
        if (!poll) {
          socket.emit("error-message", "Poll not found or is closed.");
          return;
        }

        const optionsToVote = Array.isArray(optionIndex) ? optionIndex : [Number(optionIndex)];
        
        // Prevent duplicate votes: check MeetingPollVote
        const existingVote = await MeetingPollVote.findOne({
          meeting_id: socket.meetingId,
          poll_id: pollId,
          user_id: socket.userId
        });

        if (existingVote) {
          socket.emit("error-message", "You have already voted in this poll.");
          return;
        }

        await MeetingPollVote.create({
          meeting_id: socket.meetingId,
          poll_id: pollId,
          user_id: socket.userId,
          tenant_id: socket.tenantId ? new mongoose.Types.ObjectId(socket.tenantId) : undefined,
          selected_options: optionsToVote,
          voted_at: new Date()
        });

        // Update vote map on poll
        if (!poll.votes) poll.votes = {};
        for (const idx of optionsToVote) {
          const key = String(idx);
          if (!poll.votes[key]) poll.votes[key] = [];
          if (!poll.votes[key].includes(socket.userId)) {
            poll.votes[key].push(socket.userId);
          }
        }
        poll.markModified("votes");
        poll.updated_at = new Date();
        await poll.save();

        const roomKey = String(socket.meetingId);
        io.to(roomKey).emit("poll-vote-updated", {
          pollId: poll.poll_id,
          votes: poll.votes
        });
      } catch (voteErr) {
        console.error("[Poll Vote Error]", voteErr);
      }
    });

    // ----------------------------------------------------
    // 9. REACTIONS & LIVE CAPTIONS
    // ----------------------------------------------------
    socket.on("send-reaction", (data: { reaction: string }) => {
      if (!socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      io.to(roomKey).emit("reaction-received", {
        id: `rxn_${Date.now()}`,
        userId: socket.userId,
        userName: socket.userName,
        reaction: data.reaction
      });
    });

    socket.on("caption-speak", (data: { text: string }) => {
      if (!socket.meetingId) return;
      const roomKey = String(socket.meetingId);
      socket.to(roomKey).emit("caption-received", {
        id: `cap_${Date.now()}`,
        userId: socket.userId,
        userName: socket.userName,
        text: data.text
      });
    });

    // ----------------------------------------------------
    // 10. HOST MEETING CONTROLS
    // ----------------------------------------------------
    socket.on("host-control", async (data: { action: string; targetSocketId?: string; payload?: any }) => {
      if (!socket.isHost || !socket.meetingId) {
        socket.emit("error-message", "Unauthorized: Host privileges required.");
        return;
      }

      const roomKey = String(socket.meetingId);
      const room = activeRooms[roomKey];
      if (!room) return;

      switch (data.action) {
        case "lock":
          room.isLocked = true;
          io.to(roomKey).emit("meeting-controls-sync", { isLocked: true });
          break;
        case "unlock":
          room.isLocked = false;
          io.to(roomKey).emit("meeting-controls-sync", { isLocked: false });
          break;
        case "mute-all":
          socket.to(roomKey).emit("force-mute");
          break;
        case "mute-user":
          if (data.targetSocketId) {
            io.to(data.targetSocketId).emit("force-mute");
          }
          break;
        case "kick":
          if (data.targetSocketId) {
            const targetSocket = io.sockets.sockets.get(data.targetSocketId);
            if (targetSocket) {
              targetSocket.emit("kicked-from-meeting");
              targetSocket.leave(roomKey);
              delete room.participants[data.targetSocketId];
              socket.to(roomKey).emit("user-left", { socketId: data.targetSocketId });
            }
          }
          break;
        case "end-meeting":
          const now = new Date();
          await Meeting.updateOne(
            { meeting_id: socket.meetingId },
            { $set: { status: 'COMPLETED', actual_end_time: now, updated_at: now } }
          );

          // Calculate durations for all active participants
          const participants = await MeetingParticipant.find({ meeting_id: socket.meetingId, leave_time: { $exists: false } });
          for (const p of participants) {
            const joinMs = p.join_time ? p.join_time.getTime() : now.getTime();
            p.leave_time = now;
            p.duration_seconds = Math.max(0, Math.round((now.getTime() - joinMs) / 1000));
            await p.save();
          }

          io.to(roomKey).emit("meeting-ended");
          delete activeRooms[roomKey];
          break;
      }
    });

    // ----------------------------------------------------
    // 11. PARTICIPANT LEAVE & DISCONNECT
    // ----------------------------------------------------
    const handleParticipantLeave = async () => {
      try {
        if (!socket.meetingId || !socket.userId) return;
        const roomKey = String(socket.meetingId);
        const room = activeRooms[roomKey];

        if (room && room.participants[socket.id]) {
          delete room.participants[socket.id];
          socket.to(roomKey).emit("user-left", { socketId: socket.id, userId: socket.userId });
        }

        // Calculate and persist leave time & duration
        const now = new Date();
        const participant = await MeetingParticipant.findOne({
          meeting_id: socket.meetingId,
          user_id: socket.userId
        }).sort({ join_time: -1 });

        if (participant && participant.join_time) {
          participant.leave_time = now;
          participant.duration_seconds = Math.max(0, Math.round((now.getTime() - participant.join_time.getTime()) / 1000));
          participant.updated_at = now;
          await participant.save();
        }

        socket.leave(roomKey);
      } catch (err) {
        console.error("[Leave Error]", err);
      }
    };

    socket.on("leave-meeting", handleParticipantLeave);
    socket.on("disconnect", handleParticipantLeave);
  });
};
