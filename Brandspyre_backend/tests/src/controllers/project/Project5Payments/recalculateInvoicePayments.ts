import mongoose from 'mongoose';
import { ProjectInvoice, ProjectPayreq, InvoiceRequest } from "../../../db/ModelSceham/project/client";

export const updateInvoiceByProject = async (
  clientOrDummy: any,
  milestone_code: string,
  invoice_no: string,
  session?: mongoose.ClientSession
): Promise<{
  message: string;
  invoice_id: string;
  data: any;
}> => {
  const invoiceQuery = ProjectInvoice.findOne({ invoice_no });
  if (session) invoiceQuery.session(session);
  const invoiceDoc = await invoiceQuery.lean() as any;

  if (!invoiceDoc) {
    throw new Error(`Invoice not found for invoice_no: ${invoice_no}`);
  }

  const invoice_id = invoiceDoc.invoice_id;
  
  const requestsQuery = ProjectPayreq.find({ milestone_code });
  if (session) requestsQuery.session(session);
  const requests = await requestsQuery.lean() as any[];

  if (requests.length === 0) {
    throw new Error(`No payment requests found for milestone_code: ${milestone_code}`);
  }

  let totalAmount = 0;
  let paidAmount = 0;
  let balanceAmount = 0;

  for (const req of requests) {
    const milestoneAmt = parseFloat(req.milestone_amount || 0);
    const balAmt = parseFloat(req.balance_amount || 0);
    const paid = milestoneAmt - balAmt;

    totalAmount += milestoneAmt;
    paidAmount += paid;
    balanceAmount += balAmt;

    const existsQuery = InvoiceRequest.findOne({ invoice_id, request_id: req.request_id });
    if (session) existsQuery.session(session);
    const exists = await existsQuery.lean();
    if (!exists) {
      await InvoiceRequest.create([{ invoice_id, request_id: req.request_id }], { session });
    }
  }

  await ProjectInvoice.updateOne(
    { invoice_id },
    { $set: { total_amount: totalAmount, paid_amount: paidAmount, balance_amount: balanceAmount, updated_on: new Date() } },
    { session }
  );

  return {
    message: `Invoice updated successfully`,
    invoice_id,
    data: {
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      request_ids: requests.map(r => r.request_id)
    }
  };
};