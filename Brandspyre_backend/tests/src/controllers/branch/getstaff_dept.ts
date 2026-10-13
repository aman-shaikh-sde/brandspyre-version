import { UserInfo } from "../../db/ModelSceham/userSchema";
import { RequestHandler } from "express";
import mongoose from "mongoose";
 // ✅ corrected import

export const getStaff: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { department, branch_code } = req.query;

    const authUser = (req as any).user || {};
    let effectiveTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
    if (!effectiveTenantId && req.query.tenant_id && mongoose.Types.ObjectId.isValid(String(req.query.tenant_id))) {
      effectiveTenantId = String(req.query.tenant_id);
    }

    const isPlatformAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((authUser.userRole || '').toLowerCase());

    if (!effectiveTenantId && !isPlatformAdmin) {
      res.status(200).json({ status: true, data: [], staff: [] });
      return;
    }

    const filter: any = {};
    if (department) filter.department = department;
    if (branch_code && branch_code !== 'all' && branch_code !== 'BRCODE_01') filter.branchcode = branch_code;
    if (effectiveTenantId) filter.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId.toString());

    let rows = await UserInfo.find(filter, 'staff_id firstname lastname desigantion designation permantaddress permanentaddress department').lean() as any[];

    // Fallback: If filtered by department or branchcode and got 0 rows, fallback to tenant staff
    if (rows.length === 0 && effectiveTenantId) {
      rows = await UserInfo.find({ tenant_id: new mongoose.Types.ObjectId(effectiveTenantId.toString()) }, 'staff_id firstname lastname desigantion designation permantaddress permanentaddress department').lean() as any[];
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
