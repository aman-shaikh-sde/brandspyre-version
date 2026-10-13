import { UserInfo } from '../db/ModelSceham/userSchema';
import { Branch, Department, Designation } from '../db/ModelSceham/branchSchema';
import { Tenant } from '../db/ModelSceham/saasSchema';
import { DOCUMENT_TYPE_MODULE_MAP } from '../db/ModelSceham/documentTemplateSchema';

// ---------------------------------------------------------------
// Variable Definition Interface
// ---------------------------------------------------------------
export interface VariableDefinition {
  path: string;        // e.g. "company.name"
  label: string;       // e.g. "Company Name"
  group: string;       // e.g. "Company"
  sample: string;      // e.g. "Almino Pvt Ltd"
}

// ---------------------------------------------------------------
// Variable Definitions per Group
// ---------------------------------------------------------------
const COMPANY_VARIABLES: VariableDefinition[] = [
  { path: 'company.name', label: 'Company Name', group: 'Company', sample: 'NXT Aspect Pvt Ltd' },
  { path: 'company.logo', label: 'Company Logo URL', group: 'Company', sample: '/uploads/logo.png' },
  { path: 'company.address', label: 'Company Address', group: 'Company', sample: '123 Business Park, Chennai' },
  { path: 'company.phone', label: 'Company Phone', group: 'Company', sample: '+91 9876543210' },
  { path: 'company.email', label: 'Company Email', group: 'Company', sample: 'info@nxtaspect.com' },
  { path: 'company.website', label: 'Company Website', group: 'Company', sample: 'https://nxtaspect.com' },
  { path: 'company.gst', label: 'GST Number', group: 'Company', sample: '33AASCA3262R1Z2' },
  { path: 'company.pan', label: 'PAN Number', group: 'Company', sample: 'AASCA3262R' },
];

const BRANCH_VARIABLES: VariableDefinition[] = [
  { path: 'branch.name', label: 'Branch Name', group: 'Branch', sample: 'Head Office' },
  { path: 'branch.code', label: 'Branch Code', group: 'Branch', sample: 'HO-001' },
  { path: 'branch.address', label: 'Branch Address', group: 'Branch', sample: '456 Branch Road, Mumbai' },
  { path: 'branch.phone', label: 'Branch Phone', group: 'Branch', sample: '+91 9876543211' },
];

const EMPLOYEE_VARIABLES: VariableDefinition[] = [
  { path: 'employee.name', label: 'Full Name', group: 'Employee', sample: 'John Doe' },
  { path: 'employee.first_name', label: 'First Name', group: 'Employee', sample: 'John' },
  { path: 'employee.last_name', label: 'Last Name', group: 'Employee', sample: 'Doe' },
  { path: 'employee.staff_id', label: 'Employee ID', group: 'Employee', sample: 'EMP-001' },
  { path: 'employee.email', label: 'Email', group: 'Employee', sample: 'john@company.com' },
  { path: 'employee.phone', label: 'Phone', group: 'Employee', sample: '+91 9876543212' },
  { path: 'employee.designation', label: 'Designation', group: 'Employee', sample: 'Senior Engineer' },
  { path: 'employee.department', label: 'Department', group: 'Employee', sample: 'Engineering' },
  { path: 'employee.date_of_joining', label: 'Date of Joining', group: 'Employee', sample: '2024-01-15' },
  { path: 'employee.present_address', label: 'Present Address', group: 'Employee', sample: '789 Street, City' },
  { path: 'employee.permanent_address', label: 'Permanent Address', group: 'Employee', sample: '101 Home Road, Town' },
  { path: 'employee.reporting_to', label: 'Reporting Manager', group: 'Employee', sample: 'Jane Manager' },
  { path: 'employee.salary.basic', label: 'Basic Salary', group: 'Employee', sample: '25000' },
  { path: 'employee.salary.hra', label: 'HRA', group: 'Employee', sample: '10000' },
  { path: 'employee.salary.other_allowance', label: 'Other Allowance', group: 'Employee', sample: '5000' },
  { path: 'employee.salary.gross', label: 'Gross Salary', group: 'Employee', sample: '40000' },
  { path: 'employee.salary.pf', label: 'PF Deduction', group: 'Employee', sample: '3000' },
  { path: 'employee.salary.esi', label: 'ESI Deduction', group: 'Employee', sample: '750' },
  { path: 'employee.salary.net', label: 'Net Salary', group: 'Employee', sample: '36250' },
];

const CLIENT_VARIABLES: VariableDefinition[] = [
  { path: 'client.name', label: 'Client Name', group: 'Client', sample: 'Acme Corporation' },
  { path: 'client.contact_person', label: 'Contact Person', group: 'Client', sample: 'Bob Smith' },
  { path: 'client.email', label: 'Client Email', group: 'Client', sample: 'bob@acme.com' },
  { path: 'client.phone', label: 'Client Phone', group: 'Client', sample: '+91 9876543213' },
  { path: 'client.address', label: 'Client Address', group: 'Client', sample: '200 Client Avenue, Delhi' },
  { path: 'client.gst', label: 'Client GST', group: 'Client', sample: '07AAACR1234K1ZS' },
];

const LEAD_VARIABLES: VariableDefinition[] = [
  { path: 'lead.name', label: 'Lead Name', group: 'Lead', sample: 'Prospect Inc.' },
  { path: 'lead.contact_person', label: 'Contact Person', group: 'Lead', sample: 'Alice Johnson' },
  { path: 'lead.email', label: 'Lead Email', group: 'Lead', sample: 'alice@prospect.com' },
  { path: 'lead.phone', label: 'Lead Phone', group: 'Lead', sample: '+91 9876543214' },
  { path: 'lead.source', label: 'Lead Source', group: 'Lead', sample: 'Website' },
];

const PROJECT_VARIABLES: VariableDefinition[] = [
  { path: 'project.name', label: 'Project Name', group: 'Project', sample: 'Website Redesign' },
  { path: 'project.code', label: 'Project Code', group: 'Project', sample: 'PRJ-001' },
  { path: 'project.start_date', label: 'Start Date', group: 'Project', sample: '2024-02-01' },
  { path: 'project.end_date', label: 'End Date', group: 'Project', sample: '2024-06-30' },
  { path: 'project.status', label: 'Status', group: 'Project', sample: 'In Progress' },
  { path: 'project.budget', label: 'Budget', group: 'Project', sample: '500000' },
  { path: 'project.description', label: 'Description', group: 'Project', sample: 'Complete website redesign project' },
];

const INVOICE_VARIABLES: VariableDefinition[] = [
  { path: 'invoice.number', label: 'Invoice Number', group: 'Invoice', sample: 'INV-2024-001' },
  { path: 'invoice.date', label: 'Invoice Date', group: 'Invoice', sample: '2024-03-15' },
  { path: 'invoice.due_date', label: 'Due Date', group: 'Invoice', sample: '2024-04-15' },
  { path: 'invoice.subtotal', label: 'Subtotal', group: 'Invoice', sample: '45000' },
  { path: 'invoice.tax_amount', label: 'Tax Amount', group: 'Invoice', sample: '8100' },
  { path: 'invoice.discount', label: 'Discount', group: 'Invoice', sample: '2000' },
  { path: 'invoice.total', label: 'Total Amount', group: 'Invoice', sample: '51100' },
  { path: 'invoice.amount_in_words', label: 'Amount in Words', group: 'Invoice', sample: 'Fifty One Thousand One Hundred Only' },
  { path: 'invoice.notes', label: 'Notes', group: 'Invoice', sample: 'Thank you for your business' },
  { path: 'invoice.terms', label: 'Terms', group: 'Invoice', sample: 'Net 30 days' },
];

const QUOTATION_VARIABLES: VariableDefinition[] = [
  { path: 'quotation.number', label: 'Quotation Number', group: 'Quotation', sample: 'QT-2024-001' },
  { path: 'quotation.date', label: 'Quotation Date', group: 'Quotation', sample: '2024-03-01' },
  { path: 'quotation.valid_until', label: 'Valid Until', group: 'Quotation', sample: '2024-04-01' },
  { path: 'quotation.total', label: 'Total Amount', group: 'Quotation', sample: '75000' },
];

const MEETING_VARIABLES: VariableDefinition[] = [
  { path: 'meeting.title', label: 'Meeting Title', group: 'Meeting', sample: 'Project Kickoff Meeting' },
  { path: 'meeting.date', label: 'Meeting Date', group: 'Meeting', sample: '2024-03-20' },
  { path: 'meeting.time', label: 'Meeting Time', group: 'Meeting', sample: '10:00 AM' },
  { path: 'meeting.location', label: 'Location', group: 'Meeting', sample: 'Conference Room A' },
  { path: 'meeting.agenda', label: 'Agenda', group: 'Meeting', sample: 'Discuss project scope and timeline' },
  { path: 'meeting.attendees', label: 'Attendees', group: 'Meeting', sample: 'John, Jane, Bob' },
];

const SYSTEM_VARIABLES: VariableDefinition[] = [
  { path: 'today', label: 'Today\'s Date', group: 'System', sample: new Date().toISOString().split('T')[0] },
  { path: 'current_time', label: 'Current Time', group: 'System', sample: '14:30' },
  { path: 'page', label: 'Page Number', group: 'System', sample: '1' },
  { path: 'totalPages', label: 'Total Pages', group: 'System', sample: '3' },
];

// ---------------------------------------------------------------
// Module → Variable Group Mapping
// ---------------------------------------------------------------
const MODULE_VARIABLE_MAP: Record<string, VariableDefinition[][]> = {
  hr: [COMPANY_VARIABLES, BRANCH_VARIABLES, EMPLOYEE_VARIABLES, SYSTEM_VARIABLES],
  sales: [COMPANY_VARIABLES, BRANCH_VARIABLES, CLIENT_VARIABLES, INVOICE_VARIABLES, QUOTATION_VARIABLES, SYSTEM_VARIABLES],
  accounting: [COMPANY_VARIABLES, BRANCH_VARIABLES, CLIENT_VARIABLES, INVOICE_VARIABLES, SYSTEM_VARIABLES],
  projects: [COMPANY_VARIABLES, BRANCH_VARIABLES, CLIENT_VARIABLES, PROJECT_VARIABLES, EMPLOYEE_VARIABLES, SYSTEM_VARIABLES],
  crm: [COMPANY_VARIABLES, BRANCH_VARIABLES, LEAD_VARIABLES, CLIENT_VARIABLES, SYSTEM_VARIABLES],
  meetings: [COMPANY_VARIABLES, BRANCH_VARIABLES, MEETING_VARIABLES, EMPLOYEE_VARIABLES, SYSTEM_VARIABLES],
};

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

/**
 * Get available variable definitions for a given document type
 */
export function getAvailableVariables(documentType: string): VariableDefinition[] {
  const module = DOCUMENT_TYPE_MODULE_MAP[documentType];
  if (!module) return [...COMPANY_VARIABLES, ...SYSTEM_VARIABLES];
  const groups = MODULE_VARIABLE_MAP[module] || [COMPANY_VARIABLES, SYSTEM_VARIABLES];
  return groups.flat();
}

/**
 * Get sample data for preview rendering
 */
export function getSampleData(documentType: string): Record<string, any> {
  const variables = getAvailableVariables(documentType);
  const data: Record<string, any> = {};
  for (const v of variables) {
    setNestedValue(data, v.path, v.sample);
  }
  return data;
}

/**
 * Resolve actual variable values from the database
 */
export async function resolveVariables(
  documentType: string,
  contextId: string,
  tenantId: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  try {
    // Resolve company/tenant info
    const tenant = await Tenant.findById(tenantId);
    if (tenant) {
      result['company.name'] = tenant.company_name || tenant.name || '';
      result['company.email'] = (tenant as any).email || '';
      result['company.phone'] = (tenant as any).phone || '';
      result['company.website'] = tenant.domain || '';
      result['company.gst'] = (tenant as any).gst_number || '';
      result['company.pan'] = (tenant as any).pan_number || '';
      result['company.address'] = (tenant as any).address || '';
      result['company.logo'] = (tenant.settings as any)?.logo || '';
    }

    // Resolve branch info from first active branch
    const branch = await Branch.findOne({ tenant_id: tenantId });
    if (branch) {
      result['branch.name'] = (branch as any).branchname || '';
      result['branch.code'] = (branch as any).branchcode || '';
      result['branch.address'] = (branch as any).address || '';
      result['branch.phone'] = (branch as any).phone || '';
    }

    const module = DOCUMENT_TYPE_MODULE_MAP[documentType];

    // Resolve employee data for HR documents
    if (module === 'hr' && contextId) {
      const employee = await UserInfo.findById(contextId);
      if (employee) {
        const emp: any = employee;
        result['employee.name'] = `${emp.firstname || ''} ${emp.lastname || ''}`.trim();
        result['employee.first_name'] = emp.firstname || '';
        result['employee.last_name'] = emp.lastname || '';
        result['employee.staff_id'] = emp.staff_id || '';
        result['employee.email'] = emp.email || '';
        result['employee.phone'] = emp.mobile || emp.phone || '';
        result['employee.designation'] = emp.desigantion || emp.designation || '';
        result['employee.department'] = emp.department || '';
        result['employee.date_of_joining'] = emp.dateofjoining || '';
        result['employee.present_address'] = emp.presentaddress || '';
        result['employee.permanent_address'] = emp.permantaddress || emp.permanentaddress || '';
        result['employee.reporting_to'] = emp.reporting_to_name || '';
        result['employee.salary.basic'] = String(emp.basicsalary || '');
        result['employee.salary.hra'] = String(emp.hra || '');
        result['employee.salary.other_allowance'] = String(emp.other_allowance || '');
        result['employee.salary.gross'] = String(emp.gross_salary || '');
        result['employee.salary.pf'] = String(emp.pf || '');
        result['employee.salary.esi'] = String(emp.esi || '');
        result['employee.salary.net'] = String(emp.netsalary || '');
      }
    }

    // System variables
    result['today'] = new Date().toISOString().split('T')[0];
    result['current_time'] = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  } catch (error) {
    console.error('Error resolving template variables:', error);
  }

  return result;
}

/**
 * Replace {{variable}} placeholders in a string with actual values
 */
export function replaceVariables(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmed = path.trim();
    return data[trimmed] !== undefined ? data[trimmed] : match;
  });
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function setNestedValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
