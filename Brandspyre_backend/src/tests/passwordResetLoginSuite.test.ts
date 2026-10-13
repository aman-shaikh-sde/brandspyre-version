import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
const realConsoleLog = console.log;
const realConsoleWarn = console.warn;
const realConsoleError = console.error;

import { connectDatabase } from "../db/index";
import { UserInfo } from "../db/ModelSceham/userSchema";
import { Tenant, UserTenant, TenantSubscription } from "../db/ModelSceham/saasSchema";
import { MfaChallenge } from "../db/ModelSceham/mfaChallengeSchema";
import { AuthService } from "../services/saas/AuthService";
import { MfaService } from "../services/saas/MfaService";
import { normalizeEmail } from "../utils/emailUtils";

export async function runPasswordResetLoginTests() {
  console.log = realConsoleLog;
  console.warn = realConsoleWarn;
  console.error = realConsoleError;

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  console.log("\n============================================================");
  console.log("🔐 STARTING BRANDSPYRE PASSWORD RESET & AUTHENTICATION SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName} ${detail ? `— ${detail}` : ""}`);
      failed++;
    }
  }

  const testSuffix = Date.now();
  const testEmailRaw = `TestAuth_${testSuffix}@BrandSpyre.com`;
  const normalizedTestEmail = normalizeEmail(testEmailRaw);
  const initialPassword = "InitialPassword2026!Secure";
  const newPassword = "BrandspyreNewPassword2026!";
  const wrongPassword = "WrongPassword999!";

  let testTenant: any = null;
  let testUser: any = null;

  try {
    // Setup test tenant and active subscription
    testTenant = await Tenant.create({
      name: `Test Org ${testSuffix}`,
      company_name: `Test Org ${testSuffix}`,
      subdomain: `testorg${testSuffix}`,
      email: normalizedTestEmail,
      status: "active"
    });

    const dummyPlanId = new mongoose.Types.ObjectId();
    await TenantSubscription.create({
      tenant_id: testTenant._id,
      plan_id: dummyPlanId,
      status: "active",
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      payment_status: "paid"
    });

    const hashedPassword = await bcrypt.hash(initialPassword, 12);
    testUser = await UserInfo.create({
      staff_id: `TEST_${testSuffix}`,
      firstname: "Test",
      lastname: "AuthUser",
      email: normalizedTestEmail,
      password: hashedPassword,
      role: "admin",
      status: "active",
      tenant_id: testTenant._id
    });

    await UserTenant.create({
      user_id: testUser._id,
      tenant_id: testTenant._id,
      role: "admin",
      status: "active"
    });

    // -------------------------------------------------------------
    // Test 1: Normal Login with Initial Password
    // -------------------------------------------------------------
    console.log("▶ [Test 1] Normal Login with initial password...");
    const login1 = await AuthService.login(normalizedTestEmail, initialPassword);
    assert(!!login1.tokens?.accessToken, "Login succeeds with original password and returns JWT");
    assert(login1.user.email === normalizedTestEmail, "User object returned matches normalized email");

    // -------------------------------------------------------------
    // Test 2: Request Forgot Password
    // -------------------------------------------------------------
    console.log("\n▶ [Test 2] Request Forgot Password...");
    const forgotRes = await AuthService.requestPasswordReset(testEmailRaw);
    assert(forgotRes.success === true, "Forgot password returns generic success message");
    assert(!("resetToken" in forgotRes), "Reset token is never leaked in API response");

    const userWithToken = await UserInfo.findById(testUser._id).select("+reset_password_token +reset_password_expires");
    assert(!!userWithToken?.reset_password_token, "Reset token hash is stored in database");
    assert(userWithToken?.reset_password_expires > new Date(), "Reset token expiry is set in the future");

    // -------------------------------------------------------------
    // Test 6: Invalid Reset Token Rejection
    // -------------------------------------------------------------
    console.log("\n▶ [Test 6] Invalid Reset Token Validation...");
    let invalidTokenFailed = false;
    try {
      await AuthService.resetPassword("completely_invalid_token_1234567890", newPassword);
    } catch (err: any) {
      invalidTokenFailed = true;
      assert(err.message.includes("Invalid or expired"), "Invalid reset token rejected with appropriate error");
    }
    assert(invalidTokenFailed, "Reset attempt with invalid token throws exception");

    // -------------------------------------------------------------
    // Test 7: Expired Reset Token Rejection
    // -------------------------------------------------------------
    console.log("\n▶ [Test 7] Expired Reset Token Validation...");
    const expiredToken = crypto.randomBytes(32).toString("hex");
    const expiredTokenHash = crypto.createHash("sha256").update(expiredToken).digest("hex");
    await UserInfo.updateOne(
      { _id: testUser._id },
      {
        $set: {
          reset_password_token: expiredTokenHash,
          reset_password_expires: new Date(Date.now() - 1000) // 1 second ago
        }
      }
    );

    let expiredTokenFailed = false;
    try {
      await AuthService.resetPassword(expiredToken, newPassword);
    } catch (err: any) {
      expiredTokenFailed = true;
      assert(err.message.includes("Invalid or expired"), "Expired reset token rejected");
    }
    assert(expiredTokenFailed, "Reset attempt with expired token throws exception");

    // -------------------------------------------------------------
    // Test 3: Password Reset Execution & Database Update
    // -------------------------------------------------------------
    console.log("\n▶ [Test 3] Password Reset Execution & Token Invalidation...");
    const validRawToken = crypto.randomBytes(32).toString("hex");
    const validTokenHash = crypto.createHash("sha256").update(validRawToken).digest("hex");
    await UserInfo.updateOne(
      { _id: testUser._id },
      {
        $set: {
          reset_password_token: validTokenHash,
          reset_password_expires: new Date(Date.now() + 60 * 60 * 1000)
        }
      }
    );

    const resetRes = await AuthService.resetPassword(validRawToken, newPassword);
    assert(resetRes.success === true, "Password reset executes successfully");

    const refreshedAfterReset = await UserInfo.findById(testUser._id).select("+password +reset_password_token");
    assert(!refreshedAfterReset?.reset_password_token, "Reset token is unset/invalidated in database after use");
    assert(await bcrypt.compare(newPassword, refreshedAfterReset!.password!), "Database password field is updated to new hash");

    // -------------------------------------------------------------
    // Test 4: Login With NEW Password
    // -------------------------------------------------------------
    console.log("\n▶ [Test 4] Login With NEW Password...");
    const loginNew = await AuthService.login(normalizedTestEmail, newPassword);
    assert(!!loginNew.tokens?.accessToken, "Login with NEW password succeeds");
    assert(loginNew.user.id === testUser._id.toString(), "Authenticated user ID matches");

    // -------------------------------------------------------------
    // Test 5: Login With OLD Password Fails
    // -------------------------------------------------------------
    console.log("\n▶ [Test 5] Login With OLD Password Fails...");
    let oldPasswordRejected = false;
    try {
      await AuthService.login(normalizedTestEmail, initialPassword);
    } catch (err: any) {
      oldPasswordRejected = true;
      assert(err.message === "Invalid email or password.", "Old password rejected with generic error");
    }
    assert(oldPasswordRejected, "Login with OLD password throws 401 error");

    // -------------------------------------------------------------
    // Test 8: MFA Enabled Flow After Password Reset
    // -------------------------------------------------------------
    console.log("\n▶ [Test 8] MFA Compatibility Check...");
    await UserInfo.updateOne(
      { _id: testUser._id },
      { $set: { mfaEnabled: true, mfaEmail: normalizedTestEmail } }
    );

    const mfaLoginRes = await AuthService.login(normalizedTestEmail, newPassword);
    assert(mfaLoginRes.mfaRequired === true, "Password verified and MFA challenge triggered");
    assert(!!mfaLoginRes.challengeId, "MFA challenge ID generated");

    // Complete MFA with challenge
    const challenge = await MfaChallenge.findOne({ challengeId: mfaLoginRes.challengeId });
    assert(!!challenge, "MFA Challenge found in storage");

    // -------------------------------------------------------------
    // Test 9: Case-Insensitive Email Lookup
    // -------------------------------------------------------------
    console.log("\n▶ [Test 9] Case-Insensitive Email Lookup...");
    // Temporarily disable MFA to test credential login
    await UserInfo.updateOne({ _id: testUser._id }, { $set: { mfaEnabled: false } });

    const loginMixed = await AuthService.login(`TestAUTH_${testSuffix}@BrandSPYRE.com`, newPassword);
    assert(!!loginMixed.tokens?.accessToken, "Mixed-case email successfully logs in with new password");

    const loginUpper = await AuthService.login(normalizedTestEmail.toUpperCase(), newPassword);
    assert(!!loginUpper.tokens?.accessToken, "Uppercase email successfully logs in with new password");

    const loginPadded = await AuthService.login(`  ${normalizedTestEmail}  `, newPassword);
    assert(!!loginPadded.tokens?.accessToken, "Whitespace-padded email successfully logs in with new password");

    // -------------------------------------------------------------
    // Test 10: Duplicate Email Protection
    // -------------------------------------------------------------
    console.log("\n▶ [Test 10] Duplicate Email Protection...");
    let duplicateRejected = false;
    try {
      await UserInfo.create({
        staff_id: `DUP_${testSuffix}`,
        firstname: "Duplicate",
        email: normalizedTestEmail.toUpperCase(), // Same email in uppercase
        password: "SomePassword123!"
      });
    } catch (dupErr: any) {
      duplicateRejected = true;
      assert(dupErr.code === 11000 || dupErr.name === "MongoServerError", "Duplicate email rejected by unique constraint");
    }
    assert(duplicateRejected, "Duplicate account creation with uppercase email is prevented");

  } finally {
    // Cleanup
    if (testUser?._id) {
      await UserInfo.deleteOne({ _id: testUser._id });
      await UserTenant.deleteMany({ user_id: testUser._id });
    }
    if (testTenant?._id) {
      await Tenant.deleteOne({ _id: testTenant._id });
      await TenantSubscription.deleteMany({ tenant_id: testTenant._id });
    }
  }

  console.log("\n============================================================");
  console.log(`🏁 SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPasswordResetLoginTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL SUITE ERROR:", err);
    process.exit(1);
  });
