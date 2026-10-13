import mongoose, { Schema, Document } from "mongoose";

export interface IUserSalarySlip extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  payroll_run_id?: string;
  month?: number;
  year?: number;
  staff_id: string;
  designation?: string;
  department?: string;
  bankaccount?: string;
  pan?: string;
  joindate?: string;
  monthstartdate?: string;
  monthenddate?: string;
  totalworkingdays?: string;
  leavetake?: string;
  paymentdate?: string;
  basicsalary?: number;
  hra?: number;
  otherallowance?: number;
  foodallowance?: number;
  incentive?: number;
  pf?: number;
  pfamount?: number;
  totalearned?: number;
  totaldeduction?: number;
  netpayable?: number;
  isrevised?: boolean;
}

const UserSalarySlipSchema = new Schema<IUserSalarySlip>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  payroll_run_id: { type: String },
  month: { type: Number },
  year: { type: Number },
  staff_id: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  bankaccount: { type: String },
  pan: { type: String },
  joindate: { type: String },
  monthstartdate: { type: String },
  monthenddate: { type: String },
  totalworkingdays: { type: String },
  leavetake: { type: String },
  paymentdate: { type: String },
  basicsalary: { type: Number },
  hra: { type: Number },
  otherallowance: { type: Number },
  foodallowance: { type: Number },
  incentive: { type: Number },
  pf: { type: Number },
  pfamount: { type: Number },
  totalearned: { type: Number },
  totaldeduction: { type: Number },
  netpayable: { type: Number },
  isrevised: { type: Boolean, default: false }
});

UserSalarySlipSchema.index({ tenant_id: 1, staff_id: 1 });
UserSalarySlipSchema.index({ tenant_id: 1, staff_id: 1, year: 1, month: 1 }, { unique: true, sparse: true });

export const UserSalarySlip = mongoose.model<IUserSalarySlip>('UserSalarySlip', UserSalarySlipSchema);

export const userSalarySlipMasterInfo = async () => {
  const msgInfo = `UserInfo -> Salary Slip Master Info`;
  try {
    // Schema is already defined, no initialization needed
    // console.log(`${msgInfo} successfully.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing ${msgInfo} Message: ${message}`);
    throw new Error(`Error initializing ${msgInfo} Message: ${message}`);
  }
};