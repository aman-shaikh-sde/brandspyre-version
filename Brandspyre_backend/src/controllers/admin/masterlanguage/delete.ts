import { Request, Response } from "express";
import { LanguageMaster } from "../../../db/ModelSceham/adminSession/languagemaster";

export const deleteMasterLanguageInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const deleted = await LanguageMaster.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Language not found" });
      return;
    }
    res.status(200).json({ message: "Language deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deleteMasterLanguage Error: ${message}`);
    res.status(500).json({ error: message });
  }
};