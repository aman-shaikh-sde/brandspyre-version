import mongoose from 'mongoose';
import { Campaign } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Sequence } from "../../../../db/ModelSceham/sequenceSchema";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface data {
  branchcode: string;
  campaignname?: string;
  campaigntype?: string;
  startdate?: string;
  enddate?: string;
  status?: string;
  goallead?: string;
  summary?: string;
  campaign_code?: string;
  [key: string]: any;
}

export const generateUniqueId = async (prefix: string, session?: mongoose.ClientSession): Promise<string> => {
  if (!prefix) {
    throw new Error("Prefix is required to generate UniqueId");
  }

  const seqVal = await Sequence.findOneAndUpdate(
    { name: 'campaign_code_seq' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );

  return `${prefix}/CAMP/${String(seqVal.value).padStart(3, "0")}`;
};

export const createCampaignInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create Campaign Info`;
  let { userId: idObj } = req.user as AuthenticatedUser;
  let { data: userDatas } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!Array.isArray(userDatas) || userDatas.length === 0) {
      res.status(400).json({ error: "userDatas must be a non-empty array" });
      return;
    }

    const created = [];
    const failed = [];

    for (const userDataRaw of userDatas) {
      const userData = { ...userDataRaw } as data;
      try {
        const loginUser = await UserInfo.findOne({ _id: new mongoose.Types.ObjectId(idObj) }).session(session).lean();
        if (!loginUser) {
          throw new Error("User not found");
        }

        const requiredFields = ['branchcode', 'campaignname', 'campaigntype'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`);
        }

        const campaign_code = await generateUniqueId(userData.branchcode, session);
        userData.campaign_code = campaign_code;

        const cleanObj = (obj: any) => {
          const resObj: any = {};
          for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined && v !== null && v !== "") {
              resObj[k] = v;
            }
          }
          return resObj;
        };

        const mongooseInsertDoc = cleanObj(userData);
        const [mongooseCreated] = await Campaign.create([mongooseInsertDoc], { session });

        const obj = mongooseCreated.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);
      } catch (err) {
        failed.push({
          user: userDataRaw,
          error: (err instanceof Error ? err.message : String(err))
        });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    if (created.length === 0 && failed.length > 0) {
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `No valid user found. ${msgField} failed.`,
        data: {
          successCount: 0,
          failedCount: failed.length,
          created,
          failed
        }
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: {
        successCount: created.length,
        failedCount: failed.length,
        created,
        failed
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};