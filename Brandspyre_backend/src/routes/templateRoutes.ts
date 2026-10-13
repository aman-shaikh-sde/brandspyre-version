import express, { Request, Response } from "express";
import authMiddleware from "../middleware/auth";
import { tenantAuth } from "../middleware/tenantAuth";
import { Template } from "../db/ModelSceham/templateSchema";

const router = express.Router();

// Get template by name
router.get("/:name", authMiddleware, tenantAuth(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const template = await Template.findOne({ name });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.status(200).json({ status: true, data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Update or create template by name
router.put("/:name", authMiddleware, tenantAuth(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const { content, subject, custom_fields } = req.body;

    if (!content) {
      res.status(400).json({ error: "Template content is required" });
      return;
    }

    const template = await Template.findOneAndUpdate(
      { name },
      { content, subject, custom_fields, updated_at: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ status: true, message: "Template updated successfully", data: template });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;
