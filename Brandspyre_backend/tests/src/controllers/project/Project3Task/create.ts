import { Request, Response } from "express";
import { Task, TaskParticipant, TaskParticipantLog, Milestone, Project, Client } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

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
    client_code?: string,
    campaign_code?: string,
    project_code?: string,
    milestone_code?: string,
    task_title?: string,
    task_priority?: string,
    start_date?: string,
    end_date?: string,
    handler_by?: string,
    team_id?: string,
    notes?:string;
    collaborate?: collaborate[];
    status?:string,
    // ✅ Add this line:
    [key: string]: string | number | undefined | collaborate[];
  }

  export const normalizeDateToUTC = (dateInput: string | Date, timeType: "start" | "end"): Date  => {
    const rawDate = new Date(dateInput);
  
    if (isNaN(rawDate.getTime())) {
      throw new Error("Invalid date input");
    }
  
    const year = rawDate.getUTCFullYear();
    const month = rawDate.getUTCMonth();
    const day = rawDate.getUTCDate();
  
    return new Date(Date.UTC(
      year,
      month,
      day,
      timeType === "start" ? 0 : 23,
      timeType === "start" ? 0 : 59,
      timeType === "start" ? 0 : 59
    ));
  }
  export const createProjectTask = async (req: Request, res: Response): Promise<void> => {
    const msgField = `create Project Task Info`;
    const { userId: idObj } = req.user as AuthenticatedUser;
    const { data: userDatas } = req.body;
  
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      const loginId = idObj;
      if (!Array.isArray(userDatas) || userDatas.length === 0) {
        res.status(400).json({ error: "userDatas must be a non-empty array" });
        return;
      }
  
      const created = [];
      const failed = [];
      const skippedCollaborators: string[] = [];
  
      for (const userDataRaw of userDatas) {
        let userData = { ...userDataRaw };
        
        try {
          const milestone = await Milestone.findOne({ milestone_code: userData.milestone_code }).session(session);
          if (!milestone) throw new Error(`Milestone not found in our database`);

          const milestoneStatus = milestone.status?.toLowerCase();

          if (!['inprocess', 'ongoing'].includes(milestoneStatus)) {
            throw new Error(
              `Milestone cannot proceed because it is currently marked as '${milestone.status}'. Expected status: 'inprocess' or 'ongoing'.`
            );
          }
  
          const project = await Project.findOne({ project_code: milestone.project_code }).session(session);
          if (!project) throw new Error("Project not found");
  
          userData.branchcode = milestone.branchcode;
          userData.client_code = milestone.client_code;
          userData.campaign_code = milestone.campaign_code || undefined;
          userData.project_code = milestone.project_code;
  
          const requiredFields = [
            'branchcode', 'client_code', 'project_code', 'milestone_code',
            'task_priority', 'task_title', 'start_date', 'end_date',
            'handler_by', 'team_id', 'status', 'collaborate'
          ];
          const missingFields = requiredFields.filter(field => !userData[field]);
          if (missingFields.length > 0) throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  
          if (userData.collaborate?.length === 0) throw new Error("At least one collaborator is required");
  
          const client = await Client.findOne({ client_code: userData.client_code }).session(session);
          if (!client) throw new Error("Client not found");
  
          const startDate = new Date(userData.start_date);
          const endDate = new Date(userData.end_date);
          if (startDate > endDate) throw new Error("Start date cannot be after end date");
          if (startDate < milestone.start_date! || endDate > milestone.end_date!)
            throw new Error("Task dates must be within the milestone's date range");
  
          const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          userData.duration_days = durationInDays;

          const normalizedStart = normalizeDateToUTC(userData.start_date, "start");
          const normalizedEnd = normalizeDateToUTC(userData.end_date, "end");

          userData.start_date = normalizedStart;
          userData.end_date = normalizedEnd;
          const collaborate = [];
          for (const collaborator of userData.collaborate) {
            // Note: Would need to check if user exists in UserInfo model
            collaborate.push(collaborator);
          }
          delete userData.collaborate;
  
          const insertedTask = await Task.create([{
            branchcode: userData.branchcode,
            campaign_code: userData.campaign_code,
            client_code: userData.client_code,
            project_code: userData.project_code,
            milestone_code: userData.milestone_code,
            task_title: userData.task_title,
            task_priority: userData.task_priority,
            notes: userData.notes,
            start_date: userData.start_date,
            end_date: userData.end_date,
            duration_days: userData.duration_days,
            excess_duration: userData.excess_duration || 0,
            participant_count: 0,
            handler_by: userData.handler_by,
            team_id: userData.team_id,
            status: userData.status,
            created_on: new Date(),
            updated_on: new Date()
          }], { session });

          const task = insertedTask[0];
  
          let participantCount = 0;
  
          for (const person of collaborate) {
            const exists = await TaskParticipant.findOne({
              task_id: task._id,
              project_code: task.project_code,
              milestone_code: task.milestone_code,
              staff_id: person.staff_id
            }).session(session);
  
            if (exists) {
              skippedCollaborators.push(person.staff_id);
              continue;
            }
  
            await TaskParticipant.create([{
              task_id: task._id,
              branchcode: task.branchcode,
              campaign_code: task.campaign_code,
              client_code: task.client_code,
              project_code: task.project_code,
              milestone_code: task.milestone_code,
              subtask_title: person.subtask_title || task.task_title,
              staff_id: person.staff_id,
              status: person.status || "draft",
              added_on: new Date(),
              created_on: new Date(),
              updated_on: new Date()
            }], { session });
            participantCount++;
          }
  
          // Update participant_count in task
          await Task.findByIdAndUpdate(
            task._id,
            { participant_count: participantCount },
            { session }
          );
  
          // Update task_count in milestone
          await Milestone.findOneAndUpdate(
            { milestone_code: userData.milestone_code },
            { $inc: { task_count: 1 } },
            { session }
          );
  
          created.push(task);
  
        } catch (err) {
          failed.push({ user: userDataRaw, error: err instanceof Error ? err.message : String(err) });
        }
      }
  
      await session.commitTransaction();
  
      if (created.length === 0 && failed.length > 0) {
        const allNotFound = failed.every(f => f.error?.includes("not found"));
        console.error("createProjectTask failed array:", failed);
        res.status(allNotFound ? 404 : 400).json({
          message: `${msgField} failed.`,
          data: { successCount: 0, failedCount: failed.length, created, failed }
        });
        return;
      }
  
      res.status(201).json({
        message: `Bulk ${msgField} result`,
        data: { successCount: created.length, failedCount: failed.length, created, failed, skippedCollaborators }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`${msgField} Causes Error Message: ${message}`);
      res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
    }
  };

  export const createCheckINOUT = async (req: Request, res: Response) => {
    const msgField = `Create CheckIN/OUT Info`;
    const { userId: idObj } = req.user as AuthenticatedUser;
    const { data: userDatas } = req.body;
  
    try {
      const { participants_id, status, delay_by, delay_reason } = userDatas;
  
      if (!participants_id) {
        return res.status(400).json({ error: "Missing field: participants_id" });
      }
  
      const participant = await TaskParticipant.findOne({ _id: new mongoose.Types.ObjectId(participants_id) });
      if (!participant) {
        throw new Error("Participants ID not found");
      }
  
      const task = await Task.findById(participant.task_id);
      if (!task) {
        throw new Error("Related Task not found");
      }

      const latestLog = await TaskParticipantLog.findOne({ participants_id: participant._id }).sort({ created_on: -1 });
      const now = new Date();
  
      const insertLog: any = {
        participants_id: participant._id,
        task_id: participant.task_id,
        branchcode: participant.branchcode,
        campaign_code: participant.campaign_code,
        client_code: participant.client_code,
        project_code: participant.project_code,
        milestone_code: participant.milestone_code,
        staff_id: participant.staff_id,
        check_by: idObj,
        create_datetime: now,
        last_update_datetime: now
      };
  
      const taskStart = new Date(task.start_date!);
      const taskEnd = new Date(task.end_date!);
  
      // 1. No previous log or checked out? → Check-In
      if (!latestLog || (latestLog.check_in && latestLog.check_out)) {
        insertLog.check_in = now;
  
        // Delay check
        if (now < taskStart || now > taskEnd) {
          insertLog.delay_by = delay_by || null;
          insertLog.delay_reason = delay_reason || "Checked in outside task window";
        }
  
      } else if (latestLog.check_in && !latestLog.check_out) {
        // 2. Already checked in, now doing checkout
  
        insertLog.check_in = latestLog.check_in;
        insertLog.check_out = now;
  
        const durationMs = now.getTime() - new Date(latestLog.check_in).getTime();
        insertLog.duration = +(durationMs / (1000 * 60 * 60)).toFixed(2);
  
        if (status) {
          insertLog.status = status;
        }
  
        // Delay only if checkout exceeds end date
        if (now > taskEnd) {
          insertLog.delay_by = delay_by || null;
          insertLog.delay_reason = delay_reason || "Checked out after task end";
        }
      } else {
        throw new Error("Unexpected check-in/out state");
      }
  
      const result = await TaskParticipantLog.create(insertLog);

      res.status(201).json({
        message: `${msgField} Success`,
        data: result
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} Error: ${message}`);
      res.status(500).json({ error: `${msgField} Error: ${message}` });
    }
  };