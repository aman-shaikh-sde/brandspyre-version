import { ProjectInvoice, InvoiceRequest, ProjectPayreq, Project, ClientModel, Milestone } from '../../../db/ModelSceham/project/client';

interface InvoiceFilters {
  project_code?: string;
  invoice_status?: string;
  from_date?: string;
  to_date?: string;
}

export const getFilteredInvoicesWithMilestones = async (filters: InvoiceFilters) => {
  let filter: any = {};

  if (filters.project_code) filter.project_code = filters.project_code;
  if (filters.invoice_status) filter.status = filters.invoice_status;
  if (filters.from_date && filters.to_date) {
    filter.invoice_date = { $gte: new Date(filters.from_date), $lte: new Date(filters.to_date) };
  } else if (filters.from_date) {
    filter.invoice_date = { $gte: new Date(filters.from_date) };
  } else if (filters.to_date) {
    filter.invoice_date = { $lte: new Date(filters.to_date) };
  }

  const invoices = await ProjectInvoice.find(filter).sort({ invoice_date: -1 }).lean() as any[];

  return Promise.all(invoices.map(async (inv: any) => {
    const project = await Project.findOne({ project_code: inv.project_code }).lean() as any;
    const client = project ? await ClientModel.findOne({ client_code: project.client_code }).lean() as any : null;

    const invReqs = await InvoiceRequest.find({ invoice_id: inv.invoice_id }).lean() as any[];
    const requestIds = invReqs.map(r => r.request_id);

    const payReqs = await ProjectPayreq.find({ request_id: { $in: requestIds } }).lean() as any[];

    let total_milestone_amount = 0;
    let total_balance_due = 0;
    let pending_flag = false;
    let revised_flag = false;

    const milestone_details = await Promise.all(payReqs.map(async (pr: any) => {
      const ms = await Milestone.findOne({ milestone_code: pr.milestone_code }).lean() as any;
      const mAmount = parseFloat(pr.milestone_amount || '0');
      const bAmount = parseFloat(pr.balance_amount || '0');

      total_milestone_amount += mAmount;
      total_balance_due += bAmount;

      if (bAmount > 0 || pr.status !== 'paid') pending_flag = true;
      if (pr.isrevised_milestone) revised_flag = true;

      return {
        milestone_code: pr.milestone_code,
        milestone_title: ms?.miles_title || '',
        milestone_amount: mAmount,
        due_date: pr.due_date,
        milestone_status: pr.status,
        balance_amount: bAmount,
        isrevised_milestone: pr.isrevised_milestone,
        revision_notice: pr.isrevised_milestone ? '⚠ Revised Milestone' : null
      };
    }));

    return {
      invoice_id: inv.invoice_id,
      invoice_no: inv.invoice_no,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      project_code: inv.project_code,
      final_amount: parseFloat(inv.final_amount || '0'),
      status: inv.status,
      notes: inv.notes,
      created_by: inv.created_by,
      created_on: inv.created_on,
      updated_on: inv.updated_on,
      project_title: project?.title || '',
      project_type: project?.type || '',
      project_loc: project?.loc || '',
      client_company_name: client?.company_name || '',
      client_primary_phone: client?.primary_phone || '',
      client_office_address: client?.office_address || '',
      milestone_details,
      total_milestone_amount,
      total_balance_due,
      pending_flag,
      revised_flag,
    };
  }));
};