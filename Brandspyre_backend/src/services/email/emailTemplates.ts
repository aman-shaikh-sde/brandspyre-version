/**
 * Production Email Templates & Safe Template Renderer for Brandspyre CRM
 */

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderTemplate(templateString: string, variables: Record<string, any>): string {
  if (!templateString) return '';
  return templateString.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const keys = key.split('.');
    let value: any = variables;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? escapeHtml(value) : String(value);
  });
}

/**
 * Base Responsive HTML Wrapper for all Brandspyre Emails
 */
export function baseEmailLayout(params: {
  title: string;
  previewText?: string;
  contentHtml: string;
  supportEmail?: string;
  loginUrl?: string;
}): string {
  const { title, previewText = '', contentHtml, supportEmail = 'support@brandspyre.com', loginUrl = 'https://brandspyre.com/login' } = params;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: #b91c1c; text-decoration: none; font-weight: 600; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #b91c1c; color: #ffffff !important; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; text-align: center; }
    .btn:hover { background-color: #991b1b; }
    .card { background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .footer { text-align: center; font-size: 12px; color: #64748b; padding: 24px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-red { background-color: #fee2e2; color: #991b1b; }
    .badge-green { background-color: #dcfce7; color: #166534; }
    .badge-amber { background-color: #fef3c7; color: #92400e; }
  </style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 30px 10px;">
  <!-- Hidden preview text for email clients -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${escapeHtml(previewText)}
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.03em;">
                      Brand<span style="color: #b91c1c;">spyre</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 2px;">
                      Unified Business OS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <div class="card">
                ${contentHtml}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 8px 0;">This is an automated notification from <strong>Brandspyre CRM</strong>.</p>
              <p style="margin: 0 0 12px 0;">
                <a href="${escapeHtml(loginUrl)}" style="color: #64748b; text-decoration: underline;">Workspace Login</a> &bull;
                <a href="mailto:${escapeHtml(supportEmail)}" style="color: #64748b; text-decoration: underline;">Help & Support</a>
              </p>
              <p style="margin: 0; color: #94a3b8;">&copy; ${currentYear} Brandspyre Technologies. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Built-in Core Email Templates
 */
export const DEFAULT_TEMPLATES = {
  // 1. Organization Welcome Email
  welcome_email: {
    subject: `Welcome to Brandspyre CRM, {{companyName}}!`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Welcome Aboard</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Your Brandspyre Workspace is Ready!
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{adminName}}</strong>, welcome to <strong>{{companyName}}</strong>'s new cloud operations platform.
      </p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; color: #1e293b;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td width="35%" style="color: #64748b; font-weight: 600;">Organization:</td><td><strong>{{companyName}}</strong></td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Registered Email:</td><td><strong>{{adminEmail}}</strong></td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Subscription Plan:</td><td><strong>{{planName}}</strong> (14-Day Free Trial)</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Trial Expiry Date:</td><td><strong>{{trialEndDate}}</strong></td></tr>
        </table>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        You can now sign in to your workspace, manage team members, sales pipelines, inventory, and retail operations.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Launch Workspace &rarr;</a>
      </div>
    `
  },

  // 2. Email Address Verification
  verify_email: {
    subject: `Verify your email address for Brandspyre CRM`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-red">Verification Required</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Verify Your Email Address
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{adminName}}</strong>, please verify your email address (<strong>{{adminEmail}}</strong>) to complete your <strong>{{companyName}}</strong> workspace setup.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Click the button below to confirm your email. This link is valid for 24 hours.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{verificationUrl}}" class="btn">Verify Email Address &rarr;</a>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px; word-break: break-all;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <span style="color: #b91c1c;">{{verificationUrl}}</span>
      </p>
    `
  },

  // 3. Password Reset Request
  password_reset: {
    subject: `Reset your Brandspyre CRM password`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-amber">Security Notification</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Password Reset Request
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{userName}}</strong>, we received a request to reset the password for your account associated with <strong>{{userEmail}}</strong>.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Click the button below to set a new password. This reset link will expire in <strong>60 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{resetUrl}}" class="btn">Reset Password &rarr;</a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px;">
        If you did not request a password reset, please ignore this email or contact support if you suspect unauthorized access.
      </p>
    `
  },

  // 4. Password Changed Security Confirmation
  password_changed: {
    subject: `Security Alert: Your Brandspyre password was updated`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Account Security</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Password Changed Successfully
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{userName}}</strong>, this email confirms that your Brandspyre CRM account password was changed on <strong>{{changedAt}}</strong>.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        All other active login sessions have been revoked for your security.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Sign In to Account &rarr;</a>
      </div>
      <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 24px;">
        If you did NOT perform this action, please contact your administrator or support immediately to secure your account.
      </p>
    `
  },

  // 5. Subscription Activated / Payment Successful
  subscription_activated: {
    subject: `Subscription Activated: Welcome to {{planName}} Plan!`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Payment Received & Active</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Subscription Confirmed & Active
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Thank you, <strong>{{customerName}}</strong>! Your payment for <strong>{{companyName}}</strong> was processed successfully.
      </p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; color: #1e293b;">
        <table width="100%" border="0" cellpadding="5" cellspacing="0">
          <tr><td width="40%" style="color: #64748b; font-weight: 600;">Plan:</td><td><strong>{{planName}}</strong> ({{billingCycle}})</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Amount Paid:</td><td><strong>₹{{amount}} {{currency}}</strong></td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Payment ID:</td><td><code>{{paymentId}}</code></td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Invoice Number:</td><td><strong>{{invoiceNumber}}</strong></td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Active Period:</td><td>{{startDate}} to {{endDate}}</td></tr>
          <tr><td style="color: #64748b; font-weight: 600;">Next Billing Date:</td><td><strong>{{nextBillingDate}}</strong></td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Go to Dashboard &rarr;</a>
      </div>
    `
  },

  // 6. Tax Invoice & Payment Receipt
  invoice_receipt: {
    subject: `Tax Invoice {{invoiceNumber}} - Brandspyre CRM`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Tax Invoice Paid</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Payment Receipt & Tax Invoice
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi <strong>{{billingName}}</strong>, here is your payment receipt for <strong>{{companyName}}</strong>.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="color: #64748b;">Invoice Number:</td><td align="right"><strong>{{invoiceNumber}}</strong></td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="color: #64748b;">Invoice Date:</td><td align="right">{{invoiceDate}}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="color: #64748b;">Plan & Cycle:</td><td align="right">{{planName}} ({{billingCycle}})</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="color: #64748b;">Subtotal:</td><td align="right">₹{{subtotal}}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="color: #64748b;">GST ({{taxRate}}%):</td><td align="right">₹{{taxAmount}}</td></tr>
          <tr style="font-size: 15px; font-weight: bold; color: #0f172a;"><td style="padding-top: 8px;">Total Paid:</td><td align="right" style="padding-top: 8px; color: #b91c1c;">₹{{totalAmount}} {{currency}}</td></tr>
        </table>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        Payment ID: <code>{{paymentId}}</code><br>
        GSTIN: {{gstNumber}}
      </p>
    `
  },

  // 7. Subscription Expiry Warning
  subscription_expiry_warning: {
    subject: `⚠️ Subscription Reminder: {{daysRemaining}} day(s) remaining for {{companyName}}`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-amber">Action Recommended</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Subscription Expiring Soon
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{adminName}}</strong>, your <strong>{{planName}}</strong> subscription for <strong>{{companyName}}</strong> will expire in <strong>{{daysRemaining}} day(s)</strong> on <strong>{{expiryDate}}</strong>.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Please renew your subscription to maintain uninterrupted access to all business modules, staff logins, and client portals.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{renewUrl}}" class="btn">Renew Subscription Now &rarr;</a>
      </div>
    `
  },

  // 8. Subscription Expired / Grace Period Active
  grace_period_notice: {
    subject: `🚨 Subscription Expired: {{graceDays}}-Day Grace Period Active for {{companyName}}`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-red">Grace Period Active</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Your Subscription Has Expired
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{adminName}}</strong>, the subscription for <strong>{{companyName}}</strong> has expired.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b; font-size: 13px;">
        <strong>Grace Period Notice:</strong> You have a <strong>{{graceDays}}-day grace period</strong> ending on <strong>{{graceEndDate}}</strong>. After this date, workspace accounts will be suspended.
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{renewUrl}}" class="btn">Renew Now to Restore Access &rarr;</a>
      </div>
    `
  },

  // 9. Account Suspended / Locked
  account_suspended: {
    subject: `🔒 Account Suspended: {{companyName}} Workspace Locked`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-red">Account Locked</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Workspace Access Suspended
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{adminName}}</strong>, your <strong>{{companyName}}</strong> workspace account has been locked because the subscription and grace period have ended.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Your business data remains safely intact. To unlock your workspace immediately, please log in and reactivate your subscription plan.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Unlock & Renew Account &rarr;</a>
      </div>
    `
  },

  // 10. Subscription Renewed
  subscription_renewed: {
    subject: `Subscription Renewed Successfully: {{companyName}}`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Renewal Confirmed</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Subscription Renewed
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{customerName}}</strong>, your <strong>{{planName}}</strong> subscription for <strong>{{companyName}}</strong> has been renewed.
      </p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; color: #1e293b;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td width="40%" style="color: #64748b;">Plan:</td><td><strong>{{planName}}</strong> ({{billingCycle}})</td></tr>
          <tr><td style="color: #64748b;">Amount:</td><td><strong>₹{{amount}} {{currency}}</strong></td></tr>
          <tr><td style="color: #64748b;">Invoice Number:</td><td><strong>{{invoiceNumber}}</strong></td></tr>
          <tr><td style="color: #64748b;">New Period:</td><td>{{startDate}} to {{endDate}}</td></tr>
          <tr><td style="color: #64748b;">Next Billing Date:</td><td><strong>{{nextBillingDate}}</strong></td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Open Dashboard &rarr;</a>
      </div>
    `
  },

  // 11. Subscription Cancelled
  subscription_cancelled: {
    subject: `Subscription Cancellation Confirmation - {{companyName}}`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-amber">Subscription Cancelled</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Subscription Cancellation
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{customerName}}</strong>, your subscription cancellation for <strong>{{companyName}}</strong> has been processed.
      </p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        You will maintain active access to your workspace until the end of your current billing period: <strong>{{effectiveDate}}</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Manage Subscription &rarr;</a>
      </div>
    `
  },

  // 12. Employee Account Created
  employee_created: {
    subject: `Your Brandspyre CRM Staff Account is Ready - {{companyName}}`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">New Account</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Welcome to {{companyName}}'s Team
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>{{employeeName}}</strong>, an employee account has been created for you on <strong>{{companyName}}</strong>'s Brandspyre CRM workspace.
      </p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px; color: #1e293b;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td width="35%" style="color: #64748b;">Staff ID:</td><td><strong>{{staffId}}</strong></td></tr>
          <tr><td style="color: #64748b;">Login Email:</td><td><strong>{{employeeEmail}}</strong></td></tr>
          <tr><td style="color: #64748b;">Role:</td><td><strong style="text-transform: capitalize;">{{role}}</strong></td></tr>
          <tr><td style="color: #64748b;">Branch:</td><td>{{branchName}}</td></tr>
          <tr><td style="color: #64748b;">Department:</td><td>{{departmentName}}</td></tr>
        </table>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Please click the button below to set your account password and log in:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{setupUrl}}" class="btn">Set Up Password & Login &rarr;</a>
      </div>
    `
  },

  // 13. Employee Joining & Welcome Letter
  employee_welcome_joining: {
    subject: `Welcome to {{companyName}} - Joining Details`,
    body: `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-green">Offer & Joining</span>
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 14px 0; line-height: 1.3;">
        Welcome to the Team, {{employeeName}}!
      </h1>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        We are thrilled to welcome you to <strong>{{companyName}}</strong> as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 13px;">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td width="35%" style="color: #64748b;">Joining Date:</td><td><strong>{{joiningDate}}</strong></td></tr>
          <tr><td style="color: #64748b;">Reporting Location:</td><td>{{branchName}}</td></tr>
          <tr><td style="color: #64748b;">Reporting To:</td><td>{{reportingManager}}</td></tr>
          <tr><td style="color: #64748b;">Staff ID:</td><td><strong>{{staffId}}</strong></td></tr>
        </table>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Your workspace account is ready. Please log in using the button below:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{loginUrl}}" class="btn">Access Employee Portal &rarr;</a>
      </div>
    `
  },

  // 14. Multi-Factor Authentication (Email OTP MFA)
  mfa_otp_verification: {
    subject: `{{otpCode}} is your Brandspyre security verification code`,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #1e293b;">
        <!-- Header Security Pill -->
        <div style="text-align: center; margin-bottom: 22px;">
          <span class="badge badge-red" style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase;">
            &#128274; Security Verification
          </span>
        </div>

        <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.3;">
          Two-Step Authentication
        </h1>

        <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
          A request has been initiated to authenticate for <strong>{{purpose}}</strong>. Use the 6-digit verification code below to verify your identity:
        </p>

        <!-- OTP Display Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <div style="background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%); border: 2px solid #fecdd3; border-top: 4px solid #b91c1c; border-radius: 14px; padding: 26px 20px; max-width: 380px; box-shadow: 0 4px 6px -1px rgba(185, 28, 28, 0.08);">
                <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">
                  One-Time Verification Code
                </div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #b91c1c; text-indent: 12px; line-height: 1.1; margin: 8px 0;">
                  {{otpCode}}
                </div>
                <div style="margin-top: 12px; display: inline-block; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 9999px; padding: 4px 14px; font-size: 12px; font-weight: 700; color: #b91c1c;">
                  &#9201; Expires in 5 minutes
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Security Notice Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin: 24px 0;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="26" valign="top" style="padding-top: 1px; font-size: 16px;">
                &#128737;&#65039;
              </td>
              <td style="font-size: 12px; line-height: 1.6; color: #475569;">
                <strong style="color: #0f172a;">Strict Confidentiality:</strong> Never share this 6-digit code with anyone. Brandspyre engineers, administrators, and support staff will never ask for your verification code.
              </td>
            </tr>
          </table>
        </div>

        <!-- Footnote Information -->
        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 18px 0 6px 0; text-align: center;">
          This code is single-use and valid for exactly 5 minutes. If entered incorrectly 5 times, it will be automatically burned.
        </p>

        <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          If you did not make this sign-in request, your account credentials may be compromised. Please sign in and reset your password immediately.
        </p>
      </div>
    `
  }
};
