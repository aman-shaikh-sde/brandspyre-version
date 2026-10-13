import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// Import for Master Languages List
import { createMasterLanguageInfo } from "../controllers/admin/masterlanguage/create";
import { editMasterLanguageInfo } from "../controllers/admin/masterlanguage/edit";
import { viewMasterLanguageInfo } from "../controllers/admin/masterlanguage/view";
import { deleteMasterLanguageInfo } from "../controllers/admin/masterlanguage/delete";

// Import for Master Leave Types List
import { createMasterLeaveTypeInfo } from "../controllers/admin/masterleavetype/create";
import { editMasterLeaveTypeInfo } from "../controllers/admin/masterleavetype/edit";
import { viewMasterLeaveTypeInfo } from "../controllers/admin/masterleavetype/view";
import { deleteMasterLeaveTypeInfo } from "../controllers/admin/masterleavetype/delete";

// Import for Master Software List
import { createMasterSoftwareInfo } from "../controllers/admin/mastersoftware/create";
import { editMasterSoftwareInfo } from "../controllers/admin/mastersoftware/edit";
import { viewMasterSoftwareInfo } from "../controllers/admin/mastersoftware/view";
import { deleteMasterSoftwareInfo } from "../controllers/admin/mastersoftware/delete";


const router = express.Router();

enum RoutePath {
  master = "master",
}
enum RouteField {
  language = "language",
  leavetypes = "leavetypes",
  software = "software"
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}


// Create Master Languages List
router.get(`/${RoutePath.master}/${RouteField.language}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewMasterLanguageInfo);
router.post(`/${RoutePath.master}/${RouteField.language}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createMasterLanguageInfo);
router.put(`/${RoutePath.master}/${RouteField.language}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editMasterLanguageInfo);
router.delete(`/${RoutePath.master}/${RouteField.language}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteMasterLanguageInfo);

// Create Master Leave Types List
router.get(`/${RoutePath.master}/${RouteField.leavetypes}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewMasterLeaveTypeInfo);
router.post(`/${RoutePath.master}/${RouteField.leavetypes}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createMasterLeaveTypeInfo);
router.put(`/${RoutePath.master}/${RouteField.leavetypes}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editMasterLeaveTypeInfo);
router.delete(`/${RoutePath.master}/${RouteField.leavetypes}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(),  deleteMasterLeaveTypeInfo);

// Create Master Software List
router.get(`/${RoutePath.master}/${RouteField.software}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewMasterSoftwareInfo);
router.post(`/${RoutePath.master}/${RouteField.software}/${RouteAction.Create}`,authMiddleware, tenantAuth(), createMasterSoftwareInfo);
router.put(`/${RoutePath.master}/${RouteField.software}/${RouteAction.Edit}/:id`,authMiddleware, tenantAuth(), editMasterSoftwareInfo);
router.delete(`/${RoutePath.master}/${RouteField.software}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteMasterSoftwareInfo);





export default router;
