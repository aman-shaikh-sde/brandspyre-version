import mongoose from 'mongoose';
import { Request, Response } from "express";
import { ProjectPayreq, PaymentLog, ProjectInvoice, InvoiceRequest } from "../../../db/ModelSceham/project/client";

export const deletePayRequest = async (req: Request, res: Response): Promise<void> => {
  const { request_id, delete_type } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!request_id) {
      throw new Error("request_id is required");
    }

    if (delete_type !== "permanent") {
      throw new Error("Only permanent delete allowed");
    }

    const invReqs = await InvoiceRequest.find({ request_id }).session(session).lean() as any[];
    const invoiceIds = invReqs.map((r: any) => r.invoice_id);

    await PaymentLog.deleteMany({ request_id }, { session });

    if (invoiceIds.length > 0) {
      await ProjectInvoice.deleteMany({ invoice_id: { $in: invoiceIds } }, { session });
    }

    await InvoiceRequest.deleteMany({ request_id }, { session });

    const deletedReq = await ProjectPayreq.findOneAndDelete({ request_id }, { session });
    if (!deletedReq) {
      throw new Error("Request not found");
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "Payment request deleted successfully",
      request_id
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    session.endSession();
  }
};
