import mongoose from 'mongoose';
import { TaskParticipant, Task, Milestone, Project, ClientModel, ProjectMeeting, CustomTarget, CommunicationParticipant, MeetingReminder } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Sequence } from "../../../db/ModelSceham/sequenceSchema";
import { Meeting, MeetingParticipant } from "../../../db/ModelSceham/meetingSchema";
import { Request, Response } from "express";
import path from "path";
import fs from 'fs';
import { getTargetFolder, deleteUploadedFiles } from '../../../controllers/uploads/uploads';
import nodemailer from "nodemailer";

interface AuthenticatedUser {
  userId: number;
  userRole?: string;
  brcode?: string;
}

interface DocEntry {
  url?: string;
  type?: string;
}

interface CustomTargetInput {
  target_id?: string;
  type?: string;
}

interface ParticipantInput {
  person_id?: string;
  role?: string;
  isdocvisible?: boolean;
}

interface DataItem {
  branchcode: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  task_participants?: number;
  title: string;
  notes?: string;
  comm_type: "followup" | "meeting" | "doc";
  status: "active" | "completed" | "declined";
  doc_status?: "archived" | "verified-closed" | "rework" | "none";
  meet_link?: string;
  start_date_time?: string;
  end_date_time?: string;
  category: "all" | "branch" | "role" | "team" | "staff" | "client" | "custom";
  field:
    | "project"
    | "milestone"
    | "task"
    | "task_participants"
    | "meetingdoc"
    | "team"
    | "client"
    | "staff"
    | "branch"
    | "campaign"
    | "lead"
    | "general"
    | "custom";
  custom?: CustomTargetInput[];
  communication_participants?: ParticipantInput[];
  [key: string]: any;
}

