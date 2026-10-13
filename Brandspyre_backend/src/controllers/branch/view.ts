import { Request, Response } from "express";
import { Branch } from "../../db/ModelSceham/branchSchema";
import mongoose from "mongoose";
import { settingAccessControl } from "../accountSetting/helperFunction";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode: string;
    tenantId?: string;
  }

export const viewBranch = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser
    let {branchid, branchcode, search , status , manager_id, dec, page=1, limit=25 } = req.query
    const allBase = 'all';
    const ownBase = 'own';
    const permissions = "branches";
    
    try {
        const allhasAccess = await settingAccessControl({ role: userRole, permissions: permissions, base: allBase, brcode, req})
        const ownhasAccess = await settingAccessControl({ role: userRole, permissions: permissions, base: ownBase, brcode, req})
        if (!allhasAccess && !ownhasAccess) {
            res.status(403).json({ message: `Access denied: insufficient permission to ${allBase} ${permissions}.` });
            return ;
        }

        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);
        const offset = (pageNumber - 1) * pageLimit;
        const sortOrder = dec ? -1 : 1;

        const filter: any = {};

        // Superadmin and master_super_admin can see all branches
        if (userRole === 'superadmin' || userRole === 'master_super_admin') {
            if (branchid) filter._id = branchid;
            if (branchcode) filter.branchcode = { $regex: branchcode, $options: 'i' };
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            if (manager_id) filter.manager_id = { $regex: manager_id, $options: 'i' };
            if (status) filter.status = status;
        }
        // Tenant admin can see all branches within their tenant
        else if (userRole === 'admin' && tenantId) {
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            if (branchid) filter._id = branchid;
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            if (manager_id) filter.manager_id = { $regex: manager_id, $options: 'i' };
            if (status) filter.status = status;
        }
        // Other roles with own access can only see their own branch
        else if (ownhasAccess === true) {
            filter.branchcode = brcode;
        }
        // Other roles with all access can see their branch
        else if (allhasAccess === true) {
            filter.branchcode = brcode;
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            if (manager_id) filter.manager_id = { $regex: manager_id, $options: 'i' };
            if (status) filter.status = status;
        }
        
        const totalDocuments = await Branch.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / pageLimit);
        const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

        const branches = await Branch.find(filter)
            .sort({ branchcode: 1, _id: sortOrder })
            .skip(offset)
            .limit(pageLimit);

        // Get distinct by branchcode (similar to DISTINCT ON in PostgreSQL)
        const distinctBranches = branches.reduce((acc: any[], branch) => {
            if (!acc.find(b => b.branchcode === branch.branchcode)) {
                acc.push(branch);
            }
            return acc;
        }, []);

        res.status(200).json(distinctBranches);
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewBranch Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}

export const viewBranchDropDown = async (req: Request, res: Response): Promise<void> => {
    const {userId, userRole, brcode, tenantId} = req.user as AuthenticatedUser
    let {branchid, branchcode, status, search , dec, page=1, limit=25 } = req.query

    try {
        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);
        const offset = (pageNumber - 1) * pageLimit;
        const sortOrder = dec ? -1 : 1;

        const filter: any = {};

        // Superadmin and master_super_admin can see all branches
        if (userRole === 'superadmin' || userRole === 'master_super_admin') {
            if (branchid) filter._id = branchid;
            if (branchcode) filter.branchcode = branchcode;
            if (status) filter.status = status;
        }
        // Tenant admin can see all branches within their tenant
        else if (userRole === 'admin' && tenantId) {
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            if (branchid) filter._id = branchid;
            if (branchcode) filter.branchcode = branchcode;
            if (status) filter.status = status;
        }
        // Other roles with tenant_id can only see their own branch from their tenant
        else if (tenantId) {
            filter.branchcode = brcode;
            filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            if (branchid) filter._id = branchid;
            if (status) filter.status = status;
            // Don't allow query param branchcode to override user's brcode
        }
        // No tenant_id - no filtering
        else {
            if (branchid) filter._id = branchid;
            if (branchcode) filter.branchcode = branchcode;
            if (status) filter.status = status;
        }
       
        const totalDocuments = await Branch.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / pageLimit);
        const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

        const branches = await Branch.find(filter)
            .select('id branchcode role name')
            .sort({ _id: sortOrder })
            .skip(offset)
            .limit(pageLimit);

        res.status(200).json({result: branches, pageNumber,totalPages, pageLimit,totalDocuments , balanceDocuments});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewBranch Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}

export const viewBranchAdmin = async (req: Request, res: Response): Promise<void> => {
    const { userId, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
    let { branchid, role, branchcode, status, search, dec, page = 1, limit = 25 } = req.query;

    try {
      if (!role || role !== "admin") {
        throw new Error("Only role='admin' is allowed to view this list.");
      }

      const pageNumber = parseInt(page as string, 10);
      const pageLimit = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * pageLimit;
      const sortOrder = dec ? -1 : 1;

      const filter: any = { role: 'admin' };

      // Superadmin and master_super_admin can see all branches
      if (userRole === 'superadmin' || userRole === 'master_super_admin') {
        if (branchid) filter._id = branchid;
        if (branchcode) filter.branchcode = branchcode;
        if (status) filter.status = status;
      }
      // Tenant admin can see all branches within their tenant
      else if (userRole === 'admin' && tenantId) {
        filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        if (branchid) filter._id = branchid;
        if (branchcode) filter.branchcode = branchcode;
        if (status) filter.status = status;
      }
      // Other roles with tenant_id can only see their own branch from their tenant
      else if (tenantId) {
        filter.branchcode = brcode;
        filter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        if (branchid) filter._id = branchid;
        if (status) filter.status = status;
      }
      // No tenant_id - no filtering
      else {
        if (branchid) filter._id = branchid;
        if (branchcode) filter.branchcode = branchcode;
        if (status) filter.status = status;
      }
  
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
  
      const totalDocuments = await Branch.countDocuments(filter);
      const totalPages = Math.ceil(totalDocuments / pageLimit);
      const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);
  
      const branches = await Branch.find(filter)
        .select('id branchcode role name')
        .sort({ branchcode: 1, _id: sortOrder })
        .skip(offset)
        .limit(pageLimit);

      const distinctBranches = branches.reduce((acc: any[], branch) => {
        if (!acc.find(b => b.branchcode === branch.branchcode)) {
            acc.push(branch);
        }
        return acc;
      }, []);
  
      res.status(200).json({
        result: distinctBranches,
        pageNumber,
        totalPages,
        pageLimit,
        totalDocuments,
        balanceDocuments
      });
  
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`viewBranch Causes Error Message: ${message}`);
      res.status(500).json({ error: message });
    }
  };
