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
    const authUser = (req as any).user;
    const securityContext = (req as any).securityContext;
    const effectiveTenantId = securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
    const callerRole = (authUser?.userRole || authUser?.role || "").toLowerCase();
    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(callerRole);
    const isAuthorized = ['admin', 'tenant_admin', 'superadmin', 'platform_admin', 'platform_superadmin', 'master_super_admin', 'hr', 'manager'].includes(callerRole);

    if (!isAuthorized) {
      res.status(403).json({ error: "Forbidden: You do not have permission to approve resignation requests." });
      return;
    }

    const { resign_id, status } = req.body;
    const approved_by = String(authUser?.userId || authUser?.id || authUser?.staff_id || "system");
  
    const session = await mongoose.startSession();
  
    try {
      session.startTransaction();

      const resignFilter: any = { resign_id };
      if (!isPlatformAdmin && effectiveTenantId) {
        if (mongoose.Types.ObjectId.isValid(effectiveTenantId)) {
          resignFilter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
        }
      }
  
      const resignRes = await (async () => {
        const rows = await Resignation.find(resignFilter, 'staff_id reliving_date').session(session).lean() as any[];
        return {
          rows: rows.map(r => ({
            ...r,
            id: r._id.toString(),
          })),
          rowCount: rows.length
        };
      })();
  
      if (resignRes.rowCount === 0) {
        throw new Error(`Resignation not found or unauthorized for ID: ${resign_id}`);
      }
  
      const { staff_id, reliving_date } = resignRes.rows[0];
  
      // 1. Update resign_form status
      await (async () => {
        const updateRes = await Resignation.updateMany(
          resignFilter,
          { $set: { status: status, approved_by: approved_by, updated_at: new Date() } }
        ).session(session);
        return { rows: [], rowCount: updateRes.modifiedCount };
      })();
  
      // 2. Update userinfo status and reliving date with tenant scoping
      const userUpdateFilter: any = { staff_id: staff_id };
      if (!isPlatformAdmin && effectiveTenantId) {
        if (mongoose.Types.ObjectId.isValid(effectiveTenantId)) {
          userUpdateFilter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
        }
      }

      await (async () => {
        const updateRes = await UserInfo.updateMany(
          userUpdateFilter,
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
