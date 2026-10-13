import mongoose from 'mongoose';
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Campaign } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface data {
  branchcode: string,
  campaign_code?: string,
  campaignname?: string,
  campaigntype?: string,
  startdate?: string,
  enddate?: string,
  status?: string,
  summary?: string,
  [key: string]: string | undefined;
}

export const editCampaignInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Campaign Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { data: userData } = req.body as { data: data };
  const loginId = idObj;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ _id: new mongoose.Types.ObjectId(loginId) }).session(session).lean();
    if (!existingUser) {
      res.status(409).json({ error: `User not found` });
      await session.abortTransaction();
      return;
    }

    const requiredFields = ['branchcode', 'campaign_code', 'campaignname', 'campaigntype', 'startdate', 'enddate', 'status'];
    const missingFields = requiredFields.filter(
      field => !(userData as Record<string, string | undefined>)[field]
    );
    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
      await session.abortTransaction();
      return;
    }

    userData.updated_on = new Date().toISOString();

    const filter = {
      campaign_code: userData.campaign_code,
      branchcode: userData.branchcode
    };

    const cleanUpdateObj = (obj: any) => {
      const resObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && v !== "") {
          resObj[k] = v;
        }
      }
      return resObj;
    };

    const updateRes = await Campaign.findOneAndUpdate(
      filter,
      { $set: cleanUpdateObj(userData) },
      { new: true, session }
    ).lean() as any;

    if (!updateRes) {
      res.status(404).json({ message: 'given row ids is not found' });
      await session.abortTransaction();
      return;
    }

    await session.commitTransaction();
    res.status(201).json({ message: `${msgField} Success`, result: { ...updateRes, id: updateRes._id.toString() } });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};