import { Request, Response } from "express";
import { UserInfo } from '../../../db/ModelSceham/userSchema';
import { Branch } from '../../../db/ModelSceham/branchSchema';
import { Client } from '../../../db/ModelSceham/project/client';
import { Team } from '../../../db/ModelSceham/teams/team';
import { TeamMember } from '../../../db/ModelSceham/teams/teammembers';
import mongoose from "mongoose";
import { settingAccessControl } from "../../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

export const viewUsers = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User's Info`;
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser
    let {staff_id, branchcode, role, department, designation, search , status ,joindate, relivedate, 
        dec, page=1, limit=25 } = req.query
    const loginId = staff_id ? staff_id : userId;

    const allBase = 'all';
    const ownBase = 'own';
    const permissions = "roles";
    
    try {
        const isPlatformAdmin = userRole === 'superadmin' || userRole === 'master_super_admin' || userRole === 'Super Admin';
        const allhasAccess = await settingAccessControl({ role: userRole, permissions: 'roles', base: 'all', brcode });
        const ownhasAccess = await settingAccessControl({ role: userRole, permissions: 'roles', base: 'own', brcode });

        // RBAC access check
        if (!allhasAccess && !ownhasAccess && !isPlatformAdmin && userRole !== 'admin') {
            res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
            return;
        }

        const pageNumber = parseInt(page as string, 10) || 1;
        const pageLimit = parseInt(limit as string, 10) || 25;
        const offset = (pageNumber - 1) * pageLimit;
        const sortOrder = dec ? -1 : 1;

        const filter: any = {};

        // SECURITY: Strict Tenant Isolation
        if (!isPlatformAdmin) {
            if (!tenantId) {
                res.status(401).json({ error: "Tenant context required." });
                return;
            }
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }

        // Branch and user-scope filtering
        if (!allhasAccess && ownhasAccess && !isPlatformAdmin && userRole !== 'admin') {
            filter.staff_id = String(loginId);
        }

        if (branchcode) filter.branchcode = { $regex: branchcode, $options: 'i' };
        if (staff_id) filter.staff_id = { $regex: String(loginId), $options: 'i' };
        if (role) filter.role = { $regex: role, $options: 'i' };
        if (department) filter.department = { $regex: department, $options: 'i' };
        if (designation) filter.desigantion = { $regex: designation, $options: 'i' };
        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { firstname: { $regex: search, $options: 'i' } },
                { lastname: { $regex: search, $options: 'i' } },
                { bloodgroup: { $regex: search, $options: 'i' } },
                { phonenumber: { $regex: search, $options: 'i' } },
                { marital: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { staff_id: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { desigantion: { $regex: search, $options: 'i' } },
                { gender: { $regex: search, $options: 'i' } }
            ];
        }

        const totalDocuments = await UserInfo.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / pageLimit);
        const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

        const users = await UserInfo.find(filter)
            .select("-password -reset_password_token -reset_password_expires")
            .sort({ staff_id: sortOrder })
            .skip(offset)
            .limit(pageLimit);

        // Batch enrich with branch name (eliminates N+1 queries)
        const branchcodes = Array.from(new Set(users.map(u => u.branchcode).filter(Boolean)));
        const branches = await Branch.find({ branchcode: { $in: branchcodes } }).lean() as any[];
        const branchMap = new Map(branches.map(b => [b.branchcode, b.name]));

        const enrichedUsers = users.map((user) => {
            const userObj = user.toObject();
            delete (userObj as any).password;
            delete (userObj as any).reset_password_token;
            delete (userObj as any).reset_password_expires;
            return {
                ...userObj,
                branch_name: branchMap.get(user.branchcode)
            };
        });

        // Get distinct by staff_id (similar to DISTINCT ON in PostgreSQL)
        const distinctUsers = enrichedUsers.reduce((acc: any[], user) => {
            if (!acc.find(u => u.staff_id === user.staff_id)) {
                acc.push(user);
            }
            return acc;
        }, []);

        res.status(200).json({status: true, message: msgField, data: distinctUsers, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments});

    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewUsers Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}

