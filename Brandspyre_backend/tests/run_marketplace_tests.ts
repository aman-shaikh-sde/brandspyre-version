import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { connectDatabase, disconnectDatabase } from "../src/db/index";
import { Tenant, WebhookEventLog, SubscriptionPlan, TenantSubscription } from "../src/db/ModelSceham/saasSchema";
import { OrganizationPaymentAccount } from "../src/db/ModelSceham/organizationPaymentAccountSchema";
import { OrganizationPayment } from "../src/db/ModelSceham/organizationPaymentSchema";
import { OrganizationPaymentRequest } from "../src/db/ModelSceham/organizationPaymentRequestSchema";
import { PlatformCommission } from "../src/db/ModelSceham/platformCommissionSchema";
import { PlatformPaymentConfig } from "../src/db/ModelSceham/platformPaymentConfigSchema";
import { B2BSettlementAgreement, B2BSettlementTransaction, B2BSettlementInvoice } from "../src/db/ModelSceham/b2bSettlementSchema";
import { PaymentAllocation } from "../src/db/ModelSceham/paymentAllocationSchema";
import { Referral, ReferralParticipant } from "../src/db/ModelSceham/referralSchema";
import { PlatformFeeService } from "../src/services/payments/PlatformFeeService";
import { MarketplacePaymentService } from "../src/services/payments/MarketplacePaymentService";
import { ReferralService } from "../src/services/saas/ReferralService";
import RazorpayService from "../src/services/razorpayService";

