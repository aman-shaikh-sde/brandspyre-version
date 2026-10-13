import mongoose from 'mongoose';
import { ClientModel } from "../../../../db/ModelSceham/project/client";
import { UserInfo } from "../../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

interface contacts {
  type: 'add' | 'edit' | 'remove';
  index?: number;
  name?: string;
  designation?: string;
  phone?: string;
  email?: string;
}

interface data {
  branchcode: string;
  client_code?: string;
  client_name?: string;
  company_name?: string;
  contacts?: contacts[];
  primary_phone?: string;
  email?: string;
  office_address?: string;
  website?: string;
  industry_type?: string;
  comm_type?: string;
  status?: string;
}

export const editClientInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Edit Client Info`;
  const { userId: idObj, userRole, brcode, tenantId } = (req.user as any) || {};
  let { data: userData } = req.body as { data: data };

  const loginId = String(idObj);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if logged-in user exists
    const loginUser = await UserInfo.findOne({ staff_id: loginId }).session(session).lean();
    if (!loginUser) {
      res.status(400).json({ error: "Logged-in user not found" });
      await session.abortTransaction();
      return;
    }

    const requiredFields = ['branchcode', 'client_code'];
    const missingFields = requiredFields.filter(
      field => !(userData as Record<string, any>)[field]
    );

    if (missingFields.length > 0) {
      res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
      await session.abortTransaction();
      return;
    }

    const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin';
    const clientQuery: any = {
      client_code: userData.client_code,
      branchcode: userData.branchcode
    };

    if (!isPlatformAdmin) {
      if (!tenantId) {
        res.status(403).json({ error: "Tenant context required." });
        await session.abortTransaction();
        return;
      }
      clientQuery.tenant_id = new mongoose.Types.ObjectId(tenantId);
      if (userRole !== 'admin' && userData.branchcode !== brcode) {
        res.status(403).json({ error: "Unauthorized branch access." });
        await session.abortTransaction();
        return;
      }
    }

    // Find existing client
    const clientDoc = await ClientModel.findOne(clientQuery).session(session);

    if (!clientDoc) {
      res.status(404).json({ error: `Client not found for code ${userData.client_code}` });
      await session.abortTransaction();
      return;
    }

    let existingContacts = clientDoc.contacts ? [...clientDoc.contacts] : [];
    const seen = new Set();

    // Handle contact operations if provided
    if (userData.contacts && Array.isArray(userData.contacts)) {
      for (const action of userData.contacts) {
        const type = action.type;

        if (type === 'add') {
          if (!action.name || !action.phone) continue;
          const key = `${action.phone}-${action.email || ''}`;
          if (seen.has(key)) throw new Error(`Duplicate contact in input: ${key}`);
          seen.add(key);

          // Check if phone is used in another client within the same tenant
          const phoneQuery: any = {
            client_code: { $ne: userData.client_code },
            'contacts.phone': action.phone
          };
          if (clientQuery.tenant_id) {
            phoneQuery.tenant_id = clientQuery.tenant_id;
          }
          const phoneUsed = await ClientModel.findOne(phoneQuery).session(session).lean();

          if (phoneUsed) {
            throw new Error(`Phone ${action.phone} already used in another client.`);
          }

          existingContacts.push({
            name: action.name,
            designation: action.designation || null,
            phone: action.phone,
            email: action.email || null,
          });

        } else if (type === 'remove' && typeof action.index === 'number') {
          const i = action.index;
          if (i >= 0 && i < existingContacts.length) {
            existingContacts.splice(i, 1);
          }

        } else if (type === 'edit' && typeof action.index === 'number') {
          const i = action.index;
          if (i >= 0 && i < existingContacts.length) {
            const newPhone = action.phone ?? existingContacts[i].phone;
            const key = `${newPhone}-${action.email || existingContacts[i].email || ''}`;
            if (seen.has(key)) throw new Error(`Duplicate edited contact: ${key}`);
            seen.add(key);

            // Check if phone is used in another client
            const phoneUsed = await ClientModel.findOne({
              client_code: { $ne: userData.client_code },
              'contacts.phone': newPhone
            }).session(session).lean();

            if (phoneUsed) {
              throw new Error(`Phone ${newPhone} already used in another client.`);
            }

            existingContacts[i] = {
              name: action.name ?? existingContacts[i].name,
              designation: action.designation ?? existingContacts[i].designation,
              phone: newPhone,
              email: action.email ?? existingContacts[i].email,
            };
          }
        }
      }
    }

    // Build update object
    const updateData: any = {};
    if (userData.client_name !== undefined) updateData.client_name = userData.client_name;
    if (userData.company_name !== undefined) updateData.company_name = userData.company_name;
    if (userData.primary_phone !== undefined) updateData.primary_phone = userData.primary_phone;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.office_address !== undefined) updateData.office_address = userData.office_address;
    if (userData.website !== undefined) updateData.website = userData.website;
    if (userData.industry_type !== undefined) updateData.industry_type = userData.industry_type;
    if (userData.comm_type !== undefined) updateData.comm_type = userData.comm_type;
    if (userData.status !== undefined) updateData.status = userData.status;
    
    // Assign updated contacts list
    if (userData.contacts && Array.isArray(userData.contacts)) {
      updateData.contacts = existingContacts;
    }

    updateData.updated_on = new Date();
    updateData.updatedby = loginId;

    const updatedClientDoc = await ClientModel.findOneAndUpdate(
      clientQuery,
      { $set: updateData },
      { new: true, session }
    );

    await session.commitTransaction();

    res.status(201).json({
      message: `${msgField} Success`,
      result: updatedClientDoc ? updatedClientDoc.toObject() : null
    });

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
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  } finally {
    session.endSession();
  }
};