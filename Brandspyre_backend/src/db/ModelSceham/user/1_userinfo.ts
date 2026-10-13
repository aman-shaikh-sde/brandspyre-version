import { UserInfo } from "../userSchema";
import bcrypt from 'bcrypt'

// ============================================================
// SECURITY: SuperAdmin credentials MUST come from environment.
// NEVER hardcode passwords in source code.
// ============================================================

export const initializeUserInfo = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn(
        "⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. " +
        "Skipping legacy SuperAdmin initialization."
      );
      console.log("UserInfo_Tables checked/UserInfo successfully.");
      return;
    }

    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    // Check if default SuperAdmin already exists
    const existingUser = await UserInfo.findOne({ email: normalizedAdminEmail }).lean();

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await UserInfo.create({
        role: "superadmin",
        branchcode: process.env.SUPER_ADMIN_BRANCHCODE || "BRCODE_01",
        firstname: process.env.SUPER_ADMIN_FIRSTNAME || "Platform",
        lastname: process.env.SUPER_ADMIN_LASTNAME || "Admin",
        email: normalizedAdminEmail,
        password: hashedPassword,
        status: 'active'
      });

      console.log("Default SuperAdmin inserted.");
    } else {
      console.log("SuperAdmin already exists.");
    }

    console.log("UserInfo_Tables checked/UserInfo successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing UserInfo_Tables Message: ${message}`)
    throw new Error(`Error initializing UserInfo_Tables Message: ${message}`)
  }
};

