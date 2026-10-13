import { Router } from "express";
import authMiddleware from "../middleware/auth";
import {
  getMasterData,
  getMasterCategories,
  createMasterItem,
  updateMasterItem,
  deleteMasterItem,
} from "../controllers/masterDataController";

const router = Router();

router.get("/masters", authMiddleware, getMasterData);
router.get("/masters/categories", authMiddleware, getMasterCategories);
router.post("/masters", authMiddleware, createMasterItem);
router.put("/masters/:id", authMiddleware, updateMasterItem);
router.delete("/masters/:id", authMiddleware, deleteMasterItem);

export default router;
