import mongoose from 'mongoose';
import { ProjectPayreq } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const editPayRequest = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Payment Request`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const {
    request_id, milestone_code, milestone_amount,
    due_date, notes, status, approved_staff_id,
    project_code, invoice_no
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await ProjectPayreq.findOne({ request_id }).session(session).lean() as any;
    if (!existing) throw new Error(`Payment Request not found: ${request_id}`);

    await ProjectPayreq.updateOne(
      { request_id },
      {
        $set: {
          milestone_amount: milestone_amount ?? existing.milestone_amount,
          due_date: due_date ?? existing.due_date,
          notes: notes ?? existing.notes,
          status: status ?? existing.status,
          updated_on: new Date()
        }
      }
    ).session(session);

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} completed successfully`,
      request_id,
    });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} failed: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};
