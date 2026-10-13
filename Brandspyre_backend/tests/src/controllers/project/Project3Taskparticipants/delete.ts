import { Request, Response } from "express";
import { Task, TaskParticipant } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface data {
    branchcode: string,
    project_code?: string,
    milestone_code?: string,
    status?:string,
    delete_type?:string,
    // ✅ Add this line:
    [key: string]: string | undefined;
  }
  export const deleteProjectTaskParticipants = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Project Task Participant`;
    const { userId: loginId } = req.user as AuthenticatedUser;
    const { data } = req.body as { data: data };
    const rowId = req.params.id;

    try {
        if (!['temp', 'permanent'].includes(data.delete_type ?? '')) {
             res.status(400).json({ message: `Invalid delete_type. Must be 'temp' or 'permanent'.` });
             return
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const participant = await TaskParticipant.findById(rowId).session(session);
            if (!participant) throw new Error("Task participant ID not found.");

            const task = await Task.findById(participant.task_id).session(session);
            if (!task) throw new Error("Associated task not found.");

            Object.assign(data, {
                branchcode: participant.branchcode,
                milestone_code: participant.milestone_code,
                project_code: participant.project_code,
            });

            if (data.delete_type === 'temp' && !data.status) {
                data.status = 'drop';
            }

            let result;

            switch (data.delete_type) {
                case 'temp':
                    result = await TaskParticipant.findOneAndUpdate(
                        { 
                            project_code: data.project_code, 
                            branchcode: data.branchcode, 
                            milestone_code: data.milestone_code, 
                            _id: rowId 
                        },
                        { status: data.status },
                        { new: true, session }
                    );
                    break;

                case 'permanent':
                default:
                    const newCount = Math.max(0, (task.participant_count || 0) - 1);
                    await Task.findByIdAndUpdate(
                        task._id,
                        { participant_count: newCount },
                        { session }
                    );

                    result = await TaskParticipant.findByIdAndDelete(rowId, { session });
                    break;
            }

            if (!result) {
                await session.abortTransaction();
                 res.status(404).json({ message: 'Participant not found or criteria mismatch.' });
                 return
            }

            await session.commitTransaction();
            res.status(200).json({ message: `${msgField} Success`, participant: result });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${msgField} Error: ${message}`);
        res.status(500).json({ error: `${msgField} failed: ${message}` });
    }
};