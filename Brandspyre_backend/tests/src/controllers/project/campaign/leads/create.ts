import { Request, Response } from "express";
import { Lead, Followup, Campaign } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { syncCampaignLeadData } from "../../helperfunction";
import { billingEventBus } from "../../../../services/billingEventBus";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

interface data {
  branchcode: string;
  campaign_code?: string;
  lead_date?: string;
  lead_name?: string;
  phone?: string;
  email?: string;
  assignee_id?: string;
  comm_type?: string;
  proj_type?: string;
  status?: string;
  summary?: string;
  next_date?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export const createLeadsInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Leads Info`;
  let { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  const { data: userDatas } = req.body;

  try {
    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw } as data;

      try {
        const loginUser = await UserInfo.findOne({ _id: new mongoose.Types.ObjectId(idObj) }).lean();
        if (!loginUser) throw new Error("Logged-in user not found");

        const requiredFields = ['branchcode', 'lead_name', 'phone'];
        const missing = requiredFields.filter(field => !userData[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
        }

        const campaign = await Campaign.findOne({ campaign_code: userData.campaign_code }).lean();
        if (!campaign) throw new Error("Campaign not found");

        const assignee = await UserInfo.findOne({ staff_id: userData.assignee_id }).lean();
        if (!assignee) throw new Error("Assigned user not found");

        const existingLead = await Lead.findOne({
          branchcode: userData.branchcode,
          campaign_code: userData.campaign_code,
          phone: userData.phone
        }).lean();
        if (existingLead) throw new Error("Phone or Email already exists for this campaign");

        const leadDoc = await Lead.create({
          branchcode: userData.branchcode,
          campaign_code: userData.campaign_code,
          lead_date: userData.lead_date,
          lead_name: userData.lead_name,
          phone: userData.phone,
          email: userData.email,
          assignee_id: userData.assignee_id,
          comm_type: userData.comm_type,
          proj_type: userData.proj_type,
          status: userData.status,
          summary: userData.summary || '',
        });

        if (userData.next_date) {
          await Followup.create({
            branchcode: userData.branchcode,
            campaign_code: userData.campaign_code,
            lead_id: leadDoc._id.toString(),
            next_date: userData.next_date,
            status: userData.status,
            notes: userData.notes,
          });
        }

        await syncCampaignLeadData(userData.campaign_code || '', 'Failed to sync campaign lead stats');

        if (userData.status) {
          const tenantId = (req as any).tenant?.id || (leadDoc as any).tenant_id;
          billingEventBus.emit("LEAD_STAGE_UPDATED", {
            leadId: leadDoc._id.toString(),
            newStage: userData.status,
            tenantId,
            branchcode: userData.branchcode,
            updatedBy: idObj ? String(idObj) : 'system',
            conversionDate: new Date()
          });
        }

        const obj = leadDoc.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);

      } catch (err) {
        failed.push({
          user: userDataRaw,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (created.length === 0 && failed.length > 0) {
      console.log("createLeadsInfo failed items:", failed);
      const allNotFound = failed.every(f => f.error.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed`,
        data: { successCount: 0, failedCount: failed.length, created, failed },
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: { successCount: created.length, failedCount: failed.length, created, failed },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};