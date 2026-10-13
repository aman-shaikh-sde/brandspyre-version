import mongoose, { Schema, Document } from "mongoose";

export interface IUserSalary extends Document {
  branchcode?: string;
  staff_id: string;
  basicsalary?: number;
  hra?: number;
  lpa?: number;
  gross_salary?: number;
  net_salary?: number;
  bonus?: number;
  pf?: number;
  esi?: number;
  tds?: number;
  other_allowance?: number;
  deductions?: number;
  remarks?: string;
  processondate?: string;
  processtilldate?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const UserSalarySchema = new Schema<IUserSalary>({
  branchcode: { type: String },
  staff_id: { type: String, required: true },
  basicsalary: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  lpa: { type: Number, default: 0 },
  gross_salary: { type: Number, default: 0 },
  net_salary: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  other_allowance: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  remarks: { type: String },
  processondate: { type: String },
  processtilldate: { type: String },
  status: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

// Add compound index for tenant isolation
UserSalarySchema.index({ tenant_id: 1, staff_id: 1 });

export const UserSalary = mongoose.model<IUserSalary>('UserSalary', UserSalarySchema);

export const userSalaryMasterInfo = async () => {
  const msgInfo = `UserInfo -> Salary Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};

export interface IPerformanceReview extends Document {
  performance_id: string;
  branchcode: string;
  staff_id: string;
  name?: string;
  designation?: string;
  department?: string;
  reporting_to?: string;
  team_id?: string;
  team_name?: string;
  lead_id?: string;
  lead_name?: string;
  dateofjoining?: Date;
  year_of_experience?: number;
  review_year?: string;
  total_workingdays?: number;
  total_dayspresent?: number;
  total_daysabsent?: number;
  total_daysleave?: number;
  overall_attendance_percentage?: number;
  total_project_worked?: number;
  overallprojectrating?: number;
  overall_milestone_rating?: number;
  total_task?: number;
  total_task_participantavgrating?: number;
  total_duration_minutes?: number;
  total_tasks_handled?: number;
  tasks_completed_ontime?: number;
  reworks_revisions?: number;
  major_projects?: string;
  self_timeliness_rating?: number;
  self_timeliness_comments?: string;
  self_quality_rating?: number;
  self_quality_comments?: string;
  self_communication_rating?: number;
  self_communication_comments?: string;
  self_initiative_rating?: number;
  self_initiative_comments?: string;
  self_interaction_rating?: number;
  self_interaction_comments?: string;
  self_attendance_rating?: number;
  self_attendance_comments?: string;
  what_went_well?: string;
  challenges_faced?: string;
  support_needed?: string;
  improvement_suggestions?: string;
  new_skills_learned?: string;
  areas_to_improve?: string;
  self_rating_overall?: number;
  self_training_required?: string;
  self_overall_feedback?: string;
  self_trainings_attended?: string;
  lead_tasks_completed?: number;
  lead_tasks_rating?: number;
  lead_errors_count?: number;
  lead_errors_rating?: number;
  lead_timeliness_percent?: number;
  lead_timeliness_rating?: number;
  lead_communication_rating?: number;
  lead_client_feedback_rating?: number;
  lead_attendance_rating?: number;
  development_initiative?: boolean;
  development_initiative_remarks?: string;
  lead_technical_rating?: number;
  lead_technical_remarks?: string;
  lead_attitude_rating?: number;
  lead_attitude_remarks?: string;
  lead_learning_rating?: number;
  lead_learning_remarks?: string;
  lead_team_rating?: number;
  lead_team_remarks?: string;
  training_required?: boolean;
  training_details?: string;
  lead_comments?: string;
  hr_rating?: number;
  hr_comments?: string;
  increment_percentage?: number;
  increment_effective_date?: string;
  status?: string;
  created_on?: Date;
  updated_on?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
}

const PerformanceReviewSchema = new Schema<IPerformanceReview>({
  performance_id: { type: String, required: true, unique: true },
  branchcode: { type: String, required: true },
  staff_id: { type: String, required: true },
  name: { type: String },
  designation: { type: String },
  department: { type: String },
  reporting_to: { type: String },
  team_id: { type: String },
  team_name: { type: String },
  lead_id: { type: String },
  lead_name: { type: String },
  dateofjoining: { type: Date },
  year_of_experience: { type: Number, default: 0.0 },
  review_year: { type: String },
  total_workingdays: { type: Number, default: 0 },
  total_dayspresent: { type: Number, default: 0 },
  total_daysabsent: { type: Number, default: 0 },
  total_daysleave: { type: Number, default: 0 },
  overall_attendance_percentage: { type: Number, default: 0.00 },
  total_project_worked: { type: Number, default: 0 },
  overallprojectrating: { type: Number, default: 0.00 },
  overall_milestone_rating: { type: Number, default: 0.00 },
  total_task: { type: Number, default: 0 },
  total_task_participantavgrating: { type: Number, default: 0.00 },
  total_duration_minutes: { type: Number, default: 0 },
  total_tasks_handled: { type: Number },
  tasks_completed_ontime: { type: Number },
  reworks_revisions: { type: Number },
  major_projects: { type: String },
  self_timeliness_rating: { type: Number },
  self_timeliness_comments: { type: String },
  self_quality_rating: { type: Number },
  self_quality_comments: { type: String },
  self_communication_rating: { type: Number },
  self_communication_comments: { type: String },
  self_initiative_rating: { type: Number },
  self_initiative_comments: { type: String },
  self_interaction_rating: { type: Number },
  self_interaction_comments: { type: String },
  self_attendance_rating: { type: Number },
  self_attendance_comments: { type: String },
  what_went_well: { type: String },
  challenges_faced: { type: String },
  support_needed: { type: String },
  improvement_suggestions: { type: String },
  new_skills_learned: { type: String },
  areas_to_improve: { type: String },
  self_rating_overall: { type: Number },
  self_training_required: { type: String },
  self_overall_feedback: { type: String },
  self_trainings_attended: { type: String },
  lead_tasks_completed: { type: Number, default: 0 },
  lead_tasks_rating: { type: Number },
  lead_errors_count: { type: Number, default: 0 },
  lead_errors_rating: { type: Number },
  lead_timeliness_percent: { type: Number },
  lead_timeliness_rating: { type: Number },
  lead_communication_rating: { type: Number },
  lead_client_feedback_rating: { type: Number },
  lead_attendance_rating: { type: Number },
  development_initiative: { type: Boolean },
  development_initiative_remarks: { type: String },
  lead_technical_rating: { type: Number },
  lead_technical_remarks: { type: String },
  lead_attitude_rating: { type: Number },
  lead_attitude_remarks: { type: String },
  lead_learning_rating: { type: Number },
  lead_learning_remarks: { type: String },
  lead_team_rating: { type: Number },
  lead_team_remarks: { type: String },
  training_required: { type: Boolean },
  training_details: { type: String },
  lead_comments: { type: String },
  hr_rating: { type: Number },
  hr_comments: { type: String },
  increment_percentage: { type: Number },
  increment_effective_date: { type: String },
  status: { type: String, default: 'draft' },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' }
});

PerformanceReviewSchema.index({ staff_id: 1, review_year: 1 }, { unique: true });
// Add compound index for tenant isolation
PerformanceReviewSchema.index({ tenant_id: 1, staff_id: 1 });

export const PerformanceReview = mongoose.model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);

export const userYearlyPerformanceMasterInfo = async () => {
  const msgInfo = `UserInfo -> Yearly Performacne Review Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};