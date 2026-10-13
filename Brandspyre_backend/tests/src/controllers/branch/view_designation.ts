import { Request, Response } from "express";
import { Designation, Branch } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: string | number | mongoose.Types.ObjectId;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const getDesignation = async (req: Request, res: Response): Promise<void> => {
  const { branchcode, branch_code } = req.query;

  const authUser = (req as any).user as AuthenticatedUser || { userRole: '', tenantId: '', brcode: '' };
  const effectiveTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
  const activeBranchcode = (branchcode || branch_code) as string | undefined;

  try {
    let filter: any = {};
    const roleLower = (authUser.userRole || '').toLowerCase();
    const isPlatformAdmin = roleLower === 'superadmin' || roleLower === 'master_super_admin' || (req as any).dataScope === 'platform';

    let resolvedTenantId = effectiveTenantId;

    if (!resolvedTenantId && authUser.userId) {
      try {
        const { UserInfo } = require("../../db/ModelSceham/userSchema");
        const userDoc = await UserInfo.findById(authUser.userId);
        if (userDoc && userDoc.tenant_id) {
          resolvedTenantId = userDoc.tenant_id.toString();
        }
      } catch (err) {}
    }

    if (!resolvedTenantId && req.query.tenant_id && mongoose.Types.ObjectId.isValid(String(req.query.tenant_id))) {
      resolvedTenantId = String(req.query.tenant_id);
    }

    if (!isPlatformAdmin && !resolvedTenantId) {
      res.status(200).json({
        success: true,
        data: [],
        designations: []
      });
      return;
    }

    // 1. Platform Super Admin can view across all tenants or filter by specific tenant
    if (isPlatformAdmin) {
      if (resolvedTenantId) filter.tenant_id = new mongoose.Types.ObjectId(resolvedTenantId);
      if (activeBranchcode && activeBranchcode !== 'all') filter.branchcode = activeBranchcode;
    } 
    // 2. Tenant Organization Users MUST filter strictly by their verified tenant_id
    else if (resolvedTenantId) {
      filter.tenant_id = new mongoose.Types.ObjectId(resolvedTenantId);
      if (activeBranchcode && activeBranchcode !== 'all' && activeBranchcode !== 'BRCODE_01') {
        // Validate branch belongs to the tenant
        try {
          const branch = await Branch.findOne({
            branchcode: activeBranchcode,
            tenant_id: new mongoose.Types.ObjectId(resolvedTenantId),
            status: "active"
          });
          if (branch) {
            filter.branchcode = activeBranchcode;
          }
        } catch (err) {}
      }
    }

    let designations = await Designation.find(filter).lean();

    // Fallback: If filtering by branchcode returned 0 designations, query by tenant_id only
    if (designations.length === 0 && resolvedTenantId && filter.branchcode) {
      const fallbackFilter: any = { tenant_id: new mongoose.Types.ObjectId(resolvedTenantId) };
      designations = await Designation.find(fallbackFilter).lean();
    }

    const mapped = designations.map((d: any) => ({
      ...d,
      id: d._id.toString(),
      designation: d.name || d.designation,
      name: d.name || d.designation,
      department: d.department || ""
    }));

    res.status(200).json({
      success: true,
      data: mapped,
      designations: mapped
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`getDesignation Error: ${message}`);
    res.status(500).json({ error: message });
  }
};

export const getDesignations = getDesignation;

