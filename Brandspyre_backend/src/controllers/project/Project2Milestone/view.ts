import { Request, Response } from "express";
import { Milestone, Project, Task } from '../../../db/ModelSceham/project/client';
import { RoleAccess } from '../../../db/ModelSceham/roleAccessSchema';
import mongoose from "mongoose";
import { getMilestoneSummaryByCode } from './getSummaryMilestone';

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

export const viewProjectMilestone = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Project Milestone Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { milestone_code, project_code, client_code, type, status, overdue, initiated, done, partial, search, taskid, start_date, end_date, dec, page = 1, limit = 25 } = req.query;

  const loginId = String(idObj);

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    // Superadmin and master_super_admin can see all milestones
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see milestones from their specific branch
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

    if (status) filter.status = status;
    if (milestone_code) filter.milestone_code = { $regex: milestone_code, $options: 'i' };
    if (project_code) filter.project_code = { $regex: project_code, $options: 'i' };
    if (type) filter.milestone_type = { $regex: type, $options: 'i' };
    if (client_code) filter.client_code = { $regex: client_code, $options: 'i' };

    if (initiated) {
      filter.start_approval = 'start';
      filter.status = 'ongoing';
    }

    if (done) {
      filter.status = 'verified';
      filter.paystatus = 'none';
    }

    if (partial) {
      filter.status = 'verified';
      filter.paystatus = 'partial_paid';
    }

    if (overdue) {
      const overdueDate = new Date(overdue as string);
      overdueDate.setHours(23, 59, 59, 999);
      filter.end_date = { $lte: overdueDate };
      filter.status = { $ne: 'verified' };
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const currentDateEndTime = now.toISOString();

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

    // Role Access Logic - skip for tenant admins
    if (userRole !== 'admin') {
        const roleAccessDoc = await RoleAccess.findOne({ role: userRole, branchcode: brcode });
        let milestoneAccess: { all: boolean; own: boolean } = { all: false, own: false };
        
        if (roleAccessDoc && roleAccessDoc.milestone) {
            milestoneAccess = roleAccessDoc.milestone;
        }

        if (milestoneAccess.all !== true) {
            const project = await Project.findOne({ project_code: { $regex: project_code || '', $options: 'i' } });
            const handlerBy = project?.handler_by;
            
            filter.$or = [
                { handler_by: loginId },
                { handler_by: handlerBy }
            ];
        }
    }

    const totalDocuments = await Milestone.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const milestones = await Milestone.find(filter)
      .sort({ milestone_code: sortOrder })
      .skip(offset)
      .limit(pageLimit);

    const final = await Promise.all(
      milestones.map(async (milestone) => {
        const progress = await getMilestoneSummaryByCode(milestone.milestone_code);
        return {
          ...milestone.toObject(),
          ...progress,
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

export const viewProjectMilestoneDropDown = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Project Milestone Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { milestone_code, branchcode, campaign_code, project_code, overdue, client_code, start_date, end_date, milestone_type, paystatus, search, dec, page = 1, limit = 25 } = req.query;

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

    if (milestone_code) filter.milestone_code = milestone_code;
    if (branchcode) filter.branchcode = branchcode;
    if (campaign_code) filter.campaign_code = campaign_code;
    if (project_code) filter.project_code = project_code;
    if (client_code) filter.client_code = client_code;
    if (milestone_type) filter.milestone_type = milestone_type;
    if (paystatus) filter.paystatus = paystatus;

    if (search) {
      filter.miles_title = { $regex: search, $options: 'i' };
    }

    if (overdue) {
      const overdueDate = new Date(overdue as string);
      overdueDate.setHours(23, 59, 59, 999);
      filter.end_date = { $lte: overdueDate };
      filter.status = { $ne: 'verified' };
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

    const totalDocuments = await Milestone.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const milestones = await Milestone.find(filter)
      .sort({ milestone_code: sortOrder })
      .skip(offset)
      .limit(pageLimit);

    res.status(201).json({
      message: `${msgField} Success`,
      data: milestones,
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
