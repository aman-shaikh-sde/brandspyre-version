import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  MarketplaceListing,
  ProductReview,
  Wishlist,
  MarketplaceSellerProfile
} from '../../db/ModelSceham/marketplaceSchema';
import {
  MarketplaceCategory,
  ListingCategoryData
} from '../../db/ModelSceham/marketplaceCategorySchema';
import { Product, ProductCategory, ProductBrand } from '../../db/ModelSceham/commerceSchema';
import { MarketplaceInventoryService } from '../../services/marketplace/MarketplaceInventoryService';
import { MarketplaceAuthRequest } from './marketplaceAuthController';

export class MarketplacePublicController {
  /**
   * GET /api/marketplace/products or /api/products
   * Browse published, approved marketplace listings with search & filtering
   */
  static async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        marketplace_category,
        category_code,
        listing_type,
        city,
        brand,
        min_price,
        max_price,
        in_stock,
        sort = 'newest',
        page = 1,
        limit = 24
      } = req.query;

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 24));
      const skip = (pageNum - 1) * limitNum;

      // 1. Build Filter for Marketplace Listings
      const listingFilter: any = {
        is_published: true,
        status: 'PUBLISHED'
      };

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        listingFilter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { 'location.city': searchRegex }
        ];
      }

      // Marketplace vertical filter
      const mCategory = marketplace_category || category_code;
      if (mCategory && typeof mCategory === 'string' && mCategory !== 'ALL') {
        if (mongoose.Types.ObjectId.isValid(mCategory)) {
          listingFilter.marketplace_category_id = new mongoose.Types.ObjectId(mCategory);
        } else {
          const matchedMCat: any = await MarketplaceCategory.findOne({ code: mCategory.toUpperCase() }).lean();
          if (matchedMCat) {
            listingFilter.marketplace_category_id = matchedMCat._id;
          }
        }
      }

      if (listing_type && typeof listing_type === 'string' && listing_type !== 'ALL') {
        listingFilter.listing_type = listing_type;
      }

      if (city && typeof city === 'string' && city.trim() !== '') {
        listingFilter['location.city'] = new RegExp(city.trim(), 'i');
      }

      if (category && typeof category === 'string' && category !== 'ALL') {
        if (mongoose.Types.ObjectId.isValid(category)) {
          listingFilter.$or = [
            { category_id: new mongoose.Types.ObjectId(category) },
            { marketplace_category_id: new mongoose.Types.ObjectId(category) }
          ];
        } else {
          const matchedCategory: any = await ProductCategory.findOne({
            $or: [{ code: category.toUpperCase() }, { name: new RegExp(`^${category}$`, 'i') }]
          });
          const matchedMCat: any = await MarketplaceCategory.findOne({
            $or: [{ code: category.toUpperCase() }, { name: new RegExp(`^${category}$`, 'i') }]
          });
          const orFilters: any[] = [];
          if (matchedCategory) orFilters.push({ category_id: matchedCategory._id });
          if (matchedMCat) orFilters.push({ marketplace_category_id: matchedMCat._id });
          if (orFilters.length > 0) {
            listingFilter.$or = orFilters;
          }
        }
      }

      if (brand && typeof brand === 'string' && brand !== 'ALL') {
        if (mongoose.Types.ObjectId.isValid(brand)) {
          listingFilter.brand_id = new mongoose.Types.ObjectId(brand);
        } else {
          const matchedBrand = await ProductBrand.findOne({
            $or: [{ code: brand.toUpperCase() }, { name: new RegExp(`^${brand}$`, 'i') }]
          });
          if (matchedBrand) {
            listingFilter.brand_id = matchedBrand._id;
          }
        }
      }

      if (min_price || max_price) {
        listingFilter.listing_price = {};
        if (min_price) listingFilter.listing_price.$gte = Number(min_price);
        if (max_price) listingFilter.listing_price.$lte = Number(max_price);
      }

      // Sorting map
      let sortOptions: any = { created_at: -1 };
      if (sort === 'price_asc') sortOptions = { listing_price: 1 };
      else if (sort === 'price_desc') sortOptions = { listing_price: -1 };
      else if (sort === 'name_asc') sortOptions = { title: 1 };
      else if (sort === 'rating') sortOptions = { rating: -1 };

      let [listings, total] = await Promise.all([
        MarketplaceListing.find(listingFilter)
          .populate('marketplace_category_id', 'name code icon transaction_flow default_pricing_mode default_pricing_unit')
          .populate('category_data')
          .populate('category_id', 'name code description')
          .populate('brand_id', 'name logo_url')
          .populate('product_id', 'sku name image_url track_inventory')
          .populate('tenant_id', 'company_name name')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        MarketplaceListing.countDocuments(listingFilter)
      ]);

      // Fallback: If no dedicated listings exist yet, expose active ERP products as catalog items
      if (listings.length === 0 && total === 0) {
        const productFilter: any = { is_active: true, is_deleted: { $ne: true } };
        if (search && typeof search === 'string' && search.trim() !== '') {
          const searchRegex = new RegExp(search.trim(), 'i');
          productFilter.$or = [
            { name: searchRegex },
            { description: searchRegex },
            { sku: searchRegex }
          ];
        }
        if (category && typeof category === 'string' && category !== 'ALL') {
          if (mongoose.Types.ObjectId.isValid(category)) {
            productFilter.category_id = new mongoose.Types.ObjectId(category);
          }
        }
        if (brand && typeof brand === 'string' && brand !== 'ALL') {
          if (mongoose.Types.ObjectId.isValid(brand)) {
            productFilter.brand_id = new mongoose.Types.ObjectId(brand);
          }
        }
        if (min_price || max_price) {
          productFilter.selling_price = {};
          if (min_price) productFilter.selling_price.$gte = Number(min_price);
          if (max_price) productFilter.selling_price.$lte = Number(max_price);
        }

        let pSortOptions: any = { created_at: -1 };
        if (sort === 'price_asc') pSortOptions = { selling_price: 1 };
        else if (sort === 'price_desc') pSortOptions = { selling_price: -1 };
        else if (sort === 'name_asc') pSortOptions = { name: 1 };

        const [products, pTotal] = await Promise.all([
          Product.find(productFilter)
            .populate('category_id', 'name code')
            .populate('brand_id', 'name logo_url')
            .populate('tenant_id', 'company_name name')
            .sort(pSortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Product.countDocuments(productFilter)
        ]);

        total = pTotal;
        listings = products.map((p: any) => ({
          _id: p._id,
          id: p._id,
          product_id: p._id,
          tenant_id: p.tenant_id,
          title: p.name,
          name: p.name,
          slug: (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: p.description || '',
          category_id: p.category_id,
          brand_id: p.brand_id,
          listing_price: p.selling_price,
          selling_price: p.selling_price,
          tax_rate: p.tax_rate || 0,
          image_url: p.image_url || '',
          images: p.image_url ? [p.image_url] : [],
          status: 'PUBLISHED',
          is_published: true,
          rating: 4.5,
          rating_count: 12,
          sku: p.sku
        })) as any;
      }

      // Attach available stock safely and clean payload
      const hydratedData = await Promise.all(
        listings.map(async (l: any) => {
          let availableStock = 999;
          if (l.product_id) {
            const prodId = l.product_id?._id || l.product_id;
            availableStock = await MarketplaceInventoryService.getAvailableStock(prodId);
          }

          return {
            _id: l._id,
            id: l._id,
            product_id: l.product_id?._id || l.product_id,
            tenant_id: l.tenant_id,
            marketplace_category_id: l.marketplace_category_id,
            category_data: l.category_data,
            listing_type: l.listing_type || 'STANDARD',
            title: l.title || l.name,
            name: l.title || l.name,
            slug: l.slug,
            sku: l.product_id?.sku || l.sku || '',
            description: l.description,
            category_id: l.category_id,
            brand_id: l.brand_id,
            listing_price: l.listing_price || l.selling_price || 0,
            selling_price: l.listing_price || l.selling_price || 0,
            compare_price: l.compare_price,
            pricing: l.pricing || {
              mode: 'FIXED',
              amount: l.listing_price || l.selling_price || 0,
              currency: 'INR',
              unit: 'PER_UNIT',
              compare_amount: l.compare_price
            },
            location: l.location,
            availability: l.availability,
            tax_rate: l.tax_rate || 0,
            images: l.images && l.images.length > 0 ? l.images : (l.image_url ? [l.image_url] : []),
            image_url: l.images && l.images.length > 0 ? l.images[0] : (l.image_url || ''),
            rating: l.rating || 4.5,
            rating_count: l.rating_count || 1,
            is_featured: l.is_featured || false,
            available_stock: availableStock
          };
        })
      );

      res.status(200).json({
        success: true,
        data: hydratedData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: any) {
      console.error('Error in getCatalog:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to load catalog.' });
    }
  }

  /**
   * GET /api/marketplace/products/featured
   */
  static async getFeaturedListings(req: Request, res: Response): Promise<void> {
    try {
      let listings = await MarketplaceListing.find({
        is_published: true,
        status: 'PUBLISHED'
      })
        .populate('category_id', 'name code')
        .populate('brand_id', 'name logo_url')
        .populate('product_id', 'sku name image_url')
        .populate('tenant_id', 'company_name name')
        .sort({ rating: -1, created_at: -1 })
        .limit(8)
        .lean();

      if (listings.length === 0) {
        // Fallback to top products
        const products = await Product.find({ is_active: true, is_deleted: { $ne: true } })
          .populate('category_id', 'name code')
          .populate('brand_id', 'name logo_url')
          .populate('tenant_id', 'company_name name')
          .limit(8)
          .lean();

        listings = products.map((p: any) => ({
          _id: p._id,
          id: p._id,
          product_id: p._id,
          tenant_id: p.tenant_id,
          title: p.name,
          name: p.name,
          description: p.description,
          category_id: p.category_id,
          brand_id: p.brand_id,
          listing_price: p.selling_price,
          selling_price: p.selling_price,
          tax_rate: p.tax_rate,
          image_url: p.image_url,
          images: p.image_url ? [p.image_url] : [],
          rating: 4.8,
          rating_count: 24,
          sku: p.sku
        })) as any;
      }

      const formatted = listings.map((l: any) => ({
        _id: l._id,
        id: l._id,
        product_id: l.product_id?._id || l.product_id || l._id,
        tenant_id: l.tenant_id,
        title: l.title || l.name,
        name: l.title || l.name,
        sku: l.product_id?.sku || l.sku || '',
        description: l.description,
        category_id: l.category_id,
        brand_id: l.brand_id,
        listing_price: l.listing_price || l.selling_price || 0,
        selling_price: l.listing_price || l.selling_price || 0,
        image_url: l.images && l.images.length > 0 ? l.images[0] : (l.image_url || ''),
        images: l.images || (l.image_url ? [l.image_url] : []),
        rating: l.rating || 4.5,
        rating_count: l.rating_count || 12
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/products/:id or /api/products/:id
   */
  static async getProductDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const listingOrCriteria: any[] = [{ slug: id, is_published: true, status: 'PUBLISHED' }];
      if (isObjectId) {
        listingOrCriteria.push(
          { _id: new mongoose.Types.ObjectId(id), is_published: true, status: 'PUBLISHED' },
          { product_id: new mongoose.Types.ObjectId(id), is_published: true, status: 'PUBLISHED' }
        );
      }

      // Check if ID matches a MarketplaceListing
      let listing: any = await MarketplaceListing.findOne({ $or: listingOrCriteria })
        .populate('marketplace_category_id', 'name code icon transaction_flow default_pricing_mode default_pricing_unit media_requirements')
        .populate('category_data')
        .populate('category_id', 'name code description')
        .populate('brand_id', 'name logo_url')
        .populate('unit_id', 'name code')
        .populate('product_id', 'sku name image_url track_inventory')
        .populate('tenant_id', 'company_name name industry billing_address')
        .lean();

      let targetProductId: string | null = null;

      if (!listing && isObjectId) {
        // Fallback check in Product master
        const product: any = await Product.findOne({
          _id: new mongoose.Types.ObjectId(id),
          is_active: true,
          is_deleted: { $ne: true }
        })
          .populate('category_id', 'name code description')
          .populate('brand_id', 'name logo_url')
          .populate('unit_id', 'name code')
          .populate('tenant_id', 'company_name name industry billing_address')
          .lean();

        if (!product) {
          res.status(404).json({ success: false, error: 'Product or listing not found.' });
          return;
        }

        listing = {
          _id: product._id,
          id: product._id,
          product_id: product,
          tenant_id: product.tenant_id,
          title: product.name,
          name: product.name,
          slug: (product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sku: product.sku,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          unit_id: product.unit_id,
          listing_price: product.selling_price,
          selling_price: product.selling_price,
          tax_rate: product.tax_rate,
          image_url: product.image_url,
          images: product.image_url ? [product.image_url] : [],
          rating: 4.5,
          rating_count: 12
        };
        targetProductId = product._id.toString();
      } else if (listing) {
        if (listing.product_id) {
          targetProductId = (listing.product_id._id || listing.product_id).toString();
        }
      } else {
        res.status(404).json({ success: false, error: 'Listing not found.' });
        return;
      }

      // Real-time available inventory stock calculation (only for physical products)
      let availableStock = 999;
      if (targetProductId) {
        availableStock = await MarketplaceInventoryService.getAvailableStock(targetProductId);
      }

      // Fetch seller profile
      let sellerProfile: any = null;
      if (listing.tenant_id?._id || listing.tenant_id) {
        const sellerTenantId = listing.tenant_id._id || listing.tenant_id;
        sellerProfile = await MarketplaceSellerProfile.findOne({ tenant_id: sellerTenantId }).lean();
      }

      // Fetch related items in same category
      let relatedProducts: any[] = [];
      const catId = listing.category_id?._id || listing.category_id;
      if (catId) {
        relatedProducts = await MarketplaceListing.find({
          category_id: catId,
          _id: { $ne: listing._id },
          is_published: true,
          status: 'PUBLISHED'
        })
          .populate('tenant_id', 'company_name name')
          .limit(4)
          .lean();

        if (relatedProducts.length === 0) {
          const prods = await Product.find({
            category_id: catId,
            _id: { $ne: targetProductId },
            is_active: true,
            is_deleted: { $ne: true }
          })
            .populate('tenant_id', 'company_name name')
            .limit(4)
            .lean();
          relatedProducts = prods.map((p: any) => ({
            _id: p._id,
            id: p._id,
            title: p.name,
            name: p.name,
            listing_price: p.selling_price,
            selling_price: p.selling_price,
            image_url: p.image_url,
            images: p.image_url ? [p.image_url] : [],
            tenant_id: p.tenant_id
          }));
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...listing,
          id: listing._id,
          name: listing.title || listing.name,
          title: listing.title || listing.name,
          selling_price: listing.listing_price || listing.selling_price,
          listing_price: listing.listing_price || listing.selling_price,
          pricing: listing.pricing || {
            mode: 'FIXED',
            amount: listing.listing_price || listing.selling_price || 0,
            currency: 'INR',
            unit: 'PER_UNIT',
            compare_amount: listing.compare_price
          },
          sku: listing.product_id?.sku || listing.sku || '',
          images: listing.images && listing.images.length > 0 ? listing.images : (listing.image_url ? [listing.image_url] : []),
          image_url: listing.images && listing.images.length > 0 ? listing.images[0] : (listing.image_url || ''),
          available_stock: availableStock,
          seller_profile: sellerProfile,
          related_products: relatedProducts
        }
      });
    } catch (err: any) {
      console.error('Error in getProductDetails:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/categories or /api/categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ProductCategory.find({ is_active: true }).lean();

      // Count published items per category
      const counts = await MarketplaceListing.aggregate([
        { $match: { is_published: true, status: 'PUBLISHED' } },
        { $group: { _id: '$category_id', count: { $sum: 1 } } }
      ]);

      const countMap = new Map();
      counts.forEach(c => {
        if (c._id) countMap.set(c._id.toString(), c.count);
      });

      const data = categories.map((cat: any) => ({
        ...cat,
        product_count: countMap.get(cat._id ? cat._id.toString() : '') || 0
      }));

      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/brands or /api/brands
   */
  static async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await ProductBrand.find({ is_active: true }).lean();
      res.status(200).json({ success: true, data: brands });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/products/:id/reviews or /api/products/:id/reviews
   */
  static async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reviews = await ProductReview.find({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [
            { product_id: new mongoose.Types.ObjectId(id) },
            { listing_id: new mongoose.Types.ObjectId(id) }
          ] : [])
        ]
      })
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: reviews });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/products/:id/reviews or /api/products/:id/reviews
   */
  static async createProductReview(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, review_title, comment, buyer_name } = req.body;

      if (!rating || !comment) {
        res.status(400).json({ success: false, error: 'Rating and comment are required.' });
        return;
      }

      const reviewerName = req.buyer?.name || buyer_name || 'Verified Buyer';

      const review = await ProductReview.create({
        product_id: new mongoose.Types.ObjectId(id),
        buyer_id: req.buyer?.id ? new mongoose.Types.ObjectId(req.buyer.id) : undefined,
        buyer_name: reviewerName.trim(),
        rating: Math.min(5, Math.max(1, Number(rating))),
        review_title: review_title || '',
        comment: comment.trim(),
        is_verified_purchase: true,
        created_at: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback! Review submitted.',
        data: review
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/marketplace/wishlist or /api/wishlist
   */
  static async getWishlist(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.buyer?.id) {
        res.status(401).json({ success: false, error: 'Login required to view wishlist.' });
        return;
      }

      const wishlistItems = await Wishlist.find({ buyer_id: req.buyer.id })
        .populate('product_id', 'name sku selling_price image_url')
        .populate('listing_id', 'title listing_price images')
        .sort({ created_at: -1 })
        .lean();

      res.status(200).json({ success: true, data: wishlistItems });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/marketplace/wishlist/toggle or /api/wishlist/toggle
   */
  static async toggleWishlist(req: MarketplaceAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.buyer?.id) {
        res.status(401).json({ success: false, error: 'Login required to manage wishlist.' });
        return;
      }

      const { product_id, listing_id } = req.body;
      const targetId = product_id || listing_id;

      if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        res.status(400).json({ success: false, error: 'Valid product or listing ID required.' });
        return;
      }

      const pObjectId = new mongoose.Types.ObjectId(targetId);
      const existing = await Wishlist.findOne({
        buyer_id: req.buyer.id,
        $or: [{ product_id: pObjectId }, { listing_id: pObjectId }]
      });

      if (existing) {
        await Wishlist.deleteOne({ _id: existing._id });
        res.status(200).json({ success: true, message: 'Item removed from wishlist.', inWishlist: false });
      } else {
        await Wishlist.create({
          buyer_id: new mongoose.Types.ObjectId(req.buyer.id),
          product_id: pObjectId,
          listing_id: pObjectId,
          created_at: new Date()
        });
        res.status(201).json({ success: true, message: 'Item added to wishlist.', inWishlist: true });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default MarketplacePublicController;
