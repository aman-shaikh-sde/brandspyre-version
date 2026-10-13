import mongoose from 'mongoose';
import {
  Product,
  ProductCategory,
  ProductBrand,
  ProductUnit,
  ProductVariant,
  Warehouse,
  InventoryStock
} from '../../db/ModelSceham/commerceSchema';
import { AuditLog } from '../../db/ModelSceham/saasSchema';

export class ProductService {
  /**
   * Ensure tenant has at least one default warehouse
   */
  static async ensureDefaultWarehouse(tenantId: string | mongoose.Types.ObjectId): Promise<any> {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    let warehouse = await Warehouse.findOne({ tenant_id: tId, is_default: true });

    if (!warehouse) {
      warehouse = await Warehouse.findOne({ tenant_id: tId });
    }

    if (!warehouse) {
      warehouse = await Warehouse.create({
        tenant_id: tId,
        code: 'WH-MAIN',
        name: 'Main Warehouse',
        address: 'Headquarters Main Store',
        is_default: true,
        is_active: true,
        created_at: new Date()
      });
    }

    return warehouse;
  }

  /**
   * Create new product (with SKU & Barcode uniqueness check per tenant)
   */
  static async createProduct(
    tenantId: string | mongoose.Types.ObjectId,
    data: any,
    userId?: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);

    // 1. SKU uniqueness check within tenant
    const existingSku = await Product.findOne({ tenant_id: tId, sku: data.sku });
    if (existingSku) {
      throw new Error(`Product SKU '${data.sku}' already exists in your organization.`);
    }

    // 2. Barcode uniqueness check within tenant (if provided)
    if (data.barcode && data.barcode.trim() !== '') {
      const existingBarcode = await Product.findOne({ tenant_id: tId, barcode: data.barcode.trim(), is_deleted: false });
      if (existingBarcode) {
        throw new Error(`Product Barcode '${data.barcode}' is already assigned to product '${existingBarcode.name}'.`);
      }
    }

    const product = await Product.create({
      tenant_id: tId,
      sku: data.sku.toUpperCase().trim(),
      barcode: data.barcode ? data.barcode.trim() : undefined,
      name: data.name.trim(),
      description: data.description || '',
      category_id: data.category_id ? new mongoose.Types.ObjectId(data.category_id) : undefined,
      brand_id: data.brand_id ? new mongoose.Types.ObjectId(data.brand_id) : undefined,
      unit_id: data.unit_id ? new mongoose.Types.ObjectId(data.unit_id) : undefined,
      product_type: data.product_type || 'single',
      purchase_price: Number(data.purchase_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      tax_rate: Number(data.tax_rate) || 0,
      tax_inclusive: Boolean(data.tax_inclusive),
      reorder_level: Number(data.reorder_level) || 5,
      track_inventory: data.track_inventory !== false,
      track_batch: Boolean(data.track_batch),
      track_expiry: Boolean(data.track_expiry),
      image_url: data.image_url || '',
      custom_fields: data.custom_fields || {},
      is_active: true,
      is_deleted: false,
      created_at: new Date()
    });

    // Auto-initialize inventory stock record in default warehouse
    const defaultWarehouse = await this.ensureDefaultWarehouse(tId);
    await InventoryStock.create({
      tenant_id: tId,
      warehouse_id: defaultWarehouse._id,
      product_id: product._id,
      quantity: Number(data.opening_stock) || 0,
      reserved_quantity: 0,
      available_quantity: Number(data.opening_stock) || 0,
      average_cost: Number(data.purchase_price) || 0,
      reorder_level: Number(data.reorder_level) || 5,
      updated_at: new Date()
    });

    await AuditLog.create([{
      tenant_id: tId,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      details: { productId: product._id, sku: product.sku, name: product.name },
      created_at: new Date()
    }]);

    return product;
  }

  /**
   * Search / filter products with pagination (Tenant Isolated)
   */
  static async getProducts(
    tenantId: string | mongoose.Types.ObjectId,
    query: {
      search?: string;
      category_id?: string;
      brand_id?: string;
      is_active?: boolean;
      barcode?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const filter: any = { tenant_id: tId, is_deleted: false };

    if (query.barcode) {
      filter.barcode = query.barcode.trim();
    } else if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { description: searchRegex }
      ];
    }

