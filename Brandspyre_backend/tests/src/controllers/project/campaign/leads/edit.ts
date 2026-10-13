import mongoose from 'mongoose';
import { Lead } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";
import { billingEventBus } from "../../../../services/billingEventBus";

import { buildDynamicInsert } from '../../../user/userManagement/helperFunction'
import {checkIfExists, checkIfNotExists, syncCampaignLeadData } from '../../helperfunction'

interface AuthenticatedUser {
  userId: number;
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
  [key: string]: string | undefined;
}

export const editLeadsInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Leads Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { data: userData } = req.body as { data: data };
  const loginId = idObj;

  const session = await mongoose.startSession();
  try {
    if (!req.params.id) {
      res.status(400).json({ message: `id parameter is missing` });
      return;
    }
    session.startTransaction();

    // Check logged-in user
    await checkIfExists(null, "userinfo", "id = $1", [loginId], "Logged-in user not found");

    const requiredFields = ['campaign_code'];
    const missingFields = requiredFields.filter(
      field => !(userData as Record<string, string | undefined>)[field]
    );
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
      await session.abortTransaction();
      return;
    }
    // Validate references
    await checkIfExists(null, "campaign", "campaign_code = $1", [userData.campaign_code], "Campaign not found");
    if (userData.assignee_id) {
      await checkIfExists(null, "userinfo", "staff_id = $1", [userData.assignee_id], "Assigned user not found");
    }

    // Prevent duplicate (phone or email)
    const existsFilter: Record<string, any> = {
      branchcode: userData.branchcode,
      campaign_code: userData.campaign_code,
      phone: userData.phone,
      ...(mongoose.Types.ObjectId.isValid(req.params.id)
        ? { _id: { $ne: req.params.id } }
        : { id: { $ne: Number(req.params.id) } })
    };

    const exists = await Lead.findOne(existsFilter).session(session).lean();
    if (exists) {
      throw new Error("Phone or Email already exists for this campaign");
    }

    userData.updated_on = new Date().toISOString();

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, campaign_code: userData.campaign_code }
      : { id: Number(req.params.id), campaign_code: userData.campaign_code };

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updateRes = await Lead.findOneAndUpdate(
      filter,
      { $set: cleanUpdateObj(userData) },
      { new: true, session }
    ).lean() as any;

    if (!updateRes) {
      res.status(404).json({ message: 'given row ids is not found' });
      await session.abortTransaction();
      return;
    }

    await syncCampaignLeadData(updateRes.campaign_code || '', "Failed to sync campaign lead stats");
    await session.commitTransaction();

    // Publish LEAD_STAGE_UPDATED event to EventBus for decoupled billing processing
    if (updateRes.status) {
      const tenantId = (req as any).tenant?.id || updateRes.tenant_id;
      billingEventBus.emit("LEAD_STAGE_UPDATED", {
        leadId: updateRes._id.toString(),
        newStage: updateRes.status,
        tenantId,
        branchcode: updateRes.branchcode,
        updatedBy: (req as any).user?.id || 'system',
        conversionDate: new Date()
      });
    }

    res.status(201).json({ message: `${msgField} Success`, data: { ...updateRes, id: updateRes._id.toString() } });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};