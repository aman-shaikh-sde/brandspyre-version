import { Request, Response } from "express";
import mongoose from "mongoose";
import { Lead } from "../../../db/ModelSceham/project/campagin";
import { Client } from "../../../db/ModelSceham/project/client";
import { getTenantFilter } from "../../../utils/tenantScope";

export const getLeadConversionStats = async (req: Request, res: Response) => {
  try {
    const { year, month, start_date, end_date, branchcode } = req.query;

    let tenantFilter: Record<string, any> = {};
    try {
      tenantFilter = getTenantFilter(req);
    } catch (scopeErr) {
      const fallbackTenantId =
        (req as any).effectiveTenantId ||
        (req as any).tenant_id ||
        (req as any).securityContext?.tenantId ||
        (req.headers["x-tenant-id"] as string) ||
        (req.query.tenant_id as string);

      if (fallbackTenantId && mongoose.Types.ObjectId.isValid(fallbackTenantId)) {
        tenantFilter = { tenant_id: new mongoose.Types.ObjectId(fallbackTenantId) };
      } else {
        res.status(200).json({
          overall: { total_leads: 0, converted_leads: 0, conversion_rate: "0.00%" },
          branches: [],
          converted_list: [],
        });
        return;
      }
    }

    let leadFilter: any = { ...tenantFilter };

    if (branchcode && branchcode !== "ALL") leadFilter.branchcode = branchcode;

    if (start_date && end_date) {
      leadFilter.lead_date = {
        $gte: new Date(String(start_date)),
        $lte: new Date(String(end_date))
      };
    } else if (year || month) {
      const y = year ? Number(year) : new Date().getFullYear();
      if (month) {
        const m = Number(month) - 1;
        leadFilter.lead_date = {
          $gte: new Date(y, m, 1),
          $lt: new Date(y, m + 1, 1)
        };
      } else {
        leadFilter.lead_date = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1)
        };
      }
    }

    const allLeads = await Lead.find(leadFilter).lean();
    const leadIds = allLeads.map((l: any) => l._id.toString());

    const clientFilter: any = {
      ...tenantFilter,
      lead_id: { $in: leadIds }
    };
    const clients = await Client.find(clientFilter).lean();
    const convertedLeadMap = new Map<string, any>();
    clients.forEach((c: any) => {
      if (c.lead_id) convertedLeadMap.set(String(c.lead_id), c);
    });

    const overallTotal = allLeads.length;
    const overallConverted = clients.length;
    const overallRate = overallTotal > 0 ? ((overallConverted / overallTotal) * 100).toFixed(2) : "0.00";

    const branchMap = new Map<string, { total: number; converted: number }>();
    allLeads.forEach((l: any) => {
      const bCode = l.branchcode || 'unknown';
      if (!branchMap.has(bCode)) {
        branchMap.set(bCode, { total: 0, converted: 0 });
      }
      const bStats = branchMap.get(bCode)!;
      bStats.total += 1;
      if (convertedLeadMap.has(l._id.toString())) {
        bStats.converted += 1;
      }
    });

    const branchWise = Array.from(branchMap.entries()).map(([bCode, stats]) => {
      const rate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(2) : "0.00";
      return {
        branchcode: bCode,
        total_leads: stats.total,
        converted_leads: stats.converted,
        conversion_rate: `${rate}%`,
      };
    });

    const convertedList = clients.map((c: any) => {
      const lead = allLeads.find((l: any) => l._id.toString() === String(c.lead_id)) as any;
      return {
        id: lead?._id || '',
        lead_name: lead?.lead_name || '',
        phone: lead?.phone || '',
        email: lead?.email || '',
        campaign_code: lead?.campaign_code || '',
        branchcode: lead?.branchcode || '',
        lead_status: lead?.status || '',
        client_code: c.client_code,
        client_name: c.client_name,
        company_name: c.company_name,
        industry_type: c.industry_type,
        comm_type: c.comm_type,
        client_status: c.status,
      };
    });

    res.status(200).json({
      overall: {
        total_leads: overallTotal,
        converted_leads: overallConverted,
        conversion_rate: `${overallRate}%`,
      },
      branches: branchWise,
      converted_list: convertedList,
    });

  } catch (error) {
    console.error("Error fetching lead conversion stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default getLeadConversionStats;
