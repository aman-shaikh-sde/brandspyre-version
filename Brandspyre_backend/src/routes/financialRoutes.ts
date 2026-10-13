import express, {  Request, Response, NextFunction } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";

// FINANCIAL MANAGMENTS
import { viewFinancial } from "../controllers/financial/view";
import {createFinancial} from "../controllers/financial/create"
import {editFinancial} from "../controllers/financial/edit"
import {deleteFinancial} from "../controllers/financial/delete"


const router = express.Router();

enum RoutePath {
  Financial = "financial",
}

enum RouteAction {
  View = "read",
  Create = "create",
  Edit = "edit",
  Delete = "delete"
}
// USERS MANAGMENT'S 
// example Route: /users/read,/users/read/:id 

router.get(`/${RoutePath.Financial}/${RouteAction.View}`, authMiddleware, tenantAuth(), viewFinancial);
router.post(`/${RoutePath.Financial}/${RouteAction.Create}`, authMiddleware, tenantAuth(), createFinancial);
router.put(`/${RoutePath.Financial}/${RouteAction.Edit}/:id`, authMiddleware, tenantAuth(), editFinancial);
router.delete(`/${RoutePath.Financial}/${RouteAction.Delete}/:id`, authMiddleware, tenantAuth(), deleteFinancial);


export default router;