// Force mock/test mode for predictable test runs
process.env.PAYMENT_MOCK_MODE = "true";
process.env.NODE_ENV = "test";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  PASS: ${message}`);
    testsPassed++;
  }
}

async function runAllTests() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Destructive test operations are disabled in production environment.");
  }

  console.log("\n=======================================================");
  console.log("  BRANDSPYRE MULTI-PROVIDER MARKETPLACE TEST SUITE");
  console.log("=======================================================\n");

  await connectDatabase();

  // Safely ensure Platform Fee Config without wiping shared collections
  await PlatformPaymentConfig.findOneAndUpdate(
    {},
    {
      $set: {
        fee_type: "PERCENTAGE",
        fee_percentage: 10.0,
        fixed_fee: 0,
        tax_percentage: 18,
        minimum_fee: 0,
        maximum_fee: 100000,
        is_active: true,
        payout_hold_period_days: 0,
        razorpay_enabled: true,
        stripe_enabled: true,
        default_marketplace_provider: "razorpay",
      },
    },
    { upsert: true, new: true }
  );

  const testSuffix = Date.now().toString().slice(-6);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: SaaS Subscription Isolation vs Marketplace Payments
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Verifying SaaS Subscription Isolation...");
    const subTenant = await Tenant.create({
      name: `Sub Org ${testSuffix}`,
      company_name: `Sub Org ${testSuffix}`,
      tenant_code: `TEN-SUB-${testSuffix}`,
      email: `sub_${testSuffix}@example.com`
    });

    const commCountBefore = await PlatformCommission.countDocuments();
    const allocCountBefore = await PaymentAllocation.countDocuments();
    const b2bTxnCountBefore = await B2BSettlementTransaction.countDocuments();

    // Create Subscription Plan & Tenant Subscription
    const plan = await SubscriptionPlan.create({
      plan_name: `Pro Plan ${testSuffix}`,
      plan_code: `pro_${testSuffix}`,
      description: "Professional Plan",
      plan_type: "paid",
      price_monthly: 999,
      currency: 'INR'
    });

    const tenantSub = await TenantSubscription.create({
      tenant_id: subTenant._id,
      plan_id: plan._id,
      status: 'active',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    assert(tenantSub.status === 'active', "SaaS subscription activated successfully.");

    const commCountAfter = await PlatformCommission.countDocuments();
    const allocCountAfter = await PaymentAllocation.countDocuments();
    const b2bTxnCountAfter = await B2BSettlementTransaction.countDocuments();

    assert(commCountAfter === commCountBefore, "Subscription created ZERO PlatformCommission records.");
    assert(allocCountAfter === allocCountBefore, "Subscription created ZERO PaymentAllocation records.");
    assert(b2bTxnCountAfter === b2bTxnCountBefore, "Subscription created ZERO B2BSettlementTransaction records.");

    // -------------------------------------------------------------------------
    // TEST 2: Razorpay Marketplace Calculation Invariant
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Verifying Razorpay Marketplace Calculation Invariant...");
    const grossAmount = 10000;
    const feeResult = await PlatformFeeService.calculateFee(grossAmount, 'INR');

    assert(feeResult.grossAmount === 10000, "Gross amount is ₹10,000.");
    assert(feeResult.platformFee === 1000, "Platform commission (10%) is ₹1,000.");
    assert(feeResult.taxOnPlatformFee === 180, "GST on platform commission (18%) is ₹180.");
    assert(feeResult.totalPlatformDeduction === 1180, "Total deduction is ₹1,180.");
    assert(feeResult.receiverAmount === 8820, "Receiver net payout (88.2%) is ₹8,820.");

    const invariantDiff = Math.abs(feeResult.grossAmount - (feeResult.receiverAmount + feeResult.totalPlatformDeduction));
    assert(invariantDiff <= 0.01, `Financial invariant verified: Gross (${feeResult.grossAmount}) === Receiver (${feeResult.receiverAmount}) + Deduction (${feeResult.totalPlatformDeduction}).`);

    // -------------------------------------------------------------------------
    // TEST 3: Stripe Marketplace Calculation Invariant Consistency
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Verifying Stripe Marketplace Calculation Invariant Consistency...");
    const stripeFeeResult = await PlatformFeeService.calculateFee(grossAmount, 'INR');
    assert(stripeFeeResult.platformFee === feeResult.platformFee, "Stripe commission matches Razorpay (₹1,000).");
    assert(stripeFeeResult.taxOnPlatformFee === feeResult.taxOnPlatformFee, "Stripe commission tax matches Razorpay (₹180).");
    assert(stripeFeeResult.receiverAmount === feeResult.receiverAmount, "Stripe receiver net matches Razorpay (₹8,820).");

    // -------------------------------------------------------------------------
    // Setup Organizations for Marketplace Tests
    // -------------------------------------------------------------------------
    const providerOrg = await Tenant.create({
      name: `Provider Org ${testSuffix}`,
      company_name: `Provider Org ${testSuffix}`,
      tenant_code: `TEN-PRV-${testSuffix}`,
      email: `prv_${testSuffix}@example.com`
    });

    const consumerOrg = await Tenant.create({
      name: `Consumer Org ${testSuffix}`,
      company_name: `Consumer Org ${testSuffix}`,
      tenant_code: `TEN-CON-${testSuffix}`,
      email: `con_${testSuffix}@example.com`
    });

    // Onboard Razorpay & Stripe Accounts for Provider Org
    await MarketplacePaymentService.onboardPaymentAccount(providerOrg._id.toString(), {
      provider: 'razorpay',
      business_name: providerOrg.name,
      email: providerOrg.email,
      bank_name: 'HDFC Bank',
      account_number: '123456789012',
      ifsc_code: 'HDFC0000240'
    });

    await MarketplacePaymentService.onboardPaymentAccount(providerOrg._id.toString(), {
      provider: 'stripe',
      business_name: providerOrg.name,
      email: providerOrg.email
    });

    const providerAcc = await OrganizationPaymentAccount.findOne({ tenant_id: providerOrg._id });
    assert(Boolean(providerAcc?.razorpay?.account_id), "Provider organization has connected Razorpay Route account.");
    assert(Boolean(providerAcc?.stripe?.account_id), "Provider organization has connected Stripe Connect account.");

    // -------------------------------------------------------------------------
    // TEST 4: Referral Conversion Auto-Settlement & Commission Calculation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Verifying Referral Conversion Auto-Settlement & Commission Calculation...");
    const referral = await Referral.create({
      referral_code: `REF-${testSuffix}`,
      title: `Software Lead ${testSuffix}`,
      description: "Test referral lead",
      industry: "Technology",
      location: "Mumbai",
      source_type: "ORGANIZATION",
      source_tenant_id: providerOrg._id,
      created_by_user_id: new mongoose.Types.ObjectId(),
      estimated_deal_value: 50000,
      referral_fee: 5000,
      commission_type: "FIXED",
      status: "PUBLISHED"
    });

    await ReferralParticipant.create({
      referral_id: referral._id,
      receiver_tenant_id: consumerOrg._id,
      processor_user_id: new mongoose.Types.ObjectId(),
      status: "ACTIVE"
    });

    // Trigger Referral Conversion
    const refSettlement = await ReferralService.generateReferralSettlement(referral._id.toString());
    assert(Boolean(refSettlement), "Referral settlement generated upon conversion.");
    assert(refSettlement.base_amount === 5000, "Base settlement is ₹5,000.");
    assert(refSettlement.tax_amount === 900, "Tax (18%) on base settlement is ₹900.");
    assert(refSettlement.total_amount === 5900, "Gross settlement total is ₹5,900.");
    assert(refSettlement.platform_commission === 590, "Platform commission (10%) is ₹590.");
    assert(refSettlement.platform_commission_tax === 106.2, "Commission tax (18%) is ₹106.20.");
    assert(refSettlement.receiver_net_amount === 5203.8, "Receiver net payout is ₹5,203.80.");
    assert(Boolean(refSettlement.commission_id), "Commission record ID linked to settlement transaction.");

    const linkedCommission = await PlatformCommission.findById(refSettlement.commission_id);
    assert(Boolean(linkedCommission), "PlatformCommission record found in database.");
    assert(linkedCommission?.commission_amount === 590, "PlatformCommission amount is ₹590.");
    assert(linkedCommission?.total_commission_deduction === 696.2, "PlatformCommission total deduction is ₹696.20.");

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Referral Conversion Idempotency
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Verifying Duplicate Referral Conversion Idempotency...");
    const duplicateTx = await ReferralService.generateReferralSettlement(referral._id.toString());
    assert(duplicateTx._id.toString() === refSettlement._id.toString(), "Duplicate conversion returned identical transaction ID without duplicates.");

    const totalTxnCount = await B2BSettlementTransaction.countDocuments({ lead_id: referral._id });
    assert(totalTxnCount === 1, "Exactly ONE transaction exists for the converted referral.");

    // -------------------------------------------------------------------------
    // TEST 6: Webhook Idempotency (Razorpay)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Verifying Razorpay Webhook Event Idempotency...");
    const eventIdRzp = `evt_rzp_test_${Date.now()}`;
    await WebhookEventLog.create({
      event_id: eventIdRzp,
      provider: 'razorpay_b2b',
      event_type: 'payment.captured',
      payload: { test: true }
    });

    let duplicateCaught = false;
    try {
      await WebhookEventLog.create({
        event_id: eventIdRzp,
        provider: 'razorpay_b2b',
        event_type: 'payment.captured',
        payload: { test: true }
      });
    } catch (e: any) {
      duplicateCaught = (e.code === 11000 || e.message?.includes('duplicate'));
    }
    assert(duplicateCaught, "Duplicate Razorpay webhook event prevented by unique compound index.");

    // -------------------------------------------------------------------------
    // TEST 7: Webhook Idempotency (Stripe)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Verifying Stripe Webhook Event Idempotency...");
    const eventIdStripe = `evt_stripe_test_${Date.now()}`;
    await WebhookEventLog.create({
      event_id: eventIdStripe,
      provider: 'stripe_b2b',
      event_type: 'checkout.session.completed',
      payload: { test: true }
    });

    let duplicateStripeCaught = false;
    try {
      await WebhookEventLog.create({
        event_id: eventIdStripe,
        provider: 'stripe_b2b',
        event_type: 'checkout.session.completed',
        payload: { test: true }
      });
    } catch (e: any) {
      duplicateStripeCaught = (e.code === 11000 || e.message?.includes('duplicate'));
    }
    assert(duplicateStripeCaught, "Duplicate Stripe webhook event prevented by unique compound index.");

    // -------------------------------------------------------------------------
    // TEST 8: Unauthorized Payer Protection
    // -------------------------------------------------------------------------
    console.log("\n[TEST 8] Verifying Unauthorized Payer Access Guard...");
    const intruderOrg = await Tenant.create({
      name: `Intruder Org ${testSuffix}`,
      company_name: `Intruder Org ${testSuffix}`,
      tenant_code: `TEN-INT-${testSuffix}`,
      email: `int_${testSuffix}@example.com`
    });

    const invoice = await B2BSettlementInvoice.create({
      invoice_number: `INV-TEST-${testSuffix}`,
      provider_tenant_id: providerOrg._id,
      receiver_tenant_id: consumerOrg._id,
      transaction_ids: [refSettlement._id],
      subtotal: 5000,
      tax_amount: 900,
      total_amount: 5900,
      paid_amount: 0,
      balance_due: 5900,
      currency: 'INR',
      status: 'issued'
    });

    const isAuthorized = invoice.receiver_tenant_id.toString() === intruderOrg._id.toString();
    assert(!isAuthorized, "Intruder organization is unauthorized to pay consumer's invoice (403 Forbidden).");

    // -------------------------------------------------------------------------
    // TEST 9 & 10: Multi-Provider Checkout & Account Readiness
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9 & 10] Verifying Multi-Provider Checkout Order & Readiness...");
    const payReq = await OrganizationPaymentRequest.create({
      request_code: `PR-TEST-${testSuffix}`,
      receiver_tenant_id: providerOrg._id,
      payer_tenant_id: consumerOrg._id,
      payer_name: consumerOrg.name || `Consumer Org ${testSuffix}`,
      payer_email: `consumer_${testSuffix}@example.com`,
      invoice_id: invoice._id,
      title: "Settlement Invoice",
      total_amount: 5900,
      paid_amount: 0,
      balance_due: 5900,
      currency: 'INR',
      payment_type: 'LEAD_MARKETPLACE_SETTLEMENT',
      status: 'PENDING'
    });

    invoice.payment_request_id = payReq._id;
    await invoice.save();

    // Create Razorpay Checkout
    const rzpCheckout = await MarketplacePaymentService.createCheckoutOrder(payReq._id.toString(), {
      provider: 'razorpay'
    });
    assert(rzpCheckout.provider === 'razorpay', "Razorpay checkout created with provider = razorpay.");
    assert(Boolean(rzpCheckout.order_id), "Razorpay order ID generated.");

    // Create Stripe Checkout
    const stripeCheckout = await MarketplacePaymentService.createCheckoutOrder(payReq._id.toString(), {
      provider: 'stripe'
    });
    assert(stripeCheckout.provider === 'stripe', "Stripe checkout created with provider = stripe.");
    assert(Boolean(stripeCheckout.order_id), "Stripe session ID generated.");

    // -------------------------------------------------------------------------
    // TEST 11: Payment Capture, Allocation, and Refund Reconciliation
    // -------------------------------------------------------------------------
    console.log("\n[TEST 11] Verifying Capture, Allocation & Refund Reconciliation...");
    const captureResult = await MarketplacePaymentService.reconcileCapturedPayment({
      provider: 'razorpay',
      order_id: rzpCheckout.order_id,
      payment_id: `pay_test_${testSuffix}`,
      payment_request_id: payReq._id.toString(),
      amount: 5900
    });

    assert(captureResult.success === true, "Payment reconciled and marked CAPTURED.");
    
    const updatedPayReq = await OrganizationPaymentRequest.findById(payReq._id);
    assert(updatedPayReq?.status === 'PAID', "Payment request updated to PAID.");
    assert(updatedPayReq?.balance_due === 0, "Payment request balance due is 0.");

    const updatedTxn = await B2BSettlementTransaction.findById(refSettlement._id);
    assert(updatedTxn?.status === 'paid', "Settlement transaction updated to paid.");
    assert(updatedTxn?.allocated_amount === 5900, "Settlement transaction allocated amount is ₹5,900.");

    const updatedComm = await PlatformCommission.findById(refSettlement.commission_id);
    assert(updatedComm?.status === 'COLLECTED', "Platform commission updated to COLLECTED.");

    // Process Full Refund
    const refundResult = await MarketplacePaymentService.processRefund(captureResult.paymentId.toString(), {
      amount: 5900,
      reason: "Test cancellation refund"
    });

    assert(refundResult.status === 'REFUNDED', "Payment record status updated to REFUNDED.");
    
    const rolledBackComm = await PlatformCommission.findById(refSettlement.commission_id);
    assert(rolledBackComm?.status === 'REFUNDED', "Platform commission rolled back to REFUNDED.");
    assert(rolledBackComm?.commission_collected_amount === 0, "Collected commission reversed to 0.");

    const rolledBackTxn = await B2BSettlementTransaction.findById(refSettlement._id);
    assert(rolledBackTxn?.allocated_amount === 0, "Settlement transaction allocation reversed to 0.");

    // -------------------------------------------------------------------------
    // TEST 12: SaaS Subscription Model Integrity
    // -------------------------------------------------------------------------
    console.log("\n[TEST 12] Verifying SaaS Subscription Model Integrity...");
    const verifySub = await TenantSubscription.findById(tenantSub._id);
    assert(verifySub?.status === 'active', "Tenant subscription remains active and untouched by marketplace refunds.");

    console.log("\n=======================================================");
    console.log(`  ALL ${testsPassed} TEST ASSERTIONS PASSED SUCCESSFULLY! (${testsFailed} failed)`);
    console.log("=======================================================\n");

  } catch (error: any) {
    console.error("\nTest suite execution failed:", error);
  } finally {
    console.log("\n🧹 Cleaning up temporary marketplace test records...");
    try {
      await Tenant.deleteMany({ tenant_code: { $regex: testSuffix } });
      await SubscriptionPlan.deleteMany({ plan_code: `pro_${testSuffix}` });
      await TenantSubscription.deleteMany({ plan_code: `pro_${testSuffix}` });
      await OrganizationPaymentAccount.deleteMany({ account_holder_name: { $regex: testSuffix } });
      await OrganizationPayment.deleteMany({ payment_id: { $regex: testSuffix } });
      await OrganizationPaymentRequest.deleteMany({ request_code: { $regex: testSuffix } });
      await B2BSettlementAgreement.deleteMany({ agreement_code: { $regex: testSuffix } });
      await B2BSettlementInvoice.deleteMany({ invoice_number: { $regex: testSuffix } });
      await Referral.deleteMany({ referral_code: { $regex: testSuffix } });
      await WebhookEventLog.deleteMany({ event_id: { $regex: testSuffix } });
      console.log("✅ Temporary test records cleaned successfully.");
    } catch (cleanErr) {
      console.warn("⚠️ Cleanup warning:", cleanErr);
    }
    await disconnectDatabase();
  }
}

runAllTests().catch(console.error);
