import mongoose from 'mongoose';
import { PayrollRun, IPayrollRun } from '../../db/ModelSceham/user/payrollRunSchema';
import { UserInfo } from '../../db/ModelSceham/userSchema';
import { UserSalary } from '../../db/ModelSceham/user/9_salary';
import { UserSalarySlip } from '../../db/ModelSceham/user/12_salaryslip';

export interface BatchPayrollInput {
  tenantId: string;
  month: number;
  year: number;
  initiatedBy: string;
}

export const executeBatchPayroll = async (input: BatchPayrollInput): Promise<IPayrollRun> => {
  const { tenantId, month, year, initiatedBy } = input;

  if (!tenantId) {
    throw new Error('Tenant ID is required for batch payroll execution.');
  }
  if (!month || month < 1 || month > 12) {
    throw new Error('Invalid payroll month. Must be between 1 and 12.');
  }
  if (!year || year < 2000 || year > 2100) {
    throw new Error('Invalid payroll year.');
  }

  const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
  const payrollRunId = `PR-${year}-${String(month).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Idempotency check: Ensure no active payroll run exists for this period
  const existingRun = await PayrollRun.findOne({
    tenant_id: tenantObjectId,
    payroll_year: year,
    payroll_month: month,
    status: { $in: ['PROCESSING', 'COMPLETED', 'APPROVED', 'FINALIZED'] }
  });

  if (existingRun) {
    throw new Error(`Payroll run for ${year}-${String(month).padStart(2, '0')} already exists (Status: ${existingRun.status}).`);
  }

  // Create initial PayrollRun in PROCESSING state
  let payrollRun: IPayrollRun;
  try {
    payrollRun = await PayrollRun.create({
      tenant_id: tenantObjectId,
      payroll_run_id: payrollRunId,
      payroll_month: month,
      payroll_year: year,
      status: 'PROCESSING',
      initiated_by: initiatedBy,
      started_at: new Date()
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new Error(`Concurrent payroll execution detected for period ${year}-${month}. Only one run permitted.`);
    }
    throw err;
  }

  // Query active employees strictly belonging to this tenant
  const activeEmployees = await UserInfo.find({
    tenant_id: { $in: [tenantObjectId, tenantId.toString()] }
  }).lean();

  let successfulCount = 0;
  let failedCount = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  const errors: Array<{ staff_id: string; error: string }> = [];

  const monthStartDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const monthEndDate = new Date(year, month, 0).toISOString().split('T')[0];
  const paymentDate = new Date().toISOString().split('T')[0];

  for (const emp of activeEmployees) {
    const staffId = emp.staff_id;
    if (!staffId) continue;

    try {
      // Find active salary configuration for employee
      const salaryConfig = await UserSalary.findOne({
        tenant_id: tenantObjectId,
        staff_id: staffId,
        status: 'active'
      }).lean();

      const basicSalary = salaryConfig?.basicsalary || Number(emp.basicsalary) || 0;
      const hra = salaryConfig?.hra || (basicSalary * 0.4);
      const otherAllowance = salaryConfig?.other_allowance || 0;
      const bonus = salaryConfig?.bonus || 0;
      const pf = salaryConfig?.pf || (basicSalary * 0.12);
      const deductions = salaryConfig?.deductions || 0;

      const gross = basicSalary + hra + otherAllowance + bonus;
      const totalDeductionsEmp = pf + deductions;
      const netPayable = gross - totalDeductionsEmp;

      // Upsert UserSalarySlip for this tenant, employee, and pay period
      await UserSalarySlip.findOneAndUpdate(
        {
          tenant_id: tenantObjectId,
          staff_id: staffId,
          year: year,
          month: month
        },
        {
          tenant_id: tenantObjectId,
          payroll_run_id: payrollRunId,
          month: month,
          year: year,
          staff_id: staffId,
          designation: emp.desigantion || emp.designation || '',
          department: emp.department || '',
          monthstartdate: monthStartDate,
          monthenddate: monthEndDate,
          paymentdate: paymentDate,
          basicsalary: basicSalary,
          hra: hra,
          otherallowance: otherAllowance,
          pfamount: pf,
          totalearned: gross,
          totaldeduction: totalDeductionsEmp,
          netpayable: netPayable,
          isrevised: false
        },
        { upsert: true, new: true }
      );

      successfulCount++;
      totalGross += gross;
      totalDeductions += totalDeductionsEmp;
      totalNet += netPayable;
    } catch (empErr: any) {
      failedCount++;
      errors.push({
        staff_id: staffId,
        error: empErr.message || 'Error generating salary slip'
      });
    }
  }

  // Finalize PayrollRun status
  const finalStatus = failedCount === 0 ? 'COMPLETED' : (successfulCount > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED');

  payrollRun.employee_count = activeEmployees.length;
  payrollRun.successful_count = successfulCount;
  payrollRun.failed_count = failedCount;
  payrollRun.total_gross = totalGross;
  payrollRun.total_deductions = totalDeductions;
  payrollRun.total_net = totalNet;
  payrollRun.status = finalStatus;
  payrollRun.completed_at = new Date();
  payrollRun.error_summary = errors;

  await payrollRun.save();
  return payrollRun;
};
