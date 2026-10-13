import mongoose from 'mongoose';
import { Sequence } from '../../db/ModelSceham/sequenceSchema';

export type DocumentPrefix =
  | 'QT'   // Sales Quotation
  | 'SO'   // Sales Order
  | 'DN'   // Delivery Note
  | 'INV'  // Sales Invoice
  | 'CN'   // Credit Note
  | 'PR'   // Purchase Requisition
  | 'RFQ'  // Request for Quotation
  | 'PO'   // Purchase Order
  | 'GRN'  // Goods Receipt Note
  | 'BILL' // Vendor Bill
  | 'DBN'  // Debit Note
  | 'REC'  // Customer Receipt
  | 'PAY'  // Supplier Payment
  | 'SR'   // Sales Return
  | 'PRT'  // Purchase Return
  | 'JE'   // Journal Entry
  | 'TXN'; // Financial Transaction

export class DocumentNumberService {
  /**
   * Generate an atomic, tenant-scoped, branch-scoped, year-scoped sequential document number
   * Format: PREFIX-YYYY-000001 (e.g. QT-2026-000001, SO-2026-000001, DBN-2026-000001)
   */
  static async generateNumber(
    tenantId: string | mongoose.Types.ObjectId,
    prefix: DocumentPrefix,
    branchcode: string = 'DEFAULT',
    session?: mongoose.ClientSession
  ): Promise<string> {
    const year = new Date().getFullYear();
    const tId = tenantId.toString();
    const sequenceKey = `${tId}:${branchcode}:${year}:${prefix}`;

    const query = { name: sequenceKey };
    const update = { $inc: { value: 1 } };
    const options = { upsert: true, new: true, session };

    const seq = await Sequence.findOneAndUpdate(query, update, options);
    const value = seq?.value || 1;
    const formattedNumber = String(value).padStart(6, '0');

    return `${prefix}-${year}-${formattedNumber}`;
  }
}

export default DocumentNumberService;
