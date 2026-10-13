import { ClientModel } from "../../../db/ModelSceham/project/client";
import { Project } from "../../../db/ModelSceham/project/client";
import { Milestone } from "../../../db/ModelSceham/project/client";
import { Task } from "../../../db/ModelSceham/project/client";

export const clientwiseSummary = async (  
  branchcode: string | null,
  client_code?: string | null,
  start_date: string | null = null,
  end_date: string | null = null,
  sortField?: string | "total_projects",
  sortDirection: 'ASC' | 'DESC' = 'DESC'
) => {
  try {
    const allowedSortFields = [
      'total_projects',
      'minor_priority_projects','major_priority_projects','critical_priority_projects', 'blocker_priority_projects',
      'draft_projects','planning_projects', 'inprocess_projects', 'active_projects', 'lead_review_projects',
      'completed_projects','revised_projects','client_review_projects','drop_projects',
      'total_milestones','draft_milestones', 'inprocess_milestones', 'archived_milestones', 'drop_milestones', 'verified_milestones',
      'total_tasks','minor_priority_task', 'major_priority_task', 'critical_priority_task', 'blocker_priority_task',
      'inprocess_tasks', 'archived_tasks', 'verified_closed_tasks',
      'total_client_amount', 'total_paid_amount', 'total_balance_amount',
      'total_revised_cost', 'total_additionalrevised_amount', 'total_projectrevised_count'
    ];

    const safeSortField: string = (sortField && allowedSortFields.includes(sortField)) ? sortField : 'total_projects';
    const safeSortDirection = sortDirection === 'ASC' ? 'ASC' : 'DESC';

    const result = await (async () => {
      const createdStart = start_date;
      const createdEnd = end_date;
      const clientCode = client_code;
      
      const filter: any = {};
      if (branchcode) filter.branchcode = branchcode;
      if (clientCode) filter.client_code = clientCode;
      if (createdStart && createdEnd) {
        filter.created_on = { $gte: new Date(createdStart), $lte: new Date(createdEnd) };
      }
      
      const clients = await ClientModel.find(filter).lean() as any[];
      const rows = [];
      for (const c of clients) {
        const projects = await Project.find({ client_code: c.client_code }).lean() as any[];
        const milestones = await Milestone.find({ client_code: c.client_code }).lean() as any[];
        const tasks = await Task.find({ client_code: c.client_code }).lean() as any[];
        
        const total_client_amount = projects.reduce((acc, pr) => acc + (pr.budget || 0), 0);
        const total_paid_amount = projects.reduce((acc, pr) => acc + ((pr.balance || 0) - (pr.budget || 0)), 0);
        const total_balance_amount = projects.reduce((acc, pr) => acc + -(pr.balance || 0), 0);
        const total_revised_cost = projects.reduce((acc, pr) => acc + (pr.revised_cost || 0), 0);
        
        const completed_projects = projects.filter(pr => pr.status === 'completed').length;
        const inprocess_projects = projects.filter(pr => pr.status === 'inprocess').length;

        rows.push({
          client_code: c.client_code,
          client_name: c.client_name,
          branchcode: c.branchcode,
          company_name: c.company_name,
          email: c.email,
          comm_type: c.comm_type,
          created_on: c.created_on,
          total_client_amount,
          total_paid_amount,
          total_balance_amount,
          total_revised_cost,
          total_projects: projects.length,
          completed_projects,
          inprocess_projects,
          total_milestones: milestones.length,
          total_tasks: tasks.length
        });
      }
      
      // Sort rows
      rows.sort((a: any, b: any) => {
        const valA = a[safeSortField] ?? 0;
        const valB = b[safeSortField] ?? 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return safeSortDirection === 'ASC' ? valA - valB : valB - valA;
        }
        return safeSortDirection === 'ASC'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });

      return { rows, rowCount: rows.length };
    })();

    return result.rows;
  } catch (error) {
    console.error("Error fetching client summary:", error);
    throw new Error("Error fetching client summary");
  }
};