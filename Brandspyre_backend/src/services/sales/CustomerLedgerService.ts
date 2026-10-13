import mongoose from 'mongoose';
import { CustomerLedger } from '../../db/ModelSchema/commerce/CustomerLedger';

export class CustomerLedgerService {
  /**
   * Append a customer subledger entry and recalculate running balance
   */
  static async recordEntry(params: {
    tenantId: string | mongoose.Types.ObjectId;
    customerId: string | mongoose.Types.ObjectId;
    voucherType: 'SALES_INVOICE' | 'CUSTOMER_PAYMENT' | 'CREDIT_NOTE' | 'SALES_RETURN' | 'OPENING_BALANCE';
    voucherNumber: string;
    referenceId?: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    branchcode?: string;
    operationKey: string;
    session?: mongoose.ClientSession;
  }): Promise<any> {
    const {
      tenantId,
      customerId,
      voucherType,
      voucherNumber,
      referenceId,
      debitAmount = 0,
      creditAmount = 0,
      description,
      branchcode = 'DEFAULT',
      operationKey,
      session
    } = params;

    // Idempotency check
    const existing = await CustomerLedger.findOne({ tenant_id: tenantId, operation_key: operationKey }).session(session || null);
    if (existing) return existing;

    // Fetch latest entry for running balance
    const lastEntry = await CustomerLedger.findOne({ tenant_id: tenantId, customer_id: customerId })
      .sort({ transaction_date: -1, _id: -1 })
      .session(session || null);

    const prevBalance = lastEntry?.running_balance || 0;
    const runningBalance = prevBalance + debitAmount - creditAmount;

    const [entry] = await CustomerLedger.create(
      [{
        tenant_id: tenantId,
        customer_id: customerId,
        voucher_type: voucherType,
        voucher_number: voucherNumber,
        reference_id: referenceId,
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        running_balance: runningBalance,
        description,
        branchcode,
        operation_key: operationKey
      }],
      { session }
    );

    return entry;
  }
}

export default CustomerLedgerService;
