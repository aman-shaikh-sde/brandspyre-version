import mongoose from 'mongoose';
import { ProjectInvoice, ProjectPayreq, PaymentLog, Project, Milestone, ClientModel, InvoiceRequest, Task, TaskParticipant } from "../../../db/ModelSceham/project/client";
import { Team } from "../../../db/ModelSceham/teams/team";
import { UserInfo } from "../../../db/ModelSceham/userSchema";
import { Request, Response } from "express";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const viewPayRequest = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Pay Request Info`;
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  let {
    milestone_code,
    project_code,
    client_code,
    status,
    request_id,
    dec,
    page = "1",
    limit = "25"
  } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;
    const order = dec ? "DESC" : "ASC";

    const filter: any = {};

    // Superadmin and master_super_admin can see all payments
    if (userRole === 'superadmin' || userRole === 'master_super_admin') {
      // No branch filtering
    }
    // Tenant admin can only see payments from their specific branch
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

    if (status) filter.status = status;
    if (request_id) filter.request_id = request_id;
    if (project_code) filter.project_code = { $regex: project_code, $options: 'i' };
    if (client_code) filter.client_code = { $regex: client_code, $options: 'i' };
    if (milestone_code) filter.milestone_code = { $regex: milestone_code, $options: 'i' };

    const totalDocuments = await ProjectPayreq.countDocuments(filter).session(session);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const payReqs = await ProjectPayreq.find(filter)
      .sort({ request_id: order === 'DESC' ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const rows = [];
    for (const pr of payReqs) {
      const pi = await InvoiceRequest.findOne({ request_id: pr.request_id }).session(session).lean() as any;
      let invoice_id = null;
      let cgst_percentage = null;
      let cgst_amount = null;
      let sgst_percentage = null;
      let sgst_amount = null;
      let discount = null;
      let roundoff = null;
      let total_amount = null;
      let final_amount = null;
      let invoice_no = null;

      if (pi) {
        invoice_id = pi.invoice_id;
        const inv = await ProjectInvoice.findOne({ invoice_id: pi.invoice_id }).session(session).lean() as any;
        if (inv) {
          cgst_percentage = inv.cgst_percentage;
          cgst_amount = inv.cgst_amount;
          sgst_percentage = inv.sgst_percentage;
          sgst_amount = inv.sgst_amount;
          discount = inv.discount;
          roundoff = inv.roundoff;
          total_amount = inv.total_amount;
          final_amount = inv.final_amount;
          invoice_no = inv.invoice_no;
        }
      }

      const pLogs = await PaymentLog.find({ request_id: pr.request_id }).session(session).lean() as any[];
      const paid_amount = pLogs.reduce((sum, log) => sum + (log.paid_amount || 0), 0);

      rows.push({
        ...pr,
        id: pr._id.toString(),
        invoice_id,
        cgst_percentage,
        cgst_amount,
        sgst_percentage,
        sgst_amount,
        discount,
        roundoff,
        total_amount,
        final_amount,
        invoice_no,
        paid_amount
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data: rows,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: message });
  } finally {
    session.endSession();
  }
};

export const viewPayHistoryLog = async (req: Request, res: Response): Promise<void> => {
  const msgField = `View Pay History Log Info`;
  const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  let { request_id, pay_id, search, dec, page = 1, limit = 25 } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!request_id) {
      throw new Error("Request_id is required");
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;
    const order = dec ? "DESC" : "ASC";

    const filter: any = {};
    if (request_id) filter.request_id = request_id;
    if (pay_id) filter.pay_id = pay_id;
    if (search) {
      filter.$or = [
        { payment_status: { $regex: search, $options: 'i' } },
        { payment_mode: { $regex: search, $options: 'i' } }
      ];
    }

    const totalDocuments = await PaymentLog.countDocuments(filter).session(session);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    const logs = await PaymentLog.find(filter)
      .sort({ pay_id: order === 'DESC' ? -1 : 1 })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const rows = [];
    for (const log of logs) {
      let project_code = null;
      let project_title = null;
      let milestone_title = null;
      let client_name = null;

      const pr = await ProjectPayreq.findOne({ request_id: log.request_id }).session(session).lean() as any;
      if (pr) {
        project_code = pr.project_code;
        const p = await Project.findOne({ project_code: pr.project_code }).session(session).lean() as any;
        if (p) project_title = p.title;
        const m = await Milestone.findOne({ milestone_code: pr.milestone_code }).session(session).lean() as any;
        if (m) milestone_title = m.miles_title;
        const c = await ClientModel.findOne({ client_code: pr.client_code }).session(session).lean() as any;
        if (c) client_name = c.client_name;
      }

      rows.push({
        pay_id: log.pay_id,
        request_id: log.request_id,
        payment_id: log.payment_id,
        paid_amount: log.paid_amount,
        paid_on: log.paid_on || log.created_at,
        payment_mode: log.payment_mode,
        payment_status: log.payment_status,
        notes: log.notes,
        project_code,
        project_title,
        milestone_title,
        client_name
      });
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data: rows,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Error: ${message}`);
    res.status(500).json({ error: message });
  } finally {
    session.endSession();
  }
};

