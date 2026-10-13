import mongoose from 'mongoose';
import { Campaign } from "../../../../db/ModelSceham/project/campagin";
import { Lead } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Followup } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";

import { settingAccessControl } from "../../../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: number;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

export const viewCampaignInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Campaign Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { campaign_code, branchcode, status, campaigntype, search, dec, page = 1, limit = 25 } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    // Superadmin and master_super_admin can see all campaigns
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see campaigns from their specific branch
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

    if (campaign_code) filter.campaign_code = campaign_code;
    if (branchcode) filter.branchcode = { $regex: branchcode, $options: 'i' };
    if (campaigntype) filter.campaigntype = { $regex: campaigntype, $options: 'i' };
    if (status) filter.status = { $regex: status, $options: 'i' };
    if (search) {
      filter.$or = [
        { campaignname: { $regex: search, $options: 'i' } },
        { startdate: { $regex: search, $options: 'i' } },
        { enddate: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const totalDocuments = await Campaign.countDocuments(filter).session(session);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const campaigns = await Campaign.find(filter)
      .sort({ campaign_code: sortOrder })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const data = await Promise.all(campaigns.map(async (c: any) => {
      const leads = await Lead.find({ campaign_code: c.campaign_code }).session(session).lean() as any[];
      return {
        ...c,
        id: c._id.toString(),
        lead: leads.length,
        leads: leads.map(l => ({
          id: l._id.toString(),
          lead_date: l.lead_date,
          lead_name: l.lead_name,
          phone: l.phone,
          email: l.email,
          assignee_id: l.assignee_id,
          comm_type: l.comm_type,
          proj_type: l.proj_type,
          status: l.status,
          summary: l.summary,
          created_on: l.created_on
        }))
      };
    }));

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};

export const viewCampaignDropdownInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Campaign Dropdown Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { campaign_code, branchcode, search, campaigntype, status, dec, page = 1, limit = 25 } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    // Superadmin and master_super_admin can see all campaigns
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see campaigns from their specific branch
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

    if (campaign_code) filter.campaign_code = campaign_code;
    if (branchcode) filter.branchcode = { $regex: branchcode, $options: 'i' };
    if (campaigntype) filter.campaigntype = { $regex: campaigntype, $options: 'i' };
    if (status) filter.status = { $regex: status, $options: 'i' };
    if (search) {
      filter.$or = [
        { campaignname: { $regex: search, $options: 'i' } }
      ];
    }

    const totalDocuments = await Campaign.countDocuments(filter).session(session);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const campaigns = await Campaign.find(filter)
      .select('branchcode campaignname campaign_code campaigntype status')
      .sort({ campaign_code: sortOrder })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const data = campaigns.map(c => ({
      ...c,
      id: c._id.toString()
    }));

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};

export const viewSingleCampaignDetails = async (req: Request, res: Response): Promise<void> => {
  const msg = "View Single Campaign Details";
  const { campaign_code } = req.query;

  if (!campaign_code) {
    res.status(400).json({ error: "campaign_code is required" });
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const c = await Campaign.findOne({ campaign_code }).session(session).lean() as any;
    if (!c) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const leads = await Lead.find({ campaign_code }).session(session).lean() as any[];

    const leadsData = await Promise.all(leads.map(async (l: any) => {
      let assignee_name = null;
      if (l.assignee_id) {
        const u = await UserInfo.findOne({ staff_id: l.assignee_id }).session(session).lean() as any;
        if (u) assignee_name = `${u.firstname || ''} ${u.lastname || ''}`.trim();
      }
      
      let next_date = null;
      const f = await Followup.findOne({
        $or: [
          { lead_id: l._id.toString() },
          { lead_id: l.id }
        ]
      })
      .sort({ next_date: -1 })
      .session(session)
      .lean() as any;

      if (f) next_date = f.next_date;

      return {
        id: l._id.toString(),
        lead_date: l.lead_date,
        lead_name: l.lead_name,
        phone: l.phone,
        email: l.email,
        assignee_id: l.assignee_id,
        assignee_name,
        comm_type: l.comm_type,
        proj_type: l.proj_type,
        status: l.status,
        summary: l.summary,
        lastupdate: l.updated_on || l.created_on,
        next_date: next_date || null
      };
    }));

    const result = {
      campaign_code: c.campaign_code,
      branchcode: c.branchcode,
      campaginName: c.campaignname,
      campaigntype: c.campaigntype,
      startdate: c.startdate,
      enddate: c.enddate,
      lead: leadsData.length,
      totallead: c.totallead,
      goallead: c.goallead,
      conversationrate: c.conversationrate,
      status: c.status,
      summary: c.summary,
      lastupdate: c.updated_on || c.created_on,
      leads: leadsData
    };

    await session.commitTransaction();

    res.status(200).json({ message: `${msg} Success`, data: result });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (e) {
        console.error("Rollback error:", e);
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msg} Error: ${message}`);
    res.status(500).json({ error: `${msg} Error: ${message}` });
  } finally {
    session.endSession();
  }
};

export const campaignReportByBranch = async (req: Request, res: Response) => {
  const msgField = 'Campaign Report by Branch';
  const { userRole, tenantId } = req.user as AuthenticatedUser;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const campaignFilter: any = {};
    // Multi-tenant: Add tenant_id filter for non-master_super_admin users
    if (userRole !== 'master_super_admin' && tenantId) {
      campaignFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    const campaigns = await Campaign.find(campaignFilter).session(session).lean() as any[];
    const leads = await Lead.find(campaignFilter).session(session).lean() as any[];
    const followups = await Followup.find(campaignFilter).session(session).lean() as any[];

    const rows = campaigns.map(c => {
      const cLeads = leads.filter(l => l.campaign_code === c.campaign_code);
      const assignedLeads = cLeads.filter(l => l.assignee_id != null);
      const leadIds = cLeads.map(l => l._id.toString());
      const cFollowups = followups.filter(f => leadIds.includes(String(f.lead_id)));
      const activeFollowups = cFollowups.filter(f => f.status === 'inprogress' || f.status === 'in_progress');
      const conversion_rate = c.goallead === 0 ? 0 : parseFloat(((c.totallead / c.goallead) * 100).toFixed(2));
      return {
        branchcode: c.branchcode,
        campaign_code: c.campaign_code,
        campaignname: c.campaignname,
        total_leads: cLeads.length,
        leads_assigned: assignedLeads.length,
        total_followups: cFollowups.length,
        active_followups: activeFollowups.length,
        goallead: c.goallead,
        totallead: c.totallead,
        conversion_rate
      };
    });

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} generated successfully`,
      data: rows
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};