import mongoose from 'mongoose';
import { JournalEntry, JournalEntryLine, ChartOfAccounts, FinancialTransaction } from "../../db/ModelSceham/accountingSchema";
import { Request, Response } from "express";
import DocumentNumberService from "../../services/saas/DocumentNumberService";

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
  tenantId?: string;
}

export const createJournalEntry = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Journal Entry";
  const session = await mongoose.startSession();

  try {
    const { userId, brcode, tenantId, userRole } = req.user as AuthenticatedUser;
    const { entry_date, reference, description, lines } = req.body;

    if (!lines || lines.length < 2) {
      res.status(400).json({ error: "Journal entry must have at least 2 lines" });
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const line of lines) {
      if (line.debit_amount > 0) totalDebit += parseFloat(line.debit_amount);
      if (line.credit_amount > 0) totalCredit += parseFloat(line.credit_amount);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      res.status(400).json({ error: "Journal entry must be balanced (total debits = total credits)" });
      return;
    }

    session.startTransaction();

    const dateObj = new Date(entry_date);
    const tenantIdObj = (req as any).tenant?.id || (tenantId ? new mongoose.Types.ObjectId(tenantId) : null);

    const seqVal = await DocumentNumberService.generateNumber(
      tenantIdObj ? tenantIdObj.toString() : 'DEFAULT',
      'JE',
      brcode || 'DEFAULT',
      session
    );
    const entryNumber = seqVal || `JE-${dateObj.getFullYear()}-${Date.now().toString().slice(-6)}`;

    const journalEntryData: any = {
      entry_number: entryNumber,
      entry_date: dateObj,
      reference,
      description,
      total_debit: totalDebit,
      total_credit: totalCredit,
      branchcode: brcode,
      created_by: String(userId),
      tenant_id: tenantIdObj
    };

    const [journalEntry] = await JournalEntry.create([journalEntryData], { session });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      await JournalEntryLine.create([{
        journal_entry_id: journalEntry._id,
        account_id: new mongoose.Types.ObjectId(line.account_id),
        description: line.description,
        debit_amount: parseFloat(line.debit_amount) || 0,
        credit_amount: parseFloat(line.credit_amount) || 0,
        line_order: i + 1
      }], { session });

      const balanceChange = parseFloat(line.debit_amount || 0) - parseFloat(line.credit_amount || 0);
      await ChartOfAccounts.findByIdAndUpdate(
        line.account_id,
        { $inc: { current_balance: balanceChange } },
        { session }
      );
    }

    await session.commitTransaction();

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: { journalEntry, entryNumber }
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getTrialBalance = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Trial Balance";
  const session = await mongoose.startSession();
  
  try {
    const { brcode } = req.user as AuthenticatedUser;
    const { period_start, period_end } = req.query;

    const coaList = await ChartOfAccounts.find({ branchcode: brcode, is_active: true }).session(session).lean() as any[];

    const postedEntries = await JournalEntry.find({
      entry_date: { $gte: new Date(String(period_start)), $lte: new Date(String(period_end)) },
      status: 'posted',
      branchcode: brcode
    }).session(session).lean() as any[];
    const postedEntryIds = postedEntries.map(e => e._id);

    const accounts = await Promise.all(coaList.map(async (coa: any) => {
      const lines = await JournalEntryLine.find({
        account_id: coa._id,
        journal_entry_id: { $in: postedEntryIds }
      }).session(session).lean() as any[];

      let totalDebits = 0;
      let totalCredits = 0;
      for (const line of lines) {
        totalDebits += line.debit_amount || 0;
        totalCredits += line.credit_amount || 0;
      }

      return {
        id: coa._id.toString(),
        account_code: coa.account_code,
        account_name: coa.account_name,
        account_type: coa.account_type,
        total_debits: totalDebits,
        total_credits: totalCredits,
        closing_balance: coa.current_balance || 0
      };
    }));

    const totals = accounts.reduce((acc, row) => {
      acc.total_debits += row.total_debits;
      acc.total_credits += row.total_credits;
      return acc;
    }, { total_debits: 0, total_credits: 0 });

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: {
        accounts,
        totals,
        period: { start: period_start, end: period_end }
      }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getFinancialTransactions = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Financial Transactions";
  const session = await mongoose.startSession();
  
  try {
    const { brcode } = req.user as AuthenticatedUser;
    const { page = 1, limit = 10, transaction_type, start_date, end_date } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const filter: any = { branchcode: brcode };
    if (transaction_type) filter.transaction_type = transaction_type;
    if (start_date) filter.transaction_date = { $gte: new Date(String(start_date)) };
    if (end_date) {
      filter.transaction_date = {
        ...filter.transaction_date,
        $lte: new Date(String(end_date))
      };
    }

    const total = await FinancialTransaction.countDocuments(filter).session(session);

    const transactions = await FinancialTransaction.find(filter)
      .sort({ transaction_date: -1, created_at: -1 })
      .skip(offset)
      .limit(Number(limit))
      .session(session)
      .lean() as any[];

    const data = await Promise.all(transactions.map(async (t: any) => {
      const coa = t.account_id ? await ChartOfAccounts.findById(t.account_id).session(session).lean() as any : null;
      const ca = t.contra_account_id ? await ChartOfAccounts.findById(t.contra_account_id).session(session).lean() as any : null;
      return {
        ...t,
        id: t._id.toString(),
        account_name: coa?.account_name || '',
        contra_account_name: ca?.account_name || ''
      };
    }));

    res.status(200).json({ 
      message: `${msgField} Success`,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Financial Transaction";
  const session = await mongoose.startSession();
  
  try {
    const { userId, brcode } = req.user as AuthenticatedUser;
    const { 
      transaction_date, transaction_type, reference, description, 
      amount, account_id, contra_account_id, client_id, project_id 
    } = req.body;

    session.startTransaction();

    const dateObj = new Date(transaction_date);
    const nextNumber = await FinancialTransaction.countDocuments({
      transaction_date: dateObj,
      branchcode: brcode
    }).session(session) + 1;
    const transactionNumber = `TXN${transaction_date.replace(/-/g, '')}${nextNumber.toString().padStart(4, '0')}`;

    const [transaction] = await FinancialTransaction.create([{
      transaction_number: transactionNumber,
      transaction_date: dateObj,
      transaction_type,
      reference,
      description,
      amount: Number(amount),
      account_id: account_id ? new mongoose.Types.ObjectId(account_id) : undefined,
      contra_account_id: contra_account_id ? new mongoose.Types.ObjectId(contra_account_id) : undefined,
      client_id: client_id ? new mongoose.Types.ObjectId(client_id) : undefined,
      project_id: project_id ? new mongoose.Types.ObjectId(project_id) : undefined,
      branchcode: brcode,
      created_by: String(userId)
    }], { session });

    let debitAccount = account_id;
    let creditAccount = contra_account_id;
    
    if (transaction_type === 'payment' || transaction_type === 'expense') {
      debitAccount = account_id;
      creditAccount = contra_account_id;
    } else if (transaction_type === 'receipt' || transaction_type === 'income') {
      debitAccount = contra_account_id;
      creditAccount = account_id;
    }

    const amtVal = parseFloat(amount);
    if (debitAccount) {
      await ChartOfAccounts.findByIdAndUpdate(debitAccount, { $inc: { current_balance: amtVal } }, { session });
    }
    if (creditAccount) {
      await ChartOfAccounts.findByIdAndUpdate(creditAccount, { $inc: { current_balance: -amtVal } }, { session });
    }

    await session.commitTransaction();

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: {
        ...transaction.toObject(),
        id: transaction._id.toString()
      }
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Chart of Accounts";
  const session = await mongoose.startSession();
  
  try {
    const { brcode } = req.user as AuthenticatedUser;
    const { account_type } = req.query;

    const filter: any = { branchcode: brcode, is_active: true };
    if (account_type) filter.account_type = account_type;

    const accounts = await ChartOfAccounts.find(filter).sort({ account_code: 1 }).session(session).lean() as any[];

    const data = await Promise.all(accounts.map(async (coa: any) => {
      const parent = coa.parent_account_id ? await ChartOfAccounts.findById(coa.parent_account_id).session(session).lean() as any : null;
      return {
        ...coa,
        id: coa._id.toString(),
        parent_account_name: parent?.account_name || ''
      };
    }));

    res.status(200).json({ 
      message: `${msgField} Success`,
      data
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error:`, message);
    res.status(500).json({ error: `${msgField} failed: ${message}` }); 
  } finally {
    session.endSession();
  }
};