export const viewUsersDropDown = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View User's DropDown Info`;
  const { userId, userRole, brcode, tenantId } = req.user as AuthenticatedUser;

  // Check if it's the filter request (POST /users/filter)
  if (req.method === 'POST') {
    try {
      const { branch, team, type } = req.body;
      const typeList = Array.isArray(type) ? type : [];
      const branchList = Array.isArray(branch) ? branch.filter(Boolean) : [];
      const teamList = Array.isArray(team) ? team.filter(Boolean) : [];

      let staffResult: any[] = [];
      let clientResult: any[] = [];

      // Multi-tenant: Add tenant_id filter for non-superadmin users
      const tenantFilter: any = {};
      if (userRole !== 'master_super_admin' && tenantId) {
        tenantFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
      }

      // 1. If type includes 'staff' or typeList is empty (default to both)
      if (typeList.length === 0 || typeList.includes('staff')) {
        let staffIds: string[] = [];

        // If team filters are provided
        if (teamList.length > 0) {
          const teamIds = teamList.map((t: string) => {
            const parts = t.split('/');
            return parts[parts.length - 1];
          });

          // Fetch team members with tenant filter
          const teamMemberFilter: any = { team_id: { $in: teamIds }, status: 'active' };
          if (userRole !== 'master_super_admin' && tenantId) {
            teamMemberFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
          }
          const members = await TeamMember.find(teamMemberFilter).lean();
          members.forEach((m: any) => {
            if (m.staff_id) staffIds.push(m.staff_id);
          });

          // Fetch team leads with tenant filter
          const teamFilter: any = { team_id: { $in: teamIds }, is_active: true };
          if (userRole !== 'master_super_admin' && tenantId) {
            teamFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
          }
          const teams = await Team.find(teamFilter).lean();
          teams.forEach((t: any) => {
            if (t.team_lead) staffIds.push(t.team_lead);
          });
        }

        const staffFilter: any = { status: 'active', ...tenantFilter };
        if (teamList.length > 0) {
          staffFilter.staff_id = { $in: staffIds };
        } else if (branchList.length > 0) {
          staffFilter.branchcode = { $in: branchList };
        }

        const users = await UserInfo.find(staffFilter).lean();
        staffResult = users.map((u: any) => ({
          person_id: u.staff_id || String(u._id),
          person_name: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
          role: u.role || 'staff'
        }));
      }

      // 2. If type includes 'client' or typeList is empty
      if (typeList.length === 0 || typeList.includes('client')) {
        const clientFilter: any = { status: 'active', ...tenantFilter };
        if (branchList.length > 0) {
          clientFilter.branchcode = { $in: branchList };
        } else if (teamList.length > 0) {
          // If only team is filtered, extract branches from the team filters
          const teamBranches = teamList.map((t: string) => t.split('/')[0]).filter(Boolean);
          if (teamBranches.length > 0) {
            clientFilter.branchcode = { $in: teamBranches };
          }
        }

        const clients = await Client.find(clientFilter).lean();
        clientResult = clients.map((c: any) => ({
          person_id: c.client_code || String(c._id),
          person_name: c.client_name,
          role: 'client'
        }));
      }

      res.status(200).json({
        status: true,
        message: "Users filtered successfully",
        staff: staffResult,
        client: clientResult
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`viewUsersDropDown Filter Error: ${message}`);
      res.status(500).json({ error: message, staff: [], client: [] });
      return;
    }
  }

  // Otherwise, it's GET /users/dropdown/
  let { staff_id, branchcode, department, designation, status, dec, page = 1, limit = 25 } = req.query;
  const loginId = staff_id ? staff_id : userId;

  try {
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;
    const sortOrder = dec ? -1 : 1;

    const filter: any = {};

    // Multi-tenant: Add tenant_id filter for non-superadmin users
    if (userRole !== 'master_super_admin' && tenantId) {
      filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
    }

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (designation) filter.desigantion = designation;
    if (branchcode) filter.branchcode = branchcode;
    if (staff_id) filter.staff_id = staff_id;

    const totalDocuments = await UserInfo.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const users = await UserInfo.find(filter)
        .select('staff_id branchcode department desigantion firstname lastname status role')
        .sort({ staff_id: sortOrder })
        .skip(offset)
        .limit(pageLimit);

    res.status(200).json({
      status: true,
      message: msgField,
      data: users,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`viewUsersDropDown Causes Error Message: ${message}`);
    res.status(500).json({ error: message }); 
  }
};
