import mongoose from 'mongoose';
import { Request, Response } from "express";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Branch } from "../../db/ModelSceham/branchSchema";
import { UserEmergency } from "../../db/ModelSceham/user/1_emergency";
import { UserReference } from "../../db/ModelSceham/user/2_references";
import { UserSoftware } from "../../db/ModelSceham/user/3_software";
import { UserEducation } from "../../db/ModelSceham/user/4_education";
import { UserExperience } from "../../db/ModelSceham/user/5_experience";
import { UserLanguage } from "../../db/ModelSceham/user/6_languages";
import { UserBankInfo } from "../../db/ModelSceham/user/7_bankinfo";
import { UserSalary } from "../../db/ModelSceham/user/9_salary";
import { UserPromotion } from "../../db/ModelSceham/user/11_promotion";
import { UserAttendanceLog } from "../../db/ModelSceham/user/user_attendance_log";
import { LogEntry } from "../../db/ModelSceham/logEntry";
import { isPlatformAdminRole } from "../../utils/roleUtils";

export const profilePage = async (req: Request, res: Response): Promise<void> => {
  const msgField = `create User'sProfile page Info`;
  const { staff_id, staffId, userId, id: bodyId } = req.body || {};
  const authUser = (req as any).user;
  const targetStaffId = staff_id || staffId || userId || bodyId || req.query.staff_id || req.query.staffId;
  const effectiveTenantId = (req as any).securityContext?.tenantId || (req as any).tenant?.id || authUser?.tenantId;
  const isPlatformAdmin = isPlatformAdminRole(authUser?.userRole);

  const session = await mongoose.startSession();

  try {
    let u: any = null;

    // 1. If an explicit target staff_id / userId is requested:
    if (targetStaffId) {
      const query: any = { staff_id: targetStaffId };
      if (!isPlatformAdmin && effectiveTenantId) {
        query.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
      }
      u = await UserInfo.findOne(query).session(session).lean();

      if (!u && mongoose.Types.ObjectId.isValid(targetStaffId as string)) {
        const idQuery: any = { _id: new mongoose.Types.ObjectId(targetStaffId as string) };
        if (!isPlatformAdmin && effectiveTenantId) {
          idQuery.tenant_id = new mongoose.Types.ObjectId(effectiveTenantId);
        }
        u = await UserInfo.findOne(idQuery).session(session).lean();
      }
    } 
    // 2. If no targetStaffId is supplied, resolve the authenticated user's own profile ("My Profile")
    else if (authUser?.userId) {
      if (mongoose.Types.ObjectId.isValid(String(authUser.userId))) {
        u = await UserInfo.findById(authUser.userId).session(session).lean();
      }
      if (!u) {
        u = await UserInfo.findOne({ staff_id: String(authUser.userId) }).session(session).lean();
      }
    }

    // If no user found, return 404
    if (!u) {
      res.status(404).json({ success: false, error: "Employee profile not found" });
      return;
    }

    // Double-check tenant boundary for non-platform admins
    if (!isPlatformAdmin && effectiveTenantId && u.tenant_id) {
      if (u.tenant_id.toString() !== effectiveTenantId.toString()) {
        res.status(404).json({ success: false, error: "Employee profile not found" });
        return;
      }
    }

    let branch_name = null;
    if (u.branchcode) {
      const b = await Branch.findOne({ branchcode: u.branchcode }).session(session).lean() as any;
      if (b) branch_name = b.name;
    }

    let reporting_to_name = null;
    if (u.reporting_to) {
      const r = await UserInfo.findOne({ staff_id: u.reporting_to }).session(session).lean() as any;
      if (r) reporting_to_name = `${r.firstname || ''} ${r.lastname || ''}`.trim();
    }

    const basic = {
      ...u,
      id: u._id.toString(),
      designation: u.desigantion || u.designation,
      permanentaddress: u.permantaddress || u.permanentaddress,
      branch_name,
      reporting_to_name
    };

    const id = u.staff_id;

    const [
      emergency,
      references,
      software,
      education,
      experience,
      languages,
      salary,
      promotion,
      attendance_log,
      entrylog,
      bank,
    ] = await Promise.all([
      UserEmergency.find({ staff_id: id }).session(session).lean(),
      UserReference.find({ staff_id: id }).session(session).lean(),
      UserSoftware.find({ staff_id: id }).session(session).lean(),
      UserEducation.find({ staff_id: id }).session(session).lean(),
      UserExperience.find({ staff_id: id }).session(session).lean(),
      UserLanguage.find({ staff_id: id }).session(session).lean(),
      UserSalary.find({ staff_id: id }).session(session).lean(),
      UserPromotion.find({ staff_id: id }).session(session).lean(),
      UserAttendanceLog.find({ staff_id: id }).session(session).lean(),
      LogEntry.find({ staff_id: id }).session(session).lean(),
      UserBankInfo.find({ staff_id: id }).session(session).lean(),
    ]);

    res.status(200).json({
      message: `${msgField} Success`,
      data: {
        basic,
        emergency,
        references,
        software,
        education,
        experience,
        languages,
        salary,
        incentive: [],
        promotion,
        attendance: [],
        attendance_log,
        entrylog,
        bank,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({
      error: `${msgField} Error: ${message}`,
    });
  } finally {
    session.endSession();
  }
};
