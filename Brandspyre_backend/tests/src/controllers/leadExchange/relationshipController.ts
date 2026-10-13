import { Request, Response } from "express";
import { TenantRelationship } from "../../db/ModelSceham/tenantRelationshipSchema";
import { Tenant } from "../../db/ModelSceham/saasSchema";
import { Lead } from "../../db/ModelSceham/project/campagin";
import { LeadShareAccess } from "../../db/ModelSceham/leadShareAccessSchema";
import mongoose from "mongoose";

const getTenantId = async (req: Request): Promise<mongoose.Types.ObjectId | null> => {
  const id = (req as any).securityContext?.tenantId || (req as any).tenant?.id || (req as any).user?.tenantId || (req as any).user?.tenant_id;
  return id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

export const getTenantRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const relationships = await TenantRelationship.find({
      $or: [{ initiator_tenant_id: tId }, { target_tenant_id: tId }]
    })
      .populate("initiator_tenant_id", "company_name tenant_code domain status")
      .populate("target_tenant_id", "company_name tenant_code domain status")
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({ success: true, count: relationships.length, data: relationships, current_tenant_id: tId.toString() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch relationships" });
  }
};

export const createTenantRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const initiatorTenantId = await getTenantId(req);
    const { target_tenant_code, relationship_type, custom_type_label, notes } = req.body;

    if (!initiatorTenantId || !target_tenant_code || !relationship_type) {
      res.status(400).json({ success: false, message: "Missing required fields: target_tenant_code, relationship_type" });
      return;
    }

    const targetTenant = await Tenant.findOne({
      $or: [
        { tenant_code: target_tenant_code },
        { subdomain: target_tenant_code },
        ...(mongoose.Types.ObjectId.isValid(target_tenant_code) ? [{ _id: new mongoose.Types.ObjectId(target_tenant_code) }] : [])
      ]
    });

    if (!targetTenant) {
      res.status(404).json({ success: false, message: `Organization with code '${target_tenant_code}' not found` });
      return;
    }

    if (targetTenant._id.toString() === initiatorTenantId.toString()) {
      res.status(400).json({ success: false, message: "Cannot establish a relationship with your own organization" });
      return;
    }

    const existing = await TenantRelationship.findOne({
      $or: [
        { initiator_tenant_id: initiatorTenantId, target_tenant_id: targetTenant._id },
        { initiator_tenant_id: targetTenant._id, target_tenant_id: initiatorTenantId }
      ]
    });

    if (existing) {
      res.status(400).json({ success: false, message: "A relationship already exists between these organizations" });
      return;
    }

    const relationship = await TenantRelationship.create({
      initiator_tenant_id: initiatorTenantId,
      target_tenant_id: targetTenant._id,
      relationship_type,
      custom_type_label,
      status: "pending", // Starts as PENDING until Child Company accepts
      notes
    });

    res.status(201).json({ 
      success: true, 
      message: "Relationship request sent successfully! Awaiting target organization acceptance.", 
      data: relationship 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create relationship" });
  }
};

export const updateTenantRelationshipStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tId = await getTenantId(req);

    if (!tId) {
      res.status(400).json({ success: false, message: "Tenant context missing" });
      return;
    }

    const relationship = await TenantRelationship.findOne({
      _id: id,
      $or: [
        { initiator_tenant_id: tId },
        { target_tenant_id: tId }
      ]
    });

    if (!relationship) {
      res.status(404).json({ success: false, message: "Relationship not found" });
      return;
    }

    relationship.status = status;
    if (status === "active") {
      relationship.established_at = new Date();
    }
    relationship.updated_at = new Date();
    await relationship.save();

    // When relationship becomes ACTIVE, share Child Company leads to Parent Company
    if (status === "active") {
      let parentTenantId = relationship.initiator_tenant_id;
      let childTenantId = relationship.target_tenant_id;

      if (relationship.relationship_type === "child") {
        parentTenantId = relationship.initiator_tenant_id;
        childTenantId = relationship.target_tenant_id;
      } else if (relationship.relationship_type === "parent") {
        parentTenantId = relationship.target_tenant_id;
        childTenantId = relationship.initiator_tenant_id;
      }

      // Find all existing leads belonging to Child Company
      const childLeads = await Lead.find({
        $or: [
          { tenant_id: childTenantId },
          { tenant_id: childTenantId.toString() }
        ]
      }).lean();

      // Automatically grant SSOT access to Parent Company for all Child leads
      for (const lead of childLeads) {
        await LeadShareAccess.findOneAndUpdate(
          {
            lead_id: lead._id,
            shared_tenant_id: parentTenantId
          },
          {
            owner_tenant_id: childTenantId,
            access_level: "read_update",
            document_permission: "shared",
            share_status: "accepted",
            granted_at: new Date(),
            $push: {
              activity_history: {
                action: "AUTO_SHARED_ON_RELATIONSHIP_ACCEPT",
                notes: "Child Company accepted relationship request. Lead automatically shared to Parent Company.",
                timestamp: new Date()
              }
            }
          },
          { upsert: true, new: true }
        );
      }
      console.log(`[RelationshipAccept] Shared ${childLeads.length} leads from Child Org ${childTenantId} to Parent Org ${parentTenantId}`);
    }

    res.status(200).json({ success: true, message: `Relationship accepted and activated! Leads shared with Parent Company.`, data: relationship });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update relationship status" });
  }
};

export const getAvailableOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const tId = await getTenantId(req);
    const tenants = await Tenant.find({
      ...(tId ? { _id: { $ne: tId } } : {})
    })
      .select("name company_name tenant_code subdomain status industry")
      .sort({ company_name: 1, name: 1 })
      .lean();

    const normalized = tenants.map((t: any) => ({
      ...t,
      company_name: t.company_name || t.name || (t.tenant_code ? `Org ${t.tenant_code}` : "Organization")
    }));

    res.status(200).json({ success: true, data: normalized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch available organizations" });
  }
};
