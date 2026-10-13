import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/auth";
import { authorizePermission } from "../middleware/authorize";
import PublicContentController from "../controllers/saas/publicContentController";

// Configure Multer for Public CMS Media Uploads
const uploadsDir = path.join(__dirname, "../../uploads/public-content");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `cms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/jpg"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed."));
  }
};

const cmsUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// =========================================================================
// 1. PUBLIC ROUTER (Unauthenticated, Read-Only)
// Mounted at: /api/public
// =========================================================================
export const publicContentPublicRouter = Router();

publicContentPublicRouter.get("/blog/categories", PublicContentController.getPublicCategories);
publicContentPublicRouter.get("/blog", PublicContentController.getPublicBlogs);
publicContentPublicRouter.get("/blog/:slug", PublicContentController.getPublicBlogBySlug);

publicContentPublicRouter.get("/testimonials", PublicContentController.getPublicTestimonials);
publicContentPublicRouter.get("/testimonials/:id", PublicContentController.getPublicTestimonialById);

// =========================================================================
// 2. CMS ADMIN ROUTER (Authenticated & RBAC Enforced)
// Mounted at: /api/content
// =========================================================================
export const publicContentAdminRouter = Router();

publicContentAdminRouter.use(authMiddleware);

// Blog Management
publicContentAdminRouter.get(
  "/blog",
  authorizePermission("content.blog.read"),
  PublicContentController.getAdminBlogs
);
publicContentAdminRouter.post(
  "/blog",
  authorizePermission("content.blog.create"),
  PublicContentController.createBlog
);
publicContentAdminRouter.get(
  "/blog/:id",
  authorizePermission("content.blog.read"),
  PublicContentController.getAdminBlogById
);
publicContentAdminRouter.put(
  "/blog/:id",
  authorizePermission("content.blog.update"),
  PublicContentController.updateBlog
);
publicContentAdminRouter.delete(
  "/blog/:id",
  authorizePermission("content.blog.delete"),
  PublicContentController.deleteBlog
);
publicContentAdminRouter.post(
  "/blog/:id/publish",
  authorizePermission("content.blog.publish"),
  PublicContentController.publishBlog
);
publicContentAdminRouter.post(
  "/blog/:id/unpublish",
  authorizePermission("content.blog.publish"),
  PublicContentController.unpublishBlog
);
publicContentAdminRouter.post(
  "/blog/:id/schedule",
  authorizePermission("content.blog.publish"),
  PublicContentController.scheduleBlog
);

// Categories Management
publicContentAdminRouter.get(
  "/categories",
  authorizePermission("content.blog.read"),
  PublicContentController.getCategories
);
publicContentAdminRouter.post(
  "/categories",
  authorizePermission("content.category.manage"),
  PublicContentController.createCategory
);
publicContentAdminRouter.put(
  "/categories/:id",
  authorizePermission("content.category.manage"),
  PublicContentController.updateCategory
);
publicContentAdminRouter.delete(
  "/categories/:id",
  authorizePermission("content.category.manage"),
  PublicContentController.deleteCategory
);

// Testimonials Management
publicContentAdminRouter.get(
  "/testimonials",
  authorizePermission("content.testimonial.read"),
  PublicContentController.getAdminTestimonials
);
publicContentAdminRouter.post(
  "/testimonials",
  authorizePermission("content.testimonial.create"),
  PublicContentController.createTestimonial
);
publicContentAdminRouter.get(
  "/testimonials/:id",
  authorizePermission("content.testimonial.read"),
  PublicContentController.getAdminTestimonialById
);
publicContentAdminRouter.put(
  "/testimonials/:id",
  authorizePermission("content.testimonial.update"),
  PublicContentController.updateTestimonial
);
publicContentAdminRouter.delete(
  "/testimonials/:id",
  authorizePermission("content.testimonial.delete"),
  PublicContentController.deleteTestimonial
);
publicContentAdminRouter.post(
  "/testimonials/:id/publish",
  authorizePermission("content.testimonial.publish"),
  PublicContentController.publishTestimonial
);
publicContentAdminRouter.post(
  "/testimonials/:id/unpublish",
  authorizePermission("content.testimonial.publish"),
  PublicContentController.unpublishTestimonial
);

// Media Uploads
publicContentAdminRouter.post(
  "/media/upload",
  authorizePermission("content.media.upload"),
  cmsUpload.single("file"),
  PublicContentController.uploadMedia
);
publicContentAdminRouter.get(
  "/media",
  authorizePermission("content.media.upload"),
  PublicContentController.getMediaList
);
publicContentAdminRouter.delete(
  "/media/:id",
  authorizePermission("content.media.delete"),
  PublicContentController.deleteMedia
);

export default {
  publicContentPublicRouter,
  publicContentAdminRouter,
};
