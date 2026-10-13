import mongoose, { Schema, Document } from "mongoose";

export type MfaPurpose = "LOGIN_MFA" | "ENABLE_MFA" | "DISABLE_MFA" | "HIGH_RISK_ACTION" | "LOGIN_SETUP_MFA";

export interface IMfaChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: string;
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  maxAttempts: number;
  used: boolean;
  purpose: MfaPurpose;
  createdAt: Date;
  verifiedAt?: Date;
  requestIp?: string;
  userAgent?: string;
  resendCooldownUntil: Date;
  sendCount: number;
  loginContext?: {
    userId: string;
    role: string;
    branchcode: string;
    tenantId?: string;
    device?: string;
    ip?: string;
  };
}

const MfaChallengeSchema = new Schema<IMfaChallenge>({
  userId: { type: Schema.Types.ObjectId, ref: "UserInfo", required: true, index: true },
  challengeId: { type: String, required: true, unique: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attemptCount: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  used: { type: Boolean, default: false, index: true },
  purpose: {
    type: String,
    required: true,
    enum: ["LOGIN_MFA", "ENABLE_MFA", "DISABLE_MFA", "HIGH_RISK_ACTION", "LOGIN_SETUP_MFA"],
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  requestIp: { type: String },
  userAgent: { type: String },
  resendCooldownUntil: { type: Date, required: true },
  sendCount: { type: Number, default: 1 },
  loginContext: { type: Schema.Types.Mixed }
});

// Compound index for active challenges by user and purpose
MfaChallengeSchema.index({ userId: 1, purpose: 1, used: 1 });

// TTL index to automatically purge expired challenges from MongoDB
MfaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MfaChallenge =
  mongoose.models.MfaChallenge || mongoose.model<IMfaChallenge>("MfaChallenge", MfaChallengeSchema);

export default MfaChallenge;
