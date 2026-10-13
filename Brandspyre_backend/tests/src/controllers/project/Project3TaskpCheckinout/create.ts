import { Request, Response } from "express";
import { TaskParticipant, TaskParticipantLog, Task } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import {recalculateTaskDurations} from './helperFunction'
import {sendNotification} from '../../notifications/create'

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface collaborate {
    staff_id?: string;
    status?: string;
  }

  interface data {
    branchcode: string,
    participants_id?:number;
    check?: 'in' | 'out';
    remarks?:string;
    // ✅ Add this line:
    [key: string]: string | number | undefined ;
  }

  export const createTaskCheckINOUT = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Task Check-In/Out`;
    const { userId } = req.user as AuthenticatedUser;
    const { participants_id, remarks, delay_by, delay_reason, status } = req.body.data || {};
  
    if (!participants_id) {
      res.status(400).json({ error: "participants_id is required" });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(participants_id)) {
      res.status(400).json({ error: "Invalid participant ID format" });
      return;
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const participant = await TaskParticipant.findById(participants_id).session(session);
        if (!participant || ['verified-closed', 'archived', 'drop'].includes(participant.status || '')) {
          throw new Error("Participant not found or already closed/dropped");
        }

        const task = await Task.findById(participant.task_id).session(session);
        if (!task || ['verified-closed', 'drop'].includes(task.status || '')) {
          throw new Error("Task is already verified or dropped");
        }

        const now = new Date();

        const openLog = await TaskParticipantLog.findOne({
          participants_id: participants_id,
          check_out: null
        }).sort({ check_in: -1 }).session(session);

        let wasCheckIn = false;

        if (status) {
          const isDelayed = task.end_date && now >= new Date(task.end_date);

          if (isDelayed && (!delay_by || !delay_reason)) {
            throw new Error("Delay detected. Please provide delay_by and delay_reason.");
          }

          if (isDelayed) {
            await TaskParticipant.findByIdAndUpdate(
              participants_id,
              { delay_by, delay_reason },
              { session }
            );
          }

          await TaskParticipant.findByIdAndUpdate(
            participants_id,
            { status, updated_on: now },
            { session }
          );

          if (openLog) {
            const checkInTime = new Date(openLog.check_in);
            const durationMinutes = Math.ceil((now.getTime() - checkInTime.getTime()) / (1000 * 60));

            await TaskParticipantLog.findByIdAndUpdate(
              openLog._id,
              { check_out: now, duration: durationMinutes, last_update_datetime: now },
              { session }
            );
          }
        } else {
          if (!openLog) {
            wasCheckIn = true;
            await TaskParticipantLog.create([{
              participants_id: participants_id,
              task_id: participant.task_id,
              staff_id: participant.staff_id,
              branchcode: participant.branchcode,
              campaign_code: participant.campaign_code,
              client_code: participant.client_code,
              project_code: participant.project_code,
              milestone_code: participant.milestone_code,
              team_id: participant.team_id,
              lead_id: participant.lead_id,
              check_in: now,
              remarks: remarks || null
            }], { session });
          } else {
            const checkInTime = new Date(openLog.check_in);
            const durationMinutes = Math.ceil((now.getTime() - checkInTime.getTime()) / (1000 * 60));

            await TaskParticipantLog.findByIdAndUpdate(
              openLog._id,
              { check_out: now, duration: durationMinutes, last_update_datetime: now },
              { session }
            );
          }
        }

        const totalDurationResult = await TaskParticipantLog.aggregate([
          { $match: { participants_id: participants_id } },
          { $group: { _id: null, total: { $sum: { $ifNull: ["$duration", 0] } } } }
        ]);
        const totalMinutes = totalDurationResult[0]?.total || 0;

        await TaskParticipant.findByIdAndUpdate(
          participants_id,
          { task_duration: totalMinutes, updated_on: now },
          { session }
        );

        const totalTaskDurationResult = await TaskParticipant.aggregate([
          { $match: { task_id: participant.task_id, status: { $in: ['inprocess', 'archived'] } } },
          { $group: { _id: null, total: { $sum: { $ifNull: ["$task_duration", 0] } } } }
        ]);
        const totalTaskMinutes = totalTaskDurationResult[0]?.total || 0;

        await Task.findByIdAndUpdate(
          participant.task_id,
          { duration_days: Math.ceil(totalTaskMinutes / 60) },
          { session }
        );

        await session.commitTransaction();

        const result = await recalculateTaskDurations(participant.task_id);

        const notifType = 'taskparticipants';

        const notifContent = status
          ? `Task participant ${participant.staff_id} marked as ${status} for task ${participant.task_id}.`
          : `Task participant ${participant.staff_id} has ${wasCheckIn ? 'checked in' : 'checked out'} for task ${participant.task_id}.`;

        await sendNotification({
          from: String(userId),
          project_code: participant.project_code,
          milestone_code: participant.milestone_code,
          task_id: participant.task_id,
          participants_id: participant._id.toString(),
          type: notifType,
          action: wasCheckIn ? 'check-in' : 'check-out',
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
          data: {
            task_id: participant.task_id,
            total_minutes: totalMinutes,
            task_duration_days: Math.ceil(totalTaskMinutes / 60),
            result,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} failed: ${message}`);
      res.status(500).json({ error: `${msgField} failed: ${message}` });
    }
  };