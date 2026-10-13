import mongoose, { Schema, Document } from "mongoose";

export interface IPayrollRun extends Document {
  tenant_id: mongoose.Types.ObjectId;
  payroll_run_id: string;
  payroll_month: number;
  payroll_year: number;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'APPROVED' | 'FINALIZED' | 'CANCELLED';
  employee_count: number;
  successful_count: number;
  failed_count: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  initiated_by: string;
  approved_by?: string;
  started_at: Date;
  completed_at?: Date;
  error_summary?: Array<{ staff_id: string; error: string }>;
  created_at: Date;
  updated_at: Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  payroll_run_id: { type: String, required: true, unique: true },
  payroll_month: { type: Number, required: true },
  payroll_year: { type: Number, required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'APPROVED', 'FINALIZED', 'CANCELLED'],
    default: 'PROCESSING'
  },
  employee_count: { type: Number, default: 0 },
  successful_count: { type: Number, default: 0 },
  failed_count: { type: Number, default: 0 },
  total_gross: { type: Number, default: 0 },
  total_deductions: { type: Number, default: 0 },
  total_net: { type: Number, default: 0 },
  initiated_by: { type: String, required: true },
  approved_by: { type: String },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  error_summary: [{ staff_id: String, error: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Idempotency constraint: Exactly ONE active payroll run per tenant per month/year
PayrollRunSchema.index({ tenant_id: 1, payroll_year: 1, payroll_month: 1 }, { unique: true });

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
