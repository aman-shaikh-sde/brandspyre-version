import mongoose, { Schema, Document } from "mongoose";
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  role_Access?: Record<string, any>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  role_Access: { type: Schema.Types.Mixed }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export const initializeTables = async () => {
  try {
    const count = await User.countDocuments();

    if (count === 0) {
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

      if (!adminPassword) {
        console.warn("⚠️  SUPER_ADMIN_PASSWORD not set. Skipping legacy User table admin seed.");
        console.log(" Tables checked/initialized successfully.");
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await User.create({
        name: 'Admin',
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        role_Access: { admin: true }
      });
      console.log("Admin user inserted.");
    }

    console.log(" Tables checked/initialized successfully.");
  } catch (err) {
    console.error("Error initializing tables:", err);
  }
};

