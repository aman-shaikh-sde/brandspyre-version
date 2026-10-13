import express from "express";
import {
  getTemplates,
  createProject,
  getProjects,
  updateProject,
  uploadAsset,
  getAssets,
  deleteProject
} from "../controllers/marketing/marketingController";
import authenticateToken from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Apply tenant authentication middleware to all routes
router.use(tenantAuth());

// Template routes
router.get("/templates", getTemplates);

// Project routes
router.post("/projects", createProject);
router.get("/projects", getProjects);
router.put("/projects/:project_id", updateProject);
router.delete("/projects/:project_id", deleteProject);

// Asset routes
router.post("/assets", uploadAsset);
router.get("/assets", getAssets);

export default router;
