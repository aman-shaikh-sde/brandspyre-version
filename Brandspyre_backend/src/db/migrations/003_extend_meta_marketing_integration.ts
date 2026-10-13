import mongoose from "mongoose";
import {
  MetaIntegration,
  MetaOAuthState,
  MetaBusinessAccount,
  MetaAdAccount,
  MetaPage,
  MetaInstagramAccount,
  MetaWhatsAppAccount,
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaLeadForm,
  MetaLeadSyncLog
} from "../ModelSceham/metaIntegrationSchema";

/**
 * Migration 003: Extend Meta Marketing, Facebook, Instagram, WhatsApp & Lead Management
 * 
 * Ensures collections and multi-tenant indexes for:
 * - MetaOAuthState (TTL auto-expiration)
 * - MetaBusinessAccount
 * - MetaAdAccount
 * - MetaPage
 * - MetaInstagramAccount
 * - MetaWhatsAppAccount
 * - MetaCampaign
 * - MetaAdSet
 * - MetaAd
 */
export const up = async () => {
  console.log("Starting migration 003: Extend Meta Marketing Integration");

  try {
    const models = [
      { name: "MetaIntegration", model: MetaIntegration },
      { name: "MetaOAuthState", model: MetaOAuthState },
      { name: "MetaBusinessAccount", model: MetaBusinessAccount },
      { name: "MetaAdAccount", model: MetaAdAccount },
      { name: "MetaPage", model: MetaPage },
      { name: "MetaInstagramAccount", model: MetaInstagramAccount },
      { name: "MetaWhatsAppAccount", model: MetaWhatsAppAccount },
      { name: "MetaCampaign", model: MetaCampaign },
      { name: "MetaAdSet", model: MetaAdSet },
      { name: "MetaAd", model: MetaAd },
      { name: "MetaLeadForm", model: MetaLeadForm },
      { name: "MetaLeadSyncLog", model: MetaLeadSyncLog },
    ];

    for (const item of models) {
      console.log(`Ensuring indexes for ${item.name}...`);
      await item.model.createIndexes();
    }

    console.log("Migration 003 completed successfully");
  } catch (error) {
    console.error("Migration 003 failed:", error);
    throw error;
  }
};

export const down = async () => {
  console.log("Rolling back migration 003: Extend Meta Marketing Integration");
  // Index management only - data preserved
  console.log("Migration 003 rollback completed");
};

if (require.main === module) {
  const { ensureDatabaseExists } = require("../index");
  ensureDatabaseExists().then(async () => {
    try {
      await up();
      console.log("Migration 003 executed cleanly");
      process.exit(0);
    } catch (err) {
      console.error("Migration execution failed:", err);
      process.exit(1);
    }
  });
}
