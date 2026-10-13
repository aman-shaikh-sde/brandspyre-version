import mongoose from 'mongoose';
import { ProjectInvoice, ProjectPayreq, PaymentLog, Project, ClientModel } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

export const updateInvoiceAndPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const {
      request_id,
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
    } = req.body;

    const total = parseFloat(total_amount) || 0;
    const mile = parseFloat(milestone_amount) || 0;
    const cgst = parseFloat(cgst_amount) || 0;
    const sgst = parseFloat(sgst_amount) || 0;
    const disc = parseFloat(discount) || 0;
    const round = parseFloat(round_off) || 0;
    const paid = parseFloat(paid_amount) || 0;

    const final_amount = mile + cgst + sgst - disc + round;
    const balance_amount = ((total + round) - disc) - paid;

    session.startTransaction();

    await ProjectInvoice.updateOne(
      { invoice_no },
      {
        $set: {
          branchcode,
          project_code,
          client_code,
          invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
          due_date: due_date ? new Date(due_date) : new Date(),
          cgst_percentage,
          sgst_percentage,
          cgst_amount: cgst,
          sgst_amount: sgst,
          discount: disc,
          roundoff: round,
          total_amount: mile,
          paid_amount: paid,
          balance_amount,
          notes,
          updated_on: new Date()
        }
      }
    ).session(session);

    await ProjectPayreq.updateOne(
      { request_id },
      {
        $set: {
          milestone_code,
          milestone_amount: mile,
          balance_amount,
          status,
          updated_on: new Date()
        }
      }
    ).session(session);

    if (paid > 0) {
      await PaymentLog.updateOne(
        { request_id },
        {
          $set: {
            paid_amount: paid,
            paid_on: new Date(),
            payment_mode: 'upi',
            payment_status: status === "paid" ? "paid" : "partially_paid",
            notes
          }
        }
      ).session(session);
    }

    const projectDoc = await Project.findOne({ project_code }).session(session).lean() as any;
    if (projectDoc) {
      const payReqs = await ProjectPayreq.find({ project_code }).session(session).lean() as any[];
      const totalBalance = payReqs.reduce((sum: number, pr: any) => sum + (parseFloat(pr.balance_amount) || 0), 0);

      await Project.updateOne(
        { project_code },
        { $set: { balance: totalBalance, updated_on: new Date() } }
      ).session(session);

      if (projectDoc.client_code) {
        const clientProjects = await Project.find({ client_code: projectDoc.client_code }).session(session).lean() as any[];
        const clientBudget = clientProjects.reduce((sum: number, p: any) => sum + (parseFloat(p.budget) || 0), 0);
        const clientBalance = clientProjects.reduce((sum: number, p: any) => sum + (parseFloat(p.balance) || 0), 0);

        await ClientModel.updateOne(
          { client_code: projectDoc.client_code },
          { $set: { balance: clientBalance, overallcost: clientBudget, updated_on: new Date() } }
        ).session(session);
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Invoice and payment updated successfully",
      data: { final_amount, balance_amount },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Error updating invoice/payment:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
