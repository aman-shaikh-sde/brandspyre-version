import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  MarketplaceCategory,
  CategoryFormSchema,
  IMarketplaceCategory,
  ICategoryFormSchema
} from '../../db/ModelSceham/marketplaceCategorySchema';
import { MarketplaceListing } from '../../db/ModelSceham/marketplaceSchema';

export class MarketplaceCategoryController {
  /**
   * GET /api/marketplace/categories/all
   * Public: List all active categories with their capabilities
   */
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await MarketplaceCategory.find({ is_active: true })
        .sort({ display_order: 1, name: 1 })
        .lean();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (err: any) {
      console.error('[MarketplaceCategoryController] getAllCategories error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/categories/:identifier
   * Public: Retrieve category by ID or uppercase code (e.g. "REAL_ESTATE")
   */
  static async getCategoryByIdentifier(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const query: any = {};

      if (mongoose.Types.ObjectId.isValid(identifier)) {
        query.$or = [{ _id: new mongoose.Types.ObjectId(identifier) }, { code: identifier.toUpperCase() }];
      } else {
        query.code = identifier.toUpperCase();
      }

      const category = await MarketplaceCategory.findOne(query).lean();
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }

      res.status(200).json({ success: true, data: category });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/categories/:identifier/schema
   * Public & Seller: Fetch dynamic form schema for category & listing type
   */
  static async getCategorySchema(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const { listing_type = '*' } = req.query;

      // Find category first
      let categoryId: mongoose.Types.ObjectId | null = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        categoryId = new mongoose.Types.ObjectId(identifier);
      } else {
        const cat: any = await MarketplaceCategory.findOne({ code: identifier.toUpperCase() }).lean();
        if (cat) categoryId = cat._id as mongoose.Types.ObjectId;
      }

      if (!categoryId) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }

      // Find matching schema: specific listing_type first, fallback to '*'
      let schema = await CategoryFormSchema.findOne({
        category_id: categoryId,
        listing_type: String(listing_type),
        is_active: true
      }).lean();

      if (!schema && listing_type !== '*') {
        schema = await CategoryFormSchema.findOne({
          category_id: categoryId,
          listing_type: '*',
          is_active: true
        }).lean();
      }

      res.status(200).json({
        success: true,
        data: schema || { category_id: categoryId, listing_type: '*', fields: [] }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ============================================================
  // PLATFORM ADMIN OPERATIONS
  // ============================================================

  /**
   * GET /api/marketplace/admin/categories
   * Platform Admin: View all categories with counts of active listings
   */
  static async getAllCategoriesAdmin(req: Request, res: Response): Promise<void> {
    try {
      const categories = await MarketplaceCategory.find().sort({ display_order: 1 }).lean();

      // Aggregate listing counts per category
      const counts = await MarketplaceListing.aggregate([
        { $match: { marketplace_category_id: { $exists: true, $ne: null } } },
        { $group: { _id: '$marketplace_category_id', count: { $sum: 1 } } }
      ]);

      const countMap = new Map<string, number>();
      counts.forEach((c: any) => countMap.set(String(c._id), c.count));

      const enriched = categories.map((cat: any) => ({
        ...cat,
        listing_count: countMap.get(String(cat._id)) || 0
      }));

      res.status(200).json({ success: true, data: enriched });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/admin/categories
   * Platform Admin: Create a new category vertical
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const {
        code,
        name,
        description,
        icon,
        banner_image,
        display_order,
        listing_types,
        default_listing_type,
        pricing_modes,
        default_pricing_mode,
        pricing_units,
        default_pricing_unit,
        transaction_flow,
        requires_product_link,
        requires_location,
        allow_instant_booking,
        media_requirements,
        seo_metadata
      } = req.body;

      if (!code || !name) {
        res.status(400).json({ success: false, error: 'Code and Name are required.' });
        return;
      }

      const existing = await MarketplaceCategory.findOne({ code: code.toUpperCase() });
      if (existing) {
        res.status(400).json({ success: false, error: `Category with code "${code}" already exists.` });
        return;
      }

      const category = await MarketplaceCategory.create({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description || '',
        icon: icon || 'Layers',
        banner_image,
        display_order: display_order !== undefined ? Number(display_order) : 0,
        is_active: true,
        listing_types: Array.isArray(listing_types) && listing_types.length > 0 ? listing_types : ['STANDARD'],
        default_listing_type: default_listing_type || 'STANDARD',
        pricing_modes: Array.isArray(pricing_modes) && pricing_modes.length > 0 ? pricing_modes : ['FIXED'],
        default_pricing_mode: default_pricing_mode || 'FIXED',
        pricing_units: Array.isArray(pricing_units) && pricing_units.length > 0 ? pricing_units : ['PER_UNIT'],
        default_pricing_unit: default_pricing_unit || 'PER_UNIT',
        transaction_flow: transaction_flow || 'ENQUIRY',
        requires_product_link: Boolean(requires_product_link),
        requires_location: Boolean(requires_location),
        allow_instant_booking: Boolean(allow_instant_booking),
        media_requirements: media_requirements || { min_images: 1, max_images: 10, allow_video: true, allow_documents: true },
        seo_metadata: seo_metadata || {}
      });

      res.status(201).json({
        success: true,
        message: 'Marketplace category created successfully.',
        data: category
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/marketplace/admin/categories/:id
   * Platform Admin: Update category metadata and capabilities
   */
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await MarketplaceCategory.findById(id);

      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }

      const allowedFields = [
        'name', 'description', 'icon', 'banner_image', 'display_order', 'is_active',
        'listing_types', 'default_listing_type', 'pricing_modes', 'default_pricing_mode',
        'pricing_units', 'default_pricing_unit', 'transaction_flow', 'requires_product_link',
        'requires_location', 'allow_instant_booking', 'media_requirements', 'seo_metadata'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (category as any)[field] = req.body[field];
        }
      }
      category.updated_at = new Date();

      await category.save();

      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: category
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/marketplace/admin/categories/:id
   * Platform Admin: Deactivate category
   */
  static async deactivateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await MarketplaceCategory.findById(id);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }

      category.is_active = !category.is_active; // Toggle
      category.updated_at = new Date();
      await category.save();

      res.status(200).json({
        success: true,
        message: `Category ${category.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: category
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/admin/categories/:id/schema
   * Platform Admin: Create or update form field schema for a category
   */
  static async upsertCategorySchema(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { listing_type = '*', fields } = req.body;

      if (!Array.isArray(fields)) {
        res.status(400).json({ success: false, error: 'Fields must be an array of field definitions.' });
        return;
      }

      const category = await MarketplaceCategory.findById(id);
      if (!category) {
        res.status(404).json({ success: false, error: 'Category not found.' });
        return;
      }

      // Upsert schema
      const schema = await CategoryFormSchema.findOneAndUpdate(
        { category_id: category._id, listing_type },
        {
          category_id: category._id,
          listing_type,
          fields,
          is_active: true,
          updated_at: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Category form schema updated successfully.',
        data: schema
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
