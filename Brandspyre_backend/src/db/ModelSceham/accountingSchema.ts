import mongoose, { Schema, Document } from "mongoose";

export interface IChartOfAccounts extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: mongoose.Types.ObjectId;
  description?: string;
  is_active?: boolean;
  opening_balance?: number;
  current_balance?: number;
  branchcode: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IJournalEntry extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  entry_number: string;
  entry_date: Date;
  reference?: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status?: string;
  branchcode: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface IJournalEntryLine extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  journal_entry_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  line_order?: number;
  created_at?: Date;
}

export interface IFinancialTransaction extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  transaction_number: string;
  transaction_date: Date;
  transaction_type: string;
  reference?: string;
  description: string;
  amount: number;
  currency?: string;
  account_id?: mongoose.Types.ObjectId;
  contra_account_id?: mongoose.Types.ObjectId;
  client_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  status?: string;
  reconciled_date?: Date;
  branchcode: string;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IBankAccount extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency?: string;
  opening_balance?: number;
  current_balance?: number;
  is_active?: boolean;
  branchcode: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IBankReconciliation extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  bank_account_id: mongoose.Types.ObjectId;
  reconciliation_date: Date;
  statement_balance: number;
  book_balance: number;
  difference?: number;
  reconciled_by?: string;
  status?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITrialBalance extends Document {
  tenant_id?: mongoose.Types.ObjectId;
  period_start: Date;
  period_end: Date;
  account_id: mongoose.Types.ObjectId;
  opening_balance?: number;
  total_debits?: number;
  total_credits?: number;
  closing_balance?: number;
  branchcode: string;
  generated_at?: Date;
}

const ChartOfAccountsSchema = new Schema<IChartOfAccounts>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  account_code: { type: String, required: true },
  account_name: { type: String, required: true },
  account_type: { type: String, required: true },
  parent_account_id: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  description: { type: String },
  is_active: { type: Boolean, default: true },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  branchcode: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ChartOfAccountsSchema.index({ tenant_id: 1, account_code: 1 }, { unique: true, sparse: true });
ChartOfAccountsSchema.index({ tenant_id: 1, account_type: 1 });
ChartOfAccountsSchema.index({ tenant_id: 1, branchcode: 1 });

const JournalEntrySchema = new Schema<IJournalEntry>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  entry_number: { type: String, required: true },
  entry_date: { type: Date, required: true },
  reference: { type: String },
  description: { type: String, required: true },
  total_debit: { type: Number, required: true },
  total_credit: { type: Number, required: true },
  status: { type: String, default: 'posted' },
  branchcode: { type: String, required: true },
  created_by: { type: String },
  approved_by: { type: String },
  approved_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

JournalEntrySchema.index({ tenant_id: 1, entry_number: 1 }, { unique: true, sparse: true });
JournalEntrySchema.index({ tenant_id: 1, entry_date: 1 });
JournalEntrySchema.index({ tenant_id: 1, branchcode: 1 });

const JournalEntryLineSchema = new Schema<IJournalEntryLine>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  journal_entry_id: { type: Schema.Types.ObjectId, required: true, ref: 'JournalEntry' },
  account_id: { type: Schema.Types.ObjectId, required: true, ref: 'ChartOfAccounts' },
  description: { type: String },
  debit_amount: { type: Number, default: 0 },
  credit_amount: { type: Number, default: 0 },
  line_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

JournalEntryLineSchema.index({ tenant_id: 1, journal_entry_id: 1 });
JournalEntryLineSchema.index({ tenant_id: 1, account_id: 1 });

const FinancialTransactionSchema = new Schema<IFinancialTransaction>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  transaction_number: { type: String, required: true },
  transaction_date: { type: Date, required: true },
  transaction_type: { type: String, required: true },
  reference: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  account_id: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  contra_account_id: { type: Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  client_id: { type: Schema.Types.ObjectId },
  project_id: { type: Schema.Types.ObjectId },
  status: { type: String, default: 'active' },
  reconciled_date: { type: Date },
  branchcode: { type: String, required: true },
  created_by: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

FinancialTransactionSchema.index({ tenant_id: 1, transaction_number: 1 }, { unique: true, sparse: true });
FinancialTransactionSchema.index({ tenant_id: 1, transaction_date: 1 });
FinancialTransactionSchema.index({ tenant_id: 1, transaction_type: 1 });
FinancialTransactionSchema.index({ tenant_id: 1, branchcode: 1 });

const BankAccountSchema = new Schema<IBankAccount>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  account_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  account_number: { type: String, required: true },
  account_type: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  branchcode: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BankAccountSchema.index({ tenant_id: 1, account_number: 1 });

const BankReconciliationSchema = new Schema<IBankReconciliation>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  bank_account_id: { type: Schema.Types.ObjectId, required: true, ref: 'BankAccount' },
  reconciliation_date: { type: Date, required: true },
  statement_balance: { type: Number, required: true },
  book_balance: { type: Number, required: true },
  difference: { type: Number, default: 0 },
  reconciled_by: { type: String },
  status: { type: String, default: 'pending' },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

BankReconciliationSchema.index({ tenant_id: 1, bank_account_id: 1 });

const TrialBalanceSchema = new Schema<ITrialBalance>({
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  account_id: { type: Schema.Types.ObjectId, required: true, ref: 'ChartOfAccounts' },
  opening_balance: { type: Number, default: 0 },
  total_debits: { type: Number, default: 0 },
  total_credits: { type: Number, default: 0 },
  closing_balance: { type: Number, default: 0 },
  branchcode: { type: String, required: true },
  generated_at: { type: Date, default: Date.now }
});

TrialBalanceSchema.index({ tenant_id: 1, period_start: 1, period_end: 1 });

export const ChartOfAccounts = mongoose.models.ChartOfAccounts || mongoose.model<IChartOfAccounts>('ChartOfAccounts', ChartOfAccountsSchema);
export const JournalEntry = mongoose.models.JournalEntry || mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
export const JournalEntryLine = mongoose.models.JournalEntryLine || mongoose.model<IJournalEntryLine>('JournalEntryLine', JournalEntryLineSchema);
export const FinancialTransaction = mongoose.models.FinancialTransaction || mongoose.model<IFinancialTransaction>('FinancialTransaction', FinancialTransactionSchema);
export const BankAccount = mongoose.models.BankAccount || mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
export const BankReconciliation = mongoose.models.BankReconciliation || mongoose.model<IBankReconciliation>('BankReconciliation', BankReconciliationSchema);
export const TrialBalance = mongoose.models.TrialBalance || mongoose.model<ITrialBalance>('TrialBalance', TrialBalanceSchema);

export const initializeAccountingSchema = async () => {
  try {
    const defaultAccounts = [
      { account_code: '1000', account_name: 'Assets', account_type: 'asset', description: 'Total Assets', branchcode: 'DEFAULT' },
      { account_code: '1100', account_name: 'Current Assets', account_type: 'asset', description: 'Current Assets', branchcode: 'DEFAULT' },
      { account_code: '1110', account_name: 'Cash and Cash Equivalents', account_type: 'asset', description: 'Cash and Bank Accounts', branchcode: 'DEFAULT' },
      { account_code: '1120', account_name: 'Accounts Receivable', account_type: 'asset', description: 'Money owed by customers', branchcode: 'DEFAULT' },
      { account_code: '1130', account_name: 'Inventory', account_type: 'asset', description: 'Inventory and Stock', branchcode: 'DEFAULT' },
      { account_code: '1200', account_name: 'Fixed Assets', account_type: 'asset', description: 'Property, Plant and Equipment', branchcode: 'DEFAULT' },
      { account_code: '2000', account_name: 'Liabilities', account_type: 'liability', description: 'Total Liabilities', branchcode: 'DEFAULT' },
      { account_code: '2100', account_name: 'Current Liabilities', account_type: 'liability', description: 'Current Liabilities', branchcode: 'DEFAULT' },
      { account_code: '2110', account_name: 'Accounts Payable', account_type: 'liability', description: 'Money owed to suppliers', branchcode: 'DEFAULT' },
      { account_code: '2120', account_name: 'Accrued Expenses', account_type: 'liability', description: 'Accrued but unpaid expenses', branchcode: 'DEFAULT' },
      { account_code: '2200', account_name: 'Long-term Liabilities', account_type: 'liability', description: 'Long-term Liabilities', branchcode: 'DEFAULT' },
      { account_code: '3000', account_name: 'Equity', account_type: 'equity', description: "Owner's Equity", branchcode: 'DEFAULT' },
      { account_code: '3100', account_name: 'Share Capital', account_type: 'equity', description: 'Share Capital', branchcode: 'DEFAULT' },
      { account_code: '3200', account_name: 'Retained Earnings', account_type: 'equity', description: 'Retained Earnings', branchcode: 'DEFAULT' },
      { account_code: '4000', account_name: 'Revenue', account_type: 'revenue', description: 'Total Revenue', branchcode: 'DEFAULT' },
      { account_code: '4100', account_name: 'Sales Revenue', account_type: 'revenue', description: 'Sales and Service Revenue', branchcode: 'DEFAULT' },
      { account_code: '4200', account_name: 'Other Revenue', account_type: 'revenue', description: 'Other Income', branchcode: 'DEFAULT' },
      { account_code: '5000', account_name: 'Expenses', account_type: 'expense', description: 'Total Expenses', branchcode: 'DEFAULT' },
      { account_code: '5100', account_name: 'Cost of Goods Sold', account_type: 'expense', description: 'Cost of Goods Sold', branchcode: 'DEFAULT' },
      { account_code: '5200', account_name: 'Operating Expenses', account_type: 'expense', description: 'Operating Expenses', branchcode: 'DEFAULT' },
      { account_code: '5210', account_name: 'Salaries and Wages', account_type: 'expense', description: 'Employee Compensation', branchcode: 'DEFAULT' },
      { account_code: '5220', account_name: 'Rent Expense', account_type: 'expense', description: 'Rent and Utilities', branchcode: 'DEFAULT' },
      { account_code: '5230', account_name: 'Marketing Expenses', account_type: 'expense', description: 'Marketing and Advertising', branchcode: 'DEFAULT' },
      { account_code: '5300', account_name: 'Administrative Expenses', account_type: 'expense', description: 'Administrative Costs', branchcode: 'DEFAULT' }
    ];

    for (const account of defaultAccounts) {
      await ChartOfAccounts.findOneAndUpdate(
        { account_code: account.account_code },
        account,
        { upsert: true, new: true }
      );
    }

    console.log("Accounting schema initialized successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing accounting schema: ${message}`);
    throw new Error(`Error initializing accounting schema: ${message}`);
  }
};
