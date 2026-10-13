import { Request, Response } from "express";
import { Task, Client, Project, Milestone, TaskParticipant } from '../../../db/ModelSceham/project/client';
import { Team } from '../../../db/ModelSceham/teams/team';
import { UserInfo } from '../../../db/ModelSceham/userSchema';
import { Branch } from '../../../db/ModelSceham/branchSchema';
import { Campaign } from '../../../db/ModelSceham/project/campagin';
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewProjectTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  const msgField = `View Project Task Info`;
  const { userId: idObj, userRole, tenantId, brcode } = req.user as AuthenticatedUser;
  let {
    milestone_code,
    staff_id,
    project_code,
    client_code,
    overdue,
    taskid,
    start_date,
    end_date,
    type,
    status,
    search,
    dec,
    page = 1,
    limit = 25,
  } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    // Superadmin and master_super_admin can see all tasks
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see tasks from their specific branch
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

    if (taskid) {
      if (mongoose.Types.ObjectId.isValid(taskid as string)) {
        filter._id = taskid;
      } else {
        res.status(400).json({ error: "Invalid task ID" });
        return;
      }
    }
    if (status) filter.status = status;
    if (milestone_code) filter.milestone_code = { $regex: milestone_code, $options: 'i' };
    if (project_code) filter.project_code = { $regex: project_code, $options: 'i' };
    if (type) filter.task_priority = { $regex: type, $options: 'i' };
    if (client_code) filter.client_code = { $regex: client_code, $options: 'i' };

    if (search) {
      filter.$or = [
        { task_title: { $regex: search, $options: 'i' } },
        { handler_by: { $regex: search, $options: 'i' } }
      ];
    }

    if (staff_id) {
      const taskIds = await TaskParticipant.distinct('task_id', { staff_id, ...(status && { status }) });
      filter._id = { $in: taskIds };
    }

    if (overdue) {
      const overdueDate = new Date(overdue as string);
      overdueDate.setHours(23, 59, 59, 999);
      filter.end_date = { $lte: overdueDate };
      filter.status = { $ne: 'verified-closed' };
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (start_date && !end_date) {
      const startDate = new Date(start_date as string);
      filter.start_date = { $gte: startDate, $lte: now };
    } else if (!start_date && end_date) {
      const endDate = new Date(end_date as string);
      endDate.setHours(23, 59, 59, 999);
      filter.end_date = { $lte: endDate };
    } else if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      endDate.setHours(23, 59, 59, 999);
      filter.end_date = { $gte: startDate, $lte: endDate };
    }

    const totalDocuments = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const tasks = await Task.find(filter)
      .sort({ _id: sortOrder })
      .skip(offset)
      .limit(pageLimit);

    const taskIds = tasks.map((task) => task._id);
    
    if (taskIds.length === 0) {
      res.status(200).json({
        message: `${msgField} Success`,
        data: [],
        pageNumber,
        totalPages,
        pageLimit,
        totalDocuments,
        balanceDocuments,
      });
      return;
    }

    // Enrich tasks with related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const client = await Client.findOne({ client_code: task.client_code });
        const project = await Project.findOne({ project_code: task.project_code });
        const milestone = await Milestone.findOne({ milestone_code: task.milestone_code });
        const team = await Team.findOne({ team_id: task.team_id });
        const user = await UserInfo.findOne({ staff_id: task.handler_by });
        const branch = await Branch.findOne({ branchcode: task.branchcode });
        const campaign = await Campaign.findOne({ campaign_code: task.campaign_code });

        const participantCount = await TaskParticipant.countDocuments({
          task_id: task._id,
          ...(status && { status })
        });

        return {
          ...task.toObject(),
          id: task._id.toString(),
          client_name: client?.client_name,
          projecttitle: project?.title,
          milestonetitle: milestone?.miles_title,
          teamname: team?.team_name,
          handlername: user ? `${user.firstname} ${user.lastname}` : null,
          branchname: branch?.name,
          campaignname: campaign?.campaignname,
          participant_count: participantCount,
        };
      })
    );

    // Fetch participants for all tasks
    const participants = await TaskParticipant.find({ task_id: { $in: taskIds } });
    const participantMap: { [taskId: string]: any[] } = {};

    for (const participant of participants) {
      const taskId = String(participant.task_id);
      if (!participantMap[taskId]) participantMap[taskId] = [];
      
      const user = await UserInfo.findOne({ staff_id: participant.staff_id });
      participantMap[taskId].push({
        participants_id: participant._id.toString(),
        subtitle: participant.subtask_title,
        subtask_priority: participant.subtask_priority,
        staff_id: participant.staff_id,
        name: user ? `${user.firstname} ${user.lastname}` : null,
        status: participant.status || null,
        rating: participant.rating || 0,
        lastupdate: participant.updated_on || null,
      });
    }

    for (const task of enrichedTasks) {
      task.participantdetails = participantMap[String(task._id)] || [];
    }

    res.status(200).json({
      message: `${msgField} Success`,
      data: enrichedTasks,
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
