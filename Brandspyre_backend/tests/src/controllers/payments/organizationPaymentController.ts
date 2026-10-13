import { Request, Response } from "express";
import mongoose from "mongoose";
import { OrganizationPaymentService } from "../../services/payments/OrganizationPaymentService";
import { MarketplacePaymentService } from "../../services/payments/MarketplacePaymentService";
import { PlatformFeeService } from "../../services/payments/PlatformFeeService";
import { OrganizationPayment } from "../../db/ModelSceham/organizationPaymentSchema";
import { OrganizationPaymentRequest } from "../../db/ModelSceham/organizationPaymentRequestSchema";

export class OrganizationPaymentController {
  // ==========================================
  // PAYMENT ACCOUNT CONTROLLERS
  // ==========================================

  static async getPaymentAccount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const account = await OrganizationPaymentService.getPaymentAccount(tenantId.toString());
      res.status(200).json({ success: true, data: account });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch payment account." });
    }
  }

  static async onboardPaymentAccount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const {
        provider,
        business_name,
        business_type,
        legal_name,
        email,
        phone,
        bank_name,
        account_number,
        ifsc_code,
        beneficiary_name,
        gstin,
        pan,
        return_url,
        refresh_url
      } = req.body;

      if (!business_name && !email) {
        res.status(400).json({ success: false, error: "business_name or email is required." });
        return;
      }

      const account = await OrganizationPaymentService.onboardPaymentAccount(tenantId.toString(), {
        provider: provider || 'razorpay',
        business_name: business_name || (req as any).user?.name,
        business_type,
        legal_name,
        email: email || (req as any).user?.email,
        phone,
        bank_name,
        account_number,
        ifsc_code,
        beneficiary_name,
        gstin,
        pan,
        return_url,
        refresh_url
      });

      res.status(200).json({
        success: true,
        message: "Payment account onboarded successfully.",
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to onboard payment account." });
    }
  }

  static async createOnboardingLink(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const { provider, return_url, refresh_url } = req.body;
      const targetProvider = provider || 'stripe';
      const returnUrl = return_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/payment-account?provider=${targetProvider}&status=success`;
      const refreshUrl = refresh_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/payment-account?provider=${targetProvider}&status=refresh`;

      const link = await MarketplacePaymentService.createOnboardingLink(
        tenantId.toString(),
        targetProvider,
        returnUrl,
        refreshUrl
      );

      res.status(200).json({
        success: true,
        data: link
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to generate onboarding link." });
    }
  }

  static async refreshPaymentAccount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const provider = (req.query.provider as any) || req.body.provider;
      const account = await OrganizationPaymentService.refreshPaymentAccount(tenantId.toString(), provider);

      res.status(200).json({
        success: true,
        message: "Payment account status refreshed.",
        data: account
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to refresh account status." });
    }
  }

  static async disconnectPaymentAccount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const provider = (req.query.provider as any) || req.body.provider;
      const disconnected = await OrganizationPaymentService.disconnectPaymentAccount(tenantId.toString(), provider);

      res.status(200).json({
        success: true,
        message: "Payment account disconnected successfully.",
        data: disconnected
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to disconnect payment account." });
    }
  }

  static async setDefaultProvider(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const { provider } = req.body;
      if (!provider || !['razorpay', 'stripe'].includes(provider)) {
        res.status(400).json({ success: false, error: "Valid provider ('razorpay' or 'stripe') is required." });
        return;
      }

      const updated = await OrganizationPaymentService.setDefaultProvider(tenantId.toString(), provider);

      res.status(200).json({
        success: true,
        message: `Default payment provider set to ${provider}.`,
        data: updated
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to set default payment provider." });
    }
  }

  // ==========================================
  // PAYMENT REQUEST CONTROLLERS
  // ==========================================

  static async createPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const userId = (req as any).user?.userId || (req as any).user?.id;
      const {
        title,
        description,
        payer_name,
        payer_email,
        payer_phone,
        payer_tenant_id,
        payer_client_id,
        invoice_id,
        sales_order_id,
        project_id,
        base_amount,
        tax_amount,
        currency,
        due_date,
        allowed_payment_methods,
        notes,
        payment_type,
        preferred_provider
      } = req.body;

      if (!title || !payer_name || !payer_email || base_amount === undefined) {
        res.status(400).json({
          success: false,
          error: "title, payer_name, payer_email, and base_amount are required."
        });
        return;
      }

      const request = await OrganizationPaymentService.createPaymentRequest(tenantId.toString(), {
        title,
        description,
        payer_name,
        payer_email,
        payer_phone,
        payer_tenant_id,
        payer_client_id,
        invoice_id,
        sales_order_id,
        project_id,
        base_amount: Number(base_amount),
        tax_amount: Number(tax_amount || 0),
        currency,
        due_date: due_date ? new Date(due_date) : undefined,
        allowed_payment_methods,
        notes,
        payment_type,
        preferred_provider,
        created_by: userId
      });

      res.status(201).json({
        success: true,
        message: "Payment request created successfully.",
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create payment request." });
    }
  }

  static async getPaymentRequests(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const { type, status, payment_type, page, limit } = req.query;

      const result = await OrganizationPaymentService.getPaymentRequests(tenantId.toString(), {
        type: type as 'received' | 'sent',
        status: status as string,
        payment_type: payment_type as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        pages: result.pages
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch payment requests." });
    }
  }

  static async getPaymentRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await OrganizationPaymentRequest.findById(id)
        .populate('receiver_tenant_id', 'company_name name tenant_code')
        .populate('payer_tenant_id', 'company_name name tenant_code')
        .lean();

      if (!request) {
        res.status(404).json({ success: false, error: "Payment request not found." });
        return;
      }

      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch payment request." });
    }
  }

  static async cancelPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      const { id } = req.params;

      const request = await OrganizationPaymentRequest.findOne({
        _id: id,
        receiver_tenant_id: tenantId
      });

      if (!request) {
        res.status(404).json({ success: false, error: "Payment request not found." });
        return;
      }

      if (request.status === 'PAID') {
        res.status(400).json({ success: false, error: "Cannot cancel an already paid request." });
        return;
      }

      request.status = 'CANCELLED';
      request.updated_at = new Date();
      await request.save();

      res.status(200).json({
        success: true,
        message: "Payment request cancelled.",
        data: request
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to cancel payment request." });
    }
  }

  // ==========================================
  // MARKETPLACE CHECKOUT & RECONCILIATION
  // ==========================================

  static async createCheckoutOrder(req: Request, res: Response): Promise<void> {
    try {
      const { requestId, payer_name, payer_email, payer_phone, payer_tenant_id, provider } = req.body;

      if (!requestId) {
        res.status(400).json({ success: false, error: "requestId is required." });
        return;
      }

      const orderData = await OrganizationPaymentService.createCheckoutOrder(requestId, {
        payer_name,
        payer_email,
        payer_phone,
        payer_tenant_id,
        provider
      });

      res.status(200).json({
        success: true,
        message: "Checkout order created successfully.",
        data: orderData
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create checkout order." });
    }
  }

  static async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const {
        provider,
        order_id,
        payment_id,
        signature,
        checkout_session_id,
        payment_intent_id,
        payment_request_id
      } = req.body;

      const effectiveOrderId = order_id || checkout_session_id;
      const effectivePaymentId = payment_id || payment_intent_id;

      if (!effectiveOrderId && !effectivePaymentId) {
        res.status(400).json({
          success: false,
          error: "Missing order_id / checkout_session_id or payment_id / payment_intent_id."
        });
        return;
      }

      const result = await OrganizationPaymentService.verifyAndReconcilePayment({
        provider,
        order_id: effectiveOrderId,
        payment_id: effectivePaymentId,
        signature,
        checkout_session_id,
        payment_intent_id,
        payment_request_id
      });

      res.status(200).json({
        success: true,
        message: "Payment verified and reconciled successfully.",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Payment verification failed." });
    }
  }

  static async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;

      const refundResult = await OrganizationPaymentService.processRefund(paymentId, {
        amount: amount ? Number(amount) : undefined,
        reason
      });

      res.status(200).json({
        success: true,
        message: "Refund processed successfully.",
        data: refundResult
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to process refund." });
    }
  }

  // ==========================================
  // DASHBOARD & ADMIN CONTROLLERS
  // ==========================================

  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, error: "Tenant context required." });
        return;
      }

      const { range, provider } = req.query;
      const metrics = await OrganizationPaymentService.getDashboardMetrics(
        tenantId.toString(),
        (range as string) || 'all',
        (provider as string) || 'all'
      );

      res.status(200).json({ success: true, data: metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch dashboard metrics." });
    }
  }

  static async getAdminReconciliations(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role || '';
      const isSuperAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

      if (!isSuperAdmin) {
        res.status(403).json({ success: false, error: "Access denied. Superadmin privileges required." });
        return;
      }

      const result = await OrganizationPaymentService.getAdminReconciliations(req.query as any);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch admin reconciliations." });
    }
  }

  static async updateAdjustmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role || '';
      const isSuperAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

      if (!isSuperAdmin) {
        res.status(403).json({ success: false, error: "Access denied. Superadmin privileges required." });
        return;
      }

      const { paymentId } = req.params;
      const { status, notes } = req.body;
      const actorId = (req as any).user?.userId || (req as any).user?.id;

      const updated = await OrganizationPaymentService.updateAdjustmentStatus(paymentId, {
        status,
        notes,
        actor_id: actorId
      });

      res.status(200).json({
        success: true,
        message: "Adjustment status updated successfully.",
        data: updated
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update adjustment status." });
    }
  }

  // ==========================================
  // PLATFORM PAYMENT CONFIG CONTROLLERS
  // ==========================================

  static async getPlatformFeeConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await PlatformFeeService.getConfig();
      res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch platform fee configuration." });
    }
  }

  static async updatePlatformFeeConfig(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role || '';
      const isSuperAdmin = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes(userRole.toLowerCase());

      if (!isSuperAdmin) {
        res.status(403).json({ success: false, error: "Access denied. Superadmin privileges required." });
        return;
      }

      const updatedBy = (req as any).user?.userId || (req as any).user?.id;
      const config = await PlatformFeeService.updateConfig(req.body, updatedBy);

      res.status(200).json({
        success: true,
        message: "Platform fee configuration updated successfully.",
        data: config
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to update platform fee configuration." });
    }
  }

  // ==========================================
  // PUBLIC CHECKOUT CONTROLLERS
  // ==========================================

  static async getPublicPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const data = await OrganizationPaymentService.getPaymentRequestByToken(token);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message || "Payment request not found." });
    }
  }

  static async publicCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { payer_name, payer_email, payer_phone, provider } = req.body;

      const orderData = await OrganizationPaymentService.createCheckoutOrder(token, {
        payer_name,
        payer_email,
        payer_phone,
        provider
      });

      res.status(200).json({
        success: true,
        message: "Checkout session created successfully.",
        data: orderData
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create public checkout session." });
    }
  }

  static async publicVerify(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { order_id, payment_id, signature, provider, checkout_session_id, payment_intent_id } = req.body;

      const result = await OrganizationPaymentService.verifyAndReconcilePayment({
        provider,
        order_id: order_id || checkout_session_id,
        payment_id: payment_id || payment_intent_id,
        signature,
        checkout_session_id,
        payment_intent_id,
        payment_request_id: token
      });

      res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Payment verification failed." });
    }
  }
}

export default OrganizationPaymentController;