const getNextMeetingId = async (session: mongoose.ClientSession): Promise<number> => {
  const seqVal = await Sequence.findOneAndUpdate(
    { name: 'meeting_id_seq' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );
  return seqVal.value;
};

const getNextMeetId = async (session: mongoose.ClientSession): Promise<number> => {
  const seqVal = await Sequence.findOneAndUpdate(
    { name: 'meet_id_seq' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );
  return seqVal.value;
};

export const createMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Meeting/Document Communication`;
  const { userId: createdby } = req.user as AuthenticatedUser;

  const smtpHost = process.env.SMTP_HOST || 'smtp.zoho.in';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? {
      user: smtpUser,
      pass: smtpPass,
    } : undefined,
  });

  let documents: DataItem[];

  try {
    if (req.is("multipart/form-data")) {
      documents = JSON.parse(req?.body?.data);
    } else {
      documents = Array.isArray(req?.body?.data) ? req?.body?.data : JSON.parse(req?.body?.data);
    }
  } catch {
    res.status(400).json({ error: "Invalid JSON in data field." });
    return;
  }

  let files: Express.Multer.File[] = [];
  if (req.file) {
    files = [req.file];
  } else if (Array.isArray(req.files)) {
    files = req.files;
  } else if (req.files && typeof req.files === "object") {
    files = Object.values(req.files).flat() as Express.Multer.File[];
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    res.status(400).json({ error: "Documents must be a non-empty array." });
    return;
  }

  const session = await mongoose.startSession();
  const created: any[] = [];
  const failed: any[] = [];
  const uploadedFilePaths = files.map((file) => path.resolve(file.path));

  try {
    session.startTransaction();

    for (const rawItem of documents) {
      try {
        const { custom, communication_participants, doc: existingDocs, ...meetingData } = rawItem;

        // Build doc array from uploaded files
        if (files.length > 0) {
          const docArray: DocEntry[] = files.map((file) => {
            const ext = path.extname(file.originalname).substring(1);
            return {
              url: `${file.filename}`,
              type: ext
            };
          });

          try {
            const parsedExistingDocs = Array.isArray(existingDocs)
              ? existingDocs
              : (typeof existingDocs === "string" && existingDocs.trim().startsWith("["))
              ? JSON.parse(existingDocs)
              : [];

            meetingData.doc = [...parsedExistingDocs, ...docArray];
          } catch {
            meetingData.doc = [...docArray];
          }
        }

        // Metadata resolution
        let meta: any = {};
        if (meetingData.task_participants) {
          meta = await TaskParticipant.findOne({ participants_id: meetingData.task_participants }).session(session).lean() || {};
        } else if (meetingData.task_id) {
          meta = await Task.findOne({ id: meetingData.task_id }).session(session).lean() || {};
        } else if (meetingData.milestone_code) {
          meta = await Milestone.findOne({ milestone_code: meetingData.milestone_code }).session(session).lean() || {};
        } else if (meetingData.project_code) {
          meta = await Project.findOne({ project_code: meetingData.project_code }).session(session).lean() || {};
        } else if (meetingData.client_code) {
          meta = await ClientModel.findOne({ client_code: meetingData.client_code }).session(session).lean() || {};
        } else if (meetingData.campaign_code) {
          meta = await ClientModel.findOne({ campaign_code: meetingData.campaign_code }).session(session).lean() || {};
        }

        meetingData.branchcode = meta.branchcode || meetingData.branchcode || null;
        meetingData.client_code = meta.client_code || meetingData.client_code || null;
        meetingData.campaign_code = meta.campaign_code || meetingData.campaign_code || null;
        meetingData.project_code = meta.project_code || meetingData.project_code || null;
        meetingData.milestone_code = meta.milestone_code || meetingData.milestone_code || null;
        meetingData.task_id = meta.task_id || meetingData.task_id || null;
        meetingData.participants_id = meta.participants_id || meetingData.task_participants || null;
        meetingData.createdby = createdby;

        const meet_id = meetingData.comm_type === "meeting"
          ? await getNextMeetingId(session)
          : await getNextMeetId(session);
        meetingData.meet_id = meet_id;

        if (meetingData.comm_type === "meeting") {
          const customMeetLink = rawItem.meet_link;
          meetingData.meet_link = (customMeetLink && (customMeetLink.startsWith("http://") || customMeetLink.startsWith("https://")))
            ? customMeetLink
            : `/meetings/room/${meet_id}`;
          
          const hostUser = await UserInfo.findOne({ staff_id: createdby }).session(session).lean() as any;
          const hostPsn = hostUser?.psn || 1;

          const rawTenantId = rawItem.tenant_id ? Number(rawItem.tenant_id) : 1;
          const tenantIdVal = isNaN(rawTenantId) ? 1 : rawTenantId;

          await Meeting.create([{
            meeting_id: meet_id,
            tenant_id: tenantIdVal,
            title: meetingData.title,
            description: meetingData.notes || '',
            meeting_type: 'video',
            scheduled_start_time: meetingData.start_date_time ? new Date(meetingData.start_date_time) : new Date(),
            scheduled_end_time: meetingData.end_date_time ? new Date(meetingData.end_date_time) : undefined,
            host_user_id: hostPsn,
            meeting_link: meetingData.meet_link,
            meeting_password: Math.random().toString(36).substring(2, 8).toUpperCase(),
            max_participants: 50,
            created_by: hostPsn
          }], { session });

          // Register host as a meeting participant
          await MeetingParticipant.create([{
            meeting_id: meet_id,
            user_id: hostPsn,
            is_host: true,
          }], { session });

          // Register other staff participants
          if (Array.isArray(communication_participants)) {
            for (const p of communication_participants) {
              if (p.role !== "client") {
                const staffDoc = await UserInfo.findOne({ staff_id: p.person_id }).session(session).lean() as any;
                const staffPsn = staffDoc?.psn;
                if (staffPsn) {
                  await MeetingParticipant.create([{
                    meeting_id: meet_id,
                    user_id: staffPsn,
                    is_host: false,
                  }], { session });
                }
              }
            }
          }
        }

        const [mongooseCreated] = await ProjectMeeting.create([meetingData], { session });
        const createdMeetingObj = mongooseCreated.toObject() as any;

        if (Array.isArray(custom)) {
          for (const t of custom) {
            await CustomTarget.create([{
              branchcode: meetingData.branchcode,
              campaign_code: meetingData.campaign_code,
              client_code: meetingData.client_code,
              project_code: meetingData.project_code,
              milestone_code: meetingData.milestone_code,
              task_id: meetingData.task_id,
              participants_id: meetingData.participants_id,
              meet_id,
              type: t.type,
              target_id: t.target_id,
            }], { session });
          }
        }

        if (Array.isArray(communication_participants)) {
          for (const p of communication_participants) {
            await CommunicationParticipant.create([{
              branchcode: meetingData.branchcode,
              campaign_code: meetingData.campaign_code,
              client_code: meetingData.client_code,
              project_code: meetingData.project_code,
              milestone_code: meetingData.milestone_code,
              task_id: meetingData.task_id,
              task_participants: meetingData.participants_id,
              meet_id,
              person_id: p.person_id,
              role: p.role,
              isdocvisible: !!p.isdocvisible
            }], { session });
          }
        }

        const enrichedMeeting = {
          ...createdMeetingObj,
          id: createdMeetingObj._id.toString(),
          meet_id,
          meet_id_link: meetingData.meet_link,
          start_datet: meetingData.start_date_time,
          end_datet: meetingData.end_date_time,
          titl: meetingData.title,
          communication_participants
        };
        created.push(enrichedMeeting);

        // Send email to participants
        const participantEmails: string[] = [];
        if (Array.isArray(communication_participants)) {
          for (const p of communication_participants) {
            let email: string | null = null;
            if (p.role === "client") {
              const clientDoc = await ClientModel.findOne({ client_code: p.person_id }).session(session).lean() as any;
              email = clientDoc?.email || null;
            } else {
              const staffDoc = await UserInfo.findOne({ staff_id: p.person_id }).session(session).lean() as any;
              email = staffDoc?.email || null;
            }
            if (email && !participantEmails.includes(email)) {
              participantEmails.push(email);
            }
          }
        }

        const attachments = Array.isArray(meetingData.doc)
          ? meetingData.doc.map((d: DocEntry) => ({
              filename: d.url,
              path: path.resolve(`uploads/documents/${d.url}`),
            }))
          : [];

        if (participantEmails.length > 0) {
          try {
            const fromName = process.env.SMTP_FROM_NAME || 'Brandspyre CRM';
            const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@brandspyre.in';
            await transporter.sendMail({
              from: `"${fromName}" <${fromEmail}>`,
              to: participantEmails.join(", "),
              subject: `${meetingData.title}`,
              html: `
                <p>Dear Participant,</p>
                <p>A new meeting has been scheduled:</p>
                <ul>
                  <li><b>Meeting ID:</b> ${meet_id}</li>
                  <li><b>Start Time:</b> ${meetingData.start_date_time}</li>
                  <li><b>End Time:</b> ${meetingData.end_date_time}</li>
                  <li><b>Meeting Invite:</b> <a href="${meetingData.meet_link}">${meetingData.meet_link}</a></li>
                </ul>
                <p>Please check your dashboard for more details.</p>
              `,
              attachments,
            });
          } catch (err) {
            console.error("Failed to send email:", err);
          }
        }

      } catch (err) {
        failed.push({ entry: rawItem, error: (err as Error).message });
      }
    }

    await session.commitTransaction();
    res.status(201).json({
      message: `${msgField} completed`,
      data: { successCount: created.length, failedCount: failed.length, created, failed }
    });
  } catch (error) {
    await session.abortTransaction();
    deleteUploadedFiles(uploadedFilePaths);
    res.status(500).json({ error: `${msgField} failed: ${(error as Error).message}` });
  } finally {
    session.endSession();
  }
};

export const addCustomTargets = async (req: Request, res: Response): Promise<void> => {
  const { meet_id, custom = [] } = req.body;
  const { brcode } = req.user as AuthenticatedUser;

  if (!meet_id || !Array.isArray(custom) || custom.length === 0) {
    res.status(400).json({ error: "meet_id and custom targets are required." });
    return;
  }

  const session = await mongoose.startSession();
  try {
    const meeting = await ProjectMeeting.findOne({ meet_id }).session(session).lean() as any;
    if (!meeting) {
      res.status(404).json({ error: `Meeting with meet_id ${meet_id} not found.` });
      return;
    }

    const { campaign_code, client_code, project_code, milestone_code, task_id, participants_id } = meeting;

    session.startTransaction();

    for (const item of custom) {
      const { target_id, type } = item;
      if (!target_id || !type) continue;

      const exists = await CustomTarget.findOne({ meet_id, type, target_id }).session(session).lean();
      if (exists) continue;

      await CustomTarget.create([{
        branchcode: brcode,
        campaign_code,
        client_code,
        project_code,
        milestone_code,
        task_id,
        participants_id,
        meet_id,
        type,
        target_id,
      }], { session });
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Custom targets added successfully." });
  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Add custom targets failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const addParticipantsUsingMeetingInfo = async (req: Request, res: Response): Promise<void> => {
  const { meet_id, participants = [] } = req.body;

  if (!meet_id || !Array.isArray(participants) || participants.length === 0) {
    res.status(400).json({ error: "meet_id and participants are required." });
    return;
  }

  const session = await mongoose.startSession();
  try {
    const meeting = await ProjectMeeting.findOne({ meet_id }).session(session).lean() as any;
    if (!meeting) {
      res.status(404).json({ error: `Meeting with meet_id ${meet_id} not found.` });
      return;
    }

    session.startTransaction();

    for (const p of participants as ParticipantInput[]) {
      const { person_id, role, isdocvisible = false } = p;

      const exists = await CommunicationParticipant.findOne({ meet_id, role, person_id }).session(session).lean();
      if (exists) continue;

      await CommunicationParticipant.create([{
        branchcode: meeting.branchcode,
        campaign_code: meeting.campaign_code,
        client_code: meeting.client_code,
        project_code: meeting.project_code,
        milestone_code: meeting.milestone_code,
        task_id: meeting.task_id,
        task_participants: meeting.participants_id,
        meet_id,
        person_id,
        role,
        isdocvisible,
        status: 'pending',
      }], { session });
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Participants added successfully (duplicates ignored)." });
  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Add participants failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const addMeetingReminderInfo = async (req: Request, res: Response): Promise<void> => {
  const {
    meet_id, title, description, repeat_type,
    repeat_days, start_time, start_date, end_date, active
  } = req.body;

  const session = await mongoose.startSession();

  try {
    const meeting = await ProjectMeeting.findOne({ meet_id }).session(session).lean() as any;
    if (!meeting) {
      res.status(404).json({ error: `Meeting with meet_id ${meet_id} not found.` });
      return;
    }

    session.startTransaction();

    await MeetingReminder.create([{
      meet_id,
      title: title || meeting.title,
      description: description || meeting.notes,
      repeat_type,
      repeat_days,
      start_time,
      start_date,
      end_date,
      active,
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ message: "Meeting reminder added successfully." });

  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Add Meeting Reminder failed: ${message}` });
  } finally {
    session.endSession();
  }
};