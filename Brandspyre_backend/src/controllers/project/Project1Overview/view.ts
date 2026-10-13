import { Request, Response } from "express";
import { Project, Milestone, Task } from '../../../db/ModelSceham/project/client';
import { RoleAccess } from '../../../db/ModelSceham/roleAccessSchema';
import mongoose from "mongoose";
import { getProjectSummaryByCode } from './helperFunction';
import { getProject } from '../getProject';
import { getMilestones } from '../getMilestone';
import { getCompletedTask } from '../getTask';
import { getCompletedTaskParticipants } from '../getTask_participant';
import { getProjectDetailsWithMilestones } from './getProjectDetailsWithMilestones';

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

export const viewProjectOverview = async (req: Request, res: Response): Promise<void> => {
    const msgField = `View Project Overview Info`;
    const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
    let { project_code, branchcode, client_code, campaign_code, priority, paystatus, status, 
        start_date, end_date, overdue, n_days, filter_type, search, dec, initiate, approved, completed, page = 1, limit = 25 } = req.query;
    
    const loginId = String(idObj);
    try {
        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);
        const offset = (pageNumber - 1) * pageLimit;
        const sortOrder = dec ? -1 : 1;

        const filter: any = {};

        const isPlatform = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((userRole || '').toLowerCase());

        // Platform admins have global access; tenant users are strictly scoped to their tenant
        if (!isPlatform) {
            if (!tenantId) {
                res.status(403).json({ success: false, message: "Organization context required" });
                return;
            }
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            filter.branchcode = brcode;
        } else if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }

        if (project_code) filter.project_code = project_code;
        if (paystatus) filter.paystatus = paystatus;
        if (isPlatform && branchcode) filter.branchcode = branchcode;
        if (campaign_code) filter.campaign_code = campaign_code;
        if (client_code) filter.client_code = client_code;
        if (priority) filter.priority = priority;
        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } },
                { loc: { $regex: search, $options: 'i' } },
                { handler_by: { $regex: search, $options: 'i' } }
            ];
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

        if (overdue) {
            const overdueDate = new Date(overdue as string);
            overdueDate.setHours(23, 59, 59, 999);
            filter.end_date = { $lte: overdueDate };
            filter.status = { $ne: 'completed' };
        }

        if (initiate) {
            filter.start_approval = 'start';
            filter.status = 'initiated';
        }

        if (approved) {
            filter.start_approval = 'start';
            filter.status = 'ongoing';
        }

        if (completed) {
            filter.start_approval = 'start';
            filter.status = 'completed';
        }

        // Role Access Logic - skip for tenant admins
        if (userRole !== 'admin') {
            const roleAccessDoc = await RoleAccess.findOne({ role: userRole, branchcode: brcode });
            let projectAccess: { all: boolean; own: boolean } = { all: false, own: false };
            
            if (roleAccessDoc && roleAccessDoc.project) {
                projectAccess = roleAccessDoc.project;
            }

            if (projectAccess.all !== true) {
                filter.$or = [
                    { handler_by: loginId },
                    { project_code: { $in: await Milestone.distinct('project_code', { handler_by: loginId }) } },
                    { project_code: { $in: await Task.distinct('mile_code', { handler_by: loginId }) } }
                ];
            }
        }

        // TODO: Team-based filter when team_members table is migrated to MongoDB
        // if (req.query.team_id) {
        //   const team_id = req.query.team_id as string;
        //   filter.handler_by = { $in: await TeamMember.distinct('staff_id', { team_id }) };
        // }

        const totalDocuments = await Project.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / pageLimit);
        const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

        const projects = await Project.find(filter)
            .sort({ created_on: sortOrder === 1 ? 1 : -1 })
            .skip(offset)
            .limit(pageLimit);

        const final = await Promise.all(
            projects.map(async (project) => {
                const progress = await getProjectSummaryByCode(project.project_code);
                const projectObj = project.toObject();
                projectObj.overallcost = project.overallcost !== undefined && project.overallcost !== 0 ? project.overallcost : (project.revised_cost || project.budget || 0);
                projectObj.balance_amount = project.balance_amount !== undefined && project.balance_amount !== 0 ? project.balance_amount : (project.balance || 0);
                return {
                    ...projectObj,
                    ...progress,
                    total_paid_amount: 0, // TODO: calculate from project_invoice
                    computed_paystatus: 'mid_payment', // TODO: calculate based on milestone paystatus and payments
                };
            })
        );

        res.status(201).json({
            message: `${msgField} Success`,
            data: final,
            pageNumber,
            totalPages,
            pageLimit,
            totalDocuments,
            balanceDocuments,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
    }
};

export const viewProjectDropDown = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Project Drop Down Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { project_code, lead_id, branchcode, client_code, campaign_code, status, search, dec, page=1, limit=25 } = req.query;
  
  try {
      const pageNumber = parseInt(page as string, 10);
      const pageLimit = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * pageLimit;
      const sortOrder = dec ? -1 : 1;

      const filter: any = {};
      
      // Filter by branch for tenant admins
      if (userRole === 'admin' && tenantId) {
        filter.branchcode = brcode;
      }
      
      if (project_code) filter.project_code = project_code;
      if (branchcode) filter.branchcode = branchcode;
      if (campaign_code) filter.campaign_code = campaign_code;
      if (lead_id) filter.lead_id = lead_id;
      if (client_code) filter.client_code = client_code;
      if (status) filter.status = status;
      
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      const totalDocuments = await Project.countDocuments(filter);
      const totalPages = Math.ceil(totalDocuments / pageLimit);
      const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

      const projects = await Project.find(filter, 'project_code title branchcode campaign_code lead_id client_code status')
        .sort({ project_code: sortOrder })
        .skip(offset)
        .limit(pageLimit)
        .lean();

      res.status(201).json({ message: `${msgField} Success`, data: projects, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) { 
      const message = error instanceof Error ? error.message : String(error);
      console.log(`${msgField} Causes Error Message: ${message}`);
      res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const viewTypeDropdown = async (req: Request, res: Response): Promise<void> => {
  const msgField = "View Project Drop Down Info";
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { project_code, lead_id, branchcode, client_code, campaign_code, status, search, dec, page = "1", limit = "25", } = req.query;
  try {
      const pageNumber = parseInt(page as string, 10);
      const pageLimit = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * pageLimit;
      const sortOrder = dec ? -1 : 1;

      const filter: any = {};
      
      // Filter by branch for tenant admins
      if (userRole === 'admin' && tenantId) {
        filter.branchcode = brcode;
      }
      
      if (project_code) filter.project_code = project_code;
      if (branchcode) filter.branchcode = branchcode;
      if (campaign_code) filter.campaign_code = campaign_code;
      if (lead_id) filter.lead_id = lead_id;
      if (client_code) filter.client_code = client_code;
      if (status) filter.status = status;
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      const totalDocuments = await Project.countDocuments(filter);
      const totalPages = Math.ceil(totalDocuments / pageLimit);
      const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

      const types = await Project.distinct('type', filter);
      const paginatedTypes = types.slice(offset, offset + pageLimit);

      const data = paginatedTypes.map(t => ({ type: t, status: status || 'active' }));

      res.status(200).json({
          message: `${msgField} Success`,
          data,
          pageNumber,
          totalPages,
          pageLimit,
          totalDocuments,
          balanceDocuments,
      });
  } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} Causes Error Message: ${message}`);
      res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const getClientProgressTree = async (client_code: string) => {
  try {
    const result: any = {
      client_code,
      projects: [],
      success: true,
    };

    const projects = await Project.find({ client_code }).lean() as any[];

    for (const project of projects) {
      const project_code = project.project_code;
      const projectStats = await getProject("project", "client_code", client_code);

      const projectNode: any = {
        project_code,
        projectStats,
        milestones: [],
      };

      const milestones = await Milestone.find({ project_code }).lean() as any[];

      for (const milestone of milestones) {
        const milestone_code = milestone.milestone_code;
        const milestoneStats = await getMilestones("milestone", "project_code", project_code);

        const milestoneNode: any = {
          milestone_code,
          milestoneStats,
          tasks: [],
        };

        const tasks = await Task.find({ milestone_code }).lean() as any[];

        for (const task of tasks) {
          const task_id = task._id.toString();
          const taskStats = await getCompletedTask("task", "milestone_code", milestone_code);
          const participantStats = await getCompletedTaskParticipants("task_participants", "task_id", task_id);

          const taskNode: any = {
            task_id,
            taskStats,
            participantStats,
          };

          milestoneNode.tasks.push(taskNode);
        }

        projectNode.milestones.push(milestoneNode);
      }

      result.projects.push(projectNode);
    }

    return result;
  } catch (error: any) {
    console.error("Error in getClientProgressTree:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

export const viewProjectWithMilestones = async (req: Request, res: Response): Promise<void> => {
  const msg = `View Project With Milestones`;
  try {
    const { project_code } = req.query;
    const data = await getProjectDetailsWithMilestones(project_code as string);

    if (!data) {
       res.status(404).json({ error: "Project not found" });
       return;
    }

     res.status(200).json({ data });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} Error: ${message}`);
    res.status(500).json({ error: `${msg} Error: ${message}` });
  }
};
