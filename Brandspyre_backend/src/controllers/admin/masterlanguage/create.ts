import { Request, Response } from "express";
import { LanguageMaster } from "../../../db/ModelSceham/adminSession/languagemaster";

export const createMasterLanguageInfo = async (req: Request, res: Response): Promise<void> => {
  const { name, branchcode } = req.body;

  try {
    if (!name) {
      res.status(400).json({ error: "Language name is required" });
      return;
    }

    const created = await LanguageMaster.create({ name, branchcode });
    res.status(201).json({ message: "Language created successfully", data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`createMasterLanguage Error: ${message}`);
    res.status(500).json({ error: message });
  }
};