import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  BlogPost,
  BlogCategory,
  Testimonial,
  ContentMedia,
} from "../../db/ModelSceham/publicContentSchema";
import PublicContentService from "../../services/saas/PublicContentService";

export class PublicContentController {
  // =========================================================================
  // 1. PUBLIC MARKETING ENDPOINTS (Unauthenticated)
  // =========================================================================

  /**
   * GET /api/public/blog
   * List published blog posts with pagination, category filter, search, and featured filter
   */
  static async getPublicBlogs(req: Request, res: Response): Promise<void> {
    try {
      // Auto-publish any scheduled posts that have matured
      await PublicContentService.autoPublishScheduledPosts();

      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || 12), 10)));
      const skip = (page - 1) * limit;

      const category = req.query.category ? String(req.query.category).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const featured = req.query.featured !== undefined ? String(req.query.featured) === "true" : undefined;

      const query: any = {
        status: "published",
        published_at: { $lte: new Date() },
      };

      if (category && category !== "all") {
        query.$or = [
          { category_name: { $regex: new RegExp(`^${category}$`, "i") } },
          { slug: { $regex: new RegExp(`^${category}$`, "i") } },
        ];
      }

      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { title: searchRegex },
            { subtitle: searchRegex },
            { excerpt: searchRegex },
            { category_name: searchRegex },
            { "seo.keywords": searchRegex },
          ],
        });
      }

      if (featured !== undefined) {
        query.featured = featured;
      }

      const total = await BlogPost.countDocuments(query);
      const posts = await BlogPost.find(query)
        .select(
          "_id slug title subtitle excerpt category_name category_id " +
            "author_name author_role author_avatar cover_image cover_image_alt " +
            "published_at read_time_minutes featured sort_order"
        )
        .sort({ sort_order: -1, published_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error: any) {
      console.error("Error in getPublicBlogs:", error);
      res.status(500).json({ success: false, error: "Failed to load blog posts." });
    }
  }

  /**
   * GET /api/public/blog/categories
   * List active blog categories for marketing filter
   */
  static async getPublicCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await BlogCategory.find({ is_active: true })
        .select("_id name slug description sort_order")
        .sort({ sort_order: 1, name: 1 })
        .lean();

      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      console.error("Error in getPublicCategories:", error);
      res.status(500).json({ success: false, error: "Failed to load categories." });
    }
  }

  /**
   * GET /api/public/blog/:slug
   * Fetch single published blog post by slug
   */
  static async getPublicBlogBySlug(req: Request, res: Response): Promise<void> {
    try {
      await PublicContentService.autoPublishScheduledPosts();

      const { slug } = req.params;
      const post = await BlogPost.findOne({
        slug: slug.toLowerCase().trim(),
        status: "published",
        published_at: { $lte: new Date() },
      })
        .select("-__v")
        .lean();

      if (!post) {
        res.status(404).json({ success: false, error: "Article not found or not published." });
        return;
      }

      // Fetch related articles in same category or latest
      const related = await BlogPost.find({
        _id: { $ne: post._id },
        status: "published",
        published_at: { $lte: new Date() },
      })
        .select(
          "_id slug title subtitle excerpt category_name " +
            "author_name author_role cover_image published_at read_time_minutes"
        )
        .sort({ category_name: post.category_name ? -1 : 1, published_at: -1 })
        .limit(3)
        .lean();

      res.status(200).json({
        success: true,
        data: {
          ...post,
          related,
        },
      });
    } catch (error: any) {
      console.error("Error in getPublicBlogBySlug:", error);
      res.status(500).json({ success: false, error: "Failed to load article." });
    }
  }

  /**
   * GET /api/public/testimonials
   * List published testimonials & case studies
   */
  static async getPublicTestimonials(req: Request, res: Response): Promise<void> {
    try {
      const featured = req.query.featured !== undefined ? String(req.query.featured) === "true" : undefined;
      const sector = req.query.sector ? String(req.query.sector).trim() : "";
      const industry = req.query.industry ? String(req.query.industry).trim() : "";
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || 20), 10)));

      const query: any = {
        status: "published",
        published_at: { $lte: new Date() },
      };

      if (featured !== undefined) {
        query.featured = featured;
      }

      if (sector && sector !== "all") {
        query.sector = { $regex: new RegExp(`^${sector}$`, "i") };
      }

      if (industry && industry !== "all") {
        query.industry = { $regex: new RegExp(`^${industry}$`, "i") };
      }

      const testimonials = await Testimonial.find(query)
        .select("-__v")
        .sort({ sort_order: 1, published_at: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({ success: true, data: testimonials });
    } catch (error: any) {
      console.error("Error in getPublicTestimonials:", error);
      res.status(500).json({ success: false, error: "Failed to load testimonials." });
    }
  }

  /**
   * GET /api/public/testimonials/:id
   */
  static async getPublicTestimonialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const query: any = {
        status: "published",
        published_at: { $lte: new Date() },
      };

      if (mongoose.Types.ObjectId.isValid(id)) {
        query._id = id;
      } else {
        query.headline = { $regex: new RegExp(`^${id}$`, "i") };
      }

      const item = await Testimonial.findOne(query).select("-__v").lean();
      if (!item) {
        res.status(404).json({ success: false, error: "Testimonial not found." });
        return;
      }

      res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      console.error("Error in getPublicTestimonialById:", error);
      res.status(500).json({ success: false, error: "Failed to load testimonial." });
    }
  }

  // =========================================================================
  // 2. CMS ADMIN & SALES ENDPOINTS (Protected with RBAC)
  // =========================================================================

  /**
   * GET /api/content/blog
   * Admin dashboard list of all posts with draft/scheduled status
   */
  static async getAdminBlogs(req: any, res: Response): Promise<void> {
    try {
      await PublicContentService.autoPublishScheduledPosts();

      const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 20), 10)));
      const skip = (page - 1) * limit;

      const status = req.query.status ? String(req.query.status).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const category = req.query.category ? String(req.query.category).trim() : "";

      const query: any = {};

      if (status && status !== "all") {
        query.status = status;
      }

      if (category && category !== "all") {
        query.category_name = { $regex: new RegExp(`^${category}$`, "i") };
      }

      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [{ title: searchRegex }, { slug: searchRegex }, { excerpt: searchRegex }, { author_name: searchRegex }];
      }

      const total = await BlogPost.countDocuments(query);
      const posts = await BlogPost.find(query)
        .select("-content_blocks -__v")
        .sort({ updated_at: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error: any) {
      console.error("Error in getAdminBlogs:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/content/blog/:id
   * Fetch full blog post for editing
   */
  static async getAdminBlogById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await BlogPost.findById(id).select("-__v").lean();

      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      res.status(200).json({ success: true, data: post });
    } catch (error: any) {
      console.error("Error in getAdminBlogById:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/blog
   * Create a new blog post
   */
  static async createBlog(req: any, res: Response): Promise<void> {
    try {
      const body = req.body;
      if (!body.title) {
        res.status(400).json({ success: false, error: "Title is required." });
        return;
      }

      const sanitizedBlocks = PublicContentService.sanitizeContentBlocks(body.content_blocks || []);
      const readTime = PublicContentService.calculateReadTime(sanitizedBlocks, body.excerpt);

      let slug = body.slug ? PublicContentService.sanitizeString(body.slug) : "";
      if (!slug) {
        slug = await PublicContentService.generateUniqueSlug(body.title);
      } else {
        slug = await PublicContentService.generateUniqueSlug(slug);
      }

      const status = ["draft", "scheduled", "published", "archived"].includes(body.status) ? body.status : "draft";
      let publishedAt: Date | undefined = undefined;
      let scheduledAt: Date | undefined = undefined;

      if (status === "published") {
        publishedAt = body.published_at ? new Date(body.published_at) : new Date();
      } else if (status === "scheduled") {
        scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : undefined;
      }

      const postData: any = {
        slug,
        title: PublicContentService.sanitizeString(body.title),
        subtitle: PublicContentService.sanitizeString(body.subtitle),
        excerpt: PublicContentService.sanitizeString(body.excerpt || ""),
        category_id: body.category_id || undefined,
        category_name: PublicContentService.sanitizeString(body.category_name || "General"),
        author_id: req.user?.userId || body.author_id,
        author_name: PublicContentService.sanitizeString(body.author_name || req.user?.name || "Brandspyre Editorial"),
        author_role: PublicContentService.sanitizeString(body.author_role || "Platform Architecture"),
        author_avatar: PublicContentService.sanitizeUrl(body.author_avatar),
        cover_image: PublicContentService.sanitizeUrl(body.cover_image),
        cover_image_alt: PublicContentService.sanitizeString(body.cover_image_alt),
        status,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        read_time_minutes: body.read_time_minutes || readTime,
        featured: Boolean(body.featured),
        sort_order: Number(body.sort_order || 0),
        content_blocks: sanitizedBlocks,
        seo: {
          meta_title: PublicContentService.sanitizeString(body.seo?.meta_title || body.title),
          meta_description: PublicContentService.sanitizeString(body.seo?.meta_description || body.excerpt),
          canonical_url: PublicContentService.sanitizeUrl(body.seo?.canonical_url),
          og_title: PublicContentService.sanitizeString(body.seo?.og_title || body.title),
          og_description: PublicContentService.sanitizeString(body.seo?.og_description || body.excerpt),
          og_image: PublicContentService.sanitizeUrl(body.seo?.og_image || body.cover_image),
          keywords: Array.isArray(body.seo?.keywords) ? body.seo.keywords.map((k: any) => PublicContentService.sanitizeString(k)) : [],
        },
        scope: "global",
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
      };

      const newPost = await BlogPost.create(postData);

      res.status(201).json({
        success: true,
        message: `Blog post '${newPost.title}' created successfully.`,
        data: newPost,
      });
    } catch (error: any) {
      console.error("Error in createBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/content/blog/:id
   * Update existing blog post
   */
  static async updateBlog(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body;

      const post = await BlogPost.findById(id);
      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      let slug = post.slug;
      if (body.slug && body.slug !== post.slug) {
        slug = await PublicContentService.generateUniqueSlug(body.slug, id);
      }

      let sanitizedBlocks = post.content_blocks;
      if (body.content_blocks !== undefined) {
        sanitizedBlocks = PublicContentService.sanitizeContentBlocks(body.content_blocks);
      }

      const readTime = PublicContentService.calculateReadTime(sanitizedBlocks, body.excerpt || post.excerpt);

      const status = body.status ? body.status : post.status;
      let publishedAt = post.published_at;
      let scheduledAt = post.scheduled_at;

      if (status === "published" && !publishedAt) {
        publishedAt = body.published_at ? new Date(body.published_at) : new Date();
      } else if (status === "scheduled") {
        scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : post.scheduled_at;
      }

      const updateData: any = {
        slug,
        title: body.title !== undefined ? PublicContentService.sanitizeString(body.title) : post.title,
        subtitle: body.subtitle !== undefined ? PublicContentService.sanitizeString(body.subtitle) : post.subtitle,
        excerpt: body.excerpt !== undefined ? PublicContentService.sanitizeString(body.excerpt) : post.excerpt,
        category_id: body.category_id !== undefined ? body.category_id : post.category_id,
        category_name: body.category_name !== undefined ? PublicContentService.sanitizeString(body.category_name) : post.category_name,
        author_name: body.author_name !== undefined ? PublicContentService.sanitizeString(body.author_name) : post.author_name,
        author_role: body.author_role !== undefined ? PublicContentService.sanitizeString(body.author_role) : post.author_role,
        author_avatar: body.author_avatar !== undefined ? PublicContentService.sanitizeUrl(body.author_avatar) : post.author_avatar,
        cover_image: body.cover_image !== undefined ? PublicContentService.sanitizeUrl(body.cover_image) : post.cover_image,
        cover_image_alt: body.cover_image_alt !== undefined ? PublicContentService.sanitizeString(body.cover_image_alt) : post.cover_image_alt,
        status,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        read_time_minutes: body.read_time_minutes || readTime,
        featured: body.featured !== undefined ? Boolean(body.featured) : post.featured,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : post.sort_order,
        content_blocks: sanitizedBlocks,
        seo: body.seo ? {
          meta_title: PublicContentService.sanitizeString(body.seo.meta_title || post.title),
          meta_description: PublicContentService.sanitizeString(body.seo.meta_description || post.excerpt),
          canonical_url: PublicContentService.sanitizeUrl(body.seo.canonical_url),
          og_title: PublicContentService.sanitizeString(body.seo.og_title || post.title),
          og_description: PublicContentService.sanitizeString(body.seo.og_description || post.excerpt),
          og_image: PublicContentService.sanitizeUrl(body.seo.og_image || post.cover_image),
          keywords: Array.isArray(body.seo.keywords) ? body.seo.keywords.map((k: any) => PublicContentService.sanitizeString(k)) : post.seo?.keywords,
        } : post.seo,
        updated_by: req.user?.userId,
        updated_at: new Date(),
      };

      const updated = await BlogPost.findByIdAndUpdate(id, updateData, { new: true }).lean();

      res.status(200).json({
        success: true,
        message: "Blog post updated successfully.",
        data: updated,
      });
    } catch (error: any) {
      console.error("Error in updateBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/content/blog/:id
   */
  static async deleteBlog(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await BlogPost.findByIdAndDelete(id);

      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      res.status(200).json({ success: true, message: "Blog post deleted successfully." });
    } catch (error: any) {
      console.error("Error in deleteBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/blog/:id/publish
   */
  static async publishBlog(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await BlogPost.findByIdAndUpdate(
        id,
        {
          status: "published",
          published_at: new Date(),
          updated_by: req.user?.userId,
          updated_at: new Date(),
        },
        { new: true }
      );

      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      res.status(200).json({ success: true, message: "Blog post published successfully.", data: post });
    } catch (error: any) {
      console.error("Error in publishBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/blog/:id/unpublish
   */
  static async unpublishBlog(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await BlogPost.findByIdAndUpdate(
        id,
        {
          status: "draft",
          updated_by: req.user?.userId,
          updated_at: new Date(),
        },
        { new: true }
      );

      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      res.status(200).json({ success: true, message: "Blog post unpublished to draft.", data: post });
    } catch (error: any) {
      console.error("Error in unpublishBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/blog/:id/schedule
   */
  static async scheduleBlog(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduled_at } = req.body;

      if (!scheduled_at) {
        res.status(400).json({ success: false, error: "Scheduled date & time is required." });
        return;
      }

      const post = await BlogPost.findByIdAndUpdate(
        id,
        {
          status: "scheduled",
          scheduled_at: new Date(scheduled_at),
          updated_by: req.user?.userId,
          updated_at: new Date(),
        },
        { new: true }
      );

      if (!post) {
        res.status(404).json({ success: false, error: "Blog post not found." });
        return;
      }

      res.status(200).json({ success: true, message: "Blog post scheduled successfully.", data: post });
    } catch (error: any) {
      console.error("Error in scheduleBlog:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =========================================================================
  // 3. BLOG CATEGORY MANAGEMENT
  // =========================================================================

  /**
   * GET /api/content/categories
   */
  static async getCategories(req: any, res: Response): Promise<void> {
    try {
      const categories = await BlogCategory.find().sort({ sort_order: 1, name: 1 }).lean();
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      console.error("Error in getCategories:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/categories
   */
  static async createCategory(req: any, res: Response): Promise<void> {
    try {
      const { name, description, is_active, sort_order } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: "Category name is required." });
        return;
      }

      const slug = await PublicContentService.generateUniqueSlug(name, undefined, true);

      const category = await BlogCategory.create({
        name: PublicContentService.sanitizeString(name),
        slug,
        description: PublicContentService.sanitizeString(description),
        is_active: is_active !== false,
        sort_order: Number(sort_order || 0),
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
      });

      res.status(201).json({ success: true, message: "Category created.", data: category });
    } catch (error: any) {
      console.error("Error in createCategory:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/content/categories/:id
   */
  static async updateCategory(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, is_active, sort_order } = req.body;

      const category = await BlogCategory.findById(id);
      if (!category) {
        res.status(404).json({ success: false, error: "Category not found." });
        return;
      }

      let slug = category.slug;
      if (name && name !== category.name) {
        slug = await PublicContentService.generateUniqueSlug(name, id, true);
      }

      const updated = await BlogCategory.findByIdAndUpdate(
        id,
        {
          name: name ? PublicContentService.sanitizeString(name) : category.name,
          slug,
          description: description !== undefined ? PublicContentService.sanitizeString(description) : category.description,
          is_active: is_active !== undefined ? Boolean(is_active) : category.is_active,
          sort_order: sort_order !== undefined ? Number(sort_order) : category.sort_order,
          updated_by: req.user?.userId,
          updated_at: new Date(),
        },
        { new: true }
      );

      res.status(200).json({ success: true, message: "Category updated.", data: updated });
    } catch (error: any) {
      console.error("Error in updateCategory:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/content/categories/:id
   */
  static async deleteCategory(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await BlogCategory.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Category deleted." });
    } catch (error: any) {
      console.error("Error in deleteCategory:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =========================================================================
  // 4. TESTIMONIAL & CASE STUDY MANAGEMENT
  // =========================================================================

  /**
   * GET /api/content/testimonials
   */
  static async getAdminTestimonials(req: any, res: Response): Promise<void> {
    try {
      const status = req.query.status ? String(req.query.status).trim() : "";
      const query: any = {};
      if (status && status !== "all") {
        query.status = status;
      }

      const items = await Testimonial.find(query).sort({ sort_order: 1, created_at: -1 }).lean();
      res.status(200).json({ success: true, data: items });
    } catch (error: any) {
      console.error("Error in getAdminTestimonials:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/content/testimonials/:id
   */
  static async getAdminTestimonialById(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Testimonial.findById(id).select("-__v").lean();
      if (!item) {
        res.status(404).json({ success: false, error: "Testimonial not found." });
        return;
      }
      res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      console.error("Error in getAdminTestimonialById:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/testimonials
   */
  static async createTestimonial(req: any, res: Response): Promise<void> {
    try {
      const body = req.body;
      if (!body.person_name || !body.sector || !body.testimonial_quote) {
        res.status(400).json({ success: false, error: "Person name, sector, and testimonial quote are required." });
        return;
      }

      const item = await Testimonial.create({
        person_name: PublicContentService.sanitizeString(body.person_name),
        person_role: PublicContentService.sanitizeString(body.person_role || "Customer"),
        company_name: PublicContentService.sanitizeString(body.company_name || "Enterprise Client"),
        company_logo: PublicContentService.sanitizeUrl(body.company_logo),
        person_avatar: PublicContentService.sanitizeUrl(body.person_avatar),
        industry: PublicContentService.sanitizeString(body.industry),
        sector: PublicContentService.sanitizeString(body.sector),
        testimonial_quote: PublicContentService.sanitizeString(body.testimonial_quote),
        rating: Number(body.rating || 5),
        headline: PublicContentService.sanitizeString(body.headline),
        challenge: PublicContentService.sanitizeString(body.challenge),
        solution: PublicContentService.sanitizeString(body.solution),
        outcome: PublicContentService.sanitizeString(body.outcome),
        modules_used: Array.isArray(body.modules_used)
          ? body.modules_used.map((m: any) => PublicContentService.sanitizeString(m)).filter(Boolean)
          : [],
        location: PublicContentService.sanitizeString(body.location),
        featured: Boolean(body.featured),
        sort_order: Number(body.sort_order || 0),
        status: ["draft", "published", "archived"].includes(body.status) ? body.status : "published",
        published_at: body.status === "draft" ? undefined : new Date(),
        scope: "global",
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
      });

      res.status(201).json({ success: true, message: "Testimonial created.", data: item });
    } catch (error: any) {
      console.error("Error in createTestimonial:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/content/testimonials/:id
   */
  static async updateTestimonial(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body;

      const item = await Testimonial.findById(id);
      if (!item) {
        res.status(404).json({ success: false, error: "Testimonial not found." });
        return;
      }

      const updateData: any = {
        person_name: body.person_name !== undefined ? PublicContentService.sanitizeString(body.person_name) : item.person_name,
        person_role: body.person_role !== undefined ? PublicContentService.sanitizeString(body.person_role) : item.person_role,
        company_name: body.company_name !== undefined ? PublicContentService.sanitizeString(body.company_name) : item.company_name,
        company_logo: body.company_logo !== undefined ? PublicContentService.sanitizeUrl(body.company_logo) : item.company_logo,
        person_avatar: body.person_avatar !== undefined ? PublicContentService.sanitizeUrl(body.person_avatar) : item.person_avatar,
        industry: body.industry !== undefined ? PublicContentService.sanitizeString(body.industry) : item.industry,
        sector: body.sector !== undefined ? PublicContentService.sanitizeString(body.sector) : item.sector,
        testimonial_quote: body.testimonial_quote !== undefined ? PublicContentService.sanitizeString(body.testimonial_quote) : item.testimonial_quote,
        rating: body.rating !== undefined ? Number(body.rating) : item.rating,
        headline: body.headline !== undefined ? PublicContentService.sanitizeString(body.headline) : item.headline,
        challenge: body.challenge !== undefined ? PublicContentService.sanitizeString(body.challenge) : item.challenge,
        solution: body.solution !== undefined ? PublicContentService.sanitizeString(body.solution) : item.solution,
        outcome: body.outcome !== undefined ? PublicContentService.sanitizeString(body.outcome) : item.outcome,
        modules_used: body.modules_used !== undefined
          ? (Array.isArray(body.modules_used) ? body.modules_used.map((m: any) => PublicContentService.sanitizeString(m)).filter(Boolean) : [])
          : item.modules_used,
        location: body.location !== undefined ? PublicContentService.sanitizeString(body.location) : item.location,
        featured: body.featured !== undefined ? Boolean(body.featured) : item.featured,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : item.sort_order,
        status: body.status !== undefined ? body.status : item.status,
        updated_by: req.user?.userId,
        updated_at: new Date(),
      };

      const updated = await Testimonial.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ success: true, message: "Testimonial updated.", data: updated });
    } catch (error: any) {
      console.error("Error in updateTestimonial:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/content/testimonials/:id
   */
  static async deleteTestimonial(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await Testimonial.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Testimonial deleted." });
    } catch (error: any) {
      console.error("Error in deleteTestimonial:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/testimonials/:id/publish
   */
  static async publishTestimonial(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await Testimonial.findByIdAndUpdate(
        id,
        { status: "published", published_at: new Date(), updated_by: req.user?.userId, updated_at: new Date() },
        { new: true }
      );
      res.status(200).json({ success: true, message: "Testimonial published.", data: updated });
    } catch (error: any) {
      console.error("Error in publishTestimonial:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/content/testimonials/:id/unpublish
   */
  static async unpublishTestimonial(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await Testimonial.findByIdAndUpdate(
        id,
        { status: "draft", updated_by: req.user?.userId, updated_at: new Date() },
        { new: true }
      );
      res.status(200).json({ success: true, message: "Testimonial unpublished to draft.", data: updated });
    } catch (error: any) {
      console.error("Error in unpublishTestimonial:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =========================================================================
  // 5. CMS MEDIA UPLOAD & ASSETS
  // =========================================================================

  /**
   * POST /api/content/media/upload
   */
  static async uploadMedia(req: any, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: "No image file provided." });
        return;
      }

      const fileUrl = `/uploads/public-content/${file.filename}`;

      const mediaRecord = await ContentMedia.create({
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        url: fileUrl,
        alt_text: req.body.alt_text || file.originalname,
        caption: req.body.caption || "",
        scope: "global",
        created_by: req.user?.userId,
      });

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        data: {
          url: fileUrl,
          filename: file.filename,
          mediaId: mediaRecord._id,
        },
      });
    } catch (error: any) {
      console.error("Error in uploadMedia:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/content/media
   */
  static async getMediaList(req: any, res: Response): Promise<void> {
    try {
      const media = await ContentMedia.find().sort({ created_at: -1 }).limit(100).lean();
      res.status(200).json({ success: true, data: media });
    } catch (error: any) {
      console.error("Error in getMediaList:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/content/media/:id
   */
  static async deleteMedia(req: any, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const media = await ContentMedia.findByIdAndDelete(id);

      if (media && media.filename) {
        const filePath = path.join(__dirname, "../../../uploads/public-content", media.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(200).json({ success: true, message: "Media asset deleted." });
    } catch (error: any) {
      console.error("Error in deleteMedia:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default PublicContentController;
