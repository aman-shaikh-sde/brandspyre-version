import mongoose from 'mongoose';
import { Sequence } from "../../../../db/ModelSceham/sequenceSchema";
import { ClientModel } from "../../../../db/ModelSceham/project/client";
import { Lead } from "../../../../db/ModelSceham/project/campagin";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
}

export const generateUniqueId = async (
  prefix: string,
  session?: mongoose.ClientSession
): Promise<string> => {
  if (!prefix) throw new Error("Prefix is required");

  const seqVal = await Sequence.findOneAndUpdate(
    { name: 'client_code_seq' },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );

  return `${prefix}/CLNT/${String(seqVal.value).padStart(3, "0")}`;
};

export const createClientInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create Client Info`;
  let { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
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
      const userData = { ...userDataRaw };
      try {
        const loginUser = await UserInfo.findOne({ _id: new mongoose.Types.ObjectId(idObj) }).session(session).lean();
        if (!loginUser) throw new Error("Logged-in user not found");

        const requiredFields = ['branchcode', 'client_name', 'primary_phone'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`);
        }

        const existingClient = await ClientModel.findOne({
          branchcode: userData.branchcode,
          primary_phone: userData.primary_phone
        }).session(session).lean();
        if (existingClient) throw new Error("Already phone or email is our Client database");

        const client_code = await generateUniqueId(userData.branchcode, session);
        userData.client_code = client_code;
        userData.createdby = idObj;

        // Process contacts
        if (userData.contacts && Array.isArray(userData.contacts)) {
          const contactSet = new Set();
          const validContacts = [];
          for (const contact of userData.contacts) {
            if (!contact.name || !contact.phone) continue;
            const uniqueKey = `${contact.phone}-${contact.email || ''}`;
            if (contactSet.has(uniqueKey)) {
              throw new Error(`Duplicate contact: ${contact.phone}, ${contact.email}`);
            }
            contactSet.add(uniqueKey);
            validContacts.push({
              name: contact.name,
              designation: contact.designation || null,
              phone: contact.phone,
              email: contact.email || null,
            });
          }
          userData.contacts = validContacts.length > 0 ? validContacts : undefined;
        }

        let lead_id = userData.lead_id || null;
        delete userData.lead_id;

        const [clientDoc] = await ClientModel.create([userData], { session });
        const obj = clientDoc.toObject() as any;
        obj.id = obj._id.toString();
        created.push(obj);

        if (lead_id) {
          await Lead.updateOne(
            { _id: lead_id, branchcode: userData.branchcode },
            { $set: { status: 'onboarding' } }
          ).session(session);
        }

      } catch (err) {
        failed.push({
          user: userDataRaw,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (created.length > 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
    }

    if (created.length === 0 && failed.length > 0) {
      console.log("createClientInfo failed items:", failed);
      const allNotFound = failed.every(f => f.error?.includes("not found"));
      res.status(allNotFound ? 404 : 400).json({
        message: `${msgField} failed.`,
        data: { successCount: 0, failedCount: failed.length, created, failed },
      });
      return;
    }

    res.status(201).json({
      message: `Bulk ${msgField} result`,
      data: { successCount: created.length, failedCount: failed.length, created, failed },
    });

  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};