    if (query.category_id) {
      filter.category_id = new mongoose.Types.ObjectId(query.category_id);
    }
    if (query.brand_id) {
      filter.brand_id = new mongoose.Types.ObjectId(query.brand_id);
    }
    if (typeof query.is_active === 'boolean') {
      filter.is_active = query.is_active;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('category_id', 'name code')
        .populate('brand_id', 'name code')
        .populate('unit_id', 'name code')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find product by Barcode (Scanner fast lookup)
   */
  static async getProductByBarcode(tenantId: string | mongoose.Types.ObjectId, barcode: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const barcodeTrimmed = barcode.trim();

    return await Product.findOne({
      tenant_id: tId,
      barcode: barcodeTrimmed,
      is_deleted: false
    })
      .populate('category_id', 'name code')
      .populate('unit_id', 'name code');
  }

  /**
   * Update product (Validate tenant isolation)
   */
  static async updateProduct(
    tenantId: string | mongoose.Types.ObjectId,
    productId: string,
    data: any,
    userId?: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const pId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findOne({ _id: pId, tenant_id: tId, is_deleted: false });
    if (!product) {
      throw new Error('Product not found in your organization.');
    }

    // Barcode update check if changed
    if (data.barcode && data.barcode.trim() !== product.barcode) {
      const existingBarcode = await Product.findOne({ tenant_id: tId, barcode: data.barcode.trim(), _id: { $ne: pId }, is_deleted: false });
      if (existingBarcode) {
        throw new Error(`Barcode '${data.barcode}' is already assigned to another product.`);
      }
    }

    Object.assign(product, {
      name: data.name !== undefined ? data.name.trim() : product.name,
      barcode: data.barcode !== undefined ? data.barcode.trim() : product.barcode,
      description: data.description !== undefined ? data.description : product.description,
      category_id: data.category_id ? new mongoose.Types.ObjectId(data.category_id) : product.category_id,
      brand_id: data.brand_id ? new mongoose.Types.ObjectId(data.brand_id) : product.brand_id,
      unit_id: data.unit_id ? new mongoose.Types.ObjectId(data.unit_id) : product.unit_id,
      purchase_price: data.purchase_price !== undefined ? Number(data.purchase_price) : product.purchase_price,
      selling_price: data.selling_price !== undefined ? Number(data.selling_price) : product.selling_price,
      tax_rate: data.tax_rate !== undefined ? Number(data.tax_rate) : product.tax_rate,
      tax_inclusive: data.tax_inclusive !== undefined ? Boolean(data.tax_inclusive) : product.tax_inclusive,
      reorder_level: data.reorder_level !== undefined ? Number(data.reorder_level) : product.reorder_level,
      custom_fields: data.custom_fields !== undefined ? data.custom_fields : product.custom_fields,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : product.is_active,
      updated_at: new Date()
    });

    await product.save();

    await AuditLog.create([{
      tenant_id: tId,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      details: { productId: product._id, sku: product.sku },
      created_at: new Date()
    }]);

    return product;
  }

  /**
   * Soft delete product (Never physically delete historical products)
   */
  static async deleteProduct(tenantId: string | mongoose.Types.ObjectId, productId: string, userId?: string) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const pId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findOneAndUpdate(
      { _id: pId, tenant_id: tId },
      { is_deleted: true, is_active: false, updated_at: new Date() },
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found.');
    }

    await AuditLog.create([{
      tenant_id: tId,
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      details: { productId: product._id, sku: product.sku },
      created_at: new Date()
    }]);

    return { success: true };
  }

  /**
   * Bulk import products (Supports custom_fields and error report per item)
   */
  static async bulkCreateProducts(
    tenantId: string | mongoose.Types.ObjectId,
    items: any[],
    userId?: string
  ) {
    const tId = new mongoose.Types.ObjectId(tenantId as string);
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as Array<{ row: number; sku?: string; error: string }>
    };

    for (let i = 0; i < items.length; i++) {
      const data = items[i];
      try {
        if (!data.name || !data.sku) {
          results.failed++;
          results.errors.push({ row: i + 1, sku: data.sku, error: 'Product name and SKU are required.' });
          continue;
        }

        await this.createProduct(tId, data, userId);
        results.imported++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: i + 1, sku: data.sku, error: err.message || 'Import failed.' });
      }
    }

    return results;
  }
}

export default ProductService;
