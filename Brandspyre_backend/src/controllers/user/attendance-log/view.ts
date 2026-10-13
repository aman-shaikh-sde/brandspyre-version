import mongoose from 'mongoose';
import { UserAttendance } from "../../../db/ModelSceham/user/13_attendance";
import { UserAttendanceLog } from "../../../db/ModelSceham/user/14_attedance_log";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Branch } from "../../../db/ModelSceham/branchSchema";
import { Team } from "../../../db/ModelSceham/teams/team";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewUserAttendanceInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Attendance Info`;
  const { userRole, tenantId, brcode } = req.user as AuthenticatedUser;

  let {
    rowId,
    staff_id,
    team_id,
    branchcode,
    attendance_date,
    status,
    isleaveapproved,
    search,
    dec,
    start_date,
    end_date,
    page = 1,
    limit = 25,
  } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    // Superadmin and master_super_admin can see all attendance
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see attendance from their specific branch
    else if (userRole === 'admin' && tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }
    // Other roles can only see their own branch
    else if (tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } }
      ];
    }

    if (rowId) filter._id = rowId;
    if (staff_id) filter.staff_id = staff_id;
    if (branchcode) filter.branchcode = branchcode;
    if (attendance_date) filter.attendance_date = attendance_date;
    if (status) filter.status = status;
    if (isleaveapproved !== undefined) filter.isleaveapproved = isleaveapproved === 'true';

    if (start_date || end_date) {
      filter.attendance_date = {};
      if (start_date) filter.attendance_date.$gte = String(start_date);
      if (end_date) filter.attendance_date.$lte = String(end_date);
    }

    if (team_id) {
      const members = await TeamMember.find({ team_id: String(team_id) }).lean();
      const staffIds = members.map(m => m.staff_id);
      if (staffIds.length === 0) {
        res.status(200).json({
          message: `${msgField} Success`,
          data: [],
          pageNumber,
          totalPages: 0,
          pageLimit,
          totalDocuments: 0,
          balanceDocuments: 0,
        });
        return;
      }
      filter.staff_id = { $in: staffIds };
    }

    const totalDocuments = await UserAttendance.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const attendances = await UserAttendance.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const formatted = await Promise.all(
      attendances.map(async (att: any) => {
        const user = await UserInfo.findOne({ staff_id: att.staff_id }).lean() as any;
        const branch = att.branchcode ? await Branch.findOne({ branchcode: att.branchcode }).lean() as any : null;

        const logs = await UserAttendanceLog.find({ attendance_id: att._id.toString() }).lean();

        let totalMs = 0;
        logs.forEach(l => {
          if (l.check_in && l.check_out) {
            totalMs += new Date(l.check_out).getTime() - new Date(l.check_in).getTime();
          }
        });
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

        let lastCheckout: any = null;
        logs.forEach(l => {
          if (l.check_out && (!lastCheckout || new Date(l.check_out) > new Date(lastCheckout))) {
            lastCheckout = l.check_out;
          }
        });

        return {
          ...att,
          id: att._id,
          staff_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : att.staff_id,
          role: user?.role || '',
          designation: user?.desigantion || '',
          department: user?.department || '',
          branch_name: branch?.name || '',
          total_worked_hours: `${hours}h ${minutes}m`,
          last_checkout_time: lastCheckout,
        };
      })
    );

    res.status(200).json({
      message: `${msgField} Success`,
      data: formatted,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};

export const viewUserAttendanceLogInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Attendance Log Info`;
  let { rowId, staff_id, attendance_id, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};
    if (rowId) filter._id = rowId;
    if (staff_id) filter.staff_id = staff_id;
    if (attendance_id) filter.attendance_id = attendance_id;

    const totalDocuments = await UserAttendanceLog.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const logs = await UserAttendanceLog.find(filter)
      .sort({ _id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const data = await Promise.all(
      logs.map(async (log: any) => {
        const user = await UserInfo.findOne({ staff_id: log.staff_id }).lean() as any;
        return {
          ...log,
          id: log._id,
          status: log.check_out ? 'checkout' : 'checkin',
          staff_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : log.staff_id,
          role: user?.role || '',
          designation: user?.desigantion || '',
          department: user?.department || '',
        };
      })
    );

    res.status(200).json({
      message: `${msgField} Success`,
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};

export const viewBranchAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Branch-wise Attendance Summary";
  const { branchcode, startdate, enddate } = req.query;

  try {
    let branchFilter: any = {};
    if (branchcode) branchFilter.branchcode = branchcode;

    const branches = await Branch.find(branchFilter).lean();

    const finalData = await Promise.all(
      branches.map(async (br: any) => {
        const users = await UserInfo.find({ branchcode: br.branchcode }).lean();
        const activeUsers = users.filter(u => u.status === 'active');
        const staffIds = users.map(u => u.staff_id);

        let attFilter: any = { staff_id: { $in: staffIds } };
        const todayStr = new Date().toISOString().split("T")[0];
        let diffDays = 1;

        if (startdate || enddate) {
          attFilter.attendance_date = {};
          if (startdate) attFilter.attendance_date.$gte = String(startdate);
          if (enddate) attFilter.attendance_date.$lte = String(enddate);

          if (startdate && enddate) {
            const start = new Date(startdate as string);
            const end = new Date(enddate as string);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
        } else {
          attFilter.attendance_date = todayStr;
        }

        const attendances = await UserAttendance.find(attFilter).lean();

        const presentCount = attendances.filter(a => a.status === 'present').length;
        const leaveCount = attendances.filter(a => a.status === 'leave').length;
        const approvedLeaveCount = attendances.filter(a => a.status === 'leave' && a.isleaveapproved).length;
        const halfDayCount = attendances.filter(a => a.leave_type === 'half-day').length;
        const hourlyCount = attendances.filter(a => a.leave_type === 'hourly').length;
        
        const totalExpected = activeUsers.length * diffDays;
        const absentCount = Math.max(0, totalExpected - presentCount - leaveCount);

        // 1. Group active users by department
        const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
        const department_counts = await Promise.all(
          departments.map(async (dept: string) => {
            const deptUsers = users.filter(u => u.department === dept);
            const deptActiveUsers = deptUsers.filter(u => u.status === 'active');
            const deptStaffIds = deptUsers.map(u => u.staff_id);

            let deptAttFilter: any = { staff_id: { $in: deptStaffIds } };
            if (startdate || enddate) {
              deptAttFilter.attendance_date = {};
              if (startdate) deptAttFilter.attendance_date.$gte = String(startdate);
              if (enddate) deptAttFilter.attendance_date.$lte = String(enddate);
            } else {
              deptAttFilter.attendance_date = todayStr;
            }

            const deptAttendances = await UserAttendance.find(deptAttFilter).lean();

            const present = deptAttendances.filter(a => a.status === 'present').length;
            const leave = deptAttendances.filter(a => a.status === 'leave').length;
            const approvedLeave = deptAttendances.filter(a => a.status === 'leave' && a.isleaveapproved).length;
            const halfDay = deptAttendances.filter(a => a.leave_type === 'half-day').length;
            const hourly = deptAttendances.filter(a => a.leave_type === 'hourly').length;
            
            const deptExpected = deptActiveUsers.length * diffDays;
            const absent = Math.max(0, deptExpected - present - leave);
            const waiting = Math.max(0, (deptUsers.length * diffDays) - present);

            return {
              department: dept,
              employee_count: deptUsers.length,
              present_count: present,
              absent_count: absent,
              leave_count: leave,
              approved_leave_count: approvedLeave,
              half_day_leave_count: halfDay,
              hourly_leave_count: hourly,
              waitingforlogin_count: waiting
            };
          })
        );

        // 2. Group active users by team
        const teams = await Team.find({ branchcode: br.branchcode }).lean() as any[];
        const team_counts = await Promise.all(
          teams.map(async (team: any) => {
            const members = await TeamMember.find({ team_id: team.team_id }).lean() as any[];
            const memberStaffIds = members.map(m => m.staff_id);

            const teamUsers = users.filter(u => memberStaffIds.includes(u.staff_id));
            const teamActiveUsers = teamUsers.filter(u => u.status === 'active');

            let teamAttFilter: any = { staff_id: { $in: memberStaffIds } };
            if (startdate || enddate) {
              teamAttFilter.attendance_date = {};
              if (startdate) teamAttFilter.attendance_date.$gte = String(startdate);
              if (enddate) teamAttFilter.attendance_date.$lte = String(enddate);
            } else {
              teamAttFilter.attendance_date = todayStr;
            }

            const teamAttendances = await UserAttendance.find(teamAttFilter).lean();

            const leadUser = await UserInfo.findOne({ staff_id: team.team_lead }).lean() as any;
            const teamleadname = leadUser ? `${leadUser.firstname || ''} ${leadUser.lastname || ''}`.trim() : team.team_lead || "N/A";

            const present = teamAttendances.filter(a => a.status === 'present').length;
            const leave = teamAttendances.filter(a => a.status === 'leave').length;
            const approvedLeave = teamAttendances.filter(a => a.status === 'leave' && a.isleaveapproved).length;
            const halfDay = teamAttendances.filter(a => a.leave_type === 'half-day').length;
            const hourly = teamAttendances.filter(a => a.leave_type === 'hourly').length;
            
            const teamExpected = teamActiveUsers.length * diffDays;
            const absent = Math.max(0, teamExpected - present - leave);
            const waiting = Math.max(0, (teamUsers.length * diffDays) - present);

            return {
              team_id: team.team_id,
              team_name: team.team_name,
              teamleadname,
              employee_count: teamUsers.length,
              present_count: present,
              absent_count: absent,
              leave_count: leave,
              approved_leave_count: approvedLeave,
              half_day_leave_count: halfDay,
              hourly_leave_count: hourly,
              waitingforlogin_count: waiting
            };
          })
        );

        return {
          branchcode: br.branchcode,
          branch_name: br.name,
          total_employees: users.length,
          total_active_employees: activeUsers.length,
          attendance_summary: {
            employee_count: users.length,
            present_count: presentCount,
            absent_count: absentCount,
            leave_count: leaveCount,
            approved_leave_count: approvedLeaveCount,
            half_day_leave_count: halfDayCount,
            hourly_leave_count: hourlyCount,
            waitingforlogin_count: Math.max(0, (users.length * diffDays) - presentCount),
          },
          department_counts,
          team_counts,
        };
      })
    );

    res.status(200).json({
      message: `${msgField} Success`,
      data: branchcode ? finalData[0] : finalData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} failed: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  }
};
