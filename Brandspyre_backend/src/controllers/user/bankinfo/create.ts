import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { UserBankInfo } from "../../../db/ModelSceham/user/7_bankinfo";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const createUserBankInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create Bank Info`;
  const { userId: idObj } = req.user as AuthenticatedUser;
  const { userDatas } = req.body;

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
      const userData = { ...userDataRaw };
      const idParam = userData.staff_id;
      const loginId = idParam ? idParam : idObj;
      try {
        const existingUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
        if (!existingUser) {
          res.status(409).json({ error: `User not found` });
          await session.abortTransaction();
          return;
        }

        const accountNumber = userData.accountnumber ?? "";
        const bankIFSC = userData.bankifsc ?? "";
        const existingifscode = await UserBankInfo.findOne({ accountnumber: accountNumber, bankifsc: bankIFSC }).session(session).lean();

        if (existingifscode) {
          res.status(409).json({ error: "Bank account with this IFSC already exists" });
          await session.abortTransaction();
          return;
        }

        const requiredFields = ['staff_id', 'accountholdername', 'accountnumber', 'bankname', 'bankifsc', 'banklocation'];
        const missingFields = requiredFields.filter(
          field => !(userData as Record<string, any>)[field]
        );
        if (missingFields.length > 0) {
          res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
          await session.abortTransaction();
          return;
        }

        const [createdDoc] = await UserBankInfo.create([userData], { session });
        const obj = createdDoc.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);
      } catch (error) {
        failed.push({
          user: userDataRaw,
          error: (error instanceof Error ? error.message : String(error))
        });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    }

    if (created.length === 0 && failed.length > 0) {
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed.`,
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
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};