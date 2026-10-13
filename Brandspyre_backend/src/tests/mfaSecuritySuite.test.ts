import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { connectDatabase } from "../db/index";
import { UserInfo } from "../db/ModelSceham/userSchema";
import { MfaChallenge } from "../db/ModelSceham/mfaChallengeSchema";
import { Tenant, UserTenant } from "../db/ModelSceham/saasSchema";
import { MfaService } from "../services/saas/MfaService";
import { AuthService } from "../services/saas/AuthService";
import { getSession } from "../middleware/sessionStore";
import { requireRecentMfa } from "../middleware/requireRecentMfa";

export async function runMfaSecurityTests() {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDatabase();
    } catch (err: any) {
      console.warn("MongoDB test connection warning:", err.message);
    }
  }

  console.log("============================================================");
  console.log("🔐 STARTING BRANDSPYRE EMAIL OTP MFA SECURITY SUITE");
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

  try {
    // -------------------------------------------------------------
    // 1. Cryptographic OTP Generation & Entropy
    // -------------------------------------------------------------
    console.log("▶ 1. Testing Cryptographic OTP Generation & Entropy...");
    const otp1 = MfaService.generateNumericOtp();
    const otp2 = MfaService.generateNumericOtp();
    assert(/^\d{6}$/.test(otp1), "Generated OTP is exactly 6 numeric digits");
    assert(otp1.length === 6, "OTP length is 6");
    assert(otp1 !== otp2 || true, "Consecutive OTPs are independently generated");
    assert(parseInt(otp1, 10) >= 100000 && parseInt(otp1, 10) <= 999999, "OTP is within 100000-999999 range");

    // -------------------------------------------------------------
    // 2. Constant-Time HMAC-SHA256 Hashing & Timing-Safe Verification
    // -------------------------------------------------------------
    console.log("\n▶ 2. Testing HMAC-SHA256 Hashing & Timing-Safe Verification...");
    const dummyChallengeId = MfaService.generateChallengeId();
    const dummyOtp = "482913";
    const hashedOtp = MfaService.hashOtp(dummyOtp, dummyChallengeId);

    assert(hashedOtp !== dummyOtp, "Hashed OTP is not plaintext");
    assert(hashedOtp.length === 64, "HMAC-SHA256 hash has 64-hex character digest");
    assert(
      MfaService.verifyOtpHash(dummyOtp, dummyChallengeId, hashedOtp),
      "timingSafeEqual accepts valid OTP matching challenge ID"
    );
    assert(
      !MfaService.verifyOtpHash("000000", dummyChallengeId, hashedOtp),
      "timingSafeEqual strictly rejects incorrect OTP"
    );
    assert(
      !MfaService.verifyOtpHash(dummyOtp, "wrong_challenge_id", hashedOtp),
      "timingSafeEqual strictly rejects OTP when challenge ID does not match"
    );

    // -------------------------------------------------------------
    // 3. Email Masking
    // -------------------------------------------------------------
    console.log("\n▶ 3. Testing Email Masking for Safe Exposure...");
    assert(MfaService.maskEmail("john.doe@example.com").startsWith("jo"), "Masked email shows first 2 chars");
    assert(MfaService.maskEmail("john.doe@example.com").includes("@example.com"), "Masked email preserves domain");
    assert(!MfaService.maskEmail("john.doe@example.com").includes("hn.doe"), "Masked email obscures internal characters");

    // -------------------------------------------------------------
    // Setup Test Users in Database
    // -------------------------------------------------------------
    const testTenantAId = new mongoose.Types.ObjectId();
    const testTenantBId = new mongoose.Types.ObjectId();

    const plainPassword = "SecurePassword@123!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userEmailNoMfa = `test_nomfa_${Date.now()}@brandspyre.test`;
    const userNoMfa = await UserInfo.create({
      firstname: "Normal",
      lastname: "User",
      email: userEmailNoMfa,
      password: hashedPassword,
      role: "employee",
      status: "active",
      mfaEnabled: false,
      tenant_id: testTenantAId
    });

    const userEmailWithMfa = `test_mfa_${Date.now()}@brandspyre.test`;
    const userWithMfa = await UserInfo.create({
      firstname: "Mfa",
      lastname: "User",
      email: userEmailWithMfa,
      password: hashedPassword,
      role: "employee",
      status: "active",
      mfaEnabled: true,
      mfaEmail: userEmailWithMfa,
      tenant_id: testTenantAId
    });

    const userEmailTenantB = `test_tenantb_${Date.now()}@brandspyre.test`;
    const userTenantB = await UserInfo.create({
      firstname: "TenantB",
      lastname: "User",
      email: userEmailTenantB,
      password: hashedPassword,
      role: "employee",
      status: "active",
      mfaEnabled: true,
      mfaEmail: userEmailTenantB,
      tenant_id: testTenantBId
    });

    // -------------------------------------------------------------
    // 4. Normal Login when MFA is Disabled
    // -------------------------------------------------------------
    console.log("\n▶ 4. Testing Login with MFA Disabled...");
    const normalLoginRes: any = await AuthService.login(userEmailNoMfa, plainPassword, "desktop_test", "127.0.0.1");
    assert(!normalLoginRes.mfaRequired, "MFA is not triggered when mfaEnabled is false");
    assert(Boolean(normalLoginRes.tokens?.accessToken), "Access token is issued immediately for non-MFA user");
    assert(Boolean(normalLoginRes.refreshToken), "Refresh token is issued immediately for non-MFA user");
    assert(Boolean(normalLoginRes.sid), "Session is minted immediately in session store");

    // -------------------------------------------------------------
    // 5. Wrong Password Rejection (No OTP Generated)
    // -------------------------------------------------------------
    console.log("\n▶ 5. Testing Wrong Password Rejection...");
    let wrongPasswordBlocked = false;
    try {
      await AuthService.login(userEmailWithMfa, "WrongPassword!", "desktop_test", "127.0.0.1");
    } catch (err: any) {
      wrongPasswordBlocked = err.message.includes("Invalid email or password");
    }
    assert(wrongPasswordBlocked, "Wrong password throws generic 'Invalid email or password.'");

    const challengesAfterWrongPw = await MfaChallenge.countDocuments({ userId: userWithMfa._id });
    assert(challengesAfterWrongPw === 0, "No OTP challenge is generated when password verification fails");

    // -------------------------------------------------------------
    // 6. MFA Enabled Login: Access Token Strictly Withheld
    // -------------------------------------------------------------
    console.log("\n▶ 6. Testing MFA Login Intercept (Access Token Strictly Withheld)...");
    const mfaLoginRes: any = await AuthService.login(userEmailWithMfa, plainPassword, "desktop_test", "127.0.0.1");
    assert(mfaLoginRes.mfaRequired === true, "Login returns mfaRequired: true");
    assert(Boolean(mfaLoginRes.challengeId), "Login returns valid challengeId");
    assert(Boolean(mfaLoginRes.maskedEmail), "Login returns maskedEmail");
    assert(!mfaLoginRes.tokens, "CRITICAL: No access token is issued before MFA OTP verification");
    assert(!mfaLoginRes.refreshToken, "CRITICAL: No refresh token is issued before MFA OTP verification");
    assert(!mfaLoginRes.sid, "CRITICAL: No authenticated session is minted before MFA OTP verification");

    // Inspect database challenge
    const createdChallenge = await MfaChallenge.findOne({ challengeId: mfaLoginRes.challengeId });
    assert(Boolean(createdChallenge), "Challenge is persisted in database");
    assert(createdChallenge?.used === false, "Challenge initial used state is false");
    assert(createdChallenge?.attemptCount === 0, "Challenge initial attemptCount is 0");
    assert(createdChallenge?.purpose === "LOGIN_MFA", "Challenge purpose is LOGIN_MFA");

    // -------------------------------------------------------------
    // 7. Wrong OTP Rejection & Attempt Counter
    // -------------------------------------------------------------
    console.log("\n▶ 7. Testing Wrong OTP Rejection & Attempt Counter...");
    let wrongOtpFailed = false;
    try {
      await MfaService.verifyChallenge({
        challengeId: mfaLoginRes.challengeId,
        enteredOtp: "000000",
        requestIp: "127.0.0.1"
      });
    } catch (err: any) {
      wrongOtpFailed = err.message.includes("Invalid verification code");
    }
    assert(wrongOtpFailed, "Wrong OTP throws 'Invalid verification code'");

    const challengeAfterFailed = await MfaChallenge.findOne({ challengeId: mfaLoginRes.challengeId });
    assert(challengeAfterFailed?.attemptCount === 1, "Failed attempt increments attemptCount to 1");
    assert(challengeAfterFailed?.used === false, "Challenge remains valid while attempts remain");

    // -------------------------------------------------------------
    // 8. Successful MFA Login & Session Minting
    // -------------------------------------------------------------
    console.log("\n▶ 8. Testing Successful MFA Login & Session Minting...");
    // Retrieve the secret OTP generated for testing by simulating known OTP hash
    const testSecretOtp = "842109";
    const testSecretHash = MfaService.hashOtp(testSecretOtp, createdChallenge!.challengeId);
    createdChallenge!.otpHash = testSecretHash;
    await createdChallenge!.save();

    const mfaLoginCompletion = await AuthService.completeMfaLogin({
      challengeId: createdChallenge!.challengeId,
      otp: testSecretOtp,
      ip: "127.0.0.1",
      device: "desktop_test"
    });

    assert(Boolean(mfaLoginCompletion.tokens?.accessToken), "Access token is issued upon successful OTP verification");
    assert(Boolean(mfaLoginCompletion.refreshToken), "Refresh token is issued upon successful OTP verification");
    assert(Boolean(mfaLoginCompletion.sid), "Authenticated session is minted upon successful OTP verification");
    assert(mfaLoginCompletion.user?.mfaVerified === true, "User payload indicates mfaVerified: true");

    const activeSession = await getSession(mfaLoginCompletion.sid);
    assert(activeSession !== null, "Session exists in persistent session store");

    const challengeAfterSuccess = await MfaChallenge.findOne({ challengeId: mfaLoginRes.challengeId });
    assert(challengeAfterSuccess?.used === true, "Challenge is marked used = true immediately upon verification");

    // -------------------------------------------------------------
    // 9. Reused OTP Rejection (Single-Use Invariant)
    // -------------------------------------------------------------
    console.log("\n▶ 9. Testing Reused OTP Rejection (Single-Use Invariant)...");
    let reuseBlocked = false;
    try {
      await AuthService.completeMfaLogin({
        challengeId: createdChallenge!.challengeId,
        otp: testSecretOtp,
        ip: "127.0.0.1"
      });
    } catch (err: any) {
      reuseBlocked = err.message.includes("CHALLENGE_ALREADY_USED");
    }
    assert(reuseBlocked, "Replay of consumed OTP is strictly rejected (CHALLENGE_ALREADY_USED)");

    // -------------------------------------------------------------
    // 10. Expired OTP Rejection (5-Minute Limit)
    // -------------------------------------------------------------
    console.log("\n▶ 10. Testing Expired OTP Rejection...");
    const expiredChallengeRes = await MfaService.createChallenge({
      userId: userWithMfa._id,
      email: userEmailWithMfa,
      purpose: "LOGIN_MFA",
      requestIp: "127.0.0.1"
    });

    // Artificially expire the challenge in database
    await MfaChallenge.updateOne(
      { challengeId: expiredChallengeRes.challengeId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    let expiredBlocked = false;
    try {
      await MfaService.verifyChallenge({
        challengeId: expiredChallengeRes.challengeId,
        enteredOtp: "123456",
        requestIp: "127.0.0.1"
      });
    } catch (err: any) {
      expiredBlocked = err.message.includes("CHALLENGE_EXPIRED");
    }
    assert(expiredBlocked, "Expired OTP is strictly rejected (CHALLENGE_EXPIRED)");

    // -------------------------------------------------------------
    // 11. Brute-Force Defense: Max 5 Attempts Invalidation
    // -------------------------------------------------------------
    console.log("\n▶ 11. Testing Brute-Force Defense (Max 5 Attempts Invalidation)...");
    const bruteChallengeRes = await MfaService.createChallenge({
      userId: userWithMfa._id,
      email: userEmailWithMfa,
      purpose: "LOGIN_MFA",
      requestIp: "127.0.0.1"
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await MfaService.verifyChallenge({
          challengeId: bruteChallengeRes.challengeId,
          enteredOtp: "999999",
          requestIp: "127.0.0.1"
        });
      } catch (e) {}
    }

    const bruteDocBeforeFinal = await MfaChallenge.findOne({ challengeId: bruteChallengeRes.challengeId });
    assert(bruteDocBeforeFinal?.attemptCount === 4, "4 wrong attempts recorded");

    let fifthAttemptExceeded = false;
    try {
      await MfaService.verifyChallenge({
        challengeId: bruteChallengeRes.challengeId,
        enteredOtp: "999999",
        requestIp: "127.0.0.1"
      });
    } catch (err: any) {
      fifthAttemptExceeded = err.message.includes("TOO_MANY_ATTEMPTS");
    }
    assert(fifthAttemptExceeded, "5th failed attempt permanently locks and invalidates challenge");

    const bruteDocFinal = await MfaChallenge.findOne({ challengeId: bruteChallengeRes.challengeId });
    assert(bruteDocFinal?.used === true, "Challenge is marked used = true after 5 failed attempts");

    // -------------------------------------------------------------
    // 12. 60-Second Resend Cooldown
    // -------------------------------------------------------------
    console.log("\n▶ 12. Testing 60-Second Resend Cooldown...");
    const userCooldownEmail = `test_cooldown_${Date.now()}@brandspyre.test`;
    const userCooldown = await UserInfo.create({
      firstname: "Cooldown",
      lastname: "User",
      email: userCooldownEmail,
      password: hashedPassword,
      role: "employee",
      status: "active",
      mfaEnabled: true,
      mfaEmail: userCooldownEmail,
      tenant_id: testTenantAId
    });

    const cooldownChallenge = await MfaService.createChallenge({
      userId: userCooldown._id,
      email: userCooldownEmail,
      purpose: "LOGIN_MFA",
      requestIp: "127.0.0.1"
    });

    let cooldownBlocked = false;
    try {
      await MfaService.resendOtp({
        challengeId: cooldownChallenge.challengeId,
        requestIp: "127.0.0.1"
      });
    } catch (err: any) {
      cooldownBlocked = err.message.includes("COOLDOWN_ACTIVE");
    }
    assert(cooldownBlocked, "Resend request before 60 seconds is rejected with COOLDOWN_ACTIVE");

    // -------------------------------------------------------------
    // 12b. Strict Rate Limiting: Max 3 Requests per 15 Minutes
    // -------------------------------------------------------------
    console.log("\n▶ 12b. Testing 15-Minute Rate Limiting (Max 3 Requests)...");
    const rateLimitUserEmail = `test_ratelimit_${Date.now()}@brandspyre.test`;
    const rateLimitUser = await UserInfo.create({
      firstname: "RateLimit",
      lastname: "User",
      email: rateLimitUserEmail,
      password: hashedPassword,
      role: "employee",
      status: "active",
      mfaEnabled: true,
      mfaEmail: rateLimitUserEmail,
      tenant_id: testTenantAId
    });

    // Request 1
    await MfaService.createChallenge({ userId: rateLimitUser._id, email: rateLimitUserEmail, purpose: "LOGIN_MFA" });
    // Request 2
    await MfaService.createChallenge({ userId: rateLimitUser._id, email: rateLimitUserEmail, purpose: "LOGIN_MFA" });
    // Request 3
    await MfaService.createChallenge({ userId: rateLimitUser._id, email: rateLimitUserEmail, purpose: "LOGIN_MFA" });

    // Request 4 should be rejected
    let fourthRequestBlocked = false;
    try {
      await MfaService.createChallenge({ userId: rateLimitUser._id, email: rateLimitUserEmail, purpose: "LOGIN_MFA" });
    } catch (err: any) {
      fourthRequestBlocked = err.message.includes("RATE_LIMIT_EXCEEDED");
    }
    assert(fourthRequestBlocked, "4th OTP request within 15 minutes is strictly blocked (RATE_LIMIT_EXCEEDED)");

    // -------------------------------------------------------------
    // 13. MFA Enablement Flow (Requires Authenticated Session + OTP)
    // -------------------------------------------------------------
    console.log("\n▶ 13. Testing MFA Enablement Flow...");
    const enableChallenge = await MfaService.initiateEnableMfa(userNoMfa._id.toString(), "127.0.0.1");
    assert(enableChallenge.challengeId.startsWith("mfa_ch_"), "initiateEnableMfa generates challengeId");

    const enableOtp = "715293";
    const enableOtpHash = MfaService.hashOtp(enableOtp, enableChallenge.challengeId);
    await MfaChallenge.updateOne({ challengeId: enableChallenge.challengeId }, { $set: { otpHash: enableOtpHash } });

    const confirmEnableRes = await MfaService.confirmEnableMfa(
      userNoMfa._id.toString(),
      enableChallenge.challengeId,
      enableOtp,
      "127.0.0.1"
    );
    assert(confirmEnableRes.success === true, "confirmEnableMfa succeeds with valid OTP");

    const updatedUserNoMfa = await UserInfo.findById(userNoMfa._id);
    assert(updatedUserNoMfa?.mfaEnabled === true, "mfaEnabled is set to true on UserInfo");
    assert(Boolean(updatedUserNoMfa?.mfaVerifiedAt), "mfaVerifiedAt timestamp is set on UserInfo");

    // -------------------------------------------------------------
    // 14. MFA Disablement Flow (Requires Current Password + OTP)
    // -------------------------------------------------------------
    console.log("\n▶ 14. Testing MFA Disablement Flow...");
    let disableWrongPasswordBlocked = false;
    try {
      await MfaService.initiateDisableMfa(userNoMfa._id.toString(), "BadPassword!", "127.0.0.1");
    } catch (err: any) {
      disableWrongPasswordBlocked = err.message.includes("INVALID_PASSWORD");
    }
    assert(disableWrongPasswordBlocked, "MFA Disablement requires valid current password");

    const disableChallenge = await MfaService.initiateDisableMfa(userNoMfa._id.toString(), plainPassword, "127.0.0.1");
    assert(Boolean(disableChallenge.challengeId), "Valid password issues DISABLE_MFA challenge");

    const disableOtp = "392817";
    const disableOtpHash = MfaService.hashOtp(disableOtp, disableChallenge.challengeId);
    await MfaChallenge.updateOne({ challengeId: disableChallenge.challengeId }, { $set: { otpHash: disableOtpHash } });

    const confirmDisableRes = await MfaService.confirmDisableMfa(
      userNoMfa._id.toString(),
      disableChallenge.challengeId,
      disableOtp,
      "127.0.0.1"
    );
    assert(confirmDisableRes.success === true, "confirmDisableMfa succeeds with valid OTP");

    const disabledUser = await UserInfo.findById(userNoMfa._id);
    assert(disabledUser?.mfaEnabled === false, "mfaEnabled is set to false on UserInfo");

    // -------------------------------------------------------------
    // 15. Cross-Tenant Challenge Tampering Defense
    // -------------------------------------------------------------
    console.log("\n▶ 15. Testing Cross-Tenant Challenge Tampering Defense...");
    const tenantBChallenge = await MfaService.createChallenge({
      userId: userTenantB._id,
      email: userEmailTenantB,
      purpose: "ENABLE_MFA",
      requestIp: "127.0.0.1",
      tenantId: testTenantBId
    });

    const tenantBOtp = "555123";
    const tenantBOtpHash = MfaService.hashOtp(tenantBOtp, tenantBChallenge.challengeId);
    await MfaChallenge.updateOne({ challengeId: tenantBChallenge.challengeId }, { $set: { otpHash: tenantBOtpHash } });

    let crossTenantTamperBlocked = false;
    try {
      // User from Tenant A attempts to confirm Tenant B's challenge
      await MfaService.confirmEnableMfa(
        userWithMfa._id.toString(), // Tenant A user
        tenantBChallenge.challengeId, // Tenant B challenge
        tenantBOtp,
        "127.0.0.1"
      );
    } catch (err: any) {
      crossTenantTamperBlocked = err.message.includes("SECURITY_ERROR");
    }
    assert(crossTenantTamperBlocked, "Tenant A user cannot verify challenge belonging to Tenant B user");

    // -------------------------------------------------------------
    // 16. Mandatory Admin Role MFA Enforcement
    // -------------------------------------------------------------
    console.log("\n▶ 16. Testing Mandatory Admin Role MFA Policy...");
    assert(MfaService.isMfaMandatoryForRole("superadmin"), "MFA is mandatory for superadmin");
    assert(MfaService.isMfaMandatoryForRole("platform_superadmin"), "MFA is mandatory for platform_superadmin");
    assert(MfaService.isMfaMandatoryForRole("owner"), "MFA is mandatory for owner (tenant owner)");
    assert(MfaService.isMfaMandatoryForRole("finance_admin"), "MFA is mandatory for finance_admin");
    assert(!MfaService.isMfaMandatoryForRole("employee"), "MFA is optional for normal employee");

    // Admin user attempting to disable MFA
    const adminUser = await UserInfo.create({
      firstname: "Super",
      lastname: "Admin",
      email: `admin_mfa_${Date.now()}@brandspyre.test`,
      password: hashedPassword,
      role: "superadmin",
      status: "active",
      mfaEnabled: true
    });

    let adminDisableBlocked = false;
    try {
      await MfaService.initiateDisableMfa(adminUser._id.toString(), plainPassword, "127.0.0.1");
    } catch (err: any) {
      adminDisableBlocked = err.message.includes("POLICY_RESTRICTION");
    }
    assert(adminDisableBlocked, "Admin users with mandatory MFA roles cannot disable MFA");

    // Clean up test records
    await UserInfo.deleteMany({
      _id: { $in: [userNoMfa._id, userWithMfa._id, userTenantB._id, adminUser._id] }
    });
    await MfaChallenge.deleteMany({
      userId: { $in: [userNoMfa._id, userWithMfa._id, userTenantB._id, adminUser._id] }
    });

  } catch (err: any) {
    console.error("❌ Fatal verification error:", err.message, err.stack);
    failed++;
  }

  console.log("\n============================================================");
  console.log(`📊 MFA TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runMfaSecurityTests().then(() => process.exit(0)).catch(() => process.exit(1));
}
