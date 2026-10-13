import mongoose from 'mongoose';
import { MarketplaceEnquiry, IMarketplaceEnquiry } from '../../db/ModelSceham/marketplaceEnquirySchema';
import { MarketplaceListing } from '../../db/ModelSceham/marketplaceSchema';
import { MarketplaceCategory } from '../../db/ModelSceham/marketplaceCategorySchema';
import { Lead } from '../../db/ModelSceham/project/campagin';
import { Branch } from '../../db/ModelSceham/branchSchema';
import { Notification } from '../../db/ModelSceham/Notification/notification';

export interface CreateEnquiryInput {
  listing_id: string;
  buyer_id?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string;
  buyer_message: string;
  type?: 'CONTACT' | 'VIEWING' | 'TEST_DRIVE' | 'CONSULTATION' | 'QUOTE_REQUEST' | 'GENERAL';
  requirements?: Record<string, any>;
  consent?: {
    contact_allowed?: boolean;
    data_sharing_accepted?: boolean;
  };
}

export class MarketplaceEnquiryService {
  /**
   * Generates a collision-resistant, human-friendly enquiry reference
   */
  private static generateEnquiryNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ENQ-${timestamp}-${random}`;
  }

  /**
   * Submit enquiry, auto-provision CRM lead in seller's organization, and notify seller
   */
  static async createEnquiryWithCRMLead(input: CreateEnquiryInput): Promise<{
    enquiry: IMarketplaceEnquiry;
    lead?: any;
  }> {
    if (!input.listing_id || !input.buyer_name || !input.buyer_email || !input.buyer_phone) {
      throw new Error('Listing ID, buyer name, email, and phone number are required.');
    }

    // 1. Fetch Listing & Category Context
    const listing: any = await MarketplaceListing.findById(input.listing_id).lean();
    if (!listing) {
      throw new Error('Target marketplace listing not found.');
    }

    const sellerTenantId = listing.tenant_id;
    let categoryName = 'Marketplace';
    let marketplaceCategoryId = listing.marketplace_category_id;

    if (marketplaceCategoryId) {
      const cat: any = await MarketplaceCategory.findById(marketplaceCategoryId).lean();
      if (cat) categoryName = cat.name;
    } else {
      // Fallback if not populated
      const defaultCat: any = await MarketplaceCategory.findOne({ code: 'RETAIL_COMMERCE' }).lean();
      if (defaultCat) {
        marketplaceCategoryId = defaultCat._id;
        categoryName = defaultCat.name;
      }
    }

    const enquiryNumber = this.generateEnquiryNumber();

    // 2. Auto-provision or update CRM Lead in the seller's tenant
    let leadDoc: any = null;
    try {
      // Find branch for tenant or fallback to 'MAIN'
      const branch: any = await Branch.findOne({ tenant_id: sellerTenantId }).lean();
      const branchcode = branch?.branchcode || 'MAIN';

      leadDoc = await Lead.create({
        tenant_id: sellerTenantId,
        branchcode,
        lead_name: input.buyer_name.trim(),
        phone: input.buyer_phone.trim(),
        email: input.buyer_email.toLowerCase().trim(),
        comm_type: 'Marketplace Enquiry',
        proj_type: categoryName,
        status: 'New Lead',
        summary: `Marketplace Enquiry [${input.type || 'CONTACT'}] for "${listing.title}". Message: ${input.buyer_message.trim()}`,
        custom_fields: {
          enquiry_number: enquiryNumber,
          listing_id: listing._id.toString(),
          listing_title: listing.title,
          listing_slug: listing.slug,
          buyer_company: input.buyer_company || '',
          enquiry_type: input.type || 'CONTACT',
          requirements: input.requirements || {},
          source: 'MARKETPLACE'
        }
      });
    } catch (crmErr) {
      console.error('[MarketplaceEnquiryService] Warning: Failed to create CRM lead record:', crmErr);
      // Non-fatal: still proceed to register the marketplace enquiry
    }

    // 3. Create MarketplaceEnquiry document
    const enquiry = await MarketplaceEnquiry.create({
      enquiry_number: enquiryNumber,
      listing_id: listing._id,
      marketplace_category_id: marketplaceCategoryId,
      listing_type: listing.listing_type || 'STANDARD',
      seller_tenant_id: sellerTenantId,
      buyer_id: input.buyer_id ? new mongoose.Types.ObjectId(input.buyer_id) : undefined,
      buyer_name: input.buyer_name.trim(),
      buyer_email: input.buyer_email.toLowerCase().trim(),
      buyer_phone: input.buyer_phone.trim(),
      buyer_company: input.buyer_company?.trim(),
      buyer_message: input.buyer_message.trim(),
      requirements: input.requirements || {},
      crm_lead_id: leadDoc?._id,
      crm_lead_status: leadDoc?.status || 'New Lead',
      type: input.type || 'CONTACT',
      status: 'NEW',
      consent: {
        contact_allowed: input.consent?.contact_allowed ?? true,
        data_sharing_accepted: input.consent?.data_sharing_accepted ?? true,
        timestamp: new Date()
      }
    });

    // 4. Send In-App Notification to Seller Tenant
    try {
      await Notification.create({
        tenant_id: sellerTenantId,
        from: 'Marketplace Buyer',
        type: 'MARKETPLACE_ENQUIRY',
        action: 'NEW_ENQUIRY',
        content: `New ${input.type || 'contact'} enquiry (#${enquiryNumber}) received from ${input.buyer_name} for "${listing.title}".`,
        isnotify: true,
        created_on: new Date()
      });
    } catch (notifyErr) {
      console.warn('[MarketplaceEnquiryService] Notification write error:', notifyErr);
    }

    return { enquiry, lead: leadDoc };
  }

  /**
   * Retrieve seller's incoming enquiries with filtering and pagination
   */
  static async getSellerEnquiries(
    tenantId: string | mongoose.Types.ObjectId,
    options: {
      status?: string;
      type?: string;
      search?: string;
      listing_id?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {
      seller_tenant_id: new mongoose.Types.ObjectId(tenantId)
    };

    if (options.status && options.status !== 'ALL') {
      filter.status = options.status;
    }

    if (options.type && options.type !== 'ALL') {
      filter.type = options.type;
    }

    if (options.listing_id) {
      filter.listing_id = new mongoose.Types.ObjectId(options.listing_id);
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filter.$or = [
        { enquiry_number: searchRegex },
        { buyer_name: searchRegex },
        { buyer_email: searchRegex },
        { buyer_phone: searchRegex },
        { buyer_message: searchRegex }
      ];
    }

    const [enquiries, total] = await Promise.all([
      MarketplaceEnquiry.find(filter)
        .populate('listing_id', 'title slug images listing_price pricing')
        .populate('marketplace_category_id', 'name code icon')
        .populate('crm_lead_id', 'status lead_name phone email assignee_id')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceEnquiry.countDocuments(filter)
    ]);

    return {
      enquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update enquiry lifecycle status and synchronize CRM lead status
   */
  static async updateEnquiryStatus(
    enquiryId: string,
    tenantId: string | mongoose.Types.ObjectId,
    update: {
      status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';
      notes?: string;
      follow_up_date?: Date;
      assigned_to?: string;
    }
  ) {
    const enquiry = await MarketplaceEnquiry.findOne({
      _id: new mongoose.Types.ObjectId(enquiryId),
      seller_tenant_id: new mongoose.Types.ObjectId(tenantId)
    });

    if (!enquiry) {
      throw new Error('Enquiry not found or access denied.');
    }

    if (update.status) enquiry.status = update.status;
    if (update.notes !== undefined) enquiry.notes = update.notes;
    if (update.follow_up_date) enquiry.follow_up_date = new Date(update.follow_up_date);
    if (update.assigned_to) enquiry.assigned_to = new mongoose.Types.ObjectId(update.assigned_to);
    enquiry.updated_at = new Date();

    await enquiry.save();

    // Sync CRM lead status
    if (enquiry.crm_lead_id && update.status) {
      try {
        let crmStatus = 'inprogress';
        if (update.status === 'CONVERTED') crmStatus = 'won';
        else if (update.status === 'CLOSED') crmStatus = 'lost';
        else if (update.status === 'QUALIFIED') crmStatus = 'qualified';

        await Lead.findByIdAndUpdate(enquiry.crm_lead_id, {
          status: crmStatus,
          updated_on: new Date()
        });
      } catch (e) {
        console.warn('[MarketplaceEnquiryService] CRM lead status sync failed:', e);
      }
    }

    return enquiry;
  }
}
