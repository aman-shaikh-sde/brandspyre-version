import { Request, Response } from "express";
import { LeadSharingRule } from "../../db/ModelSceham/leadSharingRuleSchema";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import mongoose from "mongoose";

const getTenantId = async (req: Request): Promise<mongoose.Types.ObjectId | null> => {
  const id = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req as any).user?.tenantId || (req as any).user?.tenant_id;
  return id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

export const getSharingRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const rules = await LeadSharingRule.find({
      $or: [{ source_tenant_id: tId }, { target_tenant_id: tId }]
    })
      .populate("source_tenant_id", "company_name tenant_code")
      .populate("target_tenant_id", "company_name tenant_code")
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch sharing rules" });
  }
};

export const createSharingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const sourceTenantId = await getTenantId(req);
    const { 
      relationship_id, 
      target_tenant_id, 
      rule_name, 
      lead_source_filter, 
      lead_campaign_filter, 
      access_level, 
      allow_internal_notes, 
      allow_attachments,
      allow_audit_visibility 
    } = req.body;

    if (!sourceTenantId || !target_tenant_id || !rule_name) {
      res.status(400).json({ success: false, message: "Missing required fields: target_tenant_id, rule_name" });
      return;
    }

    const rule = await LeadSharingRule.create({
      relationship_id,
      source_tenant_id: sourceTenantId,
      target_tenant_id: new mongoose.Types.ObjectId(target_tenant_id),
      rule_name,
      is_active: true,
      lead_source_filter: lead_source_filter || "all",
      lead_campaign_filter,
      access_level: access_level || "read_update",
      allow_internal_notes: allow_internal_notes !== false,
      allow_attachments: allow_attachments !== false,
      allow_audit_visibility: allow_audit_visibility === true
    });

    res.status(201).json({ success: true, message: "Lead sharing rule created successfully", data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create sharing rule" });
  }
};

export const toggleSharingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const tId = await getTenantId(req);

    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const rule = await LeadSharingRule.findOne({
      _id: id,
      source_tenant_id: tId
    });

    if (!rule) {
      res.status(404).json({ success: false, message: "Sharing rule not found" });
      return;
    }

    rule.is_active = is_active;
    rule.updated_at = new Date();
    await rule.save();

    res.status(200).json({ success: true, message: `Rule ${is_active ? 'enabled' : 'disabled'} successfully`, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update sharing rule" });
  }
};
