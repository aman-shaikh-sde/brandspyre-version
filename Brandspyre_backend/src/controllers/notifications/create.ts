import mongoose from 'mongoose';
import { Notification, NotificationRecipient } from "../../db/ModelSceham/Notification/notification";
import { Resignation } from "../../db/ModelSceham/user/17_resignation";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface NotificationPayload {
  tenant_id?: any;
  from: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: any;
  participants_id?: any;
  meeting_id?: any;
  type: 'project' | 'milestone' | 'task' | 'taskparticipants' | 'meeting' | 'documents' | 'message';
  action: string;
  content: string;
  recipients: {
    person_id: string;
    role_type: 'staff' | 'client';
    tenant_id?: any;
  }[];
}

export const generateResignCustomId = async (prefix: string, count: number): Promise<string> => {
  const nextNumber = count + 1;
  const digitCount = nextNumber.toString().length;
  const paddedNumber = String(nextNumber).padStart(digitCount, '0');
  return `${prefix}_${paddedNumber}`;
};

export const sendNotification = async (payload: NotificationPayload) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const {
      tenant_id, from, project_code = null, milestone_code = null,
      task_id = null, participants_id = null, meeting_id = null,
      type, action, content, recipients
    } = payload;

    const validTenantId = tenant_id && mongoose.Types.ObjectId.isValid(String(tenant_id))
      ? new mongoose.Types.ObjectId(String(tenant_id))
      : undefined;

    const [notifDoc] = await Notification.create([{
      tenant_id: validTenantId,
      from, project_code, milestone_code, task_id,
      participants_id, meeting_id, type, action, content,
    }], { session });

    const notification_id = notifDoc._id.toString();

    for (const recipient of recipients) {
      if (!recipient.person_id) continue;
      const recipientTenantId = recipient.tenant_id && mongoose.Types.ObjectId.isValid(String(recipient.tenant_id))
        ? new mongoose.Types.ObjectId(String(recipient.tenant_id))
        : validTenantId;

      await NotificationRecipient.create([{
        tenant_id: recipientTenantId,
        notification_id,
        person_id: recipient.person_id,
        role_type: recipient.role_type,
      }], { session });
    }

    await session.commitTransaction();
    return { success: true, notification_id };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Notification error:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    session.endSession();
  }
};

export const createUserResignRequest = async (req: Request, res: Response): Promise<void> => {
  const msg = `Create User Resignation/Termination`;
  const { userId, userRole } = req.user as AuthenticatedUser;
  const {
    staff_id, staff_name, branchcode, branch_name,
    department, designation, team_id, team_name,
    team_lead_id, team_lead_name, termination_type,
    termination_reason, last_working_day, reliving_date,
    exit_notes, created_by,
  } = req.body;

  const session = await mongoose.startSession();

  try {
    if (!staff_id || !termination_type || !last_working_day) {
      throw new Error("staff_id, termination_type, and last_working_day are required");
    }

    session.startTransaction();

    const existingResign = await Resignation.findOne({
      staff_id,
      status: { $in: ['initiated', 'approved'] }
    }).session(session).lean();

    if (existingResign) {
      throw new Error(`Resignation/Termination request already exists or approved for staff_id: ${staff_id}`);
    }

    const totalCount = await Resignation.countDocuments().session(session);
    const resign_id = await generateResignCustomId('RSN', totalCount);

    await Resignation.create([{
      resign_id, staff_id, staff_name, branchcode, branch_name,
      department, designation, team_id, team_name,
      team_lead_id, team_lead_name, termination_type,
      termination_reason, last_working_day, reliving_date,
      exit_notes, created_by,
    }], { session });

    await session.commitTransaction();

    res.status(201).json({ message: `${msg} submitted successfully`, resign_id });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} failed: ${message}`);
    res.status(500).json({ error: `${msg} failed: ${message}` });
  } finally {
    session.endSession();
  }
};
