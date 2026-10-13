import mongoose from 'mongoose';
import { ClientModel } from "../../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface data {
  branchcode: string;
  client_code?: string;
  status?: string;
  delete_type?: string;
}

export const deleteClientInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Delete Client Info`;
  const { userId: idObj, userRole, brcode, tenantId } = (req.user as any) || {};
  const { data: clients } = req.body as { data: data };
  const loginId = String(idObj);

  if (!clients?.client_code || !clients?.branchcode) {
    res.status(400).json({ error: "client_code and branchcode are required" });
    return;
  }

  const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin';
  const clientQuery: any = {
    client_code: clients.client_code,
    branchcode: clients.branchcode
  };

  if (!isPlatformAdmin) {
    if (!tenantId) {
      res.status(403).json({ error: "Tenant context required." });
      return;
    }
    clientQuery.tenant_id = new mongoose.Types.ObjectId(tenantId);
    if (userRole !== 'admin' && clients.branchcode !== brcode) {
      res.status(403).json({ error: "Unauthorized branch access." });
      return;
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const loginUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!loginUser) {
      res.status(400).json({ error: "Logged-in user not found" });
      await session.abortTransaction();
      return;
    }

    if (!clients.status) {
      clients.status = 'inactive';
    }

    let modifiedCount = 0;

    switch (clients.delete_type) {
      case 'temp':
        const updateRes = await ClientModel.updateMany(
          clientQuery,
          { $set: { status: clients.status, updated_on: new Date(), updatedby: loginId } }
        ).session(session);
        modifiedCount = updateRes.modifiedCount;
        break;

      case 'permanent':
        const deleteRes = await ClientModel.deleteMany(clientQuery).session(session);
        modifiedCount = deleteRes.deletedCount;
        break;

      default:
        await session.abortTransaction();
        res.status(400).json({ message: `Invalid delete_type. Must be 'temp' or 'permanent'.` });
        return;
    }

    if (modifiedCount === 0) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Client not found or does not match the criteria.' });
      return;
    }

    await session.commitTransaction();
    res.status(200).json({ message: `${msgField} Success` });

  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  } finally {
    session.endSession();
  }
};