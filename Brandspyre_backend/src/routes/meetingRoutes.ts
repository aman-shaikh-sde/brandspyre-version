import express from "express";
import MeetingController from "../controllers/meetings/meetingController";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { uploadRecordings } from "../middleware/uploadRecordings";
import { upload } from "../middleware/upload";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Apply tenant authentication middleware to all routes
router.use(tenantAuth());

// ----------------------------------------------------
// 1. STATIC ROUTES (MUST PRECEED /:meeting_id)
// ----------------------------------------------------
// Canonical Calendar Single Source of Truth Endpoint
router.get("/calendar", MeetingController.getCalendar);

// Recordings list
router.get("/recordings", MeetingController.getMeetingRecordings);

// List & Create
router.get("/", MeetingController.getMeetings);
router.get("/list", MeetingController.getMeetings);
router.get("/meetings", MeetingController.getMeetings);

router.post("/", MeetingController.createMeeting);
router.post("/create", MeetingController.createMeeting);
router.post("/instant", MeetingController.createInstantMeeting);
router.post("/meetings", MeetingController.createMeeting);

// ----------------------------------------------------
// 2. PARAMETERIZED MEETING ENDPOINTS
// ----------------------------------------------------
router.get("/:meeting_id", MeetingController.getMeetingById);
router.get("/meetings/:meeting_id", MeetingController.getMeetingById);

router.put("/:meeting_id", MeetingController.updateMeeting);
router.delete("/:meeting_id", MeetingController.deleteMeeting);
router.post("/:meeting_id/cancel", MeetingController.cancelMeeting);

// Lifecycle Operations
router.post("/:meeting_id/join", MeetingController.joinMeeting);
router.post("/meetings/:meeting_id/join", MeetingController.joinMeeting);

router.post("/:meeting_id/leave", MeetingController.leaveMeeting);
router.post("/meetings/:meeting_id/leave", MeetingController.leaveMeeting);

router.post("/:meeting_id/end", MeetingController.endMeeting);
router.post("/meetings/:meeting_id/end", MeetingController.endMeeting);

// Invitations & Membership
router.post("/:meeting_id/invite", MeetingController.inviteParticipant);
router.post("/meetings/:meeting_id/invite", MeetingController.inviteParticipant);

router.post("/:meeting_id/respond", MeetingController.respondInvitation);
router.post("/meetings/:meeting_id/respond", MeetingController.respondInvitation);

// Post-Meeting Outcomes
router.post("/:meeting_id/outcome", MeetingController.recordMeetingOutcome);
router.post("/meetings/:meeting_id/outcome", MeetingController.recordMeetingOutcome);

// Notes (Version Controlled)
router.get("/:meeting_id/notes", MeetingController.getMeetingNotes);
router.get("/meetings/:meeting_id/notes", MeetingController.getMeetingNotes);
router.put("/:meeting_id/notes", MeetingController.updateMeetingNotes);
router.put("/meetings/:meeting_id/notes", MeetingController.updateMeetingNotes);

// Documents
router.get("/:meeting_id/documents", MeetingController.getMeetingDocuments);
router.get("/meetings/:meeting_id/documents", MeetingController.getMeetingDocuments);
router.post("/:meeting_id/documents", upload.single("file"), MeetingController.uploadMeetingDocument);
router.post("/meetings/:meeting_id/documents", upload.single("file"), MeetingController.uploadMeetingDocument);

// Polls
router.get("/:meeting_id/polls", MeetingController.getMeetingPolls);
router.get("/meetings/:meeting_id/polls", MeetingController.getMeetingPolls);
router.post("/:meeting_id/polls", MeetingController.createMeetingPoll);
router.post("/meetings/:meeting_id/polls", MeetingController.createMeetingPoll);

// Recordings for specific meeting
router.get("/:meeting_id/recordings", MeetingController.getMeetingRecordings);
router.get("/meetings/:meeting_id/recordings", MeetingController.getMeetingRecordings);
router.post("/:meeting_id/recordings", uploadRecordings.single("file"), MeetingController.uploadMeetingRecording);
router.post("/meetings/:meeting_id/recordings", uploadRecordings.single("file"), MeetingController.uploadMeetingRecording);

export default router;
