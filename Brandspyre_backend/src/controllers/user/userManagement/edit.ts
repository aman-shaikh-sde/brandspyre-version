import mongoose from 'mongoose';
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";
import { encryptPassword } from "./helperFunction";

interface AuthenticatedUser {
  userId: string | number;
  userRole: string;
  brcode: string;
}

interface Profile {
  staff_id?: string;
  branchcode?: string;
  role?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  gender?: string;
  marital?: string;
  bloodgroup?: string;
  phonenumber?: string;
  alternumber?: string;
  email?: string;
  password?: string;
  permanentaddress?: string;
  presentaddress?: string;
  department?: string;
  designation?: string;
  profileurl?: string;
  dateofjoining?: string;
  relivingdate?: string;
  status?: string;
  notes?: string;
  [key: string]: any;
}

export const editUsers = async (req: Request, res: Response): Promise<void> => {
  const authUser = (req as any).user || {};
  const securityContext = (req as any).securityContext;
  const effectiveTenantId = securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
  const callerRole = (authUser.userRole || authUser.role || "").toLowerCase();
  const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(callerRole);
  const isTenantAdmin = ['admin', 'tenant_admin', 'superadmin', 'platform_superadmin', 'master_super_admin'].includes(callerRole);

  const { profile: userData } = req.body as { profile: Profile };

  if (!userData) {
    res.status(400).json({ message: "No profile data provided" });
    return;
  }

  // Mass assignment protection: callers cannot reassign tenant_id or mongo _id
  delete (userData as any).tenant_id;
  delete (userData as any).tenantId;
  delete (userData as any)._id;

  // Privilege escalation protection: only tenant admins and platform admins can alter user roles or status
  if (userData.role && !isTenantAdmin) {
    delete userData.role;
  }
  if (userData.status && !isTenantAdmin) {
    delete userData.status;
  }

  // Non-admins can strictly only edit their own profile
  const ownUserId = String(authUser.userId || authUser.id || authUser.staff_id || "");
  const staffId: string = isTenantAdmin
    ? (userData.staff_id || (req.query && (req.query.staff_id as string)) || ownUserId)
    : ownUserId;

  try {
    for (const key in userData) {
      if (typeof userData[key] === "string") {
        userData[key] = userData[key]?.trim();
      }
    }

    if (userData.email) {
      userData.email = userData.email.trim().toLowerCase();
    }

    if (userData.password) {
      userData.password = await encryptPassword(userData.password);
    }

    if (userData.role) {
      userData.role = userData.role.trim().toLowerCase();
    }

    if (userData.firstName && !userData.firstname) {
      userData.firstname = userData.firstName;
    }
    if (userData.lastName && !userData.lastname) {
      userData.lastname = userData.lastName;
    }
    if (userData.designation && !userData.desigantion) {
      userData.desigantion = userData.designation;
    }
    if (userData.permanentaddress && !userData.permantaddress) {
      userData.permantaddress = userData.permanentaddress;
    }

    const filterConditions: any[] = [];
    if (staffId) {
      filterConditions.push({ staff_id: staffId });
      if (mongoose.Types.ObjectId.isValid(staffId)) {
        filterConditions.push({ _id: new mongoose.Types.ObjectId(staffId) });
      }
    }

    let filter: any = filterConditions.length > 0 ? { $or: filterConditions } : {};

    // Strictly enforce tenant boundary for non-platform users
    if (!isPlatformAdmin && effectiveTenantId) {
      if (mongoose.Types.ObjectId.isValid(effectiveTenantId)) {
        filter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
      }
    }

    const updatedUser = await UserInfo.findOneAndUpdate(
      filter,
      { $set: userData },
      { new: true }
    ).lean() as any;

    if (!updatedUser) {
      res.status(404).json({ message: "User not found or unauthorized" });
      return;
    }

    const userObj = {
      ...updatedUser,
      id: updatedUser._id.toString(),
      designation: updatedUser.desigantion || updatedUser.designation,
      permanentaddress: updatedUser.permantaddress || updatedUser.permanentaddress,
    };

    // Sanitize credentials from response
    delete (userObj as any).password;
    delete (userObj as any).reset_password_token;
    delete (userObj as any).reset_password_expires;

    res.status(200).json({ message: "User updated successfully", result: userObj });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("editUsers error:", message);
    res.status(500).json({ error: message });
  }
};

