import mongoose from 'mongoose';
import { Supplier, Purchase } from '../../db/ModelSceham/commerceSchema';
import { AuditLog } from '../../db/ModelSceham/saasSchema';

export class SupplierService {
  /**
   * Create Supplier (Tenant Isolated)
   */
  static async createSupplier(tenantId: string | mongoose.Types.ObjectId, data: any, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const code = data.supplier_code ? data.supplier_code.toUpperCase().trim() : `SUP-${Date.now().toString().slice(-6)}`;

    const existing = await Supplier.findOne({ tenant_id: tId, supplier_code: code });
    if (existing) {
      throw new Error(`Supplier code '${code}' already exists.`);
    }

    const supplier = await Supplier.create({
      tenant_id: tId,
      supplier_code: code,
      name: data.name.trim(),
      company_name: data.company_name || data.display_name || '',
      email: data.email || data.primary_email || '',
      phone: data.phone || data.mobile_number || data.work_phone || '',
      address: data.address || (data.billing_address ? `${data.billing_address.street1 || ''} ${data.billing_address.city || ''} ${data.billing_address.state || ''}`.trim() : ''),
      tax_number: data.tax_number || data.gst_number || data.pan_number || '',
      payment_terms: data.payment_terms || data.financial_settings?.payment_terms || 'Net 30',
      credit_limit: Number(data.credit_limit || data.financial_settings?.credit_limit) || 0,
      opening_balance: Number(data.opening_balance || data.financial_settings?.opening_balance) || 0,
      current_balance: Number(data.opening_balance || data.financial_settings?.opening_balance) || 0,
      status: data.status || 'active',
      details: data.details || {
        salutation: data.salutation || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        vendor_language: data.vendor_language || 'English',
        display_name: data.display_name || '',
        work_phone: data.work_phone || '',
        landline: data.landline || '',
        website: data.website || '',
        department: data.department || '',
        designation: data.designation || '',
        skype: data.skype || '',
        remarks: data.remarks || '',
        gst_number: data.gst_number || '',
        pan_number: data.pan_number || '',
        gst_treatment: data.gst_treatment || '',
        source_of_supply: data.source_of_supply || '',
        msme_registered: Boolean(data.msme_registered),
        tds_applicable: Boolean(data.tds_applicable),
        pan_verified: Boolean(data.pan_verified),
        billing_address: data.billing_address || {},
        shipping_address: data.shipping_address || {},
        financial_settings: data.financial_settings || {},
        banking_info: data.banking_info || {},
        portal_access: Boolean(data.portal_access),
        contact_persons: data.contact_persons || [],
        custom_fields: data.custom_fields || {}
      },
      created_at: new Date(),
      updated_at: new Date()
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'SUPPLIER_CREATED',
      entity: 'Supplier',
      details: { supplierId: supplier._id, code: supplier.supplier_code, name: supplier.name },
      created_at: new Date()
    }]);

    return supplier;
  }

  /**
   * Update Supplier (Tenant Isolated)
   */
  static async updateSupplier(tenantId: string | mongoose.Types.ObjectId, supplierId: string, data: any, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const sId = new mongoose.Types.ObjectId(supplierId);

    const supplier = await Supplier.findOne({ _id: sId, tenant_id: tId });
    if (!supplier) {
      throw new Error(`Supplier not found.`);
    }

    if (data.name) supplier.name = data.name.trim();
    if (data.company_name !== undefined) supplier.company_name = data.company_name;
    if (data.email !== undefined) supplier.email = data.email;
    if (data.phone !== undefined) supplier.phone = data.phone;
    if (data.address !== undefined) supplier.address = data.address;
    if (data.tax_number !== undefined) supplier.tax_number = data.tax_number;

    // Merge or update details
    const existingDetails = supplier.details || {};
    supplier.details = {
      ...existingDetails,
      ...(data.details || {}),
      salutation: data.salutation ?? existingDetails.salutation ?? '',
      first_name: data.first_name ?? existingDetails.first_name ?? '',
      last_name: data.last_name ?? existingDetails.last_name ?? '',
      vendor_language: data.vendor_language ?? existingDetails.vendor_language ?? 'English',
      display_name: data.display_name ?? existingDetails.display_name ?? '',
      work_phone: data.work_phone ?? existingDetails.work_phone ?? '',
      landline: data.landline ?? existingDetails.landline ?? '',
      website: data.website ?? existingDetails.website ?? '',
      department: data.department ?? existingDetails.department ?? '',
      designation: data.designation ?? existingDetails.designation ?? '',
      skype: data.skype ?? existingDetails.skype ?? '',
      remarks: data.remarks ?? existingDetails.remarks ?? '',
      gst_number: data.gst_number ?? existingDetails.gst_number ?? '',
      pan_number: data.pan_number ?? existingDetails.pan_number ?? '',
      gst_treatment: data.gst_treatment ?? existingDetails.gst_treatment ?? '',
      source_of_supply: data.source_of_supply ?? existingDetails.source_of_supply ?? '',
      msme_registered: data.msme_registered !== undefined ? Boolean(data.msme_registered) : existingDetails.msme_registered,
      tds_applicable: data.tds_applicable !== undefined ? Boolean(data.tds_applicable) : existingDetails.tds_applicable,
      pan_verified: data.pan_verified !== undefined ? Boolean(data.pan_verified) : existingDetails.pan_verified,
      billing_address: data.billing_address || existingDetails.billing_address || {},
      shipping_address: data.shipping_address || existingDetails.shipping_address || {},
      financial_settings: data.financial_settings || existingDetails.financial_settings || {},
      banking_info: data.banking_info || existingDetails.banking_info || {},
      portal_access: data.portal_access !== undefined ? Boolean(data.portal_access) : existingDetails.portal_access,
      contact_persons: data.contact_persons || existingDetails.contact_persons || [],
      custom_fields: data.custom_fields || existingDetails.custom_fields || {}
    };

    supplier.markModified('details');
    supplier.updated_at = new Date();
    await supplier.save();

    await AuditLog.create([{
      tenant_id: tId,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'SUPPLIER_UPDATED',
      entity: 'Supplier',
      details: { supplierId: supplier._id, code: supplier.supplier_code, name: supplier.name },
      created_at: new Date()
    }]);

    return supplier;
  }

  /**
   * List Suppliers with search and pagination
   */
  static async getSuppliers(tenantId: string | mongoose.Types.ObjectId, query: { search?: string; page?: number; limit?: number }) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const filter: any = { tenant_id: tId };

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { supplier_code: searchRegex },
        { company_name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter)
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Recalculate and update supplier balance from actual purchases & payments
   * (Requirement #15: Never trust frontend balance values)
   */
  static async recalculateSupplierBalance(tenantId: string | mongoose.Types.ObjectId, supplierId: string | mongoose.Types.ObjectId) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const sId = new mongoose.Types.ObjectId(supplierId as string);

    const supplier = await Supplier.findOne({ _id: sId, tenant_id: tId });
    if (!supplier) throw new Error('Supplier not found.');

    const purchases = await Purchase.find({ tenant_id: tId, supplier_id: sId, status: 'received' });
    const totalUnpaid = purchases.reduce((acc, p) => acc + (p.balance_amount || 0), 0);

    supplier.current_balance = (supplier.opening_balance || 0) + totalUnpaid;
    supplier.updated_at = new Date();
    await supplier.save();

    return supplier.current_balance;
  }
}

export default SupplierService;
