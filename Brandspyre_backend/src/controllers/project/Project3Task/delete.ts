import { Request, Response } from "express";
import { Task, TaskParticipant, Milestone } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import { getTenantFilter } from "../../../utils/tenantScope";

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
  export const deleteProjectTask = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Project Task Info`;
    const { userId: loginId } = req.user as AuthenticatedUser;
    const rowId = req.params.id;
    const { data } = req.body as { data: data };

    try {
        if (!['temp', 'permanent'].includes(data.delete_type ?? '')) {
             res.status(400).json({ message: `Invalid delete_type. Must be 'temp' or 'permanent'.` });
             return
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const tenantFilter = getTenantFilter(req);
            const existingTask = await Task.findOne({ _id: rowId, ...tenantFilter }).session(session);
            if (!existingTask) throw new Error("Given Task Id not in our Task database");

            const { branchcode, milestone_code, project_code } = existingTask;
            Object.assign(data, { branchcode, milestone_code, project_code });

            if (data.delete_type === 'temp' && !data.status) {
                data.status = 'drop';
            }

            let result;
            if (data.delete_type === 'temp') {
                result = await Task.findOneAndUpdate(
                    { _id: rowId, ...tenantFilter },
                    { status: data.status },
                    { new: true, session }
                );
                await TaskParticipant.updateMany(
                    { task_id: rowId, project_code, milestone_code, ...tenantFilter },
                    { status: data.status },
                    { session }
                );
            } else {
                await TaskParticipant.deleteMany(
                    { task_id: rowId, project_code, milestone_code, ...tenantFilter },
                    { session }
                );
                result = await Task.findOneAndDelete({ _id: rowId, ...tenantFilter }, { session });
            }

            if (!result) {
                await session.abortTransaction();
                 res.status(404).json({ message: 'Task not found or criteria mismatch.' });
                 return
            }

            await session.commitTransaction();
            res.status(200).json({ message: `${msgField} Success`, task: result });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${msgField} Error]:`, message);
        res.status(500).json({ error: `${msgField} failed: ${message}` });
    }
};