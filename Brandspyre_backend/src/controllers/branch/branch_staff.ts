import { UserInfo } from "../../db/ModelSceham/userSchema";
// src/controllers/branch/getstaff_dept.ts
import { RequestHandler } from "express";
 // ✅ corrected import

export const getStaffbranch: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { branchcode, branch_code } = req.query;
    const activeBranchcode = (branchcode || branch_code) as string | undefined;

    const authUser = (req as any).user || {};
    let effectiveTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
    if (!effectiveTenantId && req.query.tenant_id && require('mongoose').Types.ObjectId.isValid(String(req.query.tenant_id))) {
      effectiveTenantId = String(req.query.tenant_id);
    }

    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((authUser.userRole || '').toLowerCase());

    if (!effectiveTenantId && !isPlatformAdmin) {
      res.status(200).json({ status: true, data: [], staff: [] });
      return;
    }

    const filter: any = {};
    if (activeBranchcode && activeBranchcode !== 'all' && activeBranchcode !== 'BRCODE_01') {
      filter.branchcode = activeBranchcode;
    }
    if (effectiveTenantId) {
      filter.tenant_id = new (require('mongoose').Types.ObjectId)(effectiveTenantId.toString());
    }

    let rows = await UserInfo.find(filter, 'staff_id firstname lastname desigantion designation permantaddress permanentaddress department branchcode').lean() as any[];

    // Fallback: If filtered by branchcode and got 0 rows, fallback to tenant staff
    if (rows.length === 0 && effectiveTenantId) {
      rows = await UserInfo.find({ tenant_id: new (require('mongoose').Types.ObjectId)(effectiveTenantId.toString()) }, 'staff_id firstname lastname desigantion designation permantaddress permanentaddress department branchcode').lean() as any[];
    }

    const mapped = rows.map(r => ({
      ...r,
      id: r._id.toString(),
      designation: r.desigantion || r.designation || "",
      permanentaddress: r.permantaddress || r.permanentaddress || ""
    }));

    res.json({ status: true, data: mapped, staff: mapped });
  } catch (err) {
    console.error("Error fetching staff", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
