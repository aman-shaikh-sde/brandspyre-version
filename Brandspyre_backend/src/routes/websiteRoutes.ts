import express from "express";
import {
  createWebsite,
  getWebsites,
  updateWebsite,
  deleteWebsite,
  getWebsiteTemplates,
  createPage,
  getPages
} from "../controllers/websites/websiteController";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Apply tenant authentication middleware to all routes
router.use(tenantAuth());

// Website CRUD routes
router.post("/websites", createWebsite);
router.get("/websites", getWebsites);
router.put("/websites/:website_id", updateWebsite);
router.delete("/websites/:website_id", deleteWebsite);

// Template routes
router.get("/website-templates", getWebsiteTemplates);

// Page routes
router.post("/pages", createPage);
router.get("/pages", getPages);

export default router;
