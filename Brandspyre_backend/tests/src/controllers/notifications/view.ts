import { Notification, NotificationRecipient } from "../../db/ModelSceham/Notification/notification";
import { Resignation } from "../../db/ModelSceham/user/17_resignation";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Project, Milestone, Task, TaskParticipant, ProjectMeeting, ProjectInvoice, ProjectPayreq } from "../../db/ModelSceham/project/client";
import { Request, Response } from "express";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewNotifications = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Notifications`;
  const { userId, userRole, tenantId } = req.user as AuthenticatedUser;

  try {
    const person_id = String(userId);
    const role_type = userRole;
    const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin';

    const recQuery: any = { person_id, role_type };
    if (!isPlatformAdmin && tenantId) {
      recQuery.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }

    const recs = await NotificationRecipient.find(recQuery).lean() as any[];
    const notificationIds = recs.map(r => r.notification_id);

    const notifQuery: any = { _id: { $in: notificationIds } };
    if (!isPlatformAdmin && tenantId) {
      notifQuery.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }

    const notifications = await Notification.find(notifQuery)
      .sort({ created_on: -1 })
      .limit(20)
      .lean() as any[];

    const rows = notifications.map(n => {
      const r = recs.find(rec => rec.notification_id.toString() === n._id.toString());
      return {
        notification_id: n._id.toString(),
        type: n.type,
        action: n.action,
        content: n.content,
        project_code: n.project_code,
        milestone_code: n.milestone_code,
        task_id: n.task_id,
        participants_id: n.participants_id,
        meeting_id: n.meeting_id,
        document_id: n.document_id,
        message_id: n.message_id,
        created_on: n.created_on,
        isread: r ? r.isread : false
      };
    });

    res.status(200).json({
      success: true,
      message: `${msgField} successful`,
      data: rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} failed: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  }
};

export const viewUserResignationRequests = async (req: Request, res: Response): Promise<void> => {
  const msg = "View User Resignation/Termination";
  const {
    resign_id,
    search = '',
    status,
    termination_type,
    branchcode,
    department,
    team_id,
    from_date,
    to_date,
    page = "1",
    limit = "25",
    dec = "dec",
    order_by = "created_at"
  } = req.query;

  try {
    if (resign_id) {
      const resignation = await Resignation.findOne({ resign_id: String(resign_id) }).lean() as any;
      if (!resignation) {
        res.status(404).json({ message: "Resignation not found" });
        return;
      }

      const user = await UserInfo.findOne({ staff_id: resignation.staff_id }, 'dateofjoining').lean() as any;
      const dateofjoining = user?.dateofjoining || null;

      let years_of_working = null;
      if (dateofjoining && resignation.last_working_day) {
        const joinDate = new Date(dateofjoining);
        const leaveDate = new Date(resignation.last_working_day);
        const msInYear = 1000 * 60 * 60 * 24 * 365.25;
        years_of_working = ((leaveDate.getTime() - joinDate.getTime()) / msInYear).toFixed(2);
      }

      res.status(200).json({
        message: `${msg} (Single Resign ID) fetched successfully`,
        data: {
          ...resignation,
          id: resignation._id.toString(),
          dateofjoining,
          years_of_working: years_of_working ? `${years_of_working} years` : null
        }
      });
      return;
    }

    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const order = dec === "dec" ? -1 : 1;

    const filter: any = {};

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { staff_name: searchRegex },
        { staff_id: searchRegex },
        { team_name: searchRegex }
      ];
    }

    if (status) filter.status = status;
    if (termination_type) filter.termination_type = termination_type;
    if (branchcode) filter.branchcode = branchcode;
    if (department) filter.department = department;
    if (team_id) filter.team_id = team_id;

    if (from_date && to_date) {
      filter.last_working_day = {
        $gte: new Date(String(from_date)),
        $lte: new Date(String(to_date))
      };
    }

    const totalDocuments = await Resignation.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const sortField = String(order_by) === 'created_at' ? 'createdAt' : String(order_by);
    const results = await Resignation.find(filter)
      .sort({ [sortField]: order })
      .skip(skip)
      .limit(pageLimit)
      .lean() as any[];

    const resignations = await Promise.all(
      results.map(async (resignation: any) => {
        const user = await UserInfo.findOne({ staff_id: resignation.staff_id }, 'dateofjoining').lean() as any;
        const dateofjoining = user?.dateofjoining || null;
        let years_of_working = null;
        if (dateofjoining && resignation.last_working_day) {
          const joinDate = new Date(dateofjoining);
          const leaveDate = new Date(resignation.last_working_day);
          const msInYear = 1000 * 60 * 60 * 24 * 365.25;
          years_of_working = ((leaveDate.getTime() - joinDate.getTime()) / msInYear).toFixed(2);
        }

        return {
          ...resignation,
          id: resignation._id.toString(),
          dateofjoining,
          years_of_working: years_of_working ? `${years_of_working} years` : null
        };
      })
    );

    res.status(200).json({
      message: `${msg} fetched successfully`,
      data: resignations,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} failed:`, message);
    res.status(500).json({ error: `${msg} failed: ${message}` });
  }
};

export const viewOverdueRecords = async (req: Request, res: Response): Promise<void> => {
  const { overdue_date, field, page = 1, limit = 10 } = req.query;

  const msg = `Fetch Overdue Records`;
  if (!overdue_date || !field) {
    res.status(400).json({ error: "overdue_date and field are required" });
    return;
  }

  const pageNumber = parseInt(page as string, 10);
  const pageLimit = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * pageLimit;
  const targetDate = new Date(String(overdue_date));

  try {
    let listQuery: any = null;
    let countPromise: Promise<number> | null = null;
    let fetchPromise: Promise<any[]> | null = null;

    switch (field) {
      case "project": {
        const filter = { end_date: { $lt: targetDate }, status: { $nin: ['completed', 'drop'] } };
        countPromise = Project.countDocuments(filter);
        fetchPromise = Project.find(filter)
          .sort({ end_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.project_code,
            title: d.title,
            due_date: d.end_date,
            status: d.status,
            type: 'project'
          })));
        break;
      }

      case "milestone": {
        const filter = { end_date: { $lt: targetDate }, status: { $nin: ['verified', 'drop'] } };
        countPromise = Milestone.countDocuments(filter);
        fetchPromise = Milestone.find(filter)
          .sort({ end_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.milestone_code,
            title: d.miles_title,
            due_date: d.end_date,
            status: d.status,
            type: 'milestone'
          })));
        break;
      }

      case "task": {
        const filter = { end_date: { $lt: targetDate }, status: { $nin: ['verified-closed', 'drop'] } };
        countPromise = Task.countDocuments(filter);
        fetchPromise = Task.find(filter)
          .sort({ end_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d._id.toString(),
            title: d.task_title,
            due_date: d.end_date,
            status: d.status,
            type: 'task'
          })));
        break;
      }

      case "task_participants": {
        const filter = { end_date: { $lt: targetDate }, status: { $nin: ['verified-closed', 'drop'] } };
        countPromise = TaskParticipant.countDocuments(filter);
        fetchPromise = TaskParticipant.find(filter)
          .sort({ end_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.participants_id || d._id.toString(),
            title: d.subtask_title,
            due_date: d.end_date,
            status: d.status,
            type: 'task_participant'
          })));
        break;
      }

      case "meeting": {
        const filter = { end_date_time: { $lt: targetDate }, status: { $ne: 'completed' } };
        countPromise = ProjectMeeting.countDocuments(filter);
        fetchPromise = ProjectMeeting.find(filter)
          .sort({ end_date_time: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.meet_id || d._id.toString(),
            title: d.title,
            due_date: d.end_date_time,
            status: d.status,
            type: 'meeting'
          })));
        break;
      }

      case "invoice": {
        const filter = { due_date: { $lt: targetDate }, status: { $nin: ['paid', 'cancelled'] } };
        countPromise = ProjectInvoice.countDocuments(filter);
        fetchPromise = ProjectInvoice.find(filter)
          .sort({ due_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.invoice_id,
            title: d.invoice_no,
            due_date: d.due_date,
            status: d.status,
            type: 'invoice'
          })));
        break;
      }

      case "payreq": {
        const filter = { due_date: { $lt: targetDate }, status: { $nin: ['paid', 'cancelled'] } };
        countPromise = ProjectPayreq.countDocuments(filter);
        fetchPromise = ProjectPayreq.find(filter)
          .sort({ due_date: 1 })
          .skip(skip)
          .limit(pageLimit)
          .lean()
          .then(docs => docs.map((d: any) => ({
            code: d.request_id,
            title: d.milestone_code,
            due_date: d.due_date,
            status: d.status,
            type: 'payreq'
          })));
        break;
      }

      default:
        res.status(400).json({ error: `Unsupported field: ${field}` });
        return;
    }

    const [totalDocuments, records] = await Promise.all([countPromise!, fetchPromise!]);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    res.status(200).json({
      message: `${msg} for ${field} completed`,
      data: records,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} failed: ${message}`);
    res.status(500).json({ error: `${msg} failed: ${message}` });
  }
};
