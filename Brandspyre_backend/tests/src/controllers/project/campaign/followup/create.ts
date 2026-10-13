import { Request, Response } from "express";
import { Lead, Followup, Campaign } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const createFollowupInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Leads Follow-up Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  const { data: userDatas } = req.body;

  try {
    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw };

      try {
        const loginUser = await UserInfo.findOne({ _id: new mongoose.Types.ObjectId(idObj) }).lean();
        if (!loginUser) throw new Error("Logged-in user not found");

        const requiredFields = ['branchcode', 'campaign_code', 'lead_id', 'next_date', 'status'];
        const missing = requiredFields.filter(field => !userData[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
        }

        const campaign = await Campaign.findOne({ campaign_code: userData.campaign_code }).lean();
        if (!campaign) throw new Error("Campaign not found");

        const lead = await Lead.findById(userData.lead_id).lean();
        if (!lead) throw new Error("Lead not found");

        const followupDoc = await Followup.create({
          branchcode: userData.branchcode,
          campaign_code: userData.campaign_code,
          lead_id: userData.lead_id,
          next_date: userData.next_date,
          status: userData.status,
          notes: userData.notes,
        });

        const obj = followupDoc.toObject() as any;
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