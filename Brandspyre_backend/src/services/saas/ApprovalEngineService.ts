import mongoose from 'mongoose';

export interface ApprovalCheckParams {
  tenantId: string | mongoose.Types.ObjectId;
  documentType: 'QUOTATION' | 'SALES_ORDER' | 'CREDIT_NOTE' | 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'VENDOR_BILL' | 'DEBIT_NOTE' | 'STOCK_ADJUSTMENT';
  grandTotal: number;
  discountAmount?: number;
  discountPercent?: number;
}

export interface ApprovalDecision {
  requiresApproval: boolean;
  requiredRole: string;
  reason?: string;
}

export class ApprovalEngineService {
  /**
   * Evaluate if a transaction requires managerial or finance approval
   */
  static evaluateApproval(params: ApprovalCheckParams): ApprovalDecision {
    const { documentType, grandTotal, discountPercent = 0 } = params;

    // Threshold rules
    if (documentType === 'QUOTATION' || documentType === 'SALES_ORDER') {
      if (discountPercent > 15) {
        return { requiresApproval: true, requiredRole: 'SALES_MANAGER', reason: 'Discount exceeds 15%' };
      }
      if (grandTotal > 500000) {
        return { requiresApproval: true, requiredRole: 'FINANCE_MANAGER', reason: 'Sales Order total exceeds ₹5,00,000' };
      }
    }

    if (documentType === 'PURCHASE_ORDER' || documentType === 'VENDOR_BILL') {
      if (grandTotal > 100000) {
        return { requiresApproval: true, requiredRole: 'PURCHASE_MANAGER', reason: 'Purchase total exceeds ₹1,00,000' };
      }
    }

    if (documentType === 'CREDIT_NOTE' || documentType === 'DEBIT_NOTE') {
      if (grandTotal > 25000) {
        return { requiresApproval: true, requiredRole: 'FINANCE_MANAGER', reason: 'Credit/Debit Note exceeds ₹25,000' };
      }
    }

    if (documentType === 'STOCK_ADJUSTMENT') {
      if (grandTotal > 50000) {
        return { requiresApproval: true, requiredRole: 'INVENTORY_MANAGER', reason: 'Stock Adjustment value exceeds ₹50,000' };
      }
    }

    return { requiresApproval: false, requiredRole: 'USER', reason: 'Approved automatically' };
  }
}

export default ApprovalEngineService;
