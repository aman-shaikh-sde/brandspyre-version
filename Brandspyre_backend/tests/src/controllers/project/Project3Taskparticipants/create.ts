import { Request, Response } from "express";
import { Task, TaskParticipant } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface collaborate {
    subtask_title?: string;
    staff_id?: string;
    status?: string;
  }

  interface data {
    branchcode: string,
    task_id?:number;
    collaborate?: collaborate[];
    
    // ✅ Add this line:
    [key: string]: string | number | undefined | collaborate[];
  }

  export const addCollaboratorsToTask = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Add Collaborators to Task`;
    const { userId } = req.user as AuthenticatedUser;
    const { data }: { data: collaborate & { task_id: string; branchcode: string; collaborate: any[] } } = req.body;
  
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const { task_id, branchcode, collaborate } = data;

        if (!task_id) throw new Error("task_id is required");
        if (!Array.isArray(collaborate) || collaborate.length === 0)
          throw new Error("No collaborators provided");

        const task = await Task.findById(task_id).session(session);
        if (!task) throw new Error("Task not found for provided task_id");
        
        const taskStatus = task.status?.toLowerCase();
        if (!['inprocess', 'ongoing', 'draft', 'hold'].includes(taskStatus)) {
          throw new Error(`Task cannot proceed because it is currently marked as '${task.status}'.`);
        }

        const { project_code, milestone_code, client_code, campaign_code, task_title } = task;

        const added: any[] = [];
        const skipped: any[] = [];

        for (const person of collaborate) {
          if (!person.staff_id) {
            skipped.push({ reason: "Missing staff_id", person });
            continue;
          }

          const exists = await TaskParticipant.findOne({
            task_id: task_id,
            project_code,
            milestone_code,
            staff_id: person.staff_id
          }).session(session);

          if (exists) {
            skipped.push({ reason: "Already assigned", person });
            continue;
          }

          const participantData = {
            task_id,
            branchcode,
            campaign_code,
            client_code,
            project_code,
            milestone_code,
            subtask_title: person.subtask_title || task_title,
            staff_id: person.staff_id,
            status: person.status || "draft",
            added_on: new Date(),
            created_on: new Date(),
            updated_on: new Date()
          };

          const insertResult = await TaskParticipant.create([participantData], { session });
          added.push(insertResult[0]);
        }

        await session.commitTransaction();

        res.status(200).json({
          message: `${msgField} successful`,
          data: {
            addedCount: added.length,
            skippedCount: skipped.length,
            added,
            skipped,
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