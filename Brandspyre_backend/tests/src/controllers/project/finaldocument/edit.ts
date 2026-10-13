import mongoose from 'mongoose';
import { Task, TaskParticipant } from "../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";
import { recalculateTaskDurations } from '../Project3TaskpCheckinout/helperFunction';

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface collaborate {
  type?: 'add' | 'edit' | 'remove';
  participant_id?: string;
  staff_id?: string;
  status?: string;
}

interface data {
  branchcode: string;
  client_code?: string;
  campaign_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_title?: string;
  task_priority?: string;
  start_date?: string;
  end_date?: string;
  handler_by?: string;
  notes?: string;
  collaborate?: collaborate[];
  status?: string;
  task_id?: string;
  [key: string]: any;
}

export const editProjectTask = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Project Task Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { data } = req.body as { data: data };
  const session = await mongoose.startSession();
  const rowId = req.params.id;

  try {
    session.startTransaction();

    const userExists = await UserInfo.findOne({ staff_id: idObj }).session(session).lean();
    if (!userExists) {
      throw new Error("Logged-in user not found");
    }

    const existingTask = await Task.findById(rowId).session(session);
    if (!existingTask) {
      throw new Error("Given Task Id not in our Task database");
    }

    data.branchcode = existingTask.branchcode || '';
    data.milestone_code = existingTask.milestone_code;
    data.project_code = existingTask.project_code;
    data.client_code = existingTask.client_code;

    const updatableFields = [
      "task_title",
      "task_priority",
      "start_date",
      "end_date",
      "handler_by",
      "notes",
      "status",
    ];

    const updateData: { [key: string]: any } = {};
    for (const key of updatableFields) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      await session.abortTransaction();
      res.status(400).json({ message: "No updatable fields provided." });
      return;
    }

    updateData.updated_on = new Date();

    const startRaw = updateData.start_date
      ? new Date(updateData.start_date)
      : new Date(existingTask.start_date!);

    const endRaw = updateData.end_date
      ? new Date(updateData.end_date)
      : new Date(existingTask.end_date!);

    const startDate = new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), 0, 0, 0);
    const endDate = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), 23, 59, 59);

    if (startDate > endDate) {
      await session.abortTransaction();
      res.status(400).json({ error: "Start date cannot be after end date." });
      return;
    }

    updateData.start_date = startDate;
    updateData.end_date = endDate;

    const durationInMilliseconds = endDate.getTime() - startDate.getTime();
    const durationInDays = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24));
    updateData.duration_days = durationInDays;

    const updatedTask = await Task.findByIdAndUpdate(
      rowId,
      { $set: updateData },
      { new: true, session }
    ).lean() as any;

    await session.commitTransaction();
    const result = await recalculateTaskDurations(String(rowId));

    res.status(200).json({
      message: `${msgField} Success`,
      updated: updatedTask,
      result: result,
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};

export const editProjectTaskParticipants = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Edit Project Task Participants Info";
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { data } = req.body as { data: data };
  const session = await mongoose.startSession();
  const rowId = req.params.id;
  data.task_id = rowId;

  try {
    session.startTransaction();

    const userExists = await UserInfo.findOne({ staff_id: idObj }).session(session).lean();
    if (!userExists) {
      throw new Error("Logged-in user not found");
    }

    let { task_id, branchcode, campaign_code, client_code, project_code, milestone_code, collaborate = [] } = data;

    const added: any[] = [];
    const edited: any[] = [];
    const removed: any[] = [];
    const skipped: any[] = [];

    const existingTask = await Task.findById(rowId).session(session).lean() as any;
    if (!existingTask) {
      throw new Error("Given Task Id not in our Task database");
    }

    branchcode = existingTask.branchcode;
    campaign_code = existingTask.campaign_code;
    client_code = existingTask.client_code;
    project_code = existingTask.project_code;
    milestone_code = existingTask.milestone_code;

    for (const entry of collaborate) {
      if (entry.type === "add") {
        if (!entry.staff_id) {
          skipped.push({ reason: "Missing staff_id", entry });
          continue;
        }

        const exists = await TaskParticipant.findOne({
          task_id: task_id,
          project_code: project_code,
          milestone_code: milestone_code,
          staff_id: entry.staff_id
        }).session(session).lean();

        if (exists) {
          skipped.push({ reason: "Already exists", entry });
          continue;
        }

        const [newParticipant] = await TaskParticipant.create([{
          task_id,
          branchcode,
          campaign_code: campaign_code || null,
          client_code,
          project_code,
          milestone_code,
          staff_id: entry.staff_id,
          status: entry.status || "open",
        }], { session });

        added.push(newParticipant.toObject());

      } else if (entry.type === "edit") {
        if (!entry.participant_id) {
          skipped.push({ reason: "Missing participant_id", entry });
          continue;
        }

        const updatedParticipant = await TaskParticipant.findByIdAndUpdate(
          entry.participant_id,
          { $set: { status: entry.status, updated_on: new Date() } },
          { new: true, session }
        ).lean();

        if (updatedParticipant) {
          edited.push(updatedParticipant);
        } else {
          skipped.push({ reason: "Participant not found", entry });
        }

      } else if (entry.type === "remove") {
        if (!entry.participant_id) {
          skipped.push({ reason: "Missing participant_id", entry });
          continue;
        }

        const deleted = await TaskParticipant.findByIdAndDelete(entry.participant_id).session(session).lean();
        if (deleted) {
          removed.push(deleted);
        } else {
          skipped.push({ reason: "Participant not found for delete", entry });
        }
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data: {
        addedCount: added.length,
        editedCount: edited.length,
        removedCount: removed.length,
        skippedCount: skipped.length,
        added,
        edited,
        removed,
        skipped,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};