import mongoose from 'mongoose';
import { Project, Milestone, ProjectPayreq, ProjectInvoice, InvoiceRequest, ClientModel } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";
import { createPaymentRequest } from './createPaymentRequest';
import { addMilestonePaymentLog } from './addMilestonePaymentLog';
import { updateInvoiceByProject } from './recalculateInvoicePayments';

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const generateInvoiceCustomId = async (prefix: string, count: number): Promise<string> => {
  const nextNumber = count + 1;
  const digitCount = nextNumber.toString().length;
  const paddedNumber = String(nextNumber).padStart(Math.max(digitCount, 3), '0');
  return `${prefix}_${paddedNumber}`;
};

export const createPayRequest = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Payment Request`;
  const {
    project_code,
    approved_staff_id,
    hsn_sac,
    qty,
    invoice_no,
    invoice_date,
    due_date,
    total_amount,
    cgst_percentage,
    sgst_percentage,
    discount,
    roundoff,
    paid_amount,
    balance_amount,
    notes,
    created_by,
    data
  } = req.body;

  const session = await mongoose.startSession();
  const results: any[] = [];
  const requestIds: string[] = [];

  try {
    session.startTransaction();

    const projectInfo = await Project.findOne({ project_code }).session(session).lean() as any;
    if (!projectInfo) throw new Error(`Invalid project_code: ${project_code}`);

    let isRevised = false;
    let revisedAmount = 0;

    for (const payload of data) {
      const { milestone_code, milestone_amount, notes, due_date, permission, isrevised } = payload;

      const isMilestoneRevised = isrevised === true || isrevised === "true";
      if (isMilestoneRevised) isRevised = true;
      if (isMilestoneRevised && !approved_staff_id) {
        throw new Error("When milestone is revised, 'approved_staff_id' is required");
      }

      const milestoneInfo = await Milestone.findOne({ milestone_code }).session(session).lean() as any;
      if (!milestoneInfo) throw new Error(`Invalid milestone_code: ${milestone_code}`);

      const milestoneCost = parseFloat(milestone_amount || milestoneInfo.total_amount || 0);
      revisedAmount += milestoneCost;

      const duplicate = await ProjectPayreq.findOne({ project_code, milestone_code }).session(session).lean();
      if (duplicate) throw new Error(`Payment request already exists for milestone: ${milestone_code}`);

      const existingProjectReq = await ProjectPayreq.findOne({ project_code }).session(session).lean() as any;
      let finalProjectAmount = 0;
      if (existingProjectReq) {
        finalProjectAmount = parseFloat(existingProjectReq.project_amount);
      } else {
        if (!req.body.project_amount || req.body.project_amount === 0) {
          throw new Error(`Project ${project_code} requires project_amount on first request`);
        }
        finalProjectAmount = req.body.project_amount;

        const paystatus = projectInfo.paystatus === 'none' ? 'request' : projectInfo.paystatus;
        await Project.updateOne(
          { project_code },
          { $set: { paystatus, revised_cost: isMilestoneRevised, balance: milestoneCost, budget: milestoneCost } }
        ).session(session);
      }

      if (milestoneCost > finalProjectAmount) {
        throw new Error(`Milestone cost exceeds project amount for ${milestone_code}`);
      }

      const payReq = await createPaymentRequest({
        branchcode: milestoneInfo.branchcode,
        campaign_code: milestoneInfo.campaign_code,
        client_code: milestoneInfo.client_code,
        project_code,
        milestone_code,
        notes,
        project_amount: finalProjectAmount,
        milestone_amount: milestoneCost,
        due_date,
        isrevised_milestone: isMilestoneRevised,
        permission: permission || false
      });

      requestIds.push(payReq.request_id);
      const staff = isMilestoneRevised ? (approved_staff_id || null) : milestoneInfo.approved_staff_id;
      await Milestone.updateOne(
        { milestone_code },
        { $set: { paystatus: 'request', approved_staff_id: staff } }
      ).session(session);

      results.push({
        milestone_code,
        request_id: payReq.request_id,
        status: 'created'
      });
    }

    const existingInvoice = await ProjectInvoice.findOne({ project_code }).session(session).lean() as any;
    const duplicateInvoiceNo = await ProjectInvoice.findOne({ invoice_no }).session(session).lean();
    if (duplicateInvoiceNo && !existingInvoice) {
      throw new Error(`Invoice No ${invoice_no} already exists`);
    }

    const invoiceCount = await ProjectInvoice.countDocuments({}).session(session);
    let invoice_id = existingInvoice ? existingInvoice.invoice_id : await generateInvoiceCustomId("INV", invoiceCount);

    if (!existingInvoice) {
      if (!isRevised) {
        const [createdInv] = await ProjectInvoice.create([{
          invoice_id,
          branchcode: projectInfo.branchcode,
          campaign_code: projectInfo.campaign_code,
          client_code: projectInfo.client_code,
          project_code,
          hsn_sac,
          qty,
          invoice_no,
          invoice_date,
          due_date,
          total_amount,
          cgst_percentage,
          sgst_percentage,
          discount,
          roundoff,
          paid_amount: paid_amount || 0,
          balance_amount: balance_amount || 0,
          status: 'raised',
          notes,
          created_by
        }], { session });
        invoice_id = createdInv.invoice_id;
      } else {
        const [createdInv] = await ProjectInvoice.create([{
          invoice_id,
          branchcode: projectInfo.branchcode,
          campaign_code: projectInfo.campaign_code,
          client_code: projectInfo.client_code,
          project_code,
          hsn_sac,
          qty,
          invoice_no,
          invoice_date,
          due_date,
          revised_count: 1,
          revised_amount: revisedAmount,
          revised_paid_amount: 0,
          revised_amount_balance: revisedAmount,
          status: 'raised',
          notes,
          created_by
        }], { session });
        invoice_id = createdInv.invoice_id;
      }
    } else {
      await ProjectInvoice.updateOne(
        { invoice_id },
        {
          $inc: { revised_count: 1 },
          $set: { revised_amount: revisedAmount, revised_amount_balance: revisedAmount, updated_on: new Date() }
        }
      ).session(session);
    }

    for (const reqId of requestIds) {
      const exists = await InvoiceRequest.findOne({ invoice_id, request_id: reqId }).session(session).lean();
      if (!exists) {
        await InvoiceRequest.create([{ invoice_id, request_id: reqId }], { session });
      }
    }

    await updateInvoiceByProject(null, data[0]?.milestone_code, invoice_no);

    await session.commitTransaction();

    res.status(201).json({
      message: `${msgField} completed successfully`,
      invoice_id,
      requestIds,
      results
    });

  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} failed: ${message}`);
    res.status(500).json({ error: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};

export const createPay = async (req: Request, res: Response): Promise<void> => {
  const msgField = `Create Payment`;
  const { project_code, milestone_code, invoice_no, request_id, payment_id, paid_amount, payment_mode, payment_status, notes } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!project_code || !invoice_no) {
      throw new Error("Project_code and Invoice_no is required");
    }

    const result = await addMilestonePaymentLog({
      request_id,
      payment_id,
      paid_amount,
      payment_mode,
      payment_status,
      notes
    }, session);
    await updateInvoiceByProject(null, milestone_code, invoice_no, session);

    const projectDoc = await Project.findOne({ project_code }).session(session).lean() as any;
    if (projectDoc) {
      const payReqs = await ProjectPayreq.find({ project_code }).session(session).lean() as any[];
      const totalBalance = payReqs.reduce((acc: number, pr: any) => acc + (parseFloat(pr.balance_amount) || 0), 0);

      let pro_status = totalBalance > 0 ? "mid_payment" : "payment_closed";
      await Project.updateOne(
        { project_code },
        { $set: { balance: totalBalance, paystatus: pro_status, updated_on: new Date(), start_approval: "start" } }
      ).session(session);

      await Milestone.updateOne(
        { milestone_code },
        { $set: { updated_on: new Date(), start_approval: "start" } }
      ).session(session);

      if (projectDoc.client_code) {
        const clientProjects = await Project.find({ client_code: projectDoc.client_code }).session(session).lean() as any[];
        const clientBudget = clientProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.budget) || 0), 0);
        const clientBalance = clientProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.balance) || 0), 0);

        await ClientModel.updateOne(
          { client_code: projectDoc.client_code },
          { $set: { balance: clientBalance, overallcost: clientBudget, updated_on: new Date() } }
        ).session(session);
      }
    }

    await session.commitTransaction();
    res.status(201).json({ message: `${msgField} completed`, data: result });
  } catch (error) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `${msgField} failed: ${message}`, message: `${msgField} failed: ${message}` });
  } finally {
    session.endSession();
  }
};
