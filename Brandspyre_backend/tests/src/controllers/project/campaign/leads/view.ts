import { Request, Response } from "express";
import { Lead, Followup } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import mongoose from "mongoose";
import { getTenantFilter } from "../../../../utils/tenantScope";
import { isPlatformAdminRole, isTenantAdminRole } from "../../../../middleware/securityContext";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewLeadsInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Leads Info`;
  const { userRole, brcode } = req.user as AuthenticatedUser;
  let { campaign_code, branchcode, campaigntype, search, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    const tenantFilter = getTenantFilter(req);
    let filter: any = { ...tenantFilter };

    const isPlatform = isPlatformAdminRole(userRole);
    const isTenantAdmin = isTenantAdminRole(userRole);

    if (!isPlatform && !isTenantAdmin) {
      if (brcode) {
        filter.branchcode = brcode;
      }
    } else if (branchcode) {
      filter.branchcode = new RegExp(String(branchcode), 'i');
    }

    if (campaign_code) filter.campaign_code = campaign_code;
    if (campaigntype) filter.campaigntype = new RegExp(String(campaigntype), 'i');

    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { phone: regex }, { email: regex }, { lead_name: regex },
        { lead_date: regex }, { assignee_id: regex }, { comm_type: regex },
        { proj_type: regex }, { status: regex },
      ];
    }

    const totalDocuments = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const leads = await Lead.find(filter).sort({ _id: sortOrder }).skip(skip).limit(pageLimit).lean();
    const mappedLeads = leads.map((l: any) => ({ ...l, id: l._id.toString() }));

    res.status(200).json({ message: `${msgField} Success`, data: mappedLeads, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const viewLeadsDropDownInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Leads Dropdown Info`;
  const { userRole, tenantId, brcode } = req.user as AuthenticatedUser;
  let { campaign_code, branchcode, lead_id, search, status, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    let filter: any = {};

    // Superadmin and master_super_admin can see all leads
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see leads from their specific branch
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

    if (lead_id) filter._id = lead_id;
    if (branchcode) filter.branchcode = branchcode;
    if (campaign_code) filter.campaign_code = campaign_code;
    if (status) filter.status = status;
    if (search) {
      filter.lead_name = new RegExp(String(search), 'i');
    }

    const totalDocuments = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const leads = await Lead.find(filter, 'branchcode campaign_code lead_name status')
      .sort({ _id: sortOrder }).skip(skip).limit(pageLimit).lean();

    const data = leads.map((l: any) => ({ ...l, id: l._id.toString() }));

    res.status(200).json({ message: `${msgField} Success`, data, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const getSingleLeadWithFollowupsDetails = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Get Lead with Followups`;
  const { lead_id: leadId } = req.query;

  try {
    if (!leadId) {
      res.status(400).json({ error: "Lead ID is required" });
      return;
    }

    const tenantFilter = getTenantFilter(req);
    const lead = await Lead.findOne({ _id: leadId, ...tenantFilter }).lean() as any;
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const assignee = await UserInfo.findOne({ staff_id: lead.assignee_id, ...tenantFilter }).lean() as any;
    const followups = await Followup.find({ lead_id: leadId, ...tenantFilter }).sort({ next_date: 1, created_on: 1 }).lean() as any[];

    const response = {
      id: lead._id.toString(),
      branchcode: lead.branchcode,
      campaign_code: lead.campaign_code,
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
      create_on: lead.created_on,
      lastupdate: lead.updated_on,
      followup: followups.map((f: any) => ({
        id: f._id.toString(),
        branchcode: f.branchcode,
        campaign_code: f.campaign_code,
        next_date: f.next_date || f.nextfollowupdate,
        status: f.status,
        notes: f.notes || f.summary,
        lastupdate: f.updated_on,
      })),
    };

    res.status(200).json({ message: msgField + " success", data: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};