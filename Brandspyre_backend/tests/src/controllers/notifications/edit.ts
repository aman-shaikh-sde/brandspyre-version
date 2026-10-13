import mongoose from 'mongoose';
import { NotificationRecipient } from "../../db/ModelSceham/Notification/notification";
import { Resignation } from "../../db/ModelSceham/user/17_resignation";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Request, Response } from "express";



interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode: string;
  }
  
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
    const { notification_id } = req.body;
    const { userId, userRole } = req.user as AuthenticatedUser;
  
    try {
      await (async () => {
      const updateRes = await NotificationRecipient.updateMany(
        { notification_id: notification_id, person_id: userId, role_type: userRole },
        { $set: { isread: true } }
      );
      return { rows: [], rowCount: updateRes.modifiedCount };
    })();
  
      res.status(200).json({ message: `Notification marked as read` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: `Failed to mark as read: ${message}` });
    }
  };


  export const approveResignationRequest = async (req: Request, res: Response): Promise<void> => {
    const msg = `Approve User Resignation/Termination`;
    const { resign_id, approved_by,status } = req.body;
  
    const session = await mongoose.startSession();
  
    try {
      session.startTransaction();
  
      const resignRes = await (async () => {
        const rows = await Resignation.find({ resign_id: resign_id }, 'staff_id reliving_date').session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
            
          })),
          rowCount: rows.length
        };
      })();
  
      if (resignRes.rowCount === 0) {
        throw new Error(`Resignation not found for ID: ${resign_id}`);
      }
  
      const { staff_id, reliving_date } = resignRes.rows[0];
  
      // 1. Update resign_form status
      await (async () => {
      const updateRes = await Resignation.updateMany(
        { resign_id: resign_id },
        { $set: { status: status, approved_by: approved_by, updated_at: new Date() } }
      ).session(session);
      return { rows: [], rowCount: updateRes.modifiedCount };
    })();
  
      // 2. Update userinfo status and reliving date
      await (async () => {
      const updateRes = await UserInfo.updateMany(
        { staff_id: staff_id },
        { $set: { status: 'resigned', relivingdate: reliving_date, last_update_datetime: new Date() } }
      ).session(session);
      return { rows: [], rowCount: updateRes.modifiedCount };
    })();
  
      await session.commitTransaction();
  
      res.status(200).json({ message: `${msg} successful` });
  
    } catch (err) {
      await session.abortTransaction();
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${msg} failed: ${message}`);
      res.status(500).json({ error: `${msg} failed: ${message}` });
    } finally {
      session.endSession();
    }
  };
