import mongoose from 'mongoose';
import { Followup } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";

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
  lead_id?: string;
  next_date?: string;
  status?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export const editFollowupInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Leads Follow-up Info`;
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
    // Validate Campaign
    await checkIfExists(null, "campaign", "campaign_code = $1", [userData.campaign_code], "Campaign not found");
    // Validate Leads
    await checkIfExists(null, "leads", "id = $1", [userData.lead_id], "Lead not found");
    // Validate followup
    await checkIfExists(null, "followup", "id = $1", [req.params.id], "Follow-up not found");

    userData.updated_on = new Date().toISOString();

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, lead_id: userData.lead_id }
      : { id: Number(req.params.id), lead_id: userData.lead_id };

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updateRes = await Followup.findOneAndUpdate(
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