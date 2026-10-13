import mongoose from 'mongoose';
import { PaymentLog, ProjectPayreq, Milestone, Project, ClientModel } from "../../../db/ModelSceham/project/client";

export const addMilestonePaymentLog = async (data: {
  request_id: string;
  payment_id?: string;
  paid_amount: number;
  payment_mode: 'cash' | 'bank' | 'upi' | 'cheque';
  payment_status?: 'paid' | 'overdue' | 'reversed' | 'partially_paid';
  notes?: string;
}, parentSession?: mongoose.ClientSession) => {
  const session = parentSession || await mongoose.startSession();
  const isLocalSession = !parentSession;

  try {
    if (isLocalSession) {
      session.startTransaction();
    }

    const count = await PaymentLog.countDocuments({}).session(session);
    const newPayId = `PAY_${count + 1}`;

    const {
      request_id,
      paid_amount,
      payment_mode,
      payment_status = 'paid',
      notes = ''
    } = data;

    const payment_id = data.payment_id || "NO PAYMENT ID RECIVED";

    const payReq = await ProjectPayreq.findOne({ request_id }).session(session).lean() as any;
    if (!payReq) throw new Error('Invalid request_id');

    const { milestone_amount, balance_amount, milestone_code, project_code } = payReq;
    const currentBalance = parseFloat(balance_amount || 0);
    const milestoneAmount = parseFloat(milestone_amount || 0);

    if (paid_amount > currentBalance) {
      throw new Error(`Paid amount (${paid_amount}) exceeds current balance (${currentBalance}). Overpayment not allowed.`);
    }

    const updatedBalance = currentBalance - paid_amount;

    await PaymentLog.create([{
      pay_id: newPayId,
      request_id,
      payment_id,
      paid_amount,
      payment_mode,
      payment_status,
      notes,
      project_code,
      milestone_code
    }], { session });

    let newStatus: string;
    if (updatedBalance <= 0) {
      newStatus = 'paid';
      await Milestone.updateOne({ milestone_code }, { $set: { paystatus: 'payment_closed', updated_on: new Date() } }).session(session);
      await Project.updateOne({ project_code }, { $set: { paystatus: 'payment_closed', updated_on: new Date() } }).session(session);
    } else if (updatedBalance < milestoneAmount) {
      newStatus = 'partially_paid';
      await Milestone.updateOne({ milestone_code }, { $set: { paystatus: 'partial_paid', updated_on: new Date() } }).session(session);
      await Project.updateOne({ project_code }, { $set: { paystatus: 'payment_closed', updated_on: new Date() } }).session(session);
    } else {
      newStatus = 'request';
    }

    await ProjectPayreq.updateOne(
      { request_id },
      { $set: { balance_amount: updatedBalance, status: newStatus, updated_on: new Date() } }
    ).session(session);

    const projectDoc = await Project.findOne({ project_code }).session(session).lean() as any;
    if (projectDoc && projectDoc.client_code) {
      await ClientModel.updateOne(
        { client_code: projectDoc.client_code },
        { $set: { balance: paid_amount, updated_on: new Date() } }
      ).session(session);
    }

    if (isLocalSession) {
      await session.commitTransaction();
    }

    return {
      message: 'Payment logged successfully',
      request_id,
      payment_id,
      status: newStatus,
      remaining_balance: updatedBalance
    };
  } catch (err) {
    if (isLocalSession) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (isLocalSession) {
      session.endSession();
    }
  }
};