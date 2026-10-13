import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { EmailLog } from '../../db/ModelSceham/emailLogSchema';
import { EmailTemplate } from '../../db/ModelSceham/saasSchema';
import {
  baseEmailLayout,
  renderTemplate,
  DEFAULT_TEMPLATES
} from './emailTemplates';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
    cid?: string;
  }>;
  tenantId?: string | mongoose.Types.ObjectId;
  eventType: string;
  referenceId?: string;
  idempotencyKey?: string;
}

export class EmailService {
  private static transporter: any = null;
  private static isInitialized = false;

  /**
   * Safe initialization and verification of Zoho SMTP transporter.
   */
  static async init(): Promise<void> {
    if (this.isInitialized) return;

    const host = process.env.SMTP_HOST || process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in';
    const port = Number(process.env.SMTP_PORT || process.env.ZOHO_SMTP_PORT) || 587;
    const secure = (process.env.SMTP_SECURE || process.env.ZOHO_SMTP_SECURE) === 'true' || port === 465;
    const user = process.env.SMTP_USER || process.env.ZOHO_SMTP_USER;
    const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.ZOHO_SMTP_PASSWORD;
    const pass = rawPass ? rawPass.trim().replace(/^["'](.*)["']$/, '$1') : undefined;

    if (!user || !pass) {
      console.warn('[EmailService] SMTP credentials not fully configured (SMTP_USER / SMTP_PASS). Emails will run in simulated development mode.');
      this.isInitialized = true;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production' ? (process.env.SMTP_ALLOW_INSECURE_TLS === 'true' ? false : true) : false
        }
      });

      // Verify SMTP connection in background without blocking server startup
      this.transporter.verify((error: any) => {
        if (error) {
          console.warn('[EmailService] SMTP verification notice:', error.message);
        } else {
          console.log(`[EmailService] ✅ SMTP configured successfully via Zoho (${host}:${port}, user: ${user})`);
        }
      });

      this.isInitialized = true;
    } catch (err: any) {
      console.error('[EmailService] Failed to create SMTP transporter:', err?.message || err);
      this.isInitialized = true;
    }
  }

  /**
   * Helper to retrieve configured sender info and URLs
   */
  private static getConfig() {
    return {
      fromName: process.env.SMTP_FROM_NAME || process.env.ZOHO_SMTP_FROM_NAME || 'Brandspyre CRM',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.ZOHO_SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.ZOHO_SMTP_USER || 'admin@brandspyre.in',
      frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@brandspyre.com'
    };
  }

  /**
   * Core send method with Idempotency protection, database logging, and non-blocking failure tolerance.
   */
  static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; skipped?: boolean }> {
    const { to, subject, html, text, attachments, tenantId, eventType, referenceId, idempotencyKey } = options;

    // Ensure SMTP transporter is initialized on-demand if credentials exist
    if (!this.isInitialized) {
      await this.init();
    }

    const config = this.getConfig();

    // 1. Idempotency Check (prevent duplicate delivery)
    if (idempotencyKey) {
      const existing = await EmailLog.findOne({ idempotency_key: idempotencyKey, status: 'sent' });
      if (existing) {
        console.log(`[EmailService] Idempotency hit: Email for key '${idempotencyKey}' already sent to ${to}. Skipping.`);
        return { success: true, messageId: existing.message_id, skipped: true };
      }
    }

    const tObjectId = tenantId && mongoose.Types.ObjectId.isValid(tenantId.toString())
      ? new mongoose.Types.ObjectId(tenantId.toString())
      : undefined;

    // If transporter is not configured (e.g. dev environment without credentials)
    if (!this.transporter) {
      console.log(`[EmailService:Simulated] To: ${to} | Subject: "${subject}" | Event: ${eventType} | Ref: ${referenceId || 'N/A'}`);
      
      await EmailLog.create({
        tenant_id: tObjectId,
        recipient: to,
        subject,
        event_type: eventType,
        reference_id: referenceId,
        idempotency_key: idempotencyKey,
        status: 'sent',
        provider: 'zoho_smtp_simulated',
        message_id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sent_at: new Date()
      }).catch((err) => console.warn('[EmailService] EmailLog insert warning:', err.message));

      return { success: true, messageId: 'simulated_id' };
    }

    // 2. Perform actual SMTP send
    try {
      const fromFormatted = `"${config.fromName}" <${config.fromEmail}>`;
      const mailResult = await this.transporter.sendMail({
        from: fromFormatted,
        to,
        subject,
        html,
        text: text || subject,
        attachments
      });

      const messageId = mailResult.messageId || `msg_${Date.now()}`;
      console.log(`[EmailService] Sent '${subject}' to ${to} (MessageId: ${messageId})`);

      // 3. Persist success log
      if (idempotencyKey) {
        await EmailLog.findOneAndUpdate(
          { idempotency_key: idempotencyKey },
          {
            tenant_id: tObjectId,
            recipient: to,
            subject,
            event_type: eventType,
            reference_id: referenceId,
            idempotency_key: idempotencyKey,
            status: 'sent',
            provider: 'zoho_smtp',
            message_id: messageId,
            sent_at: new Date()
          },
          { upsert: true, new: true }
        ).catch(() => {});
      } else {
        await EmailLog.create({
          tenant_id: tObjectId,
          recipient: to,
          subject,
          event_type: eventType,
          reference_id: referenceId,
          status: 'sent',
          provider: 'zoho_smtp',
          message_id: messageId,
          sent_at: new Date()
        }).catch(() => {});
      }

      return { success: true, messageId };
    } catch (sendError: any) {
      const errorMsg = sendError?.message || String(sendError);
      console.error(`[EmailService] Failed to send email to ${to}:`, errorMsg);

      // Log failure in EmailLog
      await EmailLog.create({
        tenant_id: tObjectId,
        recipient: to,
        subject,
        event_type: eventType,
        reference_id: referenceId,
        idempotency_key: idempotencyKey,
        status: 'failed',
        error_message: errorMsg,
        provider: 'zoho_smtp',
        sent_at: new Date()
      }).catch(() => {});

      // Non-blocking: return failure status without crashing the caller
      return { success: false };
    }
  }

  /**
   * Render template with DB overrides or built-in default templates.
   */
  static async renderEmailContent(
    templateName: keyof typeof DEFAULT_TEMPLATES,
    variables: Record<string, any>,
    tenantId?: string | mongoose.Types.ObjectId
  ): Promise<{ subject: string; html: string }> {
    const config = this.getConfig();
    const defaultTpl = DEFAULT_TEMPLATES[templateName];

    let rawSubject = defaultTpl?.subject || 'Notification from Brandspyre CRM';
    let rawBody = defaultTpl?.body || '<p>You have a new notification from Brandspyre CRM.</p>';

    // Check if tenant has customized email template in DB
    if (tenantId) {
      try {
        const customTpl = await EmailTemplate.findOne({
          tenant_id: tenantId,
          name: templateName
        });
        if (customTpl) {
          if (customTpl.subject) rawSubject = customTpl.subject;
          if (customTpl.body_html) rawBody = customTpl.body_html;
        }
      } catch (err) {
        // Fallback to default
      }
    }

    const mergedVars = {
      ...variables,
      frontendUrl: config.frontendUrl,
      supportEmail: config.supportEmail,
      loginUrl: variables.loginUrl || `${config.frontendUrl}/login`
    };

    const renderedSubject = renderTemplate(rawSubject, mergedVars);
    const renderedBody = renderTemplate(rawBody, mergedVars);

    const completeHtml = baseEmailLayout({
      title: renderedSubject,
      previewText: renderedSubject,
      contentHtml: renderedBody,
      supportEmail: config.supportEmail,
      loginUrl: mergedVars.loginUrl
    });

    return { subject: renderedSubject, html: completeHtml };
  }

  // ============================================================
  // SPECIFIC TRANSACTIONAL EMAIL WORKFLOWS
  // ============================================================

  /**
   * 1. Send Welcome Email upon new organization registration
   */
  static async sendWelcomeEmail(params: {
    tenant: any;
    adminUser: any;
    trialDays?: number;
    emailVerificationToken?: string;
  }) {
    const { tenant, adminUser, trialDays = 14, emailVerificationToken } = params;
    const config = this.getConfig();

    const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const trialEndDateStr = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      companyName: tenant.name || tenant.company_name,
      adminName: `${adminUser.firstname || adminUser.name || 'Admin'}`,
      adminEmail: adminUser.email,
      planName: (tenant.subscription_plan || 'Trial').toUpperCase(),
      trialEndDate: trialEndDateStr,
      loginUrl: `${config.frontendUrl}/login`,
      verificationUrl: emailVerificationToken ? `${config.frontendUrl}/verify-email?token=${emailVerificationToken}` : undefined
    };

    const { subject, html } = await this.renderEmailContent('welcome_email', variables, tenant._id);

    if (emailVerificationToken) {
      const verificationUrl = `${config.frontendUrl}/verify-email?token=${emailVerificationToken}`;
      const welcomeVerifyBanner = [
        '',
        '======================================================================',
        '✉️  [REGISTRATION EMAIL VERIFICATION LINK]',
        `📬 TO       : ${adminUser.email}`,
        `🔗 URL      : ${verificationUrl}`,
        `🎫 TOKEN    : ${emailVerificationToken}`,
        '======================================================================',
        ''
      ].join('\n');
      console.log(welcomeVerifyBanner);
      try { process.stdout.write(welcomeVerifyBanner + '\n'); } catch (e) {}
    }

    return this.sendEmail({
      to: adminUser.email,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'welcome_email',
      referenceId: tenant._id.toString(),
      idempotencyKey: `welcome_${tenant._id.toString()}`
    });
  }

  /**
   * 2. Send Email Verification Link
   */
  static async sendEmailVerification(params: {
    tenant: any;
    adminName: string;
    adminEmail: string;
    token: string;
  }) {
    const { tenant, adminName, adminEmail, token } = params;
    const config = this.getConfig();
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    const variables = {
      companyName: tenant.name || tenant.company_name,
      adminName,
      adminEmail,
      verificationUrl
    };

    const { subject, html } = await this.renderEmailContent('verify_email', variables, tenant._id);

    const verifyBanner = [
      '',
      '======================================================================',
      '✉️  [EMAIL VERIFICATION LINK]',
      `📬 TO       : ${adminEmail}`,
      `🔗 URL      : ${verificationUrl}`,
      `🎫 TOKEN    : ${token}`,
      '======================================================================',
      ''
    ].join('\n');
    console.log(verifyBanner);
    try { process.stdout.write(verifyBanner + '\n'); } catch (e) {}

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'email_verification',
      referenceId: token.slice(0, 16),
      idempotencyKey: `verify_${tenant._id}_${token.slice(0, 16)}`
    });
  }

  /**
   * 3. Send Password Reset Email
   */
  static async sendPasswordResetEmail(params: {
    userName: string;
    userEmail: string;
    resetToken: string;
    tenantId?: string | mongoose.Types.ObjectId;
  }) {
    const { userName, userEmail, resetToken, tenantId } = params;
    const config = this.getConfig();
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const variables = {
      userName,
      userEmail,
      resetUrl
    };

    const { subject, html } = await this.renderEmailContent('password_reset', variables, tenantId);

    const resetBanner = [
      '',
      '======================================================================',
      '🔑 [PASSWORD RESET LINK & TOKEN]',
      `📬 TO       : ${userEmail}`,
      `🔗 RESET URL: ${resetUrl}`,
      `🎫 TOKEN    : ${resetToken}`,
      '======================================================================',
      ''
    ].join('\n');
    console.log(resetBanner);
    try { process.stdout.write(resetBanner + '\n'); } catch (e) {}

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      tenantId,
      eventType: 'password_reset',
      referenceId: resetToken.slice(0, 16)
    });
  }

  /**
   * 4. Send Password Changed Confirmation
   */
  static async sendPasswordChangedConfirmation(params: {
    userName: string;
    userEmail: string;
    tenantId?: string | mongoose.Types.ObjectId;
  }) {
    const { userName, userEmail, tenantId } = params;
    const config = this.getConfig();

    const variables = {
      userName,
      userEmail,
      changedAt: new Date().toUTCString(),
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('password_changed', variables, tenantId);

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      tenantId,
      eventType: 'password_changed'
    });
  }

  /**
   * 5. Send Subscription Activated / Payment Success Email
   */
  static async sendSubscriptionActivatedEmail(params: {
    tenant: any;
    subscription: any;
    payment: any;
    invoice?: any;
    recipientEmail: string;
    customerName: string;
  }) {
    const { tenant, subscription, payment, invoice, recipientEmail, customerName } = params;
    const config = this.getConfig();

    const startDateStr = new Date(subscription.start_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDateStr = new Date(subscription.end_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const nextBillStr = new Date(subscription.next_billing_date || subscription.end_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      customerName,
      companyName: tenant.name || tenant.company_name,
      planName: (subscription.plan_code || tenant.subscription_plan || 'Plan').toUpperCase(),
      billingCycle: (subscription.subscription_type || 'monthly').toUpperCase(),
      amount: payment.amount || subscription.amount,
      currency: payment.currency || 'INR',
      paymentId: payment.razorpay_payment_id || payment.payment_id || 'N/A',
      invoiceNumber: invoice?.invoice_number || 'Generated',
      startDate: startDateStr,
      endDate: endDateStr,
      nextBillingDate: nextBillStr,
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('subscription_activated', variables, tenant._id);

    const paymentId = payment.razorpay_payment_id || payment.payment_id || payment._id?.toString() || Date.now().toString();

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'subscription_activated',
      referenceId: paymentId,
      idempotencyKey: `sub_activated_${tenant._id}_${paymentId}`
    });
  }

  /**
   * 6. Send Tax Invoice / Payment Receipt Email
   */
  static async sendInvoiceEmail(params: {
    tenant: any;
    invoice: any;
    recipientEmail: string;
  }) {
    const { tenant, invoice, recipientEmail } = params;
    const config = this.getConfig();

    const invoiceDateStr = new Date(invoice.invoice_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const item = invoice.items && invoice.items[0] ? invoice.items[0] : {};

    const variables = {
      billingName: invoice.billing_name || tenant.name,
      companyName: tenant.name || tenant.company_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoiceDateStr,
      planName: item.plan_name || (tenant.subscription_plan || 'Subscription').toUpperCase(),
      billingCycle: (item.billing_cycle || 'monthly').toUpperCase(),
      subtotal: invoice.subtotal || invoice.total_amount,
      taxRate: invoice.tax_rate || 18,
      taxAmount: invoice.tax_amount || 0,
      totalAmount: invoice.total_amount || invoice.paid_amount,
      currency: invoice.currency || 'INR',
      paymentId: invoice.razorpay_payment_id || 'Captured',
      gstNumber: invoice.gst_number || tenant.gst_number || 'N/A'
    };

    const { subject, html } = await this.renderEmailContent('invoice_receipt', variables, tenant._id);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'invoice_receipt',
      referenceId: invoice.invoice_number,
      idempotencyKey: `invoice_${invoice.invoice_number}`
    });
  }

  /**
   * 7. Send Subscription Expiry Warning Email (30, 15, 7, 5, 3, 1 days)
   */
  static async sendSubscriptionExpiryWarningEmail(params: {
    tenant: any;
    recipientEmail: string;
    adminName: string;
    daysRemaining: number;
    planName: string;
    endDate: Date;
  }) {
    const { tenant, recipientEmail, adminName, daysRemaining, planName, endDate } = params;
    const config = this.getConfig();

    const expiryDateStr = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      adminName,
      companyName: tenant.name || tenant.company_name,
      planName,
      daysRemaining,
      expiryDate: expiryDateStr,
      renewUrl: `${config.frontendUrl}/tenant-registration/plans`
    };

    const { subject, html } = await this.renderEmailContent('subscription_expiry_warning', variables, tenant._id);

    const endDateKey = new Date(endDate).toISOString().slice(0, 10);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'subscription_expiry_warning',
      referenceId: `${daysRemaining}d`,
      idempotencyKey: `expiry_warn_${tenant._id}_${daysRemaining}d_${endDateKey}`
    });
  }

  /**
   * 8. Send Grace Period Warning Email
   */
  static async sendSubscriptionGracePeriodEmail(params: {
    tenant: any;
    recipientEmail: string;
    adminName: string;
    graceDays: number;
    graceEndDate: Date;
  }) {
    const { tenant, recipientEmail, adminName, graceDays, graceEndDate } = params;
    const config = this.getConfig();

    const graceEndDateStr = new Date(graceEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      adminName,
      companyName: tenant.name || tenant.company_name,
      graceDays,
      graceEndDate: graceEndDateStr,
      renewUrl: `${config.frontendUrl}/tenant-registration/plans`
    };

    const { subject, html } = await this.renderEmailContent('grace_period_notice', variables, tenant._id);

    const graceDateKey = new Date(graceEndDate).toISOString().slice(0, 10);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'grace_period_notice',
      referenceId: graceDateKey,
      idempotencyKey: `grace_period_${tenant._id}_${graceDateKey}`
    });
  }

  /**
   * 9. Send Account Suspended / Locked Email
   */
  static async sendAccountSuspendedEmail(params: {
    tenant: any;
    recipientEmail: string;
    adminName: string;
    reason?: string;
  }) {
    const { tenant, recipientEmail, adminName, reason } = params;
    const config = this.getConfig();

    const variables = {
      adminName,
      companyName: tenant.name || tenant.company_name,
      reason: reason || 'Subscription and grace period expired',
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('account_suspended', variables, tenant._id);

    const lockDateKey = new Date().toISOString().slice(0, 10);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'account_suspended',
      referenceId: lockDateKey,
      idempotencyKey: `locked_${tenant._id}_${lockDateKey}`
    });
  }

  /**
   * 10. Send Subscription Renewed Email
   */
  static async sendSubscriptionRenewalEmail(params: {
    tenant: any;
    subscription: any;
    payment: any;
    invoice?: any;
    recipientEmail: string;
    customerName: string;
  }) {
    const { tenant, subscription, payment, invoice, recipientEmail, customerName } = params;
    const config = this.getConfig();

    const startDateStr = new Date(subscription.start_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDateStr = new Date(subscription.end_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const nextBillStr = new Date(subscription.next_billing_date || subscription.end_date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      customerName,
      companyName: tenant.name || tenant.company_name,
      planName: (subscription.plan_code || tenant.subscription_plan || 'Plan').toUpperCase(),
      billingCycle: (subscription.subscription_type || 'monthly').toUpperCase(),
      amount: payment.amount || subscription.amount,
      currency: payment.currency || 'INR',
      invoiceNumber: invoice?.invoice_number || 'Generated',
      startDate: startDateStr,
      endDate: endDateStr,
      nextBillingDate: nextBillStr,
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('subscription_renewed', variables, tenant._id);

    const paymentId = payment.razorpay_payment_id || payment.payment_id || Date.now().toString();

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'subscription_renewed',
      referenceId: paymentId,
      idempotencyKey: `renewal_${tenant._id}_${paymentId}`
    });
  }

  /**
   * 11. Send Subscription Cancelled Email
   */
  static async sendSubscriptionCancelledEmail(params: {
    tenant: any;
    recipientEmail: string;
    customerName: string;
    effectiveDate: Date;
    reason?: string;
  }) {
    const { tenant, recipientEmail, customerName, effectiveDate, reason } = params;
    const config = this.getConfig();

    const effectiveDateStr = new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const variables = {
      customerName,
      companyName: tenant.name || tenant.company_name,
      effectiveDate: effectiveDateStr,
      reason: reason || 'Requested by user',
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('subscription_cancelled', variables, tenant._id);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      tenantId: tenant._id,
      eventType: 'subscription_cancelled',
      referenceId: tenant._id.toString()
    });
  }

  /**
   * 12. Send Employee Account Created Email (with secure password setup link)
   */
  static async sendEmployeeAccountCreatedEmail(params: {
    employee: any;
    companyName: string;
    setupToken?: string;
    branchName?: string;
    departmentName?: string;
    tenantId?: string | mongoose.Types.ObjectId;
  }) {
    const { employee, companyName, setupToken, branchName = 'Headquarters', departmentName = 'General', tenantId } = params;
    const config = this.getConfig();

    const setupUrl = setupToken
      ? `${config.frontendUrl}/reset-password?token=${setupToken}`
      : `${config.frontendUrl}/login`;

    const variables = {
      employeeName: `${employee.firstname || employee.name || 'Team Member'} ${employee.lastname || ''}`.trim(),
      companyName,
      staffId: employee.staff_id || 'Assigned',
      employeeEmail: employee.email,
      role: employee.role || 'Staff',
      branchName,
      departmentName,
      setupUrl
    };

    const { subject, html } = await this.renderEmailContent('employee_created', variables, tenantId);

    return this.sendEmail({
      to: employee.email,
      subject,
      html,
      tenantId,
      eventType: 'employee_created',
      referenceId: employee.staff_id || employee._id?.toString()
    });
  }

  /**
   * 13. Send Employee Welcome / Joining Email
   */
  static async sendEmployeeJoiningEmail(params: {
    employee: any;
    companyName: string;
    designation: string;
    department: string;
    joiningDate: string;
    branchName: string;
    reportingManager?: string;
    tenantId?: string | mongoose.Types.ObjectId;
  }) {
    const { employee, companyName, designation, department, joiningDate, branchName, reportingManager = 'Management', tenantId } = params;
    const config = this.getConfig();

    const variables = {
      employeeName: `${employee.firstname || employee.name} ${employee.lastname || ''}`.trim(),
      companyName,
      designation,
      department,
      joiningDate,
      branchName,
      reportingManager,
      staffId: employee.staff_id || 'Assigned',
      loginUrl: `${config.frontendUrl}/login`
    };

    const { subject, html } = await this.renderEmailContent('employee_welcome_joining', variables, tenantId);

    return this.sendEmail({
      to: employee.email,
      subject,
      html,
      tenantId,
      eventType: 'employee_welcome_joining',
      referenceId: employee.staff_id || employee._id?.toString()
    });
  }

  /**
   * 14. Send Multi-Factor Authentication (Email OTP) Code
   */
  static async sendMfaOtpEmail(params: {
    to: string;
    otpCode: string;
    purpose?: string;
    tenantId?: string | mongoose.Types.ObjectId;
  }) {
    const { to, otpCode, purpose = 'Sign-In', tenantId } = params;
    const config = this.getConfig();

    const variables = {
      otpCode,
      purpose,
      recipientEmail: to,
      supportEmail: config.supportEmail
    };

    const { subject, html } = await this.renderEmailContent('mfa_otp_verification', variables, tenantId);

    const otpBanner = [
      '',
      '======================================================================',
      '🔐 [MFA OTP EMAIL DISPATCHED]',
      `📬 TO       : ${to}`,
      `🔑 OTP CODE : >>> ${otpCode} <<<`,
      `🎯 PURPOSE  : ${purpose}`,
      '======================================================================',
      ''
    ].join('\n');
    console.log(otpBanner);
    try { process.stdout.write(otpBanner + '\n'); } catch (e) {}

    const textFallback = [
      `Brandspyre Security Verification`,
      ``,
      `Your verification code is: ${otpCode}`,
      ``,
      `This code expires in 5 minutes and can only be used once.`,
      `If you did not attempt to sign in or initiate this request, please secure your account immediately.`,
      `Do not share this code with anyone.`
    ].join('\n');

    return this.sendEmail({
      to,
      subject,
      html,
      text: textFallback,
      tenantId,
      eventType: 'mfa_otp_verification',
      referenceId: `mfa_${Date.now()}`
    });
  }
}

export default EmailService;
