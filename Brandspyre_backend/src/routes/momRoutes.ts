import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
// import {upload} from '../controllers/uploads/uploads'
import fs from "fs";
import path from "path";

import { secureDocumentUpload } from "../middleware/secureUpload";
// // Documents MANAGMENTS
import { viewMeetingOrDoc , viewParticipants, viewcustomTarget, viewMeetReminder} from "../controllers/project/Project4Documents/view";
import {createMeetingOrDoc, addParticipantsUsingMeetingInfo, addCustomTargets, addMeetingReminderInfo} from "../controllers/project/Project4Documents/create"
import {editMeetingOrDoc, editParticipant, editMeetingReminderInfo} from "../controllers/project/Project4Documents/edit"
import {deleteMeetingOrDoc, removeParticipant, removeCustomTarget, deleteMeetingReminderInfo} from "../controllers/project/Project4Documents/delete"


import { viewMeetingsWithParticipants} from "../controllers/project/Project4Documents/meetingData";

import { getMeetingById} from "../controllers/project/Project4Documents/meetingById";

const router = express.Router();



export const uploadss = secureDocumentUpload;
enum RoutePath {
  mom = "mom",
  doc_meet = "doc_meet",
  participant = "participant",
  target = "target",
  reminder = "reminder"
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}
// MOM MANAGMENT'S

router.post("/uploadedit/documents", authMiddleware, tenantAuth(), secureDocumentUpload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded or file type rejected." });
    return;
  }

  res.json({
    url: `/uploads/documents/${req.file.filename}`,
    type: req.file.mimetype,
  });
});


// example Route: /users/read,/users/read/:id 
 // Meets Docs Managments
router.get(`/${RoutePath.doc_meet}/${RouteAction.View}`,authMiddleware, tenantAuth(),  viewMeetingOrDoc);
router.post(`/${RoutePath.doc_meet}/${RouteAction.Create}`,authMiddleware, tenantAuth(),  uploadss.array("URL"),  createMeetingOrDoc); //upload.array("files", 10),
router.put(`/${RoutePath.doc_meet}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editMeetingOrDoc);
router.delete(`/${RoutePath.doc_meet}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteMeetingOrDoc);

// communication_participants Managment

router.get(`/${RoutePath.doc_meet}/${RoutePath.participant}/${RouteAction.View}`,authMiddleware, tenantAuth(),  viewParticipants);
router.post(`/${RoutePath.doc_meet}/${RoutePath.participant}/${RouteAction.Create}`,authMiddleware, tenantAuth(),   addParticipantsUsingMeetingInfo); //upload.array("files", 10),
router.put(`/${RoutePath.doc_meet}/${RoutePath.participant}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editParticipant);
router.delete(`/${RoutePath.doc_meet}/${RoutePath.participant}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), removeParticipant);

// custom_targets Managments 
router.get(`/${RoutePath.doc_meet}/${RoutePath.target}/${RouteAction.View}`,authMiddleware, tenantAuth(),  viewcustomTarget);
router.post(`/${RoutePath.doc_meet}/${RoutePath.target}/${RouteAction.Create}`,authMiddleware, tenantAuth(),   addCustomTargets); // upload.array("files", 10),
router.delete(`/${RoutePath.doc_meet}/${RoutePath.target}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), removeCustomTarget);

// Reminder
// router.get(`/${RoutePath.doc_meet}/${RoutePath.reminder}/${RouteAction.View}`,authMiddleware,  viewcustomTarget);
router.post(`/${RoutePath.doc_meet}/${RoutePath.reminder}/${RouteAction.Create}`,authMiddleware, tenantAuth(),   addMeetingReminderInfo);
router.put(`/${RoutePath.doc_meet}/${RoutePath.reminder}/${RouteAction.Edit}`,authMiddleware, tenantAuth(), editMeetingReminderInfo);
router.delete(`/${RoutePath.doc_meet}/${RoutePath.reminder}/${RouteAction.Delete}`,authMiddleware, tenantAuth(), deleteMeetingReminderInfo);

router.get(`/getmeetingdetails`,authMiddleware, tenantAuth(), viewMeetingsWithParticipants);

router.get(`/getmeetingbyid`,authMiddleware, tenantAuth(), getMeetingById);


export default router;