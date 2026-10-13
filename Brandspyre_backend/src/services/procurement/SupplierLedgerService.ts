import mongoose from 'mongoose';
import { SupplierLedger } from '../../db/ModelSchema/procurement/SupplierLedger';

export class SupplierLedgerService {
  /**
   * Append a supplier subledger entry and recalculate running balance
   */
  static async recordEntry(params: {
    tenantId: string | mongoose.Types.ObjectId;
    supplierId: string | mongoose.Types.ObjectId;
    voucherType: 'VENDOR_BILL' | 'SUPPLIER_PAYMENT' | 'DEBIT_NOTE' | 'PURCHASE_RETURN' | 'OPENING_BALANCE';
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
      supplierId,
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
    const existing = await SupplierLedger.findOne({ tenant_id: tenantId, operation_key: operationKey }).session(session || null);
    if (existing) return existing;

    // Fetch latest entry for running balance
    const lastEntry = await SupplierLedger.findOne({ tenant_id: tenantId, supplier_id: supplierId })
      .sort({ transaction_date: -1, _id: -1 })
      .session(session || null);

    const prevBalance = lastEntry?.running_balance || 0;
    const runningBalance = prevBalance + creditAmount - debitAmount;

    const [entry] = await SupplierLedger.create(
      [{
        tenant_id: tenantId,
        supplier_id: supplierId,
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

export default SupplierLedgerService;
