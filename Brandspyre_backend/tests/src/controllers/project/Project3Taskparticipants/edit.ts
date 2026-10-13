import { Request, Response } from "express";
import { TaskParticipant } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import {sendNotification} from '../../notifications/create'

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface collaborate {
    type?: 'add' | 'edit' | 'remove';
    participant_id?: number;
    staff_id?: string;
    status?: string;
  }

  interface data {
    status?: string,
    rating?: number,
    [key: string]: string | number | undefined | collaborate[];
  }

  export const editProjectTaskParticipant = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Edit Task Participant Info`;
    const { userId } = req.user as AuthenticatedUser;
    const { data } = req.body as { data: Partial<data> };
    const participants_id = req.params.id;
  
    try {
      const participant = await TaskParticipant.findById(participants_id);
      if (!participant) throw new Error("Participant not found");
  
      const allowedFields = ["status", "rating"];
      const updateData: { [key: string]: any } = {};
  
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }
  
      if (updateData.status === "verified-closed") {
        if (typeof updateData.rating !== "number" || updateData.rating < 1 || updateData.rating > 5) {
          throw new Error("Rating must be provided and between 1–5 when closing the task as 'verified-closed'.");
        }
      }
  
      if (updateData.status === "rework") {
        delete updateData.rating;
      }
  
      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields provided for update.");
      }
  
      updateData.updated_on = new Date();
  
      const result = await TaskParticipant.findByIdAndUpdate(participants_id, updateData, { new: true });
      const notifType = 'taskparticipants';

      const notifContent = updateData.status
        ? `Task participant ${participant.staff_id} status updated to "${updateData.status}" for task ${participant.task_id}.`
        : `Task participant ${participant.staff_id} details updated for task ${participant.task_id}.`;
      
      await sendNotification({
        from: String(userId),
        project_code: participant.project_code,
        milestone_code: participant.milestone_code,
        task_id: participant.task_id,
        participants_id: participant._id.toString(),
        type: notifType,
        action: 'updated',
        content: notifContent,
        recipients: [
          {
            person_id: participant.lead_id,
            role_type: 'staff'
          }
        ]
      });
  
      res.status(200).json({
        message: `${msgField} successful`,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} failed: ${message}`);
      res.status(500).json({ error: `${msgField} failed: ${message}` });
    }
  };
