import { Request, Response } from "express";
import { Lead } from "../../../db/ModelSceham/project/campagin";
import { Client } from "../../../db/ModelSceham/project/client";

export const getLeadConversionStatss = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, branchcode } = req.query;

    let leadFilter: any = {};
    if (branchcode) leadFilter.branchcode = branchcode;
    if (fromDate && toDate) {
      leadFilter.lead_date = {
        $gte: new Date(String(fromDate)),
        $lte: new Date(String(toDate))
      };
    }

    const allLeads = await Lead.find(leadFilter).lean();
    const leadIds = allLeads.map((l: any) => l._id.toString());

    const clients = await Client.find({ lead_id: { $in: leadIds } }).lean();
    const convertedMap = new Map<string, any>();
    clients.forEach((c: any) => {
      if (c.lead_id) convertedMap.set(String(c.lead_id), c);
    });

    const branchMap = new Map<string, { total: number; converted: number }>();
    allLeads.forEach((l: any) => {
      const bCode = l.branchcode || 'unknown';
      if (!branchMap.has(bCode)) {
        branchMap.set(bCode, { total: 0, converted: 0 });
      }
      const stat = branchMap.get(bCode)!;
      stat.total += 1;
      if (convertedMap.has(l._id.toString())) {
        stat.converted += 1;
      }
    });

    const detailList = clients.map((c: any) => {
      const lead = allLeads.find((l: any) => l._id.toString() === String(c.lead_id)) as any;
      return {
        lead_id: lead?._id || '',
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

    const response = Array.from(branchMap.entries()).map(([bCode, stat]) => {
      const rate = stat.total > 0 ? ((stat.converted / stat.total) * 100).toFixed(2) : "0.00";
      return {
        branchcode: bCode,
        total_leads: stat.total,
        converted_leads: stat.converted,
        conversion_rate: `${rate}%`,
        converted_list: detailList.filter(d => d.branchcode === bCode || !bCode)
      };
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching lead conversion stats:", error);
    res.status(500).json({ error: "Failed to fetch conversion stats" });
  }
};
