import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

import { Tenant } from "../src/db/ModelSceham/saasSchema";
import { Lead } from "../src/db/ModelSceham/project/campagin";
import { LeadShareAccess } from "../src/db/ModelSceham/leadShareAccessSchema";
import { B2BSettlementAgreement, B2BSettlementTransaction, B2BSettlementInvoice } from "../src/db/ModelSceham/b2bSettlementSchema";
import { OrganizationPaymentRequest } from "../src/db/ModelSceham/organizationPaymentRequestSchema";
import { OrganizationPayment } from "../src/db/ModelSceham/organizationPaymentSchema";
import { OrganizationPaymentAccount } from "../src/db/ModelSceham/organizationPaymentAccountSchema";
import { PaymentAllocation } from "../src/db/ModelSceham/paymentAllocationSchema";
import { PlatformCommission } from "../src/db/ModelSceham/platformCommissionSchema";
import { PlatformPaymentConfig } from "../src/db/ModelSceham/platformPaymentConfigSchema";
import { OrganizationPaymentService } from "../src/services/payments/OrganizationPaymentService";
import { PlatformFeeService } from "../src/services/payments/PlatformFeeService";

async function runMultiLeadTestSuite() {
  console.log("==========================================================================");
  console.log("🚀 STARTING FINAL MULTI-LEAD & PARTIAL ALLOCATION PRODUCTION TEST SUITE");
  console.log("==========================================================================");

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/brandspyre_test";
  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.");

  process.env.PAYMENT_MOCK_MODE = "true";

  const providerTenantId = new mongoose.Types.ObjectId("6a7dce151b008912de9cfa99");
  const receiverTenantId = new mongoose.Types.ObjectId("6a79da17e880b27ad21fc2d4");
  const thirdTenantId = new mongoose.Types.ObjectId("6a79da17e880b27ad21fc2d5");

  await Promise.all([
    Tenant.findOneAndUpdate({ _id: providerTenantId }, { name: "Seller Org A", company_name: "Seller Org A" }, { upsert: true }),
    Tenant.findOneAndUpdate({ _id: receiverTenantId }, { name: "Buyer Org B", company_name: "Buyer Org B" }, { upsert: true }),
    Tenant.findOneAndUpdate({ _id: thirdTenantId }, { name: "Attacker Org C", company_name: "Attacker Org C" }, { upsert: true }),
    OrganizationPaymentAccount.findOneAndUpdate(
      { tenant_id: providerTenantId },
      {
        provider_account_id: "acc_test_seller_123",
        account_status: "ACTIVE",
        kyc_status: "verified",
        payments_enabled: true,
        payouts_enabled: true
      },
      { upsert: true }
    )
  ]);

  // Set default platform fee to 10%
  await PlatformPaymentConfig.findOneAndUpdate(
    {},
    { commission_rate_percentage: 10, min_platform_fee: 50, is_active: true },
    { upsert: true }
  );

  console.log("\n[STAGE 1] Setup Bilateral Agreement & 2 Shared Leads");
  const agreement = await B2BSettlementAgreement.create({
    agreement_code: `AGR-MULTI-${Date.now()}`,
    provider_tenant_id: providerTenantId,
    receiver_tenant_id: receiverTenantId,
    rate: 40000,
    cgst_pct: 0,
    sgst_pct: 0,
    commission_rate_override: 10,
    success_criteria: { successful_stages: ["fulfilled"] },
    status: "active"
  });

  const leadA = await Lead.create({
    lead_name: "Enterprise Lead A",
    email: "leada@client.com",
    phone: "9876543211",
    status: "Fulfilled",
    proj_type: "b2b",
    comm_type: "general",
    branchcode: "DEFAULT",
    tenantId: providerTenantId
  });

  const shareAccessA = await LeadShareAccess.create({
    lead_id: leadA._id,
    owner_tenant_id: providerTenantId,
    shared_tenant_id: receiverTenantId,
    share_status: "completed",
    marketplace_status: "billable"
  });

  const leadB = await Lead.create({
    lead_name: "Enterprise Lead B",
    email: "leadb@client.com",
    phone: "9876543212",
    status: "Fulfilled",
    proj_type: "b2b",
    comm_type: "general",
    branchcode: "DEFAULT",
    tenantId: providerTenantId
  });

  const shareAccessB = await LeadShareAccess.create({
    lead_id: leadB._id,
    owner_tenant_id: providerTenantId,
    shared_tenant_id: receiverTenantId,
    share_status: "completed",
    marketplace_status: "billable"
  });

  // Calculate fees: Lead A = ₹40,000, Lead B = ₹60,000
  const feeA = await PlatformFeeService.calculateFee(40000, "INR", 10);
  const feeB = await PlatformFeeService.calculateFee(60000, "INR", 10);

  const txnA = await B2BSettlementTransaction.create({
    transaction_code: `TXN-A-${Date.now()}`,
    agreement_id: agreement._id,
    provider_tenant_id: providerTenantId,
    receiver_tenant_id: receiverTenantId,
    lead_id: leadA._id,
    idempotency_key: `idemp_${leadA._id}_fulfilled`,
    stage_reached: "fulfilled",
    billable_event_type: "LEAD_FULFILLMENT",
    base_amount: 40000,
    tax_amount: 0,
    total_amount: 40000,
    platform_commission: feeA.platformFee, // ₹4,000
    platform_commission_tax: feeA.taxOnPlatformFee, // ₹720
    receiver_net_amount: feeA.receiverAmount, // ₹35,280
    allocated_amount: 0,
    remaining_amount: 40000,
    currency: "INR",
    status: "unbilled"
  });

  const commA = await PlatformCommission.create({
    commission_code: `COMM-A-${Date.now()}`,
    lead_id: leadA._id,
    settlement_transaction_id: txnA._id,
    payer_tenant_id: receiverTenantId,
    receiver_tenant_id: providerTenantId,
    gross_amount: 40000,
    commission_rate: 10,
    commission_amount: feeA.platformFee,
    commission_tax: feeA.taxOnPlatformFee,
    total_commission_deduction: feeA.totalPlatformDeduction, // ₹4,720
    commission_collected_amount: 0,
    commission_remaining_amount: feeA.totalPlatformDeduction,
    receiver_net_amount: feeA.receiverAmount,
    currency: "INR",
    status: "PENDING"
  });

  const txnB = await B2BSettlementTransaction.create({
    transaction_code: `TXN-B-${Date.now()}`,
    agreement_id: agreement._id,
    provider_tenant_id: providerTenantId,
    receiver_tenant_id: receiverTenantId,
    lead_id: leadB._id,
    idempotency_key: `idemp_${leadB._id}_fulfilled`,
    stage_reached: "fulfilled",
    billable_event_type: "LEAD_FULFILLMENT",
    base_amount: 60000,
    tax_amount: 0,
    total_amount: 60000,
    platform_commission: feeB.platformFee, // ₹6,000
    platform_commission_tax: feeB.taxOnPlatformFee, // ₹1,080
    receiver_net_amount: feeB.receiverAmount, // ₹52,920
    allocated_amount: 0,
    remaining_amount: 60000,
    currency: "INR",
    status: "unbilled"
  });

  const commB = await PlatformCommission.create({
    commission_code: `COMM-B-${Date.now()}`,
    lead_id: leadB._id,
    settlement_transaction_id: txnB._id,
    payer_tenant_id: receiverTenantId,
    receiver_tenant_id: providerTenantId,
    gross_amount: 60000,
    commission_rate: 10,
    commission_amount: feeB.platformFee,
    commission_tax: feeB.taxOnPlatformFee,
    total_commission_deduction: feeB.totalPlatformDeduction, // ₹7,080
    commission_collected_amount: 0,
    commission_remaining_amount: feeB.totalPlatformDeduction,
    receiver_net_amount: feeB.receiverAmount,
    currency: "INR",
    status: "PENDING"
  });

  console.log("✅ Stage 1 Passed: 2 Fulfilled leads created with locked financial snapshots.");

  console.log("\n[STAGE 2] Multi-Lead Combined Invoice Generation (₹100,000 Total)");
  const invoice = await B2BSettlementInvoice.create({
    invoice_number: `INV-MULTI-${Date.now()}`,
    provider_tenant_id: providerTenantId,
    receiver_tenant_id: receiverTenantId,
    transaction_ids: [txnA._id, txnB._id],
    subtotal: 100000,
    tax_amount: 0,
    total_amount: 100000,
    platform_fee_total: 10000,
    platform_tax_total: 1800,
    receiver_amount_total: 88200,
    paid_amount: 0,
    balance_due: 100000,
    currency: "INR",
    payment_type: "LEAD_MARKETPLACE_SETTLEMENT",
    status: "issued",
    due_date: new Date()
  });

  const payReq = await OrganizationPaymentRequest.create({
    request_code: `PAYREQ-MULTI-${Date.now()}`,
    payment_link_token: `token_multi_${Date.now()}`,
    receiver_tenant_id: providerTenantId,
    payer_tenant_id: receiverTenantId,
    payer_name: "Buyer Org B",
    payer_email: "billing@orgb.com",
    invoice_id: invoice._id,
    title: "Multi-Lead Settlement Invoice",
    total_amount: 100000,
    paid_amount: 0,
    balance_due: 100000,
    currency: "INR",
    status: "PENDING",
    payment_type: "LEAD_MARKETPLACE_SETTLEMENT"
  });

  invoice.payment_request_id = payReq._id;
  await invoice.save();

  txnA.status = "invoiced";
  txnA.invoice_id = invoice._id;
  await txnA.save();

  txnB.status = "invoiced";
  txnB.invoice_id = invoice._id;
  await txnB.save();

  commA.status = "CALCULATED";
  commA.settlement_invoice_id = invoice._id;
  await commA.save();

  commB.status = "CALCULATED";
  commB.settlement_invoice_id = invoice._id;
  await commB.save();

  console.log("✅ Stage 2 Passed: Multi-lead invoice (₹100,000) issued with linked payment request.");

  console.log("\n[STAGE 3] Payment #1 of ₹40,000 (Covers Lead A fully, Lead B gets ₹0)");
  const pmt1 = await OrganizationPayment.create({
    transaction_code: `TXN-PMT1-${Date.now()}`,
    receiver_tenant_id: providerTenantId,
    payer_tenant_id: receiverTenantId,
    payment_request_id: payReq._id,
    invoice_id: invoice._id,
    amount: 40000,
    currency: "INR",
    platform_fee: 4000,
    tax_on_platform_fee: 720,
    receiver_amount: 35280,
    provider: "razorpay",
    provider_order_id: `order_multi_p1_${Date.now()}`,
    status: "CREATED",
    receipt_number: `RCPT-MULTI-P1-${Date.now()}`,
    idempotency_key: `idemp_multi_p1_${Date.now()}`
  });

  await OrganizationPaymentService.reconcileCapturedPayment({
    order_id: pmt1.provider_order_id,
    payment_id: `pay_multi_p1_${Date.now()}`,
    payment_request_id: payReq._id.toString(),
    transfer_id: `trf_multi_p1_${Date.now()}`
  });

  // Verify State after Payment #1
  const updatedInv1 = await B2BSettlementInvoice.findById(invoice._id);
  const updatedTxnA1 = await B2BSettlementTransaction.findById(txnA._id);
  const updatedTxnB1 = await B2BSettlementTransaction.findById(txnB._id);
  const updatedCommA1 = await PlatformCommission.findById(commA._id);
  const updatedCommB1 = await PlatformCommission.findById(commB._id);
  const allocsP1 = await PaymentAllocation.find({ payment_id: pmt1._id });

  console.assert(updatedInv1?.paid_amount === 40000, `Invoice paid amount must be 40000, got ${updatedInv1?.paid_amount}`);
  console.assert(updatedInv1?.balance_due === 60000, `Invoice balance due must be 60000, got ${updatedInv1?.balance_due}`);
  console.assert(updatedInv1?.status === "partially_paid", `Invoice status must be partially_paid, got ${updatedInv1?.status}`);

  console.assert(updatedTxnA1?.allocated_amount === 40000, `Lead A allocated amount must be 40000, got ${updatedTxnA1?.allocated_amount}`);
  console.assert(updatedTxnA1?.remaining_amount === 0, `Lead A remaining amount must be 0, got ${updatedTxnA1?.remaining_amount}`);
  console.assert(updatedTxnA1?.status === "paid", `Lead A status must be paid, got ${updatedTxnA1?.status}`);

  console.assert(updatedTxnB1?.allocated_amount === 0, `Lead B allocated amount must be 0, got ${updatedTxnB1?.allocated_amount}`);
  console.assert(updatedTxnB1?.remaining_amount === 60000, `Lead B remaining amount must be 60000, got ${updatedTxnB1?.remaining_amount}`);
  console.assert(updatedTxnB1?.status === "invoiced", `Lead B status must remain invoiced, got ${updatedTxnB1?.status}`);

  console.assert(updatedCommA1?.status === "COLLECTED", `Comm A status must be COLLECTED, got ${updatedCommA1?.status}`);
  console.assert(updatedCommA1?.commission_collected_amount === 4720, `Comm A collected must be 4720, got ${updatedCommA1?.commission_collected_amount}`);

  console.assert(updatedCommB1?.status === "CALCULATED", `Comm B status must remain CALCULATED, got ${updatedCommB1?.status}`);
  console.assert(updatedCommB1?.commission_collected_amount === 0, `Comm B collected must be 0, got ${updatedCommB1?.commission_collected_amount}`);

  console.assert(allocsP1.length === 1, `Payment 1 must produce exactly 1 allocation (Lead A)`);
  console.assert(allocsP1[0].allocated_amount === 40000, `Allocation amount must be 40000`);
  console.assert(allocsP1[0].allocated_receiver_amount === 35280, `Allocated receiver amount must be 35280`);

  console.log("✅ Stage 3 Passed: Payment #1 allocated ₹40,000 to Lead A (status: paid), Lead B untouched (status: invoiced).");

  console.log("\n[STAGE 4] Transfer #1 Processed (Clears Lead A payout ₹35,280)");
  // Simulate transfer.processed webhook for Payment #1
  await OrganizationPayment.findByIdAndUpdate(pmt1._id, {
    provider_transfer_id: "trf_p1_confirmed_123"
  });

  // Execute transfer.processed logic using PaymentAllocation
  const payment1WithTransfer = await OrganizationPayment.findOneAndUpdate(
    { provider_transfer_id: "trf_p1_confirmed_123" },
    { status: "SETTLED", settled_at: new Date() },
    { new: true }
  );

  const allocations1 = await PaymentAllocation.find({ payment_id: payment1WithTransfer?._id });
  for (const alloc of allocations1) {
    alloc.status = "SETTLED";
    alloc.provider_transfer_id = "trf_p1_confirmed_123";
    await alloc.save();

    const t = await B2BSettlementTransaction.findById(alloc.settlement_transaction_id);
    if (t && t.remaining_amount <= 0.01) {
      t.status = "settled";
      await t.save();

      await LeadShareAccess.findOneAndUpdate(
        { lead_id: t.lead_id, owner_tenant_id: t.provider_tenant_id, shared_tenant_id: t.receiver_tenant_id },
        { marketplace_status: "settled", share_status: "completed" }
      );
    }

    const c = await PlatformCommission.findOne({ settlement_transaction_id: alloc.settlement_transaction_id });
    if (c && (c.commission_remaining_amount <= 0.01 || c.status === "COLLECTED")) {
      c.status = "SETTLED";
      c.settled_at = new Date();
      await c.save();
    }
  }

  // Verify that Lead A is SETTLED and Lead B is NOT SETTLED!
  const settledTxnA = await B2BSettlementTransaction.findById(txnA._id);
  const untouchedTxnB = await B2BSettlementTransaction.findById(txnB._id);
  const settledShareA = await LeadShareAccess.findOne({ lead_id: leadA._id });
  const untouchedShareB = await LeadShareAccess.findOne({ lead_id: leadB._id });
  const settledCommA = await PlatformCommission.findById(commA._id);
  const untouchedCommB = await PlatformCommission.findById(commB._id);

  console.assert(settledTxnA?.status === "settled", `Lead A transaction must be settled, got ${settledTxnA?.status}`);
  console.assert(settledShareA?.marketplace_status === "settled", `Lead A share access must be settled, got ${settledShareA?.marketplace_status}`);
  console.assert(settledCommA?.status === "SETTLED", `Comm A must be SETTLED, got ${settledCommA?.status}`);

  console.assert(untouchedTxnB?.status === "invoiced", `CRITICAL: Lead B must NOT be settled! Got status: ${untouchedTxnB?.status}`);
  console.assert(untouchedShareB?.marketplace_status === "billable" || untouchedShareB?.marketplace_status === "invoiced", `Lead B share access must NOT be settled! Got: ${untouchedShareB?.marketplace_status}`);
  console.assert(untouchedCommB?.status === "CALCULATED", `Comm B must remain CALCULATED, got ${untouchedCommB?.status}`);

  console.log("✅ Stage 4 Passed: Transfer #1 settled ONLY Lead A. Lead B remained completely un-settled.");

  console.log("\n[STAGE 5] Payment #2 of ₹60,000 (Covers Lead B fully)");
  const pmt2 = await OrganizationPayment.create({
    transaction_code: `TXN-PMT2-${Date.now()}`,
    receiver_tenant_id: providerTenantId,
    payer_tenant_id: receiverTenantId,
    payment_request_id: payReq._id,
    invoice_id: invoice._id,
    amount: 60000,
    currency: "INR",
    platform_fee: 6000,
    tax_on_platform_fee: 1080,
    receiver_amount: 52920,
    provider: "razorpay",
    provider_order_id: `order_multi_p2_${Date.now()}`,
    status: "CREATED",
    receipt_number: `RCPT-MULTI-P2-${Date.now()}`,
    idempotency_key: `idemp_multi_p2_${Date.now()}`
  });

  await OrganizationPaymentService.reconcileCapturedPayment({
    order_id: pmt2.provider_order_id,
    payment_id: `pay_multi_p2_${Date.now()}`,
    payment_request_id: payReq._id.toString(),
    transfer_id: `trf_multi_p2_${Date.now()}`
  });

  const updatedInv2 = await B2BSettlementInvoice.findById(invoice._id);
  const updatedTxnB2 = await B2BSettlementTransaction.findById(txnB._id);
  const updatedCommB2 = await PlatformCommission.findById(commB._id);
  const allocsP2 = await PaymentAllocation.find({ payment_id: pmt2._id });

  console.assert(updatedInv2?.paid_amount === 100000, `Invoice paid amount must be 100000, got ${updatedInv2?.paid_amount}`);
  console.assert(updatedInv2?.balance_due === 0, `Invoice balance due must be 0, got ${updatedInv2?.balance_due}`);
  console.assert(updatedInv2?.status === "paid", `Invoice status must be paid, got ${updatedInv2?.status}`);

  console.assert(updatedTxnB2?.allocated_amount === 60000, `Lead B allocated amount must be 60000, got ${updatedTxnB2?.allocated_amount}`);
  console.assert(updatedTxnB2?.remaining_amount === 0, `Lead B remaining amount must be 0, got ${updatedTxnB2?.remaining_amount}`);
  console.assert(updatedTxnB2?.status === "paid", `Lead B status must be paid, got ${updatedTxnB2?.status}`);

  console.assert(updatedCommB2?.status === "COLLECTED", `Comm B status must be COLLECTED, got ${updatedCommB2?.status}`);
  console.assert(updatedCommB2?.commission_collected_amount === 7080, `Comm B collected must be 7080, got ${updatedCommB2?.commission_collected_amount}`);

  console.assert(allocsP2.length === 1, `Payment 2 must produce exactly 1 allocation (Lead B)`);
  console.assert(allocsP2[0].allocated_amount === 60000, `Allocation amount must be 60000`);
  console.assert(allocsP2[0].allocated_receiver_amount === 52920, `Allocated receiver amount must be 52920`);

  console.log("✅ Stage 5 Passed: Payment #2 allocated ₹60,000 to Lead B (status: paid), Invoice balance = ₹0 (status: paid).");

  console.log("\n[STAGE 6] Transfer #2 Processed (Clears Lead B payout ₹52,920)");
  await OrganizationPayment.findByIdAndUpdate(pmt2._id, {
    provider_transfer_id: "trf_p2_confirmed_123"
  });

  const payment2WithTransfer = await OrganizationPayment.findOneAndUpdate(
    { provider_transfer_id: "trf_p2_confirmed_123" },
    { status: "SETTLED", settled_at: new Date() },
    { new: true }
  );

  const allocations2 = await PaymentAllocation.find({ payment_id: payment2WithTransfer?._id });
  for (const alloc of allocations2) {
    alloc.status = "SETTLED";
    alloc.provider_transfer_id = "trf_p2_confirmed_123";
    await alloc.save();

    const t = await B2BSettlementTransaction.findById(alloc.settlement_transaction_id);
    if (t && t.remaining_amount <= 0.01) {
      t.status = "settled";
      await t.save();

      await LeadShareAccess.findOneAndUpdate(
        { lead_id: t.lead_id, owner_tenant_id: t.provider_tenant_id, shared_tenant_id: t.receiver_tenant_id },
        { marketplace_status: "settled", share_status: "completed" }
      );
    }

    const c = await PlatformCommission.findOne({ settlement_transaction_id: alloc.settlement_transaction_id });
    if (c && (c.commission_remaining_amount <= 0.01 || c.status === "COLLECTED")) {
      c.status = "SETTLED";
      c.settled_at = new Date();
      await c.save();
    }
  }

  const settledTxnB = await B2BSettlementTransaction.findById(txnB._id);
  const settledShareB = await LeadShareAccess.findOne({ lead_id: leadB._id });
  const settledCommB = await PlatformCommission.findById(commB._id);

  console.assert(settledTxnB?.status === "settled", `Lead B transaction must be settled, got ${settledTxnB?.status}`);
  console.assert(settledShareB?.marketplace_status === "settled", `Lead B share access must be settled, got ${settledShareB?.marketplace_status}`);
  console.assert(settledCommB?.status === "SETTLED", `Comm B must be SETTLED, got ${settledCommB?.status}`);

  console.log("✅ Stage 6 Passed: Transfer #2 settled Lead B. All invoice lines are now 100% settled.");

  console.log("\n[STAGE 7] Partial Refund on Payment #2 (Refund ₹10,000 of ₹60,000)");
  await OrganizationPaymentService.processRefund(pmt2._id.toString(), {
    amount: 10000,
    reason: "Partial adjustment on Lead B"
  });

  const refundedPmt2 = await OrganizationPayment.findById(pmt2._id);
  const refundedInv = await B2BSettlementInvoice.findById(invoice._id);
  const rolledBackTxnB = await B2BSettlementTransaction.findById(txnB._id);
  const rolledBackCommB = await PlatformCommission.findById(commB._id);
  const rolledBackAllocB = await PaymentAllocation.findOne({ payment_id: pmt2._id });

  console.assert(refundedPmt2?.status === "PARTIALLY_REFUNDED", `Payment status must be PARTIALLY_REFUNDED, got ${refundedPmt2?.status}`);
  console.assert(refundedPmt2?.refunded_amount === 10000, `Refunded amount must be 10000, got ${refundedPmt2?.refunded_amount}`);

  console.assert(refundedInv?.paid_amount === 90000, `Invoice paid amount must be 90000, got ${refundedInv?.paid_amount}`);
  console.assert(refundedInv?.balance_due === 10000, `Invoice balance due must be 10000, got ${refundedInv?.balance_due}`);
  console.assert(refundedInv?.status === "partially_paid", `Invoice status must be partially_paid, got ${refundedInv?.status}`);

  console.assert(rolledBackTxnB?.allocated_amount === 50000, `Lead B allocated amount must be 50000, got ${rolledBackTxnB?.allocated_amount}`);
  console.assert(rolledBackTxnB?.remaining_amount === 10000, `Lead B remaining amount must be 10000, got ${rolledBackTxnB?.remaining_amount}`);
  console.assert(rolledBackTxnB?.status === "payment_pending", `Lead B status must be payment_pending, got ${rolledBackTxnB?.status}`);

  console.assert(rolledBackAllocB?.allocated_amount === 50000, `Allocation amount must be 50000, got ${rolledBackAllocB?.allocated_amount}`);
  console.assert(rolledBackCommB?.status === "PARTIALLY_COLLECTED", `Comm B must be PARTIALLY_COLLECTED, got ${rolledBackCommB?.status}`);
  console.assert(rolledBackCommB?.commission_collected_amount === 5900, `Comm B collected must be 5900 (7080 - 1180), got ${rolledBackCommB?.commission_collected_amount}`);

  console.log("✅ Stage 7 Passed: Partial refund proportionally rolled back Lead B allocation & commission.");

  console.log("\n==========================================================================");
  console.log("🎉 ALL MULTI-LEAD & PARTIAL ALLOCATION PRODUCTION TESTS PASSED WITH ZERO ERRORS!");
  console.log("==========================================================================\n");

  await mongoose.disconnect();
}

runMultiLeadTestSuite().catch((err) => {
  console.error("Multi-Lead Test Suite Failed:", err);
  process.exit(1);
});
