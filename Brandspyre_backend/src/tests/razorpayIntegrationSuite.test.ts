import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

import crypto from "crypto";
import mongoose from "mongoose";
import { getRazorpayConfig, assertRazorpayConfigured } from "../config/razorpayConfig";
import RazorpayService from "../services/razorpayService";
import { WebhookEventLog, SubscriptionPlan, TenantSubscription } from "../db/ModelSceham/saasSchema";
import { PaymentTransaction } from "../db/ModelSceham/subscriptionSystemSchema";
import { connectDatabase } from "../db/index";
import { MarketplacePaymentService } from "../services/payments/MarketplacePaymentService";

export async function runRazorpayIntegrationSuite() {
  console.log("============================================================");
  console.log("💳 STARTING RAZORPAY SECURITY & INTEGRATION TEST SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // Connect to DB if available
  let dbConnected = false;
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDatabase();
      dbConnected = true;
      console.log("  ℹ️ Database connected for integration assertions.\n");
    } catch (err: any) {
      console.log("  ℹ️ Running with offline test fixtures:", err.message, "\n");
    }
  } else {
    dbConnected = true;
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: Configuration & Secret Validation
    // -------------------------------------------------------------
    console.log("--- 1. Configuration & Key Hygiene ---");

    const testSecret = "actual_secret_test_key_abc123456789";
    const testKeyId = "rzp_test_validKeyId123";
    const testWebhookSecret = "webhook_secret_secure_987654321";

    const prevKeyId = process.env.RAZORPAY_KEY_ID;
    const prevKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const prevWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Inject valid test variables for test suite execution
    process.env.RAZORPAY_KEY_ID = testKeyId;
    process.env.RAZORPAY_KEY_SECRET = testSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = testWebhookSecret;

    const activeConfig = getRazorpayConfig();
    assert(
      activeConfig.keyId === testKeyId && activeConfig.isTestMode === true,
      "Identifies rzp_test_ as test mode correctly"
    );
    assert(
      activeConfig.isConfigured === true,
      "getRazorpayConfig correctly validates configured state"
    );

    // Ensure dummy placeholder rejection
    let rejectedDummy = false;
    process.env.RAZORPAY_KEY_ID = "rzp_test_xxx";
    try {
      assertRazorpayConfigured();
    } catch (e: any) {
      rejectedDummy = e.message.includes("placeholder");
    }
    assert(rejectedDummy, "Rejects known placeholder dummy key rzp_test_xxx");

    // Reset valid test credentials
    process.env.RAZORPAY_KEY_ID = testKeyId;
    process.env.RAZORPAY_KEY_SECRET = testSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = testWebhookSecret;

    // -------------------------------------------------------------
    // GROUP 2: Constant-Time HMAC Signature Verification
    // -------------------------------------------------------------
    console.log("\n--- 2. Constant-Time HMAC Signature Verification ---");

    const orderId = "order_N1234567890ABC";
    const paymentId = "pay_P9876543210XYZ";
    const correctSignature = crypto
      .createHmac("sha256", testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Valid signature
    const validVerify = RazorpayService.verifyPaymentSignature(orderId, paymentId, correctSignature);
    assert(validVerify === true, "Valid payment signature verifies successfully");

    // Invalid signature (tampered hex)
    const tamperedSig = correctSignature.slice(0, -2) + "ff";
    const invalidSigVerify = RazorpayService.verifyPaymentSignature(orderId, paymentId, tamperedSig);
    assert(invalidSigVerify === false, "Tampered payment signature fails verification");

    // Tampered orderId
    const tamperedOrderVerify = RazorpayService.verifyPaymentSignature("order_HACKED123", paymentId, correctSignature);
    assert(tamperedOrderVerify === false, "Mismatched order ID fails verification");

    // Missing fields
    const missingFieldVerify = RazorpayService.verifyPaymentSignature("", paymentId, correctSignature);
    assert(missingFieldVerify === false, "Empty order ID is rejected immediately");

    // Webhook signature verification
    const webhookPayload = JSON.stringify({
      entity: "event",
      account_id: "acc_123456",
      event: "payment.captured",
      contains: ["payment"],
      payload: { payment: { entity: { id: paymentId, amount: 79900, currency: "INR", status: "captured", order_id: orderId } } }
    });
    const webhookRawBuffer = Buffer.from(webhookPayload, "utf8");
    const validWebhookSig = crypto
      .createHmac("sha256", testWebhookSecret)
      .update(webhookRawBuffer)
      .digest("hex");

    const validWebhookVerify = RazorpayService.verifyWebhookSignature(webhookRawBuffer, validWebhookSig);
    assert(validWebhookVerify === true, "Valid raw-buffer webhook signature verifies successfully");

    const invalidWebhookVerify = RazorpayService.verifyWebhookSignature(webhookRawBuffer, "invalid_sig_abc_123");
    assert(invalidWebhookVerify === false, "Invalid webhook signature returns false without crashing");

    // Tampered webhook body with valid signature
    const tamperedBuffer = Buffer.from(webhookPayload + " ", "utf8");
    const tamperedWebhookVerify = RazorpayService.verifyWebhookSignature(tamperedBuffer, validWebhookSig);
    assert(tamperedWebhookVerify === false, "Tampered webhook payload body fails signature check");

    // -------------------------------------------------------------
    // GROUP 3: Minimum Amount and Currency Constraints
    // -------------------------------------------------------------
    console.log("\n--- 3. Minimum Amount & Currency Validation ---");

    let sub100PaiseCaught = false;
    try {
      // Razorpay enforces minimum ₹1.00 (100 paise)
      await RazorpayService.createOrder({
        amount: 0.50, // ₹0.50 -> 50 paise, which is invalid
        currency: "INR",
        receipt: "rcpt_sub_100"
      });
    } catch (e: any) {
      sub100PaiseCaught = e.message.includes("100 paise") || e.message.includes("minimum");
    }
    assert(sub100PaiseCaught, "Rejects orders with amount less than 100 paise (minimum ₹1.00)");

    // -------------------------------------------------------------
    // GROUP 4: Database-Backed Webhook Idempotency (WebhookEventLog)
    // -------------------------------------------------------------
    console.log("\n--- 4. Database-Backed Webhook Idempotency ---");

    if (dbConnected) {
      const testEventId = `evt_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1st insertion
      const firstLog = await WebhookEventLog.create({
        event_id: testEventId,
        provider: "razorpay",
        event_type: "payment.captured",
        payload: { payment_id: paymentId, order_id: orderId }
      });
      assert(!!firstLog._id, "Persisted new webhook event in WebhookEventLog");

      // 2nd insertion with same event_id must trigger duplicate key error (code 11000)
      let duplicateCaught = false;
      try {
        await WebhookEventLog.create({
          event_id: testEventId,
          provider: "razorpay",
          event_type: "payment.captured",
          payload: { payment_id: paymentId, order_id: orderId }
        });
      } catch (err: any) {
        duplicateCaught = err.code === 11000 || (err.message && err.message.includes("duplicate key"));
      }
      assert(duplicateCaught, "Enforces strict database unique index on event_id (idempotency guarantee)");

      // Clean up test log
      await WebhookEventLog.deleteOne({ event_id: testEventId }).catch(() => {});
    } else {
      console.log("  ⚠️ Skipping DB index check (database offline)");
    }

    // -------------------------------------------------------------
    // GROUP 5: Captured Status & Anti-Underpayment Verification
    // -------------------------------------------------------------
    console.log("\n--- 5. Payment Finalization & Capture Verification ---");

    // Test rejection when payment is authorized but NOT captured
    let authorizedOnlyRejected = false;
    try {
      // Mock fetchPayment returning authorized status
      const originalFetch = RazorpayService.fetchPayment;
      RazorpayService.fetchPayment = async () => ({
        id: paymentId,
        order_id: orderId,
        amount: 79900,
        currency: "INR",
        status: "authorized" as any
      } as any);

      try {
        await RazorpayService.handlePaymentSuccess({
          order_id: orderId,
          payment_id: paymentId,
          skipApiVerification: false
        });
      } finally {
        RazorpayService.fetchPayment = originalFetch;
      }
    } catch (e: any) {
      authorizedOnlyRejected = e.message.includes("Payment not captured") || e.message.includes("captured");
    }
    assert(authorizedOnlyRejected, "Rejects activation for 'authorized' payments when capture is required");

    // Test rejection when amount is underpaid
    let underpaymentRejected = false;
    try {
      const originalFetch = RazorpayService.fetchPayment;
      RazorpayService.fetchPayment = async () => ({
        id: paymentId,
        order_id: orderId,
        amount: 10000, // ₹100 paid
        currency: "INR",
        status: "captured" as any
      } as any);

      try {
        await RazorpayService.handlePaymentSuccess({
          order_id: orderId,
          payment_id: paymentId,
          amount: 500, // ₹500 expected
          skipApiVerification: false
        });
      } finally {
        RazorpayService.fetchPayment = originalFetch;
      }
    } catch (e: any) {
      underpaymentRejected = e.message.includes("Underpayment detected") || e.message.includes("mismatch");
    }
    assert(underpaymentRejected, "Rejects activation when paid amount is less than expected amount");

    // -------------------------------------------------------------
    // GROUP 6: Out-of-Order Webhook Safety State Machine
    // -------------------------------------------------------------
    console.log("\n--- 6. State Machine & Out-of-Order Protection ---");

    if (dbConnected) {
      const mockTenantId = new mongoose.Types.ObjectId();
      const mockPlanId = new mongoose.Types.ObjectId();
      const mockTxnOrderId = `order_test_${Date.now()}`;

      // Simulate an already completed subscription
      await TenantSubscription.create({
        tenant_id: mockTenantId,
        plan_id: mockPlanId,
        plan_name: "Test Plan",
        amount_paid: 799,
        payment_status: "completed",
        status: "active",
        razorpay_order_id: mockTxnOrderId,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 86400000),
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 86400000)
      });

      // Now a late/delayed failure webhook arrives for this order
      const failResult = await RazorpayService.handlePaymentFailure({
        order_id: mockTxnOrderId,
        error_code: "GATEWAY_TIMEOUT",
        error_description: "Late network failure event"
      });

      assert(
        failResult.ignored === true,
        "Late failure event is ignored for an already completed order (prevents downgrade)"
      );

      // Clean up test records
      await TenantSubscription.deleteOne({ razorpay_order_id: mockTxnOrderId }).catch(() => {});
    } else {
      console.log("  ⚠️ Skipping state machine DB test (database offline)");
    }

    // -------------------------------------------------------------
    // GROUP 7: Stripe & Multi-Provider Non-Regression
    // -------------------------------------------------------------
    console.log("\n--- 7. Stripe & Marketplace Non-Regression ---");

    assert(
      typeof MarketplacePaymentService.onboardPaymentAccount === "function",
      "MarketplacePaymentService.onboardPaymentAccount exists"
    );
    assert(
      typeof MarketplacePaymentService.verifyAndReconcilePayment === "function",
      "MarketplacePaymentService.verifyAndReconcilePayment exists"
    );
    assert(
      typeof MarketplacePaymentService.createCheckoutOrder === "function",
      "MarketplacePaymentService.createCheckoutOrder exists"
    );

    // Restore original env vars
    if (prevKeyId !== undefined) process.env.RAZORPAY_KEY_ID = prevKeyId;
    if (prevKeySecret !== undefined) process.env.RAZORPAY_KEY_SECRET = prevKeySecret;
    if (prevWebhookSecret !== undefined) process.env.RAZORPAY_WEBHOOK_SECRET = prevWebhookSecret;

  } catch (err: any) {
    console.error("  ❌ Unexpected test suite error:", err);
    failed++;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  }

  console.log("\n============================================================");
  console.log(`📊 RAZORPAY TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Razorpay integration suite`);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runRazorpayIntegrationSuite()
    .then(() => {
      console.log("Razorpay test suite executed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Razorpay test suite failed:", err);
      process.exit(1);
    });
}