export const getInvoiceDetailsWithMilestones = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Invoices with Milestones";
  const { userId: idObj, userRole, brcode, tenantId } = req.user as AuthenticatedUser;
  const {
    invoice_id,
    branchcode,
    campaign_code,
    project_code,
    client_code,
    start_date,
    end_date,
    hsn_sac,
    invoice_start_date,
    invoice_end_date,
    overdue,
    status,
    revised_count,
    page = 1,
    limit = 25
  } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 25;
    const offset = (pageNumber - 1) * pageLimit;

    const filter: any = {};
    if (invoice_id) {
      filter.invoice_id = invoice_id;
    } else {
      // Superadmin and master_super_admin can see all invoices
      if (userRole === 'superadmin' || userRole === 'master_super_admin') {
        // No branch filtering
      }
      // Tenant admin can only see invoices from their specific branch
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
      
      // Allow explicit branchcode override if provided (for superadmin)
      if (branchcode && (userRole === 'superadmin' || userRole === 'master_super_admin')) {
        filter.branchcode = branchcode;
      }
      
      if (project_code) filter.project_code = project_code;
      if (campaign_code) filter.campaign_code = campaign_code;
      if (client_code) filter.client_code = client_code;
      if (hsn_sac) filter.hsn_sac = hsn_sac;
      if (start_date && end_date) {
        filter.due_date = { $gte: new Date(String(start_date)), $lte: new Date(String(end_date)) };
      }
      if (invoice_start_date && invoice_end_date) {
        filter.invoice_date = { $gte: new Date(String(invoice_start_date)), $lte: new Date(String(invoice_end_date)) };
      }
      if (status) filter.status = status;
      if (revised_count !== undefined) filter.revised_count = revised_count;
      if (overdue) {
        filter.status = { $ne: 'paid' };
        filter.due_date = { $lte: new Date(String(overdue)) };
      }
    }

    const totalDocuments = await ProjectInvoice.countDocuments(filter).session(session);
    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - (pageNumber * pageLimit), 0);

    // Summary calculations (ignores pagination but respects filters)
    const allMatching = await ProjectInvoice.find(filter).session(session).lean() as any[];
    const total_amount = allMatching.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
    const total_paid = allMatching.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
    const total_balance = allMatching.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0);
    const total_invoices = allMatching.length;
    const summary = { total_amount, total_paid, total_balance, total_invoices };

    const invoices = await ProjectInvoice.find(filter)
      .sort({ invoice_id: -1, due_date: -1 })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const invoiceMap = new Map<string, any>();
    
    for (const invoice of invoices) {
      let branch_name = '';
      if (invoice.branchcode) {
        const branchDoc = await mongoose.connection.db!.collection('branches').findOne({ branchcode: invoice.branchcode });
        if (branchDoc) branch_name = branchDoc.name;
      }

      let campaignname = '';
      if (invoice.campaign_code) {
        const camp = await mongoose.connection.db!.collection('campaigns').findOne({ campaign_code: invoice.campaign_code });
        if (camp) campaignname = camp.campaignname;
      }

      let client_name = '';
      let company_name = '';
      let office_address = '';
      if (invoice.client_code) {
        const cl = await ClientModel.findOne({ client_code: invoice.client_code }).session(session).lean() as any;
        if (cl) {
          client_name = cl.client_name;
          company_name = cl.company_name;
          office_address = cl.office_address || cl.presentaddress;
        }
      }

      let project_title = '';
      if (invoice.project_code) {
        const p = await Project.findOne({ project_code: invoice.project_code }).session(session).lean() as any;
        if (p) project_title = p.title;
      }

      invoiceMap.set(invoice.invoice_id, {
        invoice: {
          ...invoice,
          id: invoice._id.toString(),
          branch_name,
          campaignname,
          client_name,
          company_name,
          office_address,
          project_title
        },
        milestone_requests: []
      });
    }

    if (invoices.length > 0) {
      const invoiceIds = invoices.map(i => i.invoice_id);
      const irs = await InvoiceRequest.find({ invoice_id: { $in: invoiceIds } }).session(session).lean() as any[];
      const requestIds = irs.map(i => i.request_id);
      const prs = await ProjectPayreq.find({ request_id: { $in: requestIds } }).sort({ created_on: 1 }).session(session).lean() as any[];
      
      for (const pr of prs) {
        const m = await Milestone.findOne({ milestone_code: pr.milestone_code }).session(session).lean() as any;
        const ir = irs.find(i => i.request_id === pr.request_id);
        const invId = ir ? ir.invoice_id : null;
        if (invId && invoiceMap.has(invId)) {
          invoiceMap.get(invId).milestone_requests.push({
            invoice_id: invId,
            request_id: pr.request_id,
            branchcode: pr.branchcode,
            campaign_code: pr.campaign_code,
            client_code: pr.client_code,
            project_code: pr.project_code,
            milestone_code: pr.milestone_code,
            notes: pr.notes,
            project_amount: pr.project_amount,
            milestone_amount: pr.milestone_amount,
            isrevised_milestone: pr.isrevised_milestone,
            balance_amount: pr.balance_amount,
            permission: pr.permission,
            status: pr.status,
            due_date: pr.due_date,
            created_on: pr.created_on,
            updated_on: pr.updated_on,
            miles_title: m ? m.miles_title : null
          });
        }
      }
    }

    const fullData = Array.from(invoiceMap.values());

    await session.commitTransaction();

    res.status(200).json({
      message: `${msgField} Success`,
      data: fullData,
      pageNumber,
      totalPages,
      pageLimit,
      summary,
      totalDocuments,
      balanceDocuments
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} failed: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const getInvoicePaymentSummary = async (req: Request, res: Response): Promise<void> => {
  const { branchcode, payment_date } = req.query;
  const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const branchFilter: any = {};
    if (branchcode) branchFilter.branchcode = branchcode;
    
    const branches = await mongoose.connection.db!.collection('branches').find(branchFilter).toArray();

    const data = await Promise.all(
      branches.map(async (branch) => {
        const invoices = await ProjectInvoice.find({ branchcode: branch.branchcode }).session(session).lean() as any[];

        const invoice_summary = [];
        let total_amount = 0;
        let paid_amount = 0;

        for (const invoice of invoices) {
          let campaignname = '';
          if (invoice.campaign_code) {
            const camp = await mongoose.connection.db!.collection('campaigns').findOne({ campaign_code: invoice.campaign_code });
            if (camp) campaignname = camp.campaignname;
          }

          let client_name = '';
          if (invoice.client_code) {
            const cl = await ClientModel.findOne({ client_code: invoice.client_code }).session(session).lean() as any;
            if (cl) client_name = cl.client_name;
          }

          let project_title = '';
          if (invoice.project_code) {
            const p = await Project.findOne({ project_code: invoice.project_code }).session(session).lean() as any;
            if (p) project_title = p.title;
          }

          const irs = await InvoiceRequest.find({ invoice_id: invoice.invoice_id }).session(session).lean() as any[];
          const requestIds = irs.map(i => i.request_id);

          const logFilter: any = { request_id: { $in: requestIds } };
          if (payment_date) {
            logFilter.$expr = {
              $eq: [
                { $dateToString: { format: "%Y-%m-%d", date: "$paid_on" } },
                String(payment_date)
              ]
            };
          }

          const logs = await PaymentLog.find(logFilter).session(session).lean() as any[];
          const invoicePaid = logs.reduce((sum, log) => sum + (log.paid_amount || 0), 0);
          const invoicePending = (invoice.final_amount || 0) - invoicePaid;

          total_amount += invoice.final_amount || 0;
          paid_amount += invoicePaid;

          invoice_summary.push({
            invoice_id: invoice.invoice_id,
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            total_amount: invoice.total_amount,
            final_amount: invoice.final_amount,
            paid_amount: invoicePaid,
            pending_amount: invoicePending,
            status: invoice.status,
            campaignname,
            client_name,
            project_title
          });
        }

        const pending_amount = total_amount - paid_amount;

        return {
          branchcode: branch.branchcode,
          branch_name: branch.name,
          total_invoices: invoices.length,
          total_amount,
          paid_amount,
          pending_amount,
          invoice_summary
        };
      })
    );

    await session.commitTransaction();

    res.status(200).json({
      message: "Invoice payment summary retrieved successfully",
      data
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    console.error("Error fetching invoice summary:", error);
    res.status(500).json({ error: "Failed to fetch invoice summary" });
  } finally {
    session.endSession();
  }
};

interface TeamFinancialSummary {
  team_id: string;
  team_name: string;
  branchcode: string;
  team_lead_id: string;
  team_lead_name: string;
  total_project_count: number;
  total_project_amount: number;
  total_paid_amount: number;
  total_pending_amount: number;
  total_project_draft: number;
  total_project_planning: number;
  total_project_inprocess: number;
  total_project_active: number;
  total_project_lead_review: number;
  total_project_completed: number;
  total_project_revised: number;
  total_project_client_review: number;
  total_project_drop: number;
  total_milestone_count: number;
  total_milestone_draft: number;
  total_milestone_archived: number;
  total_milestone_inprocess: number;
  total_milestone_verified: number;
  total_milestone_drop: number;
  total_task_count: number;
  total_task_draft: number;
  total_task_archived: number;
  total_task_inprocess: number;
  total_task_verified_closed: number;
  total_task_drop: number;
}

interface PaginationData {
  pageNumber: number;
  pageLimit: number;
  offset: number;
  totalDocuments: number;
  totalPages: number;
  balanceDocuments: number;
}

export const teamWiseFinacialSummary = async (req: Request, res: Response) => {
  const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
  let { branchcode, teamid, startdate, enddate, page = 1, limit = 10 } = req.query;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * pageLimit;

    const teamFilter: any = {};
    if (branchcode) teamFilter.branchcode = branchcode;
    if (teamid) teamFilter.team_id = teamid;

    const totalDocuments = await Team.countDocuments(teamFilter).session(session);
    const teams = await Team.find(teamFilter)
      .sort({ branchcode: 1, team_id: 1 })
      .skip(offset)
      .limit(pageLimit)
      .session(session)
      .lean() as any[];

    const data = await Promise.all(teams.map(async (team: any) => {
      const lead = await UserInfo.findOne({ staff_id: team.team_lead }).session(session).lean() as any;
      const tps = await TaskParticipant.find({ team_id: team.team_id }).session(session).lean() as any[];
      const taskIds = tps.map(tp => tp.task_id).filter(Boolean);

      const tasks = await Task.find({ _id: { $in: taskIds } }).session(session).lean() as any[];
      const milestoneCodes = Array.from(new Set(tasks.map(t => t.milestone_code).filter(Boolean)));

      const milestones = await Milestone.find({ milestone_code: { $in: milestoneCodes } }).session(session).lean() as any[];
      const projectCodes = Array.from(new Set(milestones.map(m => m.project_code).filter(Boolean)));

      const projects = await Project.find({ project_code: { $in: projectCodes } }).session(session).lean() as any[];

      let filteredProjects = projects;
      let filteredMilestones = milestones;
      let filteredTasks = tasks;

      if (startdate || enddate) {
        const sTime = startdate ? new Date(String(startdate)).getTime() : null;
        const eTime = enddate ? new Date(String(enddate)).getTime() : null;

        const validProjectCodes = new Set<string>();
        const validMilestoneCodes = new Set<string>();
        const validTaskIds = new Set<string>();

        for (const p of projects) {
          const pTime = p.end_date ? new Date(p.end_date).getTime() : null;
          let ok = true;
          if (sTime && (!pTime || pTime < sTime)) ok = false;
          if (eTime && (!pTime || pTime > eTime)) ok = false;
          if (ok) validProjectCodes.add(p.project_code);
        }

        for (const m of milestones) {
          const mTime = m.end_date ? new Date(m.end_date).getTime() : null;
          let ok = true;
          if (sTime && (!mTime || mTime < sTime)) ok = false;
          if (eTime && (!mTime || mTime > eTime)) ok = false;
          if (ok) {
            validMilestoneCodes.add(m.milestone_code);
            validProjectCodes.add(m.project_code);
          }
        }

        for (const t of tasks) {
          const tTime = t.end_date ? new Date(t.end_date).getTime() : null;
          let ok = true;
          if (sTime && (!tTime || tTime < sTime)) ok = false;
          if (eTime && (!tTime || tTime > eTime)) ok = false;
          if (ok) {
            validTaskIds.add(t._id.toString());
            validMilestoneCodes.add(t.milestone_code);
            const ms = milestones.find(m => m.milestone_code === t.milestone_code);
            if (ms) validProjectCodes.add(ms.project_code);
          }
        }

        filteredProjects = projects.filter(p => validProjectCodes.has(p.project_code));
        filteredMilestones = milestones.filter(m => validMilestoneCodes.has(m.milestone_code) || validProjectCodes.has(m.project_code));
        filteredTasks = tasks.filter(t => validTaskIds.has(t._id.toString()) || validMilestoneCodes.has(t.milestone_code));
      }

      const finalProjectCodes = filteredProjects.map(p => p.project_code);
      let totalProjectAmount = 0;
      for (const p of filteredProjects) {
        totalProjectAmount += p.revised_cost || p.budget || 0;
      }

      const invoices = await ProjectInvoice.find({ project_code: { $in: finalProjectCodes } }).session(session).lean() as any[];
      let totalPaidAmount = 0;
      for (const inv of invoices) {
        totalPaidAmount += inv.paid_amount || 0;
      }

      const totalPendingAmount = totalProjectAmount - totalPaidAmount;

      let total_project_draft = 0, total_project_planning = 0, total_project_inprocess = 0,
          total_project_active = 0, total_project_lead_review = 0, total_project_completed = 0,
          total_project_revised = 0, total_project_client_review = 0, total_project_drop = 0;

      for (const p of filteredProjects) {
        const s = (p.status || '').toLowerCase();
        if (s === 'draft') total_project_draft++;
        else if (s === 'planning') total_project_planning++;
        else if (s === 'inprocess') total_project_inprocess++;
        else if (s === 'active') total_project_active++;
        else if (s === 'lead_review') total_project_lead_review++;
        else if (s === 'completed') total_project_completed++;
        else if (s === 'revised') total_project_revised++;
        else if (s === 'client_review') total_project_client_review++;
        else if (s === 'drop') total_project_drop++;
      }

      let total_milestone_draft = 0, total_milestone_archived = 0, total_milestone_inprocess = 0,
          total_milestone_verified = 0, total_milestone_drop = 0;

      for (const m of filteredMilestones) {
        const s = (m.status || '').toLowerCase();
        if (s === 'draft') total_milestone_draft++;
        else if (s === 'archived') total_milestone_archived++;
        else if (s === 'inprocess') total_milestone_inprocess++;
        else if (s === 'verified') total_milestone_verified++;
        else if (s === 'drop') total_milestone_drop++;
      }

      let total_task_draft = 0, total_task_archived = 0, total_task_inprocess = 0,
          total_task_verified_closed = 0, total_task_drop = 0;

      for (const t of filteredTasks) {
        const s = (t.status || '').toLowerCase();
        if (s === 'draft') total_task_draft++;
        else if (s === 'archived') total_task_archived++;
        else if (s === 'inprocess') total_task_inprocess++;
        else if (s === 'verified-closed') total_task_verified_closed++;
        else if (s === 'drop') total_task_drop++;
      }

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        branchcode: team.branchcode,
        team_lead_id: team.team_lead,
        team_lead_name: lead ? `${lead.firstname} ${lead.lastname}` : '',
        total_project_count: filteredProjects.length,
        total_project_amount: totalProjectAmount,
        total_paid_amount: totalPaidAmount,
        total_pending_amount: totalPendingAmount,
        total_project_draft,
        total_project_planning,
        total_project_inprocess,
        total_project_active,
        total_project_lead_review,
        total_project_completed,
        total_project_revised,
        total_project_client_review,
        total_project_drop,
        total_milestone_count: filteredMilestones.length,
        total_milestone_draft,
        total_milestone_archived,
        total_milestone_inprocess,
        total_milestone_verified,
        total_milestone_drop,
        total_task_count: filteredTasks.length,
        total_task_draft,
        total_task_archived,
        total_task_inprocess,
        total_task_verified_closed,
        total_task_drop
      };
    }));

    const totalPages = Math.ceil(totalDocuments / pageLimit);
    const balanceDocuments = Math.max(totalDocuments - pageNumber * pageLimit, 0);

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Team-wise financial summary retrieved successfully",
      data,
      pageNumber,
      totalPages,
      pageLimit,
      totalDocuments,
      balanceDocuments
    });

  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (err) {
        console.error("Rollback error:", err);
      }
    }
    console.error("Error in teamWiseFinancialSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team-wise financial summary",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    session.endSession();
  }
};
