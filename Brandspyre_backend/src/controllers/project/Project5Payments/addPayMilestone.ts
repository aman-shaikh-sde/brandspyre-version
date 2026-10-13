import mongoose from 'mongoose';
import { Milestone, ProjectInvoice, Project, ProjectPayreq, PaymentLog, InvoiceRequest } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

export const addPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const {
      branchcode,
      project_code,
      milestone_code,
      milestone_amount,
      client_code,
      invoice_no,
      invoice_date,
      due_date,
      cgst_percentage,
      sgst_percentage,
      cgst_amount,
      sgst_amount,
      discount,
      round_off,
      total_amount,
      paid_amount,
      notes,
      status,
      created_by,
    } = req.body;

    const inv_status = "raised";

    const milestone = parseFloat(milestone_amount) || 0;
    const total = parseFloat(total_amount) || 0;
    const cgst = parseFloat(cgst_amount) || 0;
    const sgst = parseFloat(sgst_amount) || 0;
    const disc = parseFloat(discount) || 0;
    const round = parseFloat(round_off) || 0;
    const paid = parseFloat(paid_amount) || 0;

    const final_amount = milestone + cgst + sgst - disc + round;
    const balance_amount = total - paid;

    session.startTransaction();

    let milestone_codesss = milestone_code;
    if (!milestone_code || milestone_code === "") {
      milestone_codesss = `${project_code}/advance`;
      const msExists = await Milestone.findOne({ milestone_code: milestone_codesss }).session(session).lean();
      if (!msExists) {
        await Milestone.create([{
          branchcode,
          client_code,
          project_code,
          milestone_code: milestone_codesss,
          milestone_type: "initial",
          miles_title: "Advance",
          start_date: new Date(),
          end_date: new Date(),
          handler_by: created_by,
          status: "verified",
          base_amount: milestone_amount,
          total_amount: total_amount
        }], { session });
      }
    }

    const invCount = await ProjectInvoice.countDocuments({ branchcode }).session(session);
    const newInvoiceId = `INV_${branchcode}_${invCount + 1}`;

    const projectDoc = await Project.findOne({ project_code }).session(session).lean() as any;
    if (!projectDoc) {
      throw new Error(`Project not found for code: ${project_code}`);
    }
    const project_amount = parseFloat(projectDoc.budget) || 0;

    const reqCount = await ProjectPayreq.countDocuments({ branchcode }).session(session);
    const newRequestId = `REQ_${branchcode}_${reqCount + 1}`;

    await ProjectInvoice.create([{
      invoice_id: newInvoiceId,
      branchcode,
      project_code,
      client_code,
      invoice_no,
      invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
      due_date: due_date ? new Date(due_date) : new Date(),
      cgst_percentage,
      sgst_percentage,
      cgst_amount: cgst,
      sgst_amount: sgst,
      discount: disc,
      roundoff: round,
      total_amount: milestone,
      paid_amount: paid,
      balance_amount,
      status: inv_status,
      notes,
      created_by
    }], { session });

    await ProjectPayreq.create([{
      request_id: newRequestId,
      branchcode,
      project_code,
      client_code,
      milestone_code: milestone_codesss,
      milestone_amount: milestone,
      balance_amount,
      status,
      notes,
      project_amount,
      due_date: due_date ? new Date(due_date) : new Date()
    }], { session });

    if (paid > 0) {
      await PaymentLog.create([{
        pay_id: `PAY_${newRequestId}`,
        request_id: newRequestId,
        paid_amount: paid,
        paid_on: new Date(),
        payment_mode: 'upi',
        payment_status: status === "paid" ? "paid" : "partially_paid",
        notes
      }], { session });
    }

    const invReqExists = await InvoiceRequest.findOne({ invoice_id: newInvoiceId, request_id: newRequestId }).session(session).lean();
    if (!invReqExists) {
      await InvoiceRequest.create([{ invoice_id: newInvoiceId, request_id: newRequestId }], { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "New payment and invoice inserted successfully",
      data: { invoice_id: newInvoiceId, request_id: newRequestId, final_amount, balance_amount },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error adding payment:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
