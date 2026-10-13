import { Request, Response } from "express";
import { Team, TeamLeadHistory } from "../../../db/ModelSceham/teams/team";
import { TeamMember } from "../../../db/ModelSceham/teams/teammembers";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Branch } from "../../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewTeamInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User Attendance Info`;
  const { userId: idObj, userRole, tenantId, brcode } = req.user as AuthenticatedUser;
  let { team_lead, branchcode, search, dec, page = 1, limit = 25 } = req.query;

  const loginId = team_lead ? team_lead : idObj;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};

    // Superadmin and master_super_admin can see all teams
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see teams from their specific branch
    else if (userRole === 'admin' && tenantId) {
      filter.branchcode = brcode;
      filter.$or = [
        { tenant_id: new mongoose.Types.ObjectId(tenantId) },
        { tenant_id: { $exists: false } } // For backward compatibility with old teams
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

    if (team_lead) filter.team_lead = new RegExp(String(loginId), 'i');
    if (branchcode) filter.branchcode = new RegExp(String(branchcode), 'i');
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { team_name: searchRegex },
        { team_id: searchRegex }
      ];
    }

    const totalDocuments = await Team.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const teams = await Team.find(filter)
      .sort({ team_id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.status(200).json({
      message: `${msgField} Success`,
      data: teams,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};

export const viewTeamHistoryInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Team History Info`;
  let { team_id, branchcode, dec, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    let filter: any = {};
    if (team_id) filter.team_id = team_id;
    if (branchcode) filter.branchcode = branchcode;

    const totalDocuments = await TeamLeadHistory.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const history = await TeamLeadHistory.find(filter)
      .sort({ team_id: sortOrder })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.status(200).json({
      message: `${msgField} Success`,
      data: history,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};

export const viewSingleTeamProfileInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = "View Single Team Profile Info";
  const { team_id } = req.query;

  if (!team_id) {
    res.status(400).json({ error: "team_id is required" });
    return;
  }

  try {
    const team = await Team.findOne({ team_id }).lean() as any;

    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const lead = team.team_lead ? await UserInfo.findOne({ staff_id: team.team_lead }).lean() as any : null;
    const members = await TeamMember.find({ team_id }).sort({ joined_on: -1 }).lean();

    const membersWithInfo = await Promise.all(
      members.map(async (member: any) => {
        const u = await UserInfo.findOne({ staff_id: member.staff_id }).lean() as any;
        return {
          id: member._id,
          team_id: member.team_id,
          branchcode: member.branchcode,
          staff_id: member.staff_id,
          staff_name: u ? `${u.firstname || ''} ${u.lastname || ''}`.trim() : member.staff_id,
          staff_name_email: u?.email || '',
          role: member.role,
          department: u?.department || '',
          designation: u?.desigantion || u?.designation || '',
          joined_on: member.joined_on,
          status: member.status
        };
      })
    );

    const result = {
      branchcode: team.branchcode,
      team_name: team.team_name,
      team_id: team.team_id,
      team_lead: team.team_lead,
      lead_name: lead ? `${lead.firstname || ''} ${lead.lastname || ''}`.trim() : '',
      lead_email: lead?.email || '',
      lead_department: lead?.department || '',
      lead_designation: lead?.desigantion || lead?.designation || '',
      createdon: team.created_on,
      members: membersWithInfo
    };

    res.status(200).json({ message: `${msgField} Success`, data: result });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};

export const viewTeamByStaffId = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Team info fetched";
  const { staff_id } = req.query;

  if (!staff_id) {
    res.status(400).json({ error: "staff_id is required" });
    return;
  }

  try {
    const member = await TeamMember.findOne({ staff_id }).lean() as any;

    if (!member) {
      res.status(404).json({ message: "No team found for this staff_id" });
      return;
    }

    const team = await Team.findOne({ team_id: member.team_id }).lean() as any;
    const user = await UserInfo.findOne({ staff_id }).lean() as any;
    const lead = team?.team_lead ? await UserInfo.findOne({ staff_id: team.team_lead }).lean() as any : null;
    const branch = team?.branchcode ? await Branch.findOne({ branchcode: team.branchcode }).lean() as any : null;

    const data = {
      staff_id: member.staff_id,
      staff_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : member.staff_id,
      team_id: team?.team_id || member.team_id,
      team_name: team?.team_name || '',
      team_lead: team?.team_lead || '',
      team_lead_name: lead ? `${lead.firstname || ''} ${lead.lastname || ''}`.trim() : '',
      branchcode: team?.branchcode || member.branchcode,
      name: branch?.name || ''
    };

    res.status(200).json({
      message: `${msgField} successfully`,
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};