import { Request, Response } from "express";
import { Followup } from "../../../../db/ModelSceham/project/campagin";
import mongoose from "mongoose";
import { getTenantFilter } from "../../../../utils/tenantScope";
import { isPlatformAdminRole, isTenantAdminRole } from "../../../../middleware/securityContext";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewFollowupInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Leads Follow-up Info`;
  const { userRole, brcode } = req.user as AuthenticatedUser;
  let { campaign_code, branchcode, campaigntype, search, dec, status, page = 1, limit = 25 } = req.query;

  try {
    const pageNumber = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageLimit;

    const tenantFilter = getTenantFilter(req);
    let filter: any = { ...tenantFilter };

    const isPlatform = isPlatformAdminRole(userRole);
    const isTenantAdmin = isTenantAdminRole(userRole);

    if (!isPlatform && !isTenantAdmin) {
      if (brcode) {
        filter.branchcode = brcode;
      }
    } else if (branchcode) {
      filter.branchcode = new RegExp(String(branchcode), 'i');
    }

    if (campaign_code) filter.campaign_code = campaign_code;
    if (campaigntype) filter.lead_id = new RegExp(String(campaigntype), 'i');
    if (status) filter.status = new RegExp(String(status), 'i');

    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { next_date: regex },
        { status: regex },
      ];
    }

    const totalDocuments = await Followup.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    const sortOrder = dec ? -1 : 1;
    const followups = await Followup.find(filter).sort({ _id: sortOrder }).skip(skip).limit(pageLimit).lean();

    res.status(200).json({ message: `${msgField} Success`, data: followups, pageNumber, totalPages, pageLimit, totalDocuments, balanceDocuments });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
  }
};

export const getSingleFollowupInfo = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Get Single Leads Follow-up Info`;
  const { id } = req.params;

  try {
    const tenantFilter = getTenantFilter(req);
    const followup = await Followup.findOne({ _id: id, ...tenantFilter }).lean();
    if (!followup) {
      res.status(404).json({ error: "Follow-up not found" });
      return;
    }
    res.status(200).json({ message: `${msgField} Success`, data: followup });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
