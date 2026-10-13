import mongoose from 'mongoose';
import { CustomTarget } from "../../../db/ModelSceham/project/client";
import { CommunicationParticipant } from "../../../db/ModelSceham/project/client";
import { ProjectMeeting } from "../../../db/ModelSceham/project/client";
import { MeetingReminder } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

import {checkIfExists, checkIfNotExists, syncCampaignLeadData } from '../helperfunction'

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const deleteMeetingOrDoc = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete Meeting or Document`;
  const { userId: loginId } = req.user as AuthenticatedUser;
  const { data } = req.body as { data: { delete_type: 'permanent' } };

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1) Ensure the user exists
    await checkIfExists(null, "userinfo", "staff_id = $1", [loginId], "Logged-in user not found");

    if (data.delete_type !== 'permanent') {
      await session.abortTransaction();
      res.status(400).json({ message: `Invalid delete_type. Must be 'permanent'.` });
      return;
    }

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { meet_id: Number(req.params.id) };

    const m = await ProjectMeeting.findOne(filter).session(session).lean() as any;
    if (!m) {
      await session.abortTransaction();
      res.status(404).json({ message: `Meeting with id ${req.params.id} not found.` });
      return;
    }

    const numericMeetId = m.meet_id;

    // 2) Delete custom targets
    await CustomTarget.deleteMany({ meet_id: numericMeetId }).session(session);

    // 3) Delete communication participants
    await CommunicationParticipant.deleteMany({ meet_id: numericMeetId }).session(session);

    // 4) Delete the meeting itself
    await ProjectMeeting.deleteOne({ _id: m._id }).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} Success` });

  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const removeCustomTarget = async (req: Request, res: Response): Promise<void> => {
  const { meet_id, target_id, type } = req.body;

  if (!meet_id || !target_id || !type) {
    res.status(400).json({ error: "meet_id, target_id, and type are required." });
    return;
  }

  try {
    const deleteRes = await CustomTarget.deleteMany({ meet_id: meet_id, target_id: target_id, type: type });
    if (deleteRes.deletedCount === 0) {
      res.status(404).json({ error: "No matching custom target found." });
    } else {
      res.status(200).json({ message: "Custom target removed successfully." });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Remove custom target failed: ${message}` });
  }
};

export const removeParticipant = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;

  if (!id) {
    res.status(400).json({ error: "Participant ID is required to remove." });
    return;
  }

  try {
    const deleteRes = await CommunicationParticipant.deleteOne(
      mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id: Number(id) }
    );
    if (deleteRes.deletedCount === 0) {
      res.status(404).json({ error: "Participant not found." });
    } else {
      res.status(200).json({ message: "Participant removed successfully." });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Remove failed: ${message}` });
  }
};

export const deleteMeetingReminderInfo = async (req: Request, res: Response): Promise<void> => {
  const { reminder_id } = req.body;

  const session = await mongoose.startSession();
  try {
    const filter = mongoose.Types.ObjectId.isValid(reminder_id)
      ? { _id: reminder_id }
      : { reminder_id: Number(reminder_id) };

    const reminder = await MeetingReminder.findOne(filter).session(session).lean() as any;
    if (!reminder) {
      res.status(404).json({ error: `Reminder with id ${reminder_id} not found.` });
      await session.endSession();
      return;
    }

    session.startTransaction();

    await MeetingReminder.deleteOne({ _id: reminder._id }).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Meeting reminder deleted successfully." });

  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Delete Meeting Reminder failed: ${message}` });
  } finally {
    session.endSession();
  }
};