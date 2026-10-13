import mongoose, { Schema, Document } from "mongoose";
import bcrypt from 'bcrypt';

export interface IUserInfo extends Document {
  staff_id?: string;
  branchcode?: string;
  role?: string;
  psn?: number;
  firstname?: string;
  lastname?: string;
  dob?: Date;
  gender?: string;
  marital?: string;
  bloodgroup?: string;
  phonenumber?: string;
  alternumber?: string;
  email?: string;
  password?: string;
  permantaddress?: string;
  presentaddress?: string;
  department?: string;
  desigantion?: string;
  profileurl?: string;
  dateofjoining?: Date;
  relivingdate?: Date;
  status?: string;
  notes?: string;
  create_datetime?: Date;
  last_update_datetime?: Date;
  // Multi-tenant SaaS field
  tenant_id?: mongoose.Types.ObjectId;
  // Security & Password Reset fields
  reset_password_token?: string;
  reset_password_expires?: Date;
  // Multi-Factor Authentication (Email OTP MFA)
  mfaEnabled?: boolean;
  mfaEmail?: string;
  mfaVerifiedAt?: Date;
  recentMfaAt?: Date;
}

const UserInfoSchema = new Schema<IUserInfo>({
  staff_id: { type: String },
  branchcode: { type: String },
  role: { type: String },
  psn: { type: Number, unique: true },
  firstname: { type: String },
  lastname: { type: String },
  dob: { type: Date },
  gender: { type: String },
  marital: { type: String },
  bloodgroup: { type: String },
  phonenumber: { type: String },
  alternumber: { type: String },
  email: { type: String, unique: true, trim: true, lowercase: true },
  password: { type: String },
  permantaddress: { type: String },
  presentaddress: { type: String },
  department: { type: String },
  desigantion: { type: String },
  profileurl: { type: String },
  dateofjoining: { type: Date },
  relivingdate: { type: Date },
  status: { type: String, default: 'active' },
  notes: { type: String },
  create_datetime: { type: Date, default: Date.now },
  last_update_datetime: { type: Date, default: Date.now },
  // Multi-tenant SaaS field
  tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  // Security & Password Reset fields
  reset_password_token: { type: String, index: true },
  reset_password_expires: { type: Date },
  // Multi-Factor Authentication (Email OTP MFA)
  mfaEnabled: { type: Boolean, default: false },
  mfaEmail: { type: String },
  mfaVerifiedAt: { type: Date },
  recentMfaAt: { type: Date }
});

// Add compound index for tenant isolation
UserInfoSchema.index({ tenant_id: 1, staff_id: 1 });

UserInfoSchema.pre('save', async function (next) {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  if (this.isNew && !this.psn) {
    try {
      const UserInfoModel = this.constructor as mongoose.Model<any>;
      const lastUser = await UserInfoModel.findOne({ psn: { $ne: null } })
        .sort({ psn: -1 })
        .exec();
      this.psn = lastUser && typeof lastUser.psn === 'number' ? lastUser.psn + 1 : 1;
    } catch (err) {
      return next(err as Error);
    }
  }
  next();
});

export const UserInfo = mongoose.models.UserInfo || mongoose.model<IUserInfo>('UserInfo', UserInfoSchema);

export const initializeUserInfo = async () => {
  try {
    // ============================================================
    // SECURITY: Default superadmin credentials MUST come from
    // environment variables. Never hardcode credentials in source.
    // ============================================================
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn(
        "⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment. " +
        "Skipping default superadmin initialization. " +
        "Set these variables to create an initial admin account."
      );
      console.log("UserInfo_Tables checked — no default admin seeded (env vars missing).");
      return;
    }

    // Check if default SuperAdmin already exists
    const existingUser = await UserInfo.findOne({ email: adminEmail.toLowerCase() });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const maxPsnUser = await UserInfo.findOne({ psn: { $exists: true, $ne: null } }).sort({ psn: -1 });
      const nextPsn = (maxPsnUser && typeof maxPsnUser.psn === 'number') ? maxPsnUser.psn + 1 : 1;

      await UserInfo.create({
        staff_id: "STAFF_001",
        psn: nextPsn,
        role: "superadmin",
        branchcode: process.env.SUPER_ADMIN_BRANCHCODE || "BRCODE_01",
        firstname: process.env.SUPER_ADMIN_FIRSTNAME || "Platform",
        lastname: process.env.SUPER_ADMIN_LASTNAME || "Admin",
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        status: "active"
      });

      console.log("✅ Default SuperAdmin account created from environment configuration.");
    } else {
      let updated = false;
      if (!existingUser.staff_id) {
        existingUser.staff_id = "STAFF_001";
        updated = true;
      }
      if (!existingUser.psn) {
        const maxPsnUser = await UserInfo.findOne({ psn: { $exists: true, $ne: null } }).sort({ psn: -1 });
        existingUser.psn = (maxPsnUser && typeof maxPsnUser.psn === 'number') ? maxPsnUser.psn + 1 : 1;
        updated = true;
      }

      // Ensure normalized email
      if (existingUser.email && existingUser.email !== existingUser.email.toLowerCase().trim()) {
        existingUser.email = existingUser.email.toLowerCase().trim();
        updated = true;
      }

      // If existing user has no password set at all, initialize from env
      if (!existingUser.password) {
        existingUser.password = await bcrypt.hash(adminPassword, 12);
        updated = true;
        console.log("✅ Initialized missing SuperAdmin password from environment configuration.");
      }

      if (updated) {
        await existingUser.save();
      } else {
        console.log("SuperAdmin already exists.");
      }
    }

    console.log("UserInfo_Tables checked/UserInfo successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Error initializing UserInfo_Tables Message: ${message}`)
    throw new Error(`Error initializing UserInfo_Tables Message: ${message}`)
  }
};

