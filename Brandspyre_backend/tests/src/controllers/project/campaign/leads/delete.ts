import mongoose from 'mongoose';
import { Lead } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";

import {checkIfExists, checkIfNotExists, syncCampaignLeadData } from '../../helperfunction'

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface data {
  branchcode: string,
  campaign_code?: string,
  [key: string]: string | undefined;
}

export const deleteLeadsInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete Leads Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { data: leads } = req.body as { data: data };
  const loginId = idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check logged-in user
    await checkIfExists(null, "userinfo", "staff_id = $1", [loginId], "Logged-in user not found");

    // Validate references
    await checkIfExists(null, "campaign", "campaign_code = $1", [leads.campaign_code], "Campaign not found");

    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id, campaign_code: leads.campaign_code, branchcode: leads.branchcode }
      : { id: Number(req.params.id), campaign_code: leads.campaign_code, branchcode: leads.branchcode };

    const deleteRes = await Lead.findOneAndDelete(filter).session(session).lean();
    if (!deleteRes) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Given row ID not found or does not belong to this user.' });
      return;
    }

    await syncCampaignLeadData(leads.campaign_code || '', "Failed to sync campaign lead stats");
    await session.commitTransaction();

    res.status(201).json({ message: `${msgField} Success` });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};