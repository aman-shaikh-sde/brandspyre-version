import { Request, Response } from "express";
import { ProjectMeeting, CommunicationParticipant, ClientModel, MeetingReminder } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface Doc {
  url: string;
  type: string;
  name?: string;
}

interface EditDocInput {
  index: number;
  doc: Doc;
}

interface Participant {
  person_id: string;
  role: string;
  email?: string;
}

function resolveFilePath(docUrl: string) {
  const cleanUrl = docUrl.replace(/^[/\\]+/, "");
  if (path.isAbsolute(cleanUrl)) return cleanUrl;
  if (cleanUrl.startsWith("uploads/documents")) return path.join(process.cwd(), cleanUrl);
  return path.join(process.cwd(), "uploads", "documents", cleanUrl);
}

export const editMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Meeting/Document Communication`;
  const { userId: idObj } = req.user as AuthenticatedUser;

  const {
    meet_id, title, notes, meet_link,
    start_date_time, end_date_time, status, doc_status, field,
    add_docs = [], remove_indexes = [], edit_docs = [],
  } = req.body;

  try {
    if (!meet_id) {
      res.status(400).json({ error: "Missing 'meet_id' in request body." });
      return;
    }

    const meeting = await ProjectMeeting.findOne({ meet_id }).lean() as any;
    if (!meeting) {
      res.status(404).json({ error: `Meeting with id ${meet_id} not found.` });
      return;
    }

    let currentDocs: any[] = meeting.doc || [];

    if (Array.isArray(remove_indexes) && remove_indexes.length > 0) {
      currentDocs = currentDocs.filter((_: any, index: number) => !remove_indexes.includes(index));
    }
    if (Array.isArray(edit_docs) && edit_docs.length > 0) {
      for (const { index, doc } of edit_docs as EditDocInput[]) {
        if (index >= 0 && index < currentDocs.length) {
          currentDocs[index] = doc;
        }
      }
    }
    if (Array.isArray(add_docs) && add_docs.length > 0) {
      currentDocs.push(...add_docs);
    }

    const updateData: any = { doc: currentDocs, updated_on: new Date() };
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (meet_link !== undefined) updateData.meet_link = meet_link;
    if (start_date_time !== undefined) updateData.start_date_time = start_date_time;
    if (end_date_time !== undefined) updateData.end_date_time = end_date_time;
    if (field !== undefined) updateData.field = field;
    if (status !== undefined) updateData.status = status;
    if (doc_status !== undefined) updateData.doc_status = doc_status;

    const updated = await ProjectMeeting.findOneAndUpdate(
      { meet_id },
      { $set: updateData },
      { new: true }
    ).lean() as any;

    // Get participants and resolve emails
    const participantDocs = await CommunicationParticipant.find({ meet_id }).lean() as any[];
    const participants: Participant[] = [];

    for (const cp of participantDocs) {
      const participant: Participant = { person_id: cp.person_id, role: cp.role };
      if (cp.role === "client") {
        const client = await ClientModel.findOne({ client_code: cp.person_id }).lean() as any;
        participant.email = client?.email || null;
      } else if (cp.role === "staff") {
        const staff = await UserInfo.findOne({ staff_id: cp.person_id }).lean() as any;
        participant.email = staff?.email || null;
      }
      participants.push(participant);
    }

    // Prepare email content
    let subject = "Meeting Update";
    let body = "";

    if (status === "completed") {
      subject = "Meeting Completed - Thank You";
      body = `Dear Participant,\n\nThank you for attending the meeting.\nThe MOM (Minutes of Meeting) has been attached.\n\nRegards,\nTeam`;
    } else if (status === "declined") {
      subject = "Meeting Declined";
      body = `Dear Participant,\n\nThe scheduled meeting has been declined.\n\nRegards,\nTeam`;
    } else if (status === "active") {
      subject = "Meeting Schedule Updated";
      body = `Dear Participant,\n\nThe meeting schedule has been updated. Please check the new details.\n\nRegards,\nTeam`;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'yuvarajseenipandi29@gmail.com',
        pass: 'nzas jcuk hqlz hkhx',
      },
    });

    let attachments: any[] = [];
    if (Array.isArray(currentDocs) && currentDocs.length > 0) {
      if (status === "completed") {
        const lastDoc = currentDocs[currentDocs.length - 1];
        if (lastDoc?.url) {
          const filePath = resolveFilePath(lastDoc.url);
          if (fs.existsSync(filePath)) {
            attachments = [{ filename: lastDoc.name || path.basename(lastDoc.url), path: filePath }];
          }
        }
      } else {
        attachments = currentDocs
          .filter((d: any) => d?.url)
          .map((d: any) => {
            const filePath = resolveFilePath(d.url);
            if (fs.existsSync(filePath)) {
              return { filename: d.name || path.basename(d.url), path: filePath };
            }
            return null;
          })
          .filter(Boolean);
      }
    }

    for (const participant of participants) {
      if (participant.email) {
        try {
          await transporter.sendMail({
            from: "yuvarajseenipandi29@gmail.com",
            to: participant.email,
            subject,
            text: body,
            attachments,
          });
        } catch (emailErr) {
          console.error(`Failed to send email to ${participant.email}:`, emailErr);
        }
      }
    }

    res.status(200).json({ message: `${msgField} Success`, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error: ${message}` });
  }
};

export const editParticipant = async (req: Request, res: Response): Promise<void> => {
  const { id, role, isdocvisible, status } = req.body;

  if (!id) {
    res.status(400).json({ error: "Participant ID is required for editing." });
    return;
  }

  try {
    const updateData: any = { responded_at: new Date() };
    if (role !== undefined) updateData.role = role;
    if (isdocvisible !== undefined) updateData.isdocvisible = isdocvisible;
    if (status !== undefined) updateData.status = status;

    const updated = await CommunicationParticipant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean() as any;

    if (!updated) {
      res.status(404).json({ error: "Participant not found." });
    } else {
      const obj = { ...updated, id: updated._id.toString() };
      res.status(200).json({ message: "Participant updated.", data: obj });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Edit failed: ${message}` });
  }
};

export const editMeetingReminderInfo = async (req: Request, res: Response): Promise<void> => {
  const {
    reminder_id, title, description, repeat_type,
    repeat_days, start_time, start_date, end_date, active
  } = req.body;

  try {
    const existing = await MeetingReminder.findOne({ reminder_id }).lean();
    if (!existing) {
      res.status(404).json({ error: `Reminder with id ${reminder_id} not found.` });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (repeat_type !== undefined) updateData.repeat_type = repeat_type;
    if (repeat_days !== undefined) updateData.repeat_days = repeat_days;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (active !== undefined) updateData.active = active;

    await MeetingReminder.updateOne({ reminder_id }, { $set: updateData });

    res.status(200).json({ message: "Meeting reminder updated successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Edit Meeting Reminder failed: ${message}` });
  }
};
