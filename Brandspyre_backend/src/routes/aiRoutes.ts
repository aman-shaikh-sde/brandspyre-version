import express from "express";
import { chatWithAI, checkOllamaHealth } from "../controllers/ai/chat";
import authMiddleware from "../middleware/auth";
import { aiLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// AI Chat endpoints
router.post("/chat", aiLimiter, authMiddleware, chatWithAI);
router.get("/health", checkOllamaHealth);

export default router;
