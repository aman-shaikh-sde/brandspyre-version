import { Request, Response } from "express";
import { ClientModel, Project } from "../../../../db/ModelSceham/project/client";
import { Campaign, Lead, Followup } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { getClientProjectSummary } from './getClientProjectSummary';
import { getClientWithProjectDetails } from './getClientWithProjectDetails';
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewClientInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Client Info`;
  const { userRole, tenantId, brcode } = req.user as AuthenticatedUser;
  let { client_code, branchcode, status, start_date, end_date, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    let filter: any = {};

    // Platform admins can view across tenants or filter by branch
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      if (branchcode) filter.branchcode = new RegExp(String(branchcode), 'i');
    } else {
      if (!tenantId) {
        res.status(403).json({ error: "Tenant context required." });
        return;
      }
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
      if (userRole === 'admin') {
        if (branchcode) filter.branchcode = new RegExp(String(branchcode), 'i');
      } else {
        filter.branchcode = brcode;
      }
    }

    if (client_code) filter.client_code = client_code;
    if (status) filter.status = new RegExp(String(status), 'i');

    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { client_name: regex }, { company_name: regex },
        { primary_phone: regex }, { email: regex },
        { office_address: regex }, { industry_type: regex },
        { comm_type: regex },
      ];
    }

    if (start_date && end_date) {
      const sDate = new Date(`${start_date}T00:00:00Z`);
      const eDate = new Date(`${end_date}T23:59:59Z`);
      const projectClientCodes = await Project.find({
        end_date: { $gte: sDate, $lte: eDate }
      }).distinct('client_code');
      filter.client_code = { ...(filter.client_code ? { $eq: filter.client_code } : {}), $in: projectClientCodes };
    }

    const totalDocuments = await ClientModel.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const clients = await ClientModel.find(filter)
      .sort({ client_code: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean() as any[];

    const final = await Promise.all(
      clients.map(async (client: any) => {
        const projectCount = await Project.countDocuments({ client_code: client.client_code });
        const progress = await getClientProjectSummary(client.client_code);
        return { ...client, project_count: projectCount, ...progress };
      })
    );

    res.status(200).json({ message: `${msgField} Success`, data: final, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const viewClientDropdownInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Client Dropdown Info`;
  const authUser = req.user as AuthenticatedUser | undefined;
  const userRole = authUser?.userRole;
  const tenantId = authUser?.tenantId;
  const brcode = authUser?.brcode;
  let { client_code, branchcode, campaign_code, search, status, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    let filter: any = {};
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      if (branchcode) filter.branchcode = branchcode;
    } else if (tenantId) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
      if (userRole === 'admin') {
        if (branchcode) filter.branchcode = branchcode;
      } else if (brcode) {
        filter.branchcode = brcode;
      }
    }

    if (client_code) filter.client_code = client_code;
    if (campaign_code) filter.campaign_code = campaign_code;
    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [{ client_name: regex }, { company_name: regex }];
    }

    const totalDocuments = await ClientModel.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const clients = await ClientModel.find(filter, 'client_code branchcode campaign_code client_name company_name status')
      .sort({ client_code: sortOrder }).skip(skip).limit(pageLimit).lean();

    res.status(200).json({ message: `${msgField} Success`, data: clients, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const viewSingleClientDetails = async (req: Request, res: Response): Promise<void> => {
  const msg = "View Single Campaign Details";
  const authUser = req.user as AuthenticatedUser | undefined;
  const userRole = authUser?.userRole;
  const tenantId = authUser?.tenantId;
  const { campaign_code } = req.query;

  if (!campaign_code) {
    res.status(400).json({ error: "campaign_code is required" });
    return;
  }

  try {
    const campaignFilter: any = { campaign_code };
    if (userRole !== 'superadmin' && userRole !== 'master_super_admin' && tenantId) {
      campaignFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }
    const campaign = await Campaign.findOne(campaignFilter).lean() as any;
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const leads = await Lead.find({ campaign_code }).sort({ updated_on: -1 }).lean() as any[];

    const enrichedLeads = await Promise.all(leads.map(async (lead: any) => {
      const assignee = await UserInfo.findOne({ staff_id: lead.assignee_id }).lean() as any;
      const latestFollowup = await Followup.findOne({ lead_id: lead._id.toString() })
        .sort({ next_date: -1, created_on: -1 }).lean() as any;

      return {
        id: lead._id.toString(),
        lead_date: lead.lead_date,
        lead_name: lead.lead_name,
        phone: lead.phone,
        email: lead.email,
        assignee_id: lead.assignee_id,
        assignee_name: assignee ? `${assignee.firstname} ${assignee.lastname}` : null,
        comm_type: lead.comm_type,
        proj_type: lead.proj_type,
        status: lead.status,
        summary: lead.summary,
        lastupdate: lead.updated_on,
        next_date: latestFollowup?.next_date || latestFollowup?.nextfollowupdate || null,
      };
    }));

    const result = {
      campaign_code: campaign.campaign_code,
      branchcode: campaign.branchcode,
      campaginName: campaign.campaignname,
      campaigntype: campaign.campaigntype,
      startdate: campaign.startdate,
      enddate: campaign.enddate,
      lead: campaign.lead,
      totallead: campaign.totallead,
      goallead: campaign.goallead,
      conversationrate: campaign.conversationrate,
      status: campaign.status,
      summary: campaign.summary,
      lastupdate: campaign.updated_on,
      leads: enrichedLeads,
    };

    res.status(200).json({ message: `${msg} Success`, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} Error: ${message}`);
    res.status(500).json({ error: `${msg} Error: ${message}` });
  }
};

export const viewClientWithProjects = async (req: Request, res: Response): Promise<void> => {
  const msg = `View Client With Projects`;
  const authUser = req.user as AuthenticatedUser | undefined;
  const userRole = authUser?.userRole;
  const tenantId = authUser?.tenantId;
  try {
    const { client_code, start_date, end_date } = req.query;
    const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin';
    const result = await getClientWithProjectDetails(client_code as string, start_date as string, end_date as string, tenantId, isPlatformAdmin);
    res.json({ data: result });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} Error: ${message}`);
    res.status(500).json({ error: `${msg} Error: ${message}` });
  }
};
