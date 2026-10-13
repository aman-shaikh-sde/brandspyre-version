import mongoose from "mongoose";
import { Lead } from "../db/ModelSceham/project/campagin";
import { UserInfo } from "../db/ModelSceham/userSchema";
import { Campaign } from "../db/ModelSceham/project/campagin";
import { billingEventBus } from "./billingEventBus";

/**
 * Lead Mapping Service
 * Maps Meta lead fields to CRM lead fields with tenant isolation, custom mappings, and full marketing attribution
 */

export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MappedLeadData {
  tenant_id: mongoose.Types.ObjectId;
  branchcode: string;
  campaign_code?: string;
  lead_name?: string;
  phone?: string;
  email?: string;
  company?: string;
  city?: string;
  assignee_id?: string;
  comm_type: string;
  proj_type: string;
  status: string;
  summary?: string;
  meta_lead_id: string;
  meta_source: string;
  meta_form_id: string;
  meta_page_id: string;
  meta_ad_id?: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_created_at: Date;
  meta_raw_fields?: Record<string, any>;
  custom_fields?: Record<string, any>;
}

export class LeadMappingService {
  /**
   * Default field mapping for common Meta lead fields to CRM fields
   */
  private static defaultMapping: Record<string, string> = {
    full_name: "lead_name",
    name: "lead_name",
    first_name: "lead_name",
    phone_number: "phone",
    phone: "phone",
    email: "email",
    company_name: "company",
    company: "company",
    city: "city",
  };

  /**
   * Map Meta lead data to CRM lead structure
   */
  static mapMetaLeadToCRM(
    metaLeadData: any,
    formMapping: Record<string, string> = {},
    tenantId: mongoose.Types.ObjectId,
    tenantBranchcode: string,
    defaultAssigneeId?: string,
    defaultCampaignCode?: string,
    defaultStatus?: string
  ): MappedLeadData {
    const fieldData: MetaLeadField[] = metaLeadData.field_data || [];
    const mappedFields: Record<string, string> = {};
    const rawFields: Record<string, any> = {};
    const customFields: Record<string, any> = {};

    // Combine default mapping with form-specific custom mappings
    const combinedMapping = { ...this.defaultMapping, ...formMapping };

    // Process field_data array returned by Meta Graph API
    fieldData.forEach((field) => {
      const fieldVal = field.values && field.values.length > 0 ? field.values[0] : "";
      rawFields[field.name] = fieldVal;

      const crmField = combinedMapping[field.name.toLowerCase()];
      if (crmField && fieldVal) {
        mappedFields[crmField] = fieldVal;
      } else if (fieldVal) {
        // Retain unmapped custom questions/answers so customer responses are preserved
        customFields[field.name] = fieldVal;
      }
    });

    // Handle full name construction if separate first/last name
    if (!mappedFields.lead_name) {
      const firstNameField = fieldData.find((f) => f.name.toLowerCase() === "first_name");
      const lastNameField = fieldData.find((f) => f.name.toLowerCase() === "last_name");
      if (firstNameField || lastNameField) {
        mappedFields.lead_name = `${firstNameField?.values?.[0] || ""} ${lastNameField?.values?.[0] || ""}`.trim();
      }
    }

    // Determine precise source platform (Instagram vs Facebook Lead Ads)
    const rawPlatform = (metaLeadData.platform || "").toLowerCase();
    const isInstagram =
      rawPlatform.includes("ig") ||
      rawPlatform.includes("instagram") ||
      metaLeadData.is_instagram === true;
    const metaSource = metaLeadData.platform || (isInstagram ? "instagram" : "facebook_lead_ads");

    // Format custom questions into summary if available
    const customAnswersSnippet = Object.keys(customFields).length > 0
      ? ` | Custom Fields: ${Object.entries(customFields).map(([k, v]) => `${k}: ${v}`).join(", ")}`
      : "";

    const leadData: MappedLeadData = {
      tenant_id: tenantId,
      branchcode: tenantBranchcode,
      campaign_code: defaultCampaignCode || mappedFields.campaign_code,
      lead_name: mappedFields.lead_name || metaLeadData.lead_name || metaLeadData.full_name || `Meta Lead (${metaLeadData.id || metaLeadData.leadgen_id || "Direct"})`,
      phone: mappedFields.phone || metaLeadData.phone || metaLeadData.phone_number || "",
      email: mappedFields.email || metaLeadData.email || "",
      company: mappedFields.company || "",
      city: mappedFields.city || "",
      assignee_id: defaultAssigneeId,
      comm_type: isInstagram ? "Instagram" : "Social Media",
      proj_type: "General",
      status: defaultStatus || mappedFields.status || "New Lead",
      summary: `Lead received via Meta Lead Ads (Form: ${metaLeadData.form_id || metaLeadData.meta_form_id || "N/A"})${customAnswersSnippet}`,
      meta_lead_id: metaLeadData.id || metaLeadData.leadgen_id || "",
      meta_source: metaSource,
      meta_form_id: metaLeadData.form_id || metaLeadData.meta_form_id || "",
      meta_page_id: metaLeadData.page_id || metaLeadData.meta_page_id || "",
      meta_ad_id: metaLeadData.ad_id,
      meta_campaign_id: metaLeadData.campaign_id,
      meta_adset_id: metaLeadData.adset_id,
      meta_created_at: metaLeadData.created_time ? new Date(metaLeadData.created_time) : new Date(),
      meta_raw_fields: rawFields,
      custom_fields: customFields,
    };

    return leadData;
  }

