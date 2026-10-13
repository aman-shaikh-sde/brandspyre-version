import mongoose from 'mongoose';
import { ChartOfAccounts, JournalEntry, JournalEntryLine } from '../../db/ModelSceham/accountingSchema';

export interface AccountingPostingParams {
  tenantId: string | mongoose.Types.ObjectId;
  branchcode?: string;
  sourceType: string; // e.g., 'SALES_INVOICE', 'CUSTOMER_PAYMENT', 'VENDOR_BILL', 'PURCHASE_RETURN'
  sourceId: string;   // e.g., 'INV-2026-000123', 'BILL-2026-000045'
  operationKey: string;
  postingDate?: Date;
  description: string;
  lines: {
    accountCode: string; // e.g. '1120' for AR, '4100' for Sales Revenue
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }[];
  createdBy?: string;
  session?: mongoose.ClientSession;
}

export class AccountingPostingService {
  /**
   * Core posting engine enforcing DR = CR and creating audit-traceable Journal Entries
   */
  static async postJournalEntry(params: AccountingPostingParams): Promise<any> {
    const {
      tenantId,
      branchcode = 'DEFAULT',
      sourceType,
      sourceId,
      operationKey,
      postingDate = new Date(),
      description,
      lines,
      createdBy = 'SYSTEM',
      session
    } = params;

    // Idempotency check: Return existing posting if operationKey already posted
    const existing = await JournalEntry.findOne({ tenant_id: tenantId, reference: operationKey }).session(session || null);
    if (existing) {
      return existing;
    }

    // Double-entry validation: Total Debit MUST equal Total Credit
    let totalDebit = 0;
    let totalCredit = 0;
    lines.forEach(l => {
      totalDebit += Math.round((l.debitAmount || 0) * 100) / 100;
      totalCredit += Math.round((l.creditAmount || 0) * 100) / 100;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Accounting Posting Failed: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit}) for ${sourceType} ${sourceId}`);
    }

    const entryNumber = `JE-${sourceType.slice(0, 3)}-${Date.now()}`;

    // Create main Journal Entry document
    const [journalEntry] = await JournalEntry.create(
      [{
        tenant_id: tenantId,
        entry_number: entryNumber,
        entry_date: postingDate,
        reference: operationKey,
        description: `[${sourceType}] ${sourceId} - ${description}`,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'posted',
        branchcode,
        created_by: createdBy
      }],
      { session }
    );

    // Create line items & update Chart of Accounts running balances
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.debitAmount === 0 && l.creditAmount === 0) continue;

      let account = await ChartOfAccounts.findOne({ tenant_id: tenantId, account_code: l.accountCode }).session(session || null);
      if (!account) {
        account = await ChartOfAccounts.findOne({ account_code: l.accountCode }).session(session || null);
      }
      const accountId = account?._id || new mongoose.Types.ObjectId();

      await JournalEntryLine.create(
        [{
          tenant_id: tenantId,
          journal_entry_id: journalEntry._id,
          account_id: accountId,
          description: l.description || description,
          debit_amount: l.debitAmount,
          credit_amount: l.creditAmount,
          line_order: i + 1
        }],
        { session }
      );

      // Update current account balance
      if (account) {
        const netChange = (l.debitAmount || 0) - (l.creditAmount || 0);
        await ChartOfAccounts.findByIdAndUpdate(
          account._id,
          { $inc: { current_balance: netChange }, updated_at: new Date() },
          { session }
        );
      }
    }

    return journalEntry;
  }
}

export default AccountingPostingService;
