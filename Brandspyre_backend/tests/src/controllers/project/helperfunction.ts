import mongoose from "mongoose";
import { Lead, Campaign, Followup } from "../../db/ModelSceham/project/campagin";
import { Project, Milestone, Task, ClientDocument, DraftDocument, FinalDocument, ProjectInvoice, ProjectPayreq, PaymentLog } from "../../db/ModelSceham/project/client";
import { Team } from "../../db/ModelSceham/teams/team";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import bcrypt from 'bcrypt';

const modelMap: Record<string, mongoose.Model<any>> = {
  'leads': Lead,
  'campaign': Campaign,
  'project': Project,
  'milestone': Milestone,
  'task': Task,
  'teams': Team,
  'project_invoice': ProjectInvoice,
  'project_payreq': ProjectPayreq,
  'payment_log': PaymentLog,
  'communication_documents': ClientDocument,
  'draft_documents': DraftDocument,
  'final_documents': FinalDocument,
  'client_documents': ClientDocument,
  'userinfo': UserInfo,
  'followup': Followup
};

const buildFilter = (whereClause: string, values: any[]): Record<string, any> => {
  const filter: Record<string, any> = {};
  const parts = whereClause.split(/\s+AND\s+/i);
  parts.forEach((part, index) => {
    const match = part.match(/([a-zA-Z0-9_-]+)\s*=/);
    if (match) {
      const colName = match[1];
      const val = values[index];
      // Map 'id' to '_id' for MongoDB ObjectId lookups
      if (colName === 'id' || colName === '_id') {
        if (mongoose.Types.ObjectId.isValid(val)) {
          filter._id = new mongoose.Types.ObjectId(val);
        } else {
          filter._id = val;
        }
      } else {
        filter[colName] = val;
      }
    }
  });
  return filter;
};

/**
 * Check if a document exists in a Mongoose model by filter.
 * Throws an error if not found.
 */
export const checkIfExistsMongo = async (
  Model: mongoose.Model<any>,
  filter: Record<string, any>,
  errorMessage: string
): Promise<void> => {
  const doc = await Model.findOne(filter).lean();
  if (!doc) {
    throw new Error(errorMessage);
  }
};

/**
 * Throws an error if found (i.e., duplicate check).
 * Skips check if all filter values are empty.
 */
export const checkIfNotExistsMongo = async (
  Model: mongoose.Model<any>,
  filter: Record<string, any>,
  errorMessage: string
): Promise<void> => {
  const values = Object.values(filter);
  if (
    values.length === 0 ||
    values.every((v) => v === null || v === undefined || v === "")
  ) {
    return;
  }

  const doc = await Model.findOne(filter).lean();
  if (doc) {
    throw new Error(errorMessage);
  }
};

/**
 * Sync campaign lead statistics from the leads collection.
 */
export const syncCampaignLeadData = async (
  campaign_code: string,
  errorMessage: string
): Promise<void> => {
  try {
    const totalLeads = await Lead.countDocuments({ campaign_code });
    const activeLeads = await Lead.countDocuments({
      campaign_code,
      status: { $nin: ['inactive', 'closed'] }
    });
    const approvedLeads = await Lead.countDocuments({
      campaign_code,
      status: 'approved'
    });

    const campaignDoc = await Campaign.findOne({ campaign_code }).lean() as any;
    const goalLead = parseInt(campaignDoc?.goallead || "0", 10);
    const conversationRate = goalLead > 0 ? (approvedLeads / goalLead) * 100 : 0;

    await Campaign.updateOne(
      { campaign_code },
      {
        $set: {
          lead: activeLeads,
          totallead: totalLeads,
          conversationrate: conversationRate,
          updated_on: new Date()
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${errorMessage} (campaign_code: ${campaign_code}) => ${message}`);
    throw new Error(`${errorMessage} (campaign_code: ${campaign_code}) => ${message}`);
  }
};

export const encryptPassword = async (password: string): Promise<string> => {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
};

export const checkIfExists = async (
  client: any,
  table: string,
  whereClause: string,
  values: any[],
  errorMessage: string
): Promise<void> => {
  const Model = modelMap[table.toLowerCase()];
  if (!Model) {
    throw new Error(`Table mapping not found for: ${table}`);
  }
  const filter = buildFilter(whereClause, values);
  const doc = await Model.findOne(filter).lean();
  if (!doc) {
    throw new Error(errorMessage);
  }
};

export const checkIfNotExists = async (
  client: any,
  table: string,
  whereClause: string,
  values: any[],
  errorMessage: string
): Promise<void> => {
  const Model = modelMap[table.toLowerCase()];
  if (!Model) {
    throw new Error(`Table mapping not found for: ${table}`);
  }
  const filter = buildFilter(whereClause, values);
  const doc = await Model.findOne(filter).lean();
  if (doc) {
    throw new Error(errorMessage);
  }
};