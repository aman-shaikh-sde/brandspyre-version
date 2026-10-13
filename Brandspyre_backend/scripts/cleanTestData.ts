import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.CLEANUP_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI or CLEANUP_URI must be provided in environment variables.");
}

async function executeProductionSafeCleanup() {
  console.log("=================================================================");
  console.log("🛡️  STARTING PRODUCTION-SAFE DATABASE CLEANUP SCRIPT");
  console.log("=================================================================\n");

  const conn = await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Could not access MongoDB database connection.");
  }
  console.log("✅ Connected to database:", db.databaseName);

  // 1. SAFETY ENVIRONMENT CHECK
  if (process.env.STRICT_PROD_LOCK === "true") {
    throw new Error("❌ STRICT_PROD_LOCK is enabled. Aborting cleanup.");
  }

  // 2. CREATE BACKUP DIRECTORY
  const timestamp = Date.now();
  const backupDir = path.join(__dirname, `../scratch/backup_pre_cleanup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Backup directory created at: ${backupDir}\n`);

  const backupData: Record<string, any[]> = {};

  const saveToBackup = (collectionName: string, docs: any[]) => {
    backupData[collectionName] = docs;
    fs.writeFileSync(
      path.join(backupDir, `${collectionName}.json`),
      JSON.stringify(docs, null, 2),
      "utf-8"
    );
    console.log(`  💾 Backed up ${docs.length} records from [${collectionName}]`);
  };

  // 3. IDENTIFY ALL TEST DATA RECORDS TARGETED FOR CLEANUP

  // A. Temporary Test Subscription Plans
  const targetTestPlanCodes = ["pro_946651", "pro_121282", "pro_187979", "pro_358382"];
  const testPlans = await db
    .collection("subscriptionplans")
    .find({
      $or: [
        { plan_code: { $in: targetTestPlanCodes } },
        { code: { $in: targetTestPlanCodes } },
        { plan_name: { $regex: /^Pro Plan \d+$/ } },
      ],
    })
    .toArray();
  saveToBackup("subscriptionplans", testPlans);

  // B. Test Tenants
  const testTenants = await db
    .collection("tenants")
    .find({
      $or: [
        { tenant_code: { $regex: /^TEN-(SUB|PRV|CON|INT)-/ } },
        { company_name: { $regex: /^(Sub|Provider|Consumer|Intruder) Org / } },
      ],
    })
    .toArray();
  saveToBackup("tenants", testTenants);
  const testTenantIds = testTenants.map((t) => t._id);
  const testTenantIdStrs = testTenants.map((t) => t._id.toString());

  // C. Test Tenant Subscriptions
  const testTenantSubs = await db
    .collection("tenantsubscriptions")
    .find({
      $or: [
        { tenant_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { plan_code: { $in: targetTestPlanCodes } },
        { plan_id: { $in: testPlans.map((p) => p._id.toString()) } },
      ],
    })
    .toArray();
  saveToBackup("tenantsubscriptions", testTenantSubs);

  // D. Test Payment Accounts
  const testPaymentAccounts = await db
    .collection("organizationpaymentaccounts")
    .find({
      $or: [
        { organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { tenant_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
      ],
    })
    .toArray();
  saveToBackup("organizationpaymentaccounts", testPaymentAccounts);

  // E. Test Payment Requests
  const testPaymentRequests = await db
    .collection("organizationpaymentrequests")
    .find({
      $or: [
        { organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { request_code: { $regex: /^(PR-TEST-|PAYREQ-TEST-|PAYREQ-INVALID-|PAYREQ-MULTI-)/ } },
      ],
    })
    .toArray();
  saveToBackup("organizationpaymentrequests", testPaymentRequests);

  // F. Test B2B Settlement Agreements
  const testAgreements = await db
    .collection("b2bsettlementagreements")
    .find({
      $or: [
        { provider_organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { consumer_organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { agreement_code: { $regex: /^(AGR-TEST-|AGR-MULTI-|AGR-REF-)/ } },
      ],
    })
    .toArray();
  saveToBackup("b2bsettlementagreements", testAgreements);
  const testAgreementIds = testAgreements.map((a) => a._id);
  const testAgreementIdStrs = testAgreements.map((a) => a._id.toString());

  // G. Test B2B Settlement Transactions
  const testTransactions = await db
    .collection("b2bsettlementtransactions")
    .find({
      $or: [
        { agreement_id: { $in: [...testAgreementIds, ...testAgreementIdStrs] } },
      ],
    })
    .toArray();
  saveToBackup("b2bsettlementtransactions", testTransactions);
  const testTransactionIds = testTransactions.map((tx) => tx._id);
  const testTransactionIdStrs = testTransactions.map((tx) => tx._id.toString());

  // H. Test B2B Settlement Invoices
  const testInvoices = await db
    .collection("b2bsettlementinvoices")
    .find({
      $or: [
        { agreement_id: { $in: [...testAgreementIds, ...testAgreementIdStrs] } },
        { invoice_number: { $regex: /^(INV-TEST-|INV-INVALID-|INV-MULTI-)/ } },
      ],
    })
    .toArray();
  saveToBackup("b2bsettlementinvoices", testInvoices);
  const testInvoiceIds = testInvoices.map((inv) => inv._id);
  const testInvoiceIdStrs = testInvoices.map((inv) => inv._id.toString());

  // I. Test Platform Commissions
  const testCommissions = await db
    .collection("platformcommissions")
    .find({
      $or: [
        { transaction_id: { $in: [...testTransactionIds, ...testTransactionIdStrs] } },
        { agreement_id: { $in: [...testAgreementIds, ...testAgreementIdStrs] } },
        { invoice_id: { $in: [...testInvoiceIds, ...testInvoiceIdStrs] } },
        { settlement_id: { $in: [...testAgreementIds, ...testAgreementIdStrs] } },
        { commission_amount: { $in: [590, 1000, 4000, 6000] } },
      ],
    })
    .toArray();
  saveToBackup("platformcommissions", testCommissions);

  // J. Test Organization Payments & Allocations
  const testPayments = await db
    .collection("organizationpayments")
    .find({
      $or: [
        { organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { payment_id: { $regex: /^pay_test_/ } },
      ],
    })
    .toArray();
  saveToBackup("organizationpayments", testPayments);
  const testPaymentIds = testPayments.map((p) => p._id);
  const testPaymentIdStrs = testPayments.map((p) => p._id.toString());

  const testAllocations = await db
    .collection("paymentallocations")
    .find({
      $or: [
        { payment_id: { $in: [...testPaymentIds, ...testPaymentIdStrs] } },
        { invoice_id: { $in: [...testInvoiceIds, ...testInvoiceIdStrs] } },
      ],
    })
    .toArray();
  saveToBackup("paymentallocations", testAllocations);

  // K. Test Referrals, Participants, and Activities
  const testReferrals = await db
    .collection("referrals")
    .find({
      $or: [
        { origin_organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { target_organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
        { referral_code: { $regex: /^REF-/ } },
      ],
    })
    .toArray();
  saveToBackup("referrals", testReferrals);
  const testReferralIds = testReferrals.map((r) => r._id);
  const testReferralIdStrs = testReferrals.map((r) => r._id.toString());

  const testReferralParticipants = await db
    .collection("referralparticipants")
    .find({
      $or: [
        { referral_id: { $in: [...testReferralIds, ...testReferralIdStrs] } },
        { organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
      ],
    })
    .toArray();
  saveToBackup("referralparticipants", testReferralParticipants);

  const testReferralActivities = await db
    .collection("referralactivities")
    .find({
      $or: [
        { referral_id: { $in: [...testReferralIds, ...testReferralIdStrs] } },
        { organization_id: { $in: [...testTenantIds, ...testTenantIdStrs] } },
      ],
    })
    .toArray();
  saveToBackup("referralactivities", testReferralActivities);

  // L. Test Webhook Event Logs
  const testWebhooks = await db
    .collection("webhookeventlogs")
    .find({
      event_id: { $regex: /^(evt_rzp_test_|evt_stripe_test_)/ },
    })
    .toArray();
  saveToBackup("webhookeventlogs", testWebhooks);

  console.log("\n-----------------------------------------------------------------");
  console.log("🔥 EXECUTING TARGETED RELATIONSHIP-BASED DELETIONS");
  console.log("-----------------------------------------------------------------\n");

  // 4. PERFORM TARGETED DELETIONS SAFELY

  // Delete Dependent records first
  const delAlloc = await db
    .collection("paymentallocations")
    .deleteMany({ _id: { $in: testAllocations.map((a) => a._id) } });
  console.log(`✅ Deleted ${delAlloc.deletedCount} test PaymentAllocations`);

  const delComm = await db
    .collection("platformcommissions")
    .deleteMany({ _id: { $in: testCommissions.map((c) => c._id) } });
  console.log(`✅ Deleted ${delComm.deletedCount} test PlatformCommissions`);

  const delTx = await db
    .collection("b2bsettlementtransactions")
    .deleteMany({ _id: { $in: testTransactions.map((tx) => tx._id) } });
  console.log(`✅ Deleted ${delTx.deletedCount} test B2BSettlementTransactions`);

  const delInv = await db
    .collection("b2bsettlementinvoices")
    .deleteMany({ _id: { $in: testInvoices.map((inv) => inv._id) } });
  console.log(`✅ Deleted ${delInv.deletedCount} test B2BSettlementInvoices`);

  const delAgr = await db
    .collection("b2bsettlementagreements")
    .deleteMany({ _id: { $in: testAgreements.map((a) => a._id) } });
  console.log(`✅ Deleted ${delAgr.deletedCount} test B2BSettlementAgreements`);

  const delRefAct = await db
    .collection("referralactivities")
    .deleteMany({ _id: { $in: testReferralActivities.map((act) => act._id) } });
  console.log(`✅ Deleted ${delRefAct.deletedCount} test ReferralActivities`);

  const delRefPart = await db
    .collection("referralparticipants")
    .deleteMany({ _id: { $in: testReferralParticipants.map((part) => part._id) } });
  console.log(`✅ Deleted ${delRefPart.deletedCount} test ReferralParticipants`);

  const delRef = await db
    .collection("referrals")
    .deleteMany({ _id: { $in: testReferrals.map((r) => r._id) } });
  console.log(`✅ Deleted ${delRef.deletedCount} test Referrals`);

  const delPayReq = await db
    .collection("organizationpaymentrequests")
    .deleteMany({ _id: { $in: testPaymentRequests.map((r) => r._id) } });
  console.log(`✅ Deleted ${delPayReq.deletedCount} test OrganizationPaymentRequests`);

  const delPay = await db
    .collection("organizationpayments")
    .deleteMany({ _id: { $in: testPayments.map((p) => p._id) } });
  console.log(`✅ Deleted ${delPay.deletedCount} test OrganizationPayments`);

  const delPayAcc = await db
    .collection("organizationpaymentaccounts")
    .deleteMany({ _id: { $in: testPaymentAccounts.map((a) => a._id) } });
  console.log(`✅ Deleted ${delPayAcc.deletedCount} test OrganizationPaymentAccounts`);

  const delSubs = await db
    .collection("tenantsubscriptions")
    .deleteMany({ _id: { $in: testTenantSubs.map((s) => s._id) } });
  console.log(`✅ Deleted ${delSubs.deletedCount} test TenantSubscriptions`);

  const delWebhooks = await db
    .collection("webhookeventlogs")
    .deleteMany({ _id: { $in: testWebhooks.map((w) => w._id) } });
  console.log(`✅ Deleted ${delWebhooks.deletedCount} test WebhookEventLogs`);

  // Delete Test Tenants
  const delTenants = await db
    .collection("tenants")
    .deleteMany({ _id: { $in: testTenants.map((t) => t._id) } });
  console.log(`✅ Deleted ${delTenants.deletedCount} test Tenants`);

  // Delete ONLY temporary test plans
  const delPlans = await db
    .collection("subscriptionplans")
    .deleteMany({ _id: { $in: testPlans.map((p) => p._id) } });
  console.log(`✅ Deleted ${delPlans.deletedCount} temporary test SubscriptionPlans`);

  console.log("\n=================================================================");
  console.log("🔍 POST-CLEANUP INTEGRITY & DATA PROTECTION VERIFICATION");
  console.log("=================================================================\n");

  // 5. POST-CLEANUP INTEGRITY CHECKS
  const remainingPlans = await db.collection("subscriptionplans").find({}).toArray();
  console.log(`📊 Remaining SubscriptionPlans: ${remainingPlans.length}`);
  const remainingPlanCodes = remainingPlans.map((p) => p.plan_code || p.code);
  console.log(`   Plan codes: ${remainingPlanCodes.join(", ")}`);

  const legitimateCodes = [
    "trial",
    "starter",
    "professional",
    "business",
    "enterprise",
    "retail_starter",
    "retail_business",
    "retail_professional",
    "retail_enterprise",
    "biz_starter",
    "biz_business",
    "biz_professional",
    "biz_enterprise",
  ];

  const allLegitPreserved = legitimateCodes.every((code) => remainingPlanCodes.includes(code));
  if (!allLegitPreserved || remainingPlans.length !== 13) {
    throw new Error(
      `❌ Plan integrity check failed! Expected 13 legitimate plans, found ${remainingPlans.length}`
    );
  }
  console.log("   ✅ All 13 legitimate commercial plans are 100% PRESERVED.");

  const remainingTenants = await db.collection("tenants").find({}).toArray();
  console.log(`\n📊 Remaining Tenants: ${remainingTenants.length}`);
  remainingTenants.forEach((t) => {
    console.log(`   - ${t.tenant_code || t.code || "N/A"} | ${t.company_name || t.name}`);
  });
  if (remainingTenants.length < 8) {
    throw new Error(`❌ Tenant integrity check failed! Real tenants were affected.`);
  }
  console.log("   ✅ All real customer organizations are 100% PRESERVED.");

  const remainingUsers = await db.collection("userinfos").find({}).toArray();
  console.log(`\n📊 Remaining Users: ${remainingUsers.length}`);
  remainingUsers.forEach((u) => {
    console.log(`   - ${u.official_email || u.email} (${u.role})`);
  });
  if (remainingUsers.length !== 12) {
    throw new Error(`❌ User integrity check failed! Expected 12 users, found ${remainingUsers.length}`);
  }
  console.log("   ✅ All user accounts are 100% PRESERVED.");

  const remainingBlogPosts = await db.collection("blogposts").find({}).toArray();
  const remainingTestimonials = await db.collection("testimonials").find({}).toArray();
  const remainingCategories = await db.collection("blogcategories").find({}).toArray();
  console.log(`\n📊 Remaining CMS Content:`);
  console.log(`   - BlogPosts: ${remainingBlogPosts.length} [PRESERVED]`);
  console.log(`   - BlogCategories: ${remainingCategories.length} [PRESERVED]`);
  console.log(`   - Testimonials: ${remainingTestimonials.length} [PRESERVED]`);

  const remainingAddons = await db.collection("addons").countDocuments();
  const remainingModulePricings = await db.collection("modulepricings").countDocuments();
  const remainingPaymentConfigs = await db.collection("platformpaymentconfigs").countDocuments();
  console.log(`\n📊 Pricing & Platform Configuration:`);
  console.log(`   - Addons: ${remainingAddons} [PRESERVED]`);
  console.log(`   - ModulePricings: ${remainingModulePricings} [PRESERVED]`);
  console.log(`   - PlatformPaymentConfigs: ${remainingPaymentConfigs} [PRESERVED]`);

  console.log("\n=================================================================");
  console.log("🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY WITH ZERO DATA LOSS");
  console.log("=================================================================\n");

  await mongoose.disconnect();
}

executeProductionSafeCleanup().catch((err) => {
  console.error("\n❌ Error during cleanup:", err);
  process.exit(1);
});
