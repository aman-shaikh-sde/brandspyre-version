import { Request, Response } from "express";
import { MasterDataModel } from "../db/ModelSceham/masterDataSchema";

const DEFAULT_MASTERS = [
  // Priorities
  { category: "priority", key: "low", label: "Low", badgeColor: "gray", sortOrder: 1, isSystem: true },
  { category: "priority", key: "medium", label: "Medium", badgeColor: "blue", sortOrder: 2, isSystem: true },
  { category: "priority", key: "high", label: "High", badgeColor: "orange", sortOrder: 3, isSystem: true },
  { category: "priority", key: "critical", label: "Critical", badgeColor: "red", sortOrder: 4, isSystem: true },

  // Lead Sources
  { category: "lead_source", key: "social_media", label: "Social Media", badgeColor: "purple", sortOrder: 1, isSystem: true },
  { category: "lead_source", key: "website", label: "Website Inquiry", badgeColor: "blue", sortOrder: 2, isSystem: true },
  { category: "lead_source", key: "referral", label: "Client Referral", badgeColor: "green", sortOrder: 3, isSystem: true },
  { category: "lead_source", key: "direct", label: "Direct Outreach", badgeColor: "cyan", sortOrder: 4, isSystem: true },
  { category: "lead_source", key: "campaign", label: "Marketing Campaign", badgeColor: "indigo", sortOrder: 5, isSystem: true },

  // Lead Statuses
  { category: "lead_status", key: "new", label: "New", badgeColor: "blue", sortOrder: 1, isSystem: true },
  { category: "lead_status", key: "contacted", label: "Contacted", badgeColor: "yellow", sortOrder: 2, isSystem: true },
  { category: "lead_status", key: "qualified", label: "Qualified", badgeColor: "purple", sortOrder: 3, isSystem: true },
  { category: "lead_status", key: "proposal_sent", label: "Proposal Sent", badgeColor: "indigo", sortOrder: 4, isSystem: true },
  { category: "lead_status", key: "won", label: "Won", badgeColor: "green", sortOrder: 5, isSystem: true },
  { category: "lead_status", key: "lost", label: "Lost", badgeColor: "red", sortOrder: 6, isSystem: true },

  // Task Statuses
  { category: "task_status", key: "pending", label: "Pending", badgeColor: "gray", sortOrder: 1, isSystem: true },
  { category: "task_status", key: "in_progress", label: "In Progress", badgeColor: "blue", sortOrder: 2, isSystem: true },
  { category: "task_status", key: "on_hold", label: "On Hold", badgeColor: "yellow", sortOrder: 3, isSystem: true },
  { category: "task_status", key: "completed", label: "Completed", badgeColor: "green", sortOrder: 4, isSystem: true },
  { category: "task_status", key: "cancelled", label: "Cancelled", badgeColor: "red", sortOrder: 5, isSystem: true },

  // Project Statuses
  { category: "project_status", key: "draft", label: "Draft", badgeColor: "gray", sortOrder: 1, isSystem: true },
  { category: "project_status", key: "ongoing", label: "Ongoing", badgeColor: "yellow", sortOrder: 2, isSystem: true },
  { category: "project_status", key: "in_review", label: "In Review", badgeColor: "purple", sortOrder: 3, isSystem: true },
  { category: "project_status", key: "verified", label: "Verified", badgeColor: "blue", sortOrder: 4, isSystem: true },
  { category: "project_status", key: "completed", label: "Completed", badgeColor: "green", sortOrder: 5, isSystem: true },

  // Invoice / Payment Statuses
  { category: "invoice_status", key: "request", label: "Request", badgeColor: "yellow", sortOrder: 1, isSystem: true },
  { category: "invoice_status", key: "raised", label: "Raised / Sent", badgeColor: "blue", sortOrder: 2, isSystem: true },
  { category: "invoice_status", key: "partially_paid", label: "Partially Paid", badgeColor: "purple", sortOrder: 3, isSystem: true },
  { category: "invoice_status", key: "paid", label: "Paid", badgeColor: "green", sortOrder: 4, isSystem: true },
  { category: "invoice_status", key: "cancelled", label: "Cancelled", badgeColor: "red", sortOrder: 5, isSystem: true },

  // Tax Types
  { category: "tax_type", key: "exclusive", label: "Exclusive (Tax added on top)", badgeColor: "blue", sortOrder: 1, isSystem: true },
  { category: "tax_type", key: "inclusive", label: "Inclusive (Tax included in amount)", badgeColor: "purple", sortOrder: 2, isSystem: true },
  { category: "tax_type", key: "exempt", label: "Exempt (No Tax)", badgeColor: "gray", sortOrder: 3, isSystem: true },

  // Payment Methods
  { category: "payment_method", key: "bank_transfer", label: "Bank Transfer (NEFT/RTGS)", badgeColor: "blue", sortOrder: 1, isSystem: true },
  { category: "payment_method", key: "upi", label: "UPI", badgeColor: "purple", sortOrder: 2, isSystem: true },
  { category: "payment_method", key: "credit_card", label: "Credit Card", badgeColor: "indigo", sortOrder: 3, isSystem: true },
  // Project Types (Industry Independent)
  { category: "project_type", key: "client_project", label: "Client Project", badgeColor: "blue", sortOrder: 1, isSystem: true },
  { category: "project_type", key: "internal_project", label: "Internal Project", badgeColor: "gray", sortOrder: 2, isSystem: true },
  { category: "project_type", key: "commercial", label: "Commercial", badgeColor: "purple", sortOrder: 3, isSystem: true },
  { category: "project_type", key: "residential", label: "Residential", badgeColor: "green", sortOrder: 4, isSystem: true },
  { category: "project_type", key: "government", label: "Government / Public Sector", badgeColor: "amber", sortOrder: 5, isSystem: true },
  { category: "project_type", key: "infrastructure", label: "Infrastructure", badgeColor: "indigo", sortOrder: 6, isSystem: true },
  { category: "project_type", key: "manufacturing", label: "Manufacturing", badgeColor: "cyan", sortOrder: 7, isSystem: true },
  { category: "project_type", key: "marketing_campaign", label: "Marketing Campaign", badgeColor: "pink", sortOrder: 8, isSystem: true },
  { category: "project_type", key: "event", label: "Event & Conference", badgeColor: "yellow", sortOrder: 9, isSystem: true },
  { category: "project_type", key: "consulting", label: "Consulting", badgeColor: "blue", sortOrder: 10, isSystem: true },
  { category: "project_type", key: "construction", label: "Construction", badgeColor: "orange", sortOrder: 11, isSystem: true },
  { category: "project_type", key: "maintenance", label: "Maintenance / AMC", badgeColor: "gray", sortOrder: 12, isSystem: true },
  { category: "project_type", key: "service", label: "Professional Service", badgeColor: "green", sortOrder: 13, isSystem: true },
  { category: "project_type", key: "implementation", label: "Software / System Implementation", badgeColor: "purple", sortOrder: 14, isSystem: true },
  { category: "project_type", key: "healthcare", label: "Healthcare & Life Sciences", badgeColor: "red", sortOrder: 15, isSystem: true },
  { category: "project_type", key: "education", label: "Educational", badgeColor: "cyan", sortOrder: 16, isSystem: true },
  { category: "project_type", key: "logistics", label: "Logistics & Supply Chain", badgeColor: "indigo", sortOrder: 17, isSystem: true },
  { category: "project_type", key: "other", label: "Other", badgeColor: "gray", sortOrder: 18, isSystem: true },
];

