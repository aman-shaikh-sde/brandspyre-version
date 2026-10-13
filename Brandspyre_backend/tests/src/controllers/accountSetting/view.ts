import { Request, Response } from "express";
import { RoleAccess } from "../../db/ModelSceham/roleAccessSchema";
import { settingAccessControl } from "./helperFunction";
import { Branch } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewSetting = async (req: Request, res: Response): Promise<void> => {
  const { userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let { branchcode, id, role, dec, fieldKey, page = 1, limit = 25 } = req.query;
  const allBase = 'all';
  const ownBase = 'own';
  const permissions = "roles";

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const allhasAccess = await settingAccessControl({ role: userRole, permissions, base: allBase, brcode, req });
    const ownhasAccess = await settingAccessControl({ role: userRole, permissions, base: ownBase, brcode, req });
    if (!allhasAccess && !ownhasAccess) {
      res.status(403).json({ message: `Access denied: insufficient permission to ${allBase} ${permissions}.` });
      return;
    }

    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    // Superadmin and master super admin can see all roles
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      if (id) filter._id = id;
      if (branchcode && branchcode !== 'all') filter.branchcode = branchcode;
      if (role) filter.role = role;
    }
    // Tenant admin can see all roles within their organization/tenant
    else if (userRole === 'admin' && tenantId) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);

      if (id) filter._id = id;
      if (role) filter.role = role;
      if (branchcode && branchcode !== 'all') {
        filter.$or = [
          { branchcode: branchcode },
          { branchcode: { $exists: false } },
          { branchcode: null },
          { branchcode: '' }
        ];
      }
    }
    // Other roles with own access can only see their own role
    else if (ownhasAccess === true) {
      filter.role = userRole;
      if (tenantId) filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
      if (branchcode && branchcode !== 'all') filter.branchcode = branchcode;
    }
    // Other roles with all access can see roles within their tenant
    else if (allhasAccess === true) {
      if (tenantId) {
        filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
      } else if (brcode) {
        filter.branchcode = brcode;
      }
      if (id) filter._id = id;
      if (branchcode && branchcode !== 'all') {
        filter.$or = [
          { branchcode: branchcode },
          { branchcode: { $exists: false } },
          { branchcode: null },
          { branchcode: '' }
        ];
      }
      if (role) filter.role = role;
    }

    const docs = await RoleAccess.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const filteredRows = docs.map((item: any) => {
      const key = fieldKey as string | undefined;
      const itemId = item._id.toString();
      const itemBranchcode = item.branchcode || brcode || "Organization Wide";
      if (key && typeof item[key] === "object") {
        return {
          id: itemId,
          branchcode: itemBranchcode,
          role: item.role,
          [key]: item[key]
        };
      } else if (!key) {
        return { ...item, id: itemId, branchcode: itemBranchcode };
      }
      return null;
    }).filter(Boolean);

    res.status(200).json(filteredRows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`viewSetting Causes Error Message: ${message}`);
    res.status(500).json({ error: message });
  }
};