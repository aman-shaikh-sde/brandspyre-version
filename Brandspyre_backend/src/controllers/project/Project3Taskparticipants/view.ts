import { Request, Response } from "express";
import { TaskParticipant, Task, Client, Project, Milestone } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import { settingAccessControl } from "../../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

  export const viewParticipantDetails = async (req: Request, res: Response) => {
    const msgField = `View Project Task Participants Info`;
    const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;

    let {
      search,
      client_code,
      campaign_code,
      start_date,
      overdue,
      end_date,
      end_to,
      milestone_code,
      filtertype,
      project_code,
      branchcode,
      status,
      participants_id,
      subtask_priority,
      task_id,
      team_id,
      lead_id,
      staff_id,
      delay_by,
      dec,
      page = 1,
      limit = 25,
    } = req.query;

    try {
      const pageNumber = parseInt(page as string, 10);
      const pageLimit = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * pageLimit;
      const sortOrder = dec ? -1 : 1;
      const today = new Date().toISOString().split("T")[0];

      const filter: any = {};

      // Superadmin and master_super_admin can see all task participants
      if (userRole === 'superadmin' || userRole === 'master_super_admin') {
        // No branch filtering
      }
      // Tenant admin can only see task participants from their specific branch
      else if (userRole === 'admin' && tenantId) {
        filter.branchcode = brcode;
        filter.$or = [
          { tenant_id: new mongoose.Types.ObjectId(tenantId) },
          { tenant_id: { $exists: false } }
        ];
      }
      // Other roles can only see their own branch
      else if (tenantId) {
        filter.branchcode = brcode;
        filter.$or = [
          { tenant_id: new mongoose.Types.ObjectId(tenantId) },
          { tenant_id: { $exists: false } }
        ];
      }

      if (participants_id) {
        if (mongoose.Types.ObjectId.isValid(participants_id as string)) {
          filter._id = participants_id;
        } else {
          res.status(400).json({ error: "Invalid participant ID" });
          return;
        }
      }
      if (branchcode) filter.branchcode = branchcode;
      if (campaign_code) filter.campaign_code = campaign_code;
      if (client_code) filter.client_code = client_code;
      if (project_code) filter.project_code = project_code;
      if (milestone_code) filter.milestone_code = milestone_code;
      if (task_id) filter.task_id = task_id;
      if (team_id) filter.team_id = team_id;
      if (lead_id) filter.lead_id = lead_id;
      if (staff_id) filter.staff_id = staff_id;
      if (delay_by) filter.delay_by = delay_by;
      if (status) filter.status = status;
      if (subtask_priority) filter.subtask_priority = subtask_priority;

      if (search) {
        filter.$or = [
          { subtask_title: { $regex: search, $options: 'i' } },
          { delay_reason: { $regex: search, $options: 'i' } },
          { close_reason: { $regex: search, $options: 'i' } }
        ];
      }

      const totalDocuments = await TaskParticipant.countDocuments(filter);
      const totalPages = Math.ceil(totalDocuments / pageLimit);
      const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

      const participants = await TaskParticipant.find(filter)
        .sort({ participants_id: sortOrder })
        .skip(offset)
        .limit(pageLimit);

      const enrichedParticipants = await Promise.all(participants.map(async (participant) => {
        const task = await Task.findById(participant.task_id);
        const taskObj = task ? task.toObject() : {};
        delete taskObj._id; // prevent task _id from overwriting participant _id
        return {
          ...participant.toObject(),
          participants_id: participant._id.toString(),
          ...taskObj
        };
      }));

      res.status(200).json({
        message: `${msgField} Success`,
        data: enrichedParticipants,
        pageNumber,
        totalPages,
        pageLimit,
        totalDocuments,
        balanceDocuments,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} Error: ${message}`);
      res.status(500).json({ error: `${msgField} Error: ${message}` });
    }
  };