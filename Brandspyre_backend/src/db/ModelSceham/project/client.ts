import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  client_code: string;
  branchcode: string;
  campaign_code?: string;
  lead_id?: any;
  client_name: string;
  company_name: string;
  primary_phone: string;
  email?: string;
  office_address?: string;
  website?: string;
  overallcost?: number;
  balance?: number;
  project_count?: number;
  contacts?: any[];
  createdby?: string;
  updatedby?: string;
  industry_type: string;
  comm_type?: string;
  status?: string;
  custom_fields?: Record<string, any>;
  created_on?: Date;
  updated_on?: Date;
}

const ClientSchema = new Schema<IClient>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  client_code: { type: String, required: true },
  branchcode: { type: String, required: true },
  campaign_code: { type: String },
  lead_id: { type: Schema.Types.Mixed },
  client_name: { type: String, required: true },
  company_name: { type: String, required: true },
  primary_phone: { type: String, required: true },
  email: { type: String },
  office_address: { type: String },
  website: { type: String },
  overallcost: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  project_count: { type: Number, default: 0 },
  contacts: { type: [Schema.Types.Mixed], default: [] },
  createdby: { type: String },
  updatedby: { type: String },
  industry_type: { type: String, required: true },
  comm_type: { type: String, default: 'none' },
  status: { type: String, default: 'active' },
  custom_fields: { type: Schema.Types.Mixed, default: {} },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

ClientSchema.index({ tenant_id: 1, client_code: 1 }, { unique: true, sparse: true });
ClientSchema.index({ tenant_id: 1, branchcode: 1 });
ClientSchema.index({ tenant_id: 1, status: 1 });
ClientSchema.index({ tenant_id: 1, created_on: -1 });

export const Client = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export const clientInfo = async () => {
  const msgInfo = `Client -> Client Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface IProject extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  project_code: string;
  branchcode?: string;
  campaign_code?: string;
  lead_id?: any;
  client_code?: string;
  title?: string;
  priority?: string;
  type?: string;
  loc?: string;
  notes?: string;
  budget?: number;
  overallcost?: number;
  balance_amount?: number;
  revised_cost?: number;
  balance?: number;
  paystatus?: string;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  handler_by?: string;
  createby?: string;
  updatedby?: string;
  revised_count?: number;
  additional?: number;
  milestone_count?: number;
  status?: string;
  created_on?: Date;
  updated_on?: Date;
}

const ProjectSchema = new Schema<IProject>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  project_code: { type: String, required: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  lead_id: { type: Schema.Types.Mixed },
  client_code: { type: String },
  title: { type: String },
  priority: { type: String },
  type: { type: String },
  loc: { type: String },
  notes: { type: String },
  budget: { type: Number, default: 0 },
  overallcost: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  revised_cost: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paystatus: { type: String, default: 'none' },
  start_date: { type: Date },
  end_date: { type: Date },
  duration_days: { type: Number },
  handler_by: { type: String },
  createby: { type: String },
  updatedby: { type: String },
  revised_count: { type: Number, default: 0 },
  additional: { type: Number, default: 0 },
  milestone_count: { type: Number, default: 0 },
  status: { type: String, default: 'draft' },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

ProjectSchema.index({ tenant_id: 1, project_code: 1 }, { unique: true, sparse: true });

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export const projectInfo = async () => {
  const msgInfo = `Client -> Project Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface IMilestone extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  milestone_code: string;
  branchcode?: string;
  campaign_code?: string;
  project_code?: string;
  client_code?: string;
  milestone_type?: string;
  miles_title?: string;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  base_amount: number;
  additional_amount?: number;
  total_amount?: number;
  paystatus?: string;
  revision_reason?: string;
  status?: string;
  handler_by?: string;
  createby?: string;
  task_count?: number;
  approved_staff_id?: string;
  isrevised?: boolean;
  created_on?: Date;
  updated_on?: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  milestone_code: { type: String, required: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  project_code: { type: String },
  client_code: { type: String },
  milestone_type: { type: String },
  miles_title: { type: String },
  start_date: { type: Date },
  end_date: { type: Date },
  duration_days: { type: Number },
  base_amount: { type: Number, required: true },
  additional_amount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  paystatus: { type: String, default: 'none' },
  revision_reason: { type: String },
  status: { type: String, default: 'draft' },
  handler_by: { type: String },
  createby: { type: String },
  task_count: { type: Number, default: 0 },
  approved_staff_id: { type: String },
  isrevised: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

MilestoneSchema.index({ tenant_id: 1, milestone_code: 1 }, { unique: true, sparse: true });

export const Milestone = mongoose.models.Milestone || mongoose.model<IMilestone>('Milestone', MilestoneSchema);

export const projectMilestoneInfo = async () => {
  const msgInfo = `Client -> Project Milestone Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface ITask extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_title?: string;
  task_priority?: string;
  notes?: string;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  excess_duration?: number;
  participant_count?: number;
  handler_by?: string;
  team_id?: string;
  status?: string;
  created_on?: Date;
  updated_on?: Date;
}

export interface ITaskParticipant extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  participants_id?: any;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  subtask_title?: string;
  subtask_priority?: string;
  team_id?: string;
  lead_id?: string;
  staff_id?: string;
  rating?: number;
  start_date?: Date;
  end_date?: Date;
  task_duration?: number;
  delay_reason?: string;
  delay_by?: string;
  close_reason?: string;
  status?: string;
  added_on?: Date;
  created_on?: Date;
  updated_on?: Date;
}

export interface ITaskParticipantLog extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  team_id?: string;
  lead_id?: string;
  participants_id?: any;
  staff_id?: string;
  check_in: Date;
  check_out?: Date;
  duration?: number;
  remarks?: string;
  create_datetime?: Date;
  last_update_datetime?: Date;
}

const TaskSchema = new Schema<ITask>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_title: { type: String },
  task_priority: { type: String },
  notes: { type: String },
  start_date: { type: Date },
  end_date: { type: Date },
  duration_days: { type: Number, default: 0 },
  excess_duration: { type: Number, default: 0 },
  participant_count: { type: Number, default: 0 },
  handler_by: { type: String },
  team_id: { type: String },
  status: { type: String, default: 'draft' },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

TaskSchema.index({ tenant_id: 1, project_code: 1 });

const TaskParticipantSchema = new Schema<ITaskParticipant>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  participants_id: { type: Schema.Types.Mixed },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Schema.Types.Mixed },
  subtask_title: { type: String },
  subtask_priority: { type: String },
  team_id: { type: String },
  lead_id: { type: String },
  staff_id: { type: String },
  rating: { type: Number, default: 0 },
  start_date: { type: Date },
  end_date: { type: Date },
  task_duration: { type: Number, default: 0 },
  delay_reason: { type: String },
  delay_by: { type: String },
  close_reason: { type: String },
  status: { type: String, default: 'draft' },
  added_on: { type: Date, default: Date.now },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

TaskParticipantSchema.index({ tenant_id: 1, staff_id: 1 });

const TaskParticipantLogSchema = new Schema<ITaskParticipantLog>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Schema.Types.Mixed },
  team_id: { type: String },
  lead_id: { type: String },
  participants_id: { type: Schema.Types.Mixed },
  staff_id: { type: String },
  check_in: { type: Date, required: true },
  check_out: { type: Date },
  duration: { type: Number, default: 0 },
  remarks: { type: String },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now }
});

TaskParticipantLogSchema.index({ tenant_id: 1, staff_id: 1 });

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export const TaskParticipant = mongoose.models.TaskParticipant || mongoose.model<ITaskParticipant>('TaskParticipant', TaskParticipantSchema);
export const TaskParticipantLog = mongoose.models.TaskParticipantLog || mongoose.model<ITaskParticipantLog>('TaskParticipantLog', TaskParticipantLogSchema);

export const projectMilesTaskInfo = async () => {
  const msgInfo = `Project -> Project Task Plan Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface IProjectMeeting extends Document {
  meet_id?: number;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  participants_id?: number;
  title: string;
  notes?: string;
  comm_type: string;
  status?: string;
  doc_status?: string;
  meet_link?: string;
  start_date_time?: Date;
  end_date_time?: Date;
  category?: string;
  field?: string;
  doc?: any[];
  createdby?: string;
  created_on?: Date;
  updated_on?: Date;
}

export interface ICustomTarget extends Document {
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  participants_id?: number;
  meet_id?: number;
  type: string;
  target_id: string;
  created_at?: Date;
}

export interface ICommunicationParticipant extends Document {
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  task_id?: number;
  task_participants?: string;
  meet_id?: number;
  person_id: string;
  role: string;
  isdocvisible?: boolean;
  team_id?: string;
  status?: string;
  created_at?: Date;
  responded_at?: Date;
}

export interface IMeetingReminder extends Document {
  meet_id?: number;
  title: string;
  description?: string;
  repeat_type: string;
  repeat_days?: string[];
  start_time: string;
  start_date?: Date;
  end_date?: Date;
  active?: boolean;
  created_at?: Date;
}

const ProjectMeetingSchema = new Schema<IProjectMeeting>({
  meet_id: { type: Number },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Number },
  participants_id: { type: Number },
  title: { type: String, required: true },
  notes: { type: String },
  comm_type: { type: String, required: true },
  status: { type: String, default: 'draft' },
  doc_status: { type: String, default: 'none' },
  meet_link: { type: String },
  start_date_time: { type: Date },
  end_date_time: { type: Date },
  category: { type: String, default: 'custom' },
  field: { type: String },
  doc: { type: [Schema.Types.Mixed], default: [] },
  createdby: { type: String },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

const CustomTargetSchema = new Schema<ICustomTarget>({
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Number },
  participants_id: { type: Number },
  meet_id: { type: Number },
  type: { type: String, required: true },
  target_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

CustomTargetSchema.index({ meet_id: 1, type: 1, target_id: 1 }, { unique: true });

const CommunicationParticipantSchema = new Schema<ICommunicationParticipant>({
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  task_id: { type: Number },
  task_participants: { type: String },
  meet_id: { type: Number },
  person_id: { type: String, required: true },
  role: { type: String, required: true },
  isdocvisible: { type: Boolean, default: false },
  team_id: { type: String },
  status: { type: String, default: 'pending' },
  created_at: { type: Date },
  responded_at: { type: Date }
});

CommunicationParticipantSchema.index({ meet_id: 1, role: 1, person_id: 1 }, { unique: true });

const MeetingReminderSchema = new Schema<IMeetingReminder>({
  meet_id: { type: Number },
  title: { type: String, required: true },
  description: { type: String },
  repeat_type: { type: String, required: true },
  repeat_days: { type: [String] },
  start_time: { type: String, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export const ProjectMeeting = mongoose.models.ProjectMeeting || mongoose.model<IProjectMeeting>('ProjectMeeting', ProjectMeetingSchema);
export const CustomTarget = mongoose.models.CustomTarget || mongoose.model<ICustomTarget>('CustomTarget', CustomTargetSchema);
export const CommunicationParticipant = mongoose.models.CommunicationParticipant || mongoose.model<ICommunicationParticipant>('CommunicationParticipant', CommunicationParticipantSchema);
export const MeetingReminder = mongoose.models.MeetingReminder || mongoose.model<IMeetingReminder>('MeetingReminder', MeetingReminderSchema);

export const projectMeetingInfo = async () => {
  const msgInfo = `Project -> Project Meeting/Doc Plan Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface IProjectPayreq extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  request_id: string;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  milestone_code?: string;
  notes?: string;
  project_amount?: number;
  milestone_amount?: number;
  isrevised_milestone?: boolean;
  balance_amount?: number;
  permission?: boolean;
  status?: string;
  due_date?: Date;
  created_on?: Date;
  updated_on?: Date;
}

export interface IPaymentLog extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  pay_id: string;
  request_id: string;
  payment_id?: string;
  paid_amount: number;
  paid_on?: Date;
  payment_mode: string;
  payment_status?: string;
  notes?: string;
}

export interface IProjectInvoice extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  invoice_id: string;
  branchcode?: string;
  campaign_code?: string;
  client_code?: string;
  project_code?: string;
  hsn_sac?: string;
  qty?: string;
  invoice_no: string;
  invoice_date?: Date;
  due_date?: Date;
  total_amount?: number;
  cgst_amount?: number;
  cgst_percentage?: number;
  sgst_amount?: number;
  sgst_percentage?: number;
  discount?: number;
  roundoff?: number;
  final_amount?: number;
  paid_amount?: number;
  balance_amount?: number;
  status?: string;
  revised_count?: number;
  revised_amount?: number;
  revised_paid_amount?: number;
  revised_amount_balance?: number;
  notes?: string;
  created_by?: string;
  created_on?: Date;
  updated_on?: Date;
}

const ProjectPayreqSchema = new Schema<IProjectPayreq>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  request_id: { type: String, required: true, unique: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  milestone_code: { type: String },
  notes: { type: String },
  project_amount: { type: Number, default: 0 },
  milestone_amount: { type: Number, default: 0 },
  isrevised_milestone: { type: Boolean, default: false },
  balance_amount: { type: Number, default: 0 },
  permission: { type: Boolean, default: false },
  status: { type: String, default: 'request' },
  due_date: { type: Date },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

ProjectPayreqSchema.index({ tenant_id: 1, request_id: 1 });
ProjectPayreqSchema.index({ tenant_id: 1, project_code: 1, milestone_code: 1 });
ProjectPayreqSchema.index({ project_code: 1, milestone_code: 1 });

const PaymentLogSchema = new Schema<IPaymentLog>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  pay_id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true },
  payment_id: { type: String },
  paid_amount: { type: Number, required: true },
  paid_on: { type: Date, default: Date.now },
  payment_mode: { type: String, required: true },
  payment_status: { type: String, default: 'request' },
  notes: { type: String }
});

PaymentLogSchema.index({ tenant_id: 1, request_id: 1 });
PaymentLogSchema.index({ tenant_id: 1, pay_id: 1 });

const ProjectInvoiceSchema = new Schema<IProjectInvoice>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  invoice_id: { type: String, required: true, unique: true },
  branchcode: { type: String },
  campaign_code: { type: String },
  client_code: { type: String },
  project_code: { type: String },
  hsn_sac: { type: String },
  qty: { type: String },
  invoice_no: { type: String, required: true },
  invoice_date: { type: Date, default: Date.now },
  due_date: { type: Date },
  total_amount: { type: Number, default: 0 },
  cgst_amount: { type: Number, default: 0 },
  cgst_percentage: { type: Number, default: 0 },
  sgst_amount: { type: Number, default: 0 },
  sgst_percentage: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  roundoff: { type: Number, default: 0 },
  final_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  revised_count: { type: Number, default: 0 },
  revised_amount: { type: Number, default: 0 },
  revised_paid_amount: { type: Number, default: 0 },
  revised_amount_balance: { type: Number, default: 0 },
  notes: { type: String },
  created_by: { type: String },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

ProjectInvoiceSchema.index({ tenant_id: 1, invoice_id: 1 });
ProjectInvoiceSchema.index({ tenant_id: 1, project_code: 1, invoice_no: 1 });
ProjectInvoiceSchema.index({ project_code: 1, invoice_no: 1 });

export const ProjectPayreq = mongoose.models.ProjectPayreq || mongoose.model<IProjectPayreq>('ProjectPayreq', ProjectPayreqSchema);
export const PaymentLog = mongoose.models.PaymentLog || mongoose.model<IPaymentLog>('PaymentLog', PaymentLogSchema);
export const ProjectInvoice = mongoose.models.ProjectInvoice || mongoose.model<IProjectInvoice>('ProjectInvoice', ProjectInvoiceSchema);

// Compatibility alias
export const ClientModel = Client;

// 1. ClientDocument Model
const ClientDocumentSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  project_id: { type: String, required: true },
  user_id: { type: Schema.Types.Mixed },
  branchcode: { type: String },
  description: { type: String },
  file_path: { type: String },
  file_name: { type: String },
  on_date: { type: Date, default: Date.now }
});
export const ClientDocument = mongoose.models.ClientDocument || mongoose.model('ClientDocument', ClientDocumentSchema);

// 2. DraftDocument Model
const DraftDocumentSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  project_id: { type: String, required: true },
  description: { type: String },
  on_date: { type: Date, default: Date.now }
});
export const DraftDocument = mongoose.models.DraftDocument || mongoose.model('DraftDocument', DraftDocumentSchema);

// 3. FinalDocument Model
const FinalDocumentSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  project_id: { type: String, required: true },
  description: { type: String },
  on_date: { type: Date, default: Date.now }
});
export const FinalDocument = mongoose.models.FinalDocument || mongoose.model('FinalDocument', FinalDocumentSchema);

// 4. InvoiceRequest Model
const InvoiceRequestSchema = new Schema({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  invoice_id: { type: String, required: true },
  request_id: { type: String, required: true }
});
export const InvoiceRequest = mongoose.models.InvoiceRequest || mongoose.model('InvoiceRequest', InvoiceRequestSchema);

export const projectPaymentsInfo = async () => {
  const msgInfo = `Project -> Project Payments Plan Info`;
  try {
    // Schema is already defined, no initialization needed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};
