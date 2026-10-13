import mongoose from 'mongoose';
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Campaign } from "../../../../db/ModelSceham/project/campagin";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface campaign {
  branchcode: string,
  campaign_code?: string,
  status?: string,
  [key: string]: string | undefined;
}

export const deleteCampaignInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete campaign Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  let { data: camp } = req.body as { data: campaign };
  const loginId = idObj;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!existingUser) {
      await session.abortTransaction();
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!camp.status) {
      camp.status = 'inactive';
    }

    const filter = {
      campaign_code: camp.campaign_code,
      branchcode: camp.branchcode
    };

    const updateRes = await Campaign.findOneAndUpdate(
      filter,
      { $set: { status: camp.status } },
      { new: true, session }
    ).lean();

    if (!updateRes) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Given row ID not found or does not belong to this user.' });
      return;
    }

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