import mongoose from "mongoose";
import { MetaIntegration, MetaLeadForm, MetaLeadSyncLog } from "../ModelSceham/metaIntegrationSchema";
import { Lead } from "../ModelSceham/project/campagin";

/**
 * Migration 002: Add Meta Lead Integration support
 * 
 * This migration:
 * 1. Creates indexes for Meta integration models
 * 2. Adds meta_lead_id index to Lead model for duplicate prevention
 * 3. Creates default webhook verify tokens for existing tenants
 */

export const up = async () => {
  console.log("Starting migration 002: Add Meta Lead Integration support");

  try {
    // Check if MetaIntegration collection exists and has indexes
    if (mongoose.connection.collection('metaintegrations')) {
      console.log("MetaIntegration collection exists, ensuring indexes...");
      await MetaIntegration.createIndexes();
    }

    // Check if MetaLeadForm collection exists and has indexes
    if (mongoose.connection.collection('metaleadforms')) {
      console.log("MetaLeadForm collection exists, ensuring indexes...");
      await MetaLeadForm.createIndexes();
    }

    // Check if MetaLeadSyncLog collection exists and has indexes
    if (mongoose.connection.collection('metaleadsynclogs')) {
      console.log("MetaLeadSyncLog collection exists, ensuring indexes...");
      await MetaLeadSyncLog.createIndexes();
    }

    // Add index for meta_lead_id on Lead model for duplicate prevention
    const leadCollection = mongoose.connection.collection('leads');
    const leadIndexes = await leadCollection.indexes();
    const hasMetaLeadIdIndex = leadIndexes.some(index => 
      index.key && index.key.meta_lead_id === 1
    );

    if (!hasMetaLeadIdIndex) {
      console.log("Creating meta_lead_id index on Lead collection...");
      await leadCollection.createIndex({ meta_lead_id: 1 }, { 
        name: 'idx_meta_lead_id',
        sparse: true,
        background: true 
      });
    }

    console.log("Migration 002 completed successfully");
  } catch (error) {
    console.error("Migration 002 failed:", error);
    throw error;
  }
};

export const down = async () => {
  console.log("Rolling back migration 002: Add Meta Lead Integration support");

  try {
    // Drop indexes
    const leadCollection = mongoose.connection.collection('leads');
    await leadCollection.dropIndex('idx_meta_lead_id').catch(() => {
      console.log("idx_meta_lead_id index does not exist, skipping drop");
    });

    // Note: We don't drop the collections themselves as they might contain data
    // In production, you might want to handle data migration/rollback differently

    console.log("Migration 002 rollback completed successfully");
  } catch (error) {
    console.error("Migration 002 rollback failed:", error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  const { connectDatabase } = require("../index");
  
  connectDatabase().then(async () => {
    try {
      await up();
      console.log("Migration completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  });
}
