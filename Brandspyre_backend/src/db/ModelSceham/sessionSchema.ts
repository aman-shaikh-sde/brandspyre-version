import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  sessionId: string;
  userId: string;
  role: string;
  brcode?: string | null;
  tenantId?: string;
  membershipId?: string;
  isRevoked: boolean;
  lastSeen: Date;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true, default: "employee" },
    brcode: { type: String, default: null },
    tenantId: { type: String, index: true },
    membershipId: { type: String },
    isRevoked: { type: Boolean, default: false, index: true },
    lastSeen: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL index auto-cleans expired sessions
    userAgent: { type: String },
    ip: { type: String }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

SessionSchema.index({ sessionId: 1, isRevoked: 1 });
SessionSchema.index({ userId: 1, lastSeen: -1 });
SessionSchema.index({ userId: 1, isRevoked: 1 });

export const Session = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export const initializeSessionSchema = async (): Promise<void> => {
  try {
    await Session.init();
    console.log("Session schema with TTL index initialized.");
  } catch (err) {
    console.warn("Session schema init warning:", err);
  }
};