export const getMasterData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, activeOnly } = req.query;
    const filter: any = {};

    if (category) {
      filter.category = category;
    }
    if (activeOnly === "true") {
      filter.isActive = true;
    }

    let items = await MasterDataModel.find(filter).sort({ sortOrder: 1, label: 1 }).lean();

    // Auto-seed if collection is completely empty
    if (items.length === 0 && !category) {
      await MasterDataModel.insertMany(DEFAULT_MASTERS);
      items = await MasterDataModel.find(filter).sort({ sortOrder: 1, label: 1 }).lean();
    }

    res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMasterCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await MasterDataModel.distinct("category");
    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMasterItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, key, label, badgeColor, icon, sortOrder } = req.body;

    if (!category || !key || !label) {
      res.status(400).json({ success: false, message: "category, key, and label are required" });
      return;
    }

    const existing = await MasterDataModel.findOne({ category, key });
    if (existing) {
      res.status(400).json({ success: false, message: `Master item with key '${key}' already exists in category '${category}'` });
      return;
    }

    const newItem = await MasterDataModel.create({
      category,
      key,
      label,
      badgeColor: badgeColor || "gray",
      icon: icon || "",
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMasterItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { label, badgeColor, icon, sortOrder, isActive } = req.body;

    const item = await MasterDataModel.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: "Master item not found" });
      return;
    }

    if (label !== undefined) item.label = label;
    if (badgeColor !== undefined) item.badgeColor = badgeColor;
    if (icon !== undefined) item.icon = icon;
    if (sortOrder !== undefined) item.sortOrder = sortOrder;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMasterItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await MasterDataModel.findById(id);

    if (!item) {
      res.status(404).json({ success: false, message: "Master item not found" });
      return;
    }

    if (item.isSystem) {
      res.status(400).json({ success: false, message: "System master items cannot be deleted" });
      return;
    }

    await item.deleteOne();
    res.status(200).json({ success: true, message: "Master item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
