import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

// Configure reliable DNS servers for MongoDB Atlas SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

dotenv.config();

if (process.env.SILENT_LOGGING === "true" || process.env.QUIET_LOGS === "true") {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

const rawMongoUri = process.env.MONGODB_URI;
if (process.env.NODE_ENV === "production" && !rawMongoUri) {
  throw new Error("FATAL: MONGODB_URI environment variable must be defined in production.");
}
const MONGODB_URI = rawMongoUri || "mongodb://localhost:27017/almino";

export const connectDatabase = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 to prevent Windows/ISP dual-stack DNS lookup failures
        retryWrites: true,
        retryReads: true
      });
      console.log("Connected to MongoDB successfully.");
      break;
    } catch (error) {
      if (attempt === retries) {
        console.error(" MongoDB connection error:", error);
        throw error;
      }
      console.log(` MongoDB connect attempt ${attempt} failed. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Drop legacy or invalid indexes and delete null role entries if any exist
  try {
    const db = mongoose.connection.db;
    if (db) {
      try {
        await db.collection("projectpayreqs").dropIndex("project_code_1_milestone_code_1");
      } catch (e) {}

      try {
        await db.collection("refreshtokens").dropIndex("token_1");
      } catch (e) {}

      try {
        // Remove invalid null roles that cause E11000 duplicate key error
        await db.collection("roles").deleteMany({ tenant_id: null, code: null });
        await db.collection("roles").deleteMany({ code: { $exists: false } });
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error(" MongoDB disconnect error:", error);
    throw error;
  }
};

export const ensureDatabaseExists = async () => {
  await connectDatabase();
  console.log(" ensureDatabaseExists: Database initialization check passed.");
};
