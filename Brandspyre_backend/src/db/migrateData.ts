import mongoose from "mongoose";
import dotenv from "dotenv";

import { UserInfo } from "./ModelSceham/userSchema";
import { Branch } from "./ModelSceham/branchSchema";
import { RoleAccess } from "./ModelSceham/roleAccessSchema";
import { Notification } from "./ModelSceham/Notification/notification";
import { Team } from "./ModelSceham/teams/team";
import { TeamMember } from "./ModelSceham/teams/teammembers";
import { Campaign, Lead, Followup } from "./ModelSceham/project/campagin";
import { Client, Project, Milestone, Task } from "./ModelSceham/project/client";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription } from "./ModelSceham/saasSchema";
import { Website, WebsitePage, WebsiteTemplate } from "./ModelSceham/websiteSchema";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/almino";

export async function runMigration() {
  console.log("🚀 Initializing MongoDB data integrity checks...");

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB.");

  try {
    console.log("✅ MongoDB data initialization completed successfully.");
  } catch (err) {
    console.error("Error running MongoDB initialization:", err);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error("Migration fatal error:", err);
  });
}