  /**
   * Validate lead mapping configuration
   */
  static validateMapping(mapping: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validCrmFields = [
      "lead_name",
      "phone",
      "email",
      "company",
      "city",
      "comm_type",
      "proj_type",
      "status",
      "summary",
      "campaign_code",
    ];

    for (const [metaField, crmField] of Object.entries(mapping)) {
      if (!validCrmFields.includes(crmField)) {
        errors.push(`Invalid CRM field mapping: '${crmField}' for Meta field '${metaField}'`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply lead assignment rules with tenant isolation
   */
  static async applyLeadAssignment(
    leadData: MappedLeadData,
    formAssigneeId?: string,
    tenantBranchcode?: string
  ): Promise<string | null> {
    const assigneeId = formAssigneeId || leadData.assignee_id;

    if (assigneeId) {
      const assignee = await UserInfo.findOne({
        staff_id: assigneeId,
        branchcode: tenantBranchcode,
      }).lean();

      if (!assignee) {
        console.warn(`Assignee ${assigneeId} not found in branch ${tenantBranchcode}`);
        return null;
      }

      return assigneeId;
    }

    return null;
  }

  /**
   * Check for duplicate lead within tenant context
   */
  static async checkDuplicate(tenantId: mongoose.Types.ObjectId, metaLeadId: string): Promise<boolean> {
    try {
      const existingLead = await Lead.findOne({
        tenant_id: tenantId,
        meta_lead_id: metaLeadId,
      }).lean();
      return !!existingLead;
    } catch (error) {
      console.error("Error checking for duplicate lead:", error);
      return false;
    }
  }

  /**
   * Create lead in CRM with complete attribution and idempotency protection
   */
  static async createLead(leadData: MappedLeadData): Promise<any> {
    try {
      const lead = await Lead.create({
        ...leadData,
        lead_date: new Date().toISOString().split("T")[0],
        created_on: new Date(),
        updated_on: new Date(),
      });

      if (lead.status) {
        billingEventBus.emit("LEAD_STAGE_UPDATED", {
          leadId: lead._id.toString(),
          newStage: lead.status,
          tenantId: lead.tenant_id,
          branchcode: lead.branchcode,
          updatedBy: "meta_webhook",
          conversionDate: new Date(),
        });
      }

      return lead;
    } catch (error: any) {
      // Idempotency: If duplicate key violation occurred during race condition, fetch and return existing lead
      if (error.code === 11000 && leadData.meta_lead_id) {
        const existing = await Lead.findOne({
          tenant_id: leadData.tenant_id,
          meta_lead_id: leadData.meta_lead_id,
        });
        if (existing) {
          console.log(`[LeadMappingService] Lead with meta_lead_id ${leadData.meta_lead_id} already exists (idempotent duplicate avoided): ${existing._id}`);
          return existing;
        }
      }

      console.error("Error creating lead in CRM:", error);
      throw new Error("Failed to create lead in CRM");
    }
  }

  /**
   * Get available CRM fields for mapping
   */
  static getAvailableCrmFields(): Array<{ value: string; label: string }> {
    return [
      { value: "lead_name", label: "Lead Name" },
      { value: "phone", label: "Phone Number" },
      { value: "email", label: "Email Address" },
      { value: "company", label: "Company" },
      { value: "city", label: "City" },
      { value: "comm_type", label: "Communication Type" },
      { value: "proj_type", label: "Project Type" },
      { value: "status", label: "Lead Status" },
      { value: "summary", label: "Summary / Notes" },
      { value: "campaign_code", label: "Campaign Code" },
    ];
  }

  /**
   * Get common Meta field names for form builder
   */
  static getCommonMetaFields(): Array<{ value: string; label: string }> {
    return [
      { value: "full_name", label: "Full Name" },
      { value: "first_name", label: "First Name" },
      { value: "last_name", label: "Last Name" },
      { value: "phone_number", label: "Phone Number" },
      { value: "email", label: "Email Address" },
      { value: "company_name", label: "Company Name" },
      { value: "city", label: "City" },
      { value: "country", label: "Country" },
      { value: "job_title", label: "Job Title" },
    ];
  }
}

export default LeadMappingService;
