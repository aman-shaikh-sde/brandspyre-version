import { Request, Response } from "express";
import { LanguageMaster } from "../../../db/ModelSceham/adminSession/languagemaster";

export const editMasterLanguageInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, branchcode } = req.body;

  try {
    const updated = await LanguageMaster.findByIdAndUpdate(id, { $set: { name, branchcode } }, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Language not found" });
      return;
    }
    res.status(200).json({ message: "Language updated successfully", data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`editMasterLanguage Error: ${message}`);
    res.status(500).json({ error: message });
  }
};