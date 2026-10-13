import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { executeBatchPayroll } from '../../../services/payroll/batchPayrollProcessor';
import { PayrollRun } from '../../../db/ModelSceham/user/payrollRunSchema';

/**
 * Start a new batch payroll run for the tenant
 */
export const runBatchPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const userId = (req.user as any)?.userId || (req.user as any)?.id || 'admin';
    const { month, year } = req.body;

    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    if (!month || !year) {
      res.status(400).json({ success: false, message: "Missing month or year in request body" });
      return;
    }

    const result = await executeBatchPayroll({
      tenantId: tenantId.toString(),
      month: Number(month),
      year: Number(year),
      initiatedBy: String(userId)
    });

    res.status(201).json({
      success: true,
      message: `Batch payroll run initiated/completed for ${year}-${month}`,
      data: result
    });
  } catch (error: any) {
    console.error("Batch payroll execution error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to execute batch payroll"
    });
  }
};

/**
 * List all payroll runs for tenant
 */
export const getPayrollRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId.toString());
    const runs = await PayrollRun.find({ tenant_id: tenantObjectId }).sort({ created_at: -1 }).lean();

    res.status(200).json({
      success: true,
      count: runs.length,
      data: runs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * View details of a specific payroll run
 */
export const getPayrollRunById = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId.toString());
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const query = isObjectId
      ? { _id: id, tenant_id: tenantObjectId }
      : { payroll_run_id: id, tenant_id: tenantObjectId };

    const run = await PayrollRun.findOne(query).lean();

    if (!run) {
      res.status(404).json({ success: false, message: "Payroll run not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: run
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve a completed payroll run
 */
export const approvePayrollRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const userId = (req.user as any)?.userId || (req.user as any)?.id || 'admin';
    const { id } = req.params;

    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId.toString());
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const query = isObjectId
      ? { _id: id, tenant_id: tenantObjectId }
      : { payroll_run_id: id, tenant_id: tenantObjectId };

    const run = await PayrollRun.findOne(query);

    if (!run) {
      res.status(404).json({ success: false, message: "Payroll run not found" });
      return;
    }

    if (run.status !== 'COMPLETED' && run.status !== 'PARTIALLY_COMPLETED') {
      res.status(400).json({ success: false, message: `Cannot approve payroll in status '${run.status}'` });
      return;
    }

    run.status = 'APPROVED';
    run.approved_by = String(userId);
    run.updated_at = new Date();
    await run.save();

    res.status(200).json({ success: true, message: "Payroll run approved successfully", data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Finalize an approved payroll run
 */
export const finalizePayrollRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId.toString());
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const query = isObjectId
      ? { _id: id, tenant_id: tenantObjectId }
      : { payroll_run_id: id, tenant_id: tenantObjectId };

    const run = await PayrollRun.findOne(query);

    if (!run) {
      res.status(404).json({ success: false, message: "Payroll run not found" });
      return;
    }

    if (run.status !== 'APPROVED' && run.status !== 'COMPLETED') {
      res.status(400).json({ success: false, message: `Cannot finalize payroll in status '${run.status}'. Must be APPROVED first.` });
      return;
    }

    run.status = 'FINALIZED';
    run.updated_at = new Date();
    await run.save();

    res.status(200).json({ success: true, message: "Payroll run finalized", data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel a payroll run (if not finalized)
 */
export const cancelPayrollRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(401).json({ success: false, message: "Tenant authentication context required" });
      return;
    }

    const tenantObjectId = new mongoose.Types.ObjectId(tenantId.toString());
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const query = isObjectId
      ? { _id: id, tenant_id: tenantObjectId }
      : { payroll_run_id: id, tenant_id: tenantObjectId };

    const run = await PayrollRun.findOne(query);

    if (!run) {
      res.status(404).json({ success: false, message: "Payroll run not found" });
      return;
    }

    if (run.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: "Finalized payroll runs cannot be cancelled." });
      return;
    }

    run.status = 'CANCELLED';
    run.updated_at = new Date();
    await run.save();

    res.status(200).json({ success: true, message: "Payroll run cancelled", data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
