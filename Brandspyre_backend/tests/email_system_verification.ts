import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { EmailService } from '../src/services/email/EmailService';
import { renderTemplate, escapeHtml, DEFAULT_TEMPLATES } from '../src/services/email/emailTemplates';
import { EmailLog } from '../src/db/ModelSceham/emailLogSchema';
import { UserInfo } from '../src/db/ModelSceham/userSchema';
import { Tenant } from '../src/db/ModelSceham/saasSchema';
import AuthService from '../src/services/saas/AuthService';

async function runEmailSystemVerification() {
  console.log('====================================================');
  console.log('🧪 RUNNING BRANDSPYRE EMAIL SYSTEM VERIFICATION SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Connect to DB for testing
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/almino';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Safe Template Renderer & HTML Escaping
    // ----------------------------------------------------
    console.log('\n[1] Testing Template Renderer & Escaping:');
    const rawTemplate = '<p>Hello {{name}}, welcome to {{company.name}}! <script>{{evil}}</script></p>';
    const vars = {
      name: 'John & Doe',
      company: { name: 'Acme <Corp>' },
      evil: 'alert("xss")'
    };
    const rendered = renderTemplate(rawTemplate, vars);
    assert(rendered.includes('John &amp; Doe'), 'Escapes special characters (& -> &amp;)');
    assert(rendered.includes('Acme &lt;Corp&gt;'), 'Escapes nested object keys (< -> &lt;)');
    assert(!rendered.includes('<script>alert("xss")</script>'), 'Sanitizes XSS injection payload');

    // ----------------------------------------------------
    // TEST 2: Core Default Email Templates Verification
    // ----------------------------------------------------
    console.log('\n[2] Testing Default Email Templates Rendering:');
    const templateKeys = Object.keys(DEFAULT_TEMPLATES) as Array<keyof typeof DEFAULT_TEMPLATES>;
    assert(templateKeys.length >= 13, `All 13 core email templates are defined (Found: ${templateKeys.length})`);

    const welcomeContent = await EmailService.renderEmailContent('welcome_email', {
      companyName: 'Apex Enterprise',
      adminName: 'Alice Johnson',
      adminEmail: 'alice@apex.com',
      planName: 'BUSINESS',
      trialEndDate: 'Oct 15, 2026',
      loginUrl: 'http://localhost:5173/login',
      verificationUrl: 'http://localhost:5173/verify-email?token=xyz123'
    });
    assert(welcomeContent.subject.includes('Apex Enterprise'), 'Welcome template renders company name in subject');
    assert(welcomeContent.html.includes('Apex Enterprise'), 'Welcome template renders company name in HTML body');
    assert(welcomeContent.html.includes('Launch Workspace'), 'Welcome template includes CTA button');

    // ----------------------------------------------------
    // TEST 3: Idempotency & Deduplication
    // ----------------------------------------------------
    console.log('\n[3] Testing Idempotency & Deduplication:');
    const testKey = `test_idempotency_${Date.now()}`;
    const testRecipient = `test_${Date.now()}@brandspyre.test`;

    // First send
    const res1 = await EmailService.sendEmail({
      to: testRecipient,
      subject: 'Test Idempotency 1',
      html: '<p>First dispatch</p>',
      eventType: 'test_event',
      referenceId: 'ref_100',
      idempotencyKey: testKey
    });
    assert(res1.success === true && res1.skipped !== true, 'First send succeeds and is not skipped');

    // Second send with same idempotencyKey
    const res2 = await EmailService.sendEmail({
      to: testRecipient,
      subject: 'Test Idempotency 2 (Duplicate)',
      html: '<p>Second dispatch</p>',
      eventType: 'test_event',
      referenceId: 'ref_100',
      idempotencyKey: testKey
    });
    assert(res2.success === true && res2.skipped === true, 'Second send is skipped via idempotency check');

    // Verify EmailLog record
    const logRecord = await EmailLog.findOne({ idempotency_key: testKey });
    assert(logRecord !== null, 'EmailLog record persisted with idempotency_key');
    assert(logRecord?.recipient === testRecipient, 'EmailLog has correct recipient');
    assert(logRecord?.status === 'sent', 'EmailLog status marked as sent');

    // Clean up test log
    await EmailLog.deleteOne({ idempotency_key: testKey });

    // ----------------------------------------------------
    // TEST 4: Forgot Password Security & Anti-Enumeration
    // ----------------------------------------------------
    console.log('\n[4] Testing Forgot Password Security:');
    
    // Existing vs non-existing emails must receive identical response structure
    const nonExistingRes = await AuthService.requestPasswordReset('non_existent_user_9999@domain.test');
    assert(nonExistingRes.success === true, 'Non-existent email returns success: true');
    assert(nonExistingRes.message.includes('password reset instructions have been sent'), 'Non-existent email returns uniform security message');
    assert(!('resetToken' in nonExistingRes), 'Non-existent email NEVER returns resetToken');

    // Test with temporary user
    const testEmail = `sec_test_${Date.now()}@brandspyre.test`;
    const tempUser = await UserInfo.create({
      firstname: 'Security',
      lastname: 'Tester',
      email: testEmail,
      password: 'hashed_password_123',
      role: 'admin',
      status: 'active',
      dateofjoining: new Date(),
      create_datetime: new Date(),
      last_update_datetime: new Date()
    });

    const existingRes = await AuthService.requestPasswordReset(testEmail);
    assert(existingRes.success === true, 'Existing email returns success: true');
    assert(existingRes.message.includes('password reset instructions have been sent'), 'Existing email returns same generic message');
    assert(!('resetToken' in existingRes), 'Existing email NEVER returns resetToken in API response');

    // Verify user received reset token in DB
    const refreshedUser = await UserInfo.findById(tempUser._id);
    const tokenInDb = (refreshedUser as any)?.reset_password_token;
    assert(typeof tokenInDb === 'string' && tokenInDb.length === 64, 'Secure 64-character hex token generated and stored in DB');

    // Test Password Reset
    const newPass = 'BrandspyreNewPassword2026!';
    const resetRes = await AuthService.resetPassword(tokenInDb, newPass);
    assert(resetRes.success === true, 'Password reset succeeds with valid token');

    const afterResetUser = await UserInfo.findById(tempUser._id);
    assert((afterResetUser as any)?.reset_password_token === undefined, 'Reset token invalidated after password reset');

    // Clean up temporary user
    await UserInfo.deleteOne({ _id: tempUser._id });

    // ----------------------------------------------------
    // TEST 5: Invoice Email 18% GST Calculation
    // ----------------------------------------------------
    console.log('\n[5] Testing Invoice Email Tax Calculations:');
    const invoiceContent = await EmailService.renderEmailContent('invoice_receipt', {
      billingName: 'Bob Smith',
      companyName: 'Smith & Co',
      invoiceNumber: 'INV-202609-0001',
      invoiceDate: 'Sep 3, 2026',
      planName: 'PROFESSIONAL',
      billingCycle: 'MONTHLY',
      subtotal: 1000,
      taxRate: 18,
      taxAmount: 180,
      totalAmount: 1180,
      currency: 'INR',
      paymentId: 'pay_test_123456',
      gstNumber: '29ABCDE1234F1Z5'
    });
    assert(invoiceContent.html.includes('INV-202609-0001'), 'Invoice template contains invoice number');
    assert(invoiceContent.html.includes('₹1180'), 'Invoice template contains total amount with GST');
    assert(invoiceContent.html.includes('GST (18%)'), 'Invoice template contains 18% GST line');

    // ----------------------------------------------------
    // TEST 6: Employee Account Created Email
    // ----------------------------------------------------
    console.log('\n[6] Testing Employee Account Created Email:');
    const employeeContent = await EmailService.renderEmailContent('employee_created', {
      employeeName: 'Dave Miller',
      companyName: 'Acme Corp',
      staffId: 'HQ/05',
      employeeEmail: 'dave@acme.com',
      role: 'Sales Representative',
      branchName: 'Headquarters',
      departmentName: 'Sales & Marketing',
      setupUrl: 'http://localhost:5173/reset-password?token=setup123'
    });
    assert(employeeContent.html.includes('HQ/05'), 'Employee template includes Staff ID');
    assert(employeeContent.html.includes('Sales Representative'), 'Employee template includes role');
    assert(employeeContent.html.includes('http://localhost:5173/reset-password?token=setup123'), 'Employee template includes setup URL');

  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    try {
      await EmailLog.deleteMany({ recipient: { $regex: /@brandspyre\.test/ } });
      await mongoose.disconnect();
    } catch (e) {}

    console.log('\n====================================================');
    console.log(`🏁 SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runEmailSystemVerification();
