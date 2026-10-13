import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// BRANCH MANAGMENTS
import { viewSetting } from "../controllers/accountSetting/view";
import {createSetting} from "../controllers/accountSetting/create"
import {editSetting} from "../controllers/accountSetting/edit"
import {deleteSetting} from "../controllers/accountSetting/delete"


const router = express.Router();

enum RoutePath {
  Setting = "setting",
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}
// ACCESS CONTROL MANAGMENT'S 
// example Route: /users/read,/users/read/:id 

router.get(`/${RoutePath.Setting}/${RouteAction.View}`,authMiddleware, tenantAuth(), viewSetting);
router.post(`/${RoutePath.Setting}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createSetting);
router.put(`/${RoutePath.Setting}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editSetting);
router.delete(`/${RoutePath.Setting}/${RouteAction.Delete}/:id`,authMiddleware, tenantAuth(), deleteSetting);


export default router;
