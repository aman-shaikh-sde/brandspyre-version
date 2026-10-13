import { Request, Response } from "express";
import { SoftwareMaster } from "../../../db/ModelSceham/adminSession/softwaremaster";

export const deleteMasterSoftwareInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const deleted = await SoftwareMaster.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Software not found" });
      return;
    }
    res.status(200).json({ message: "Software deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deleteMasterSoftware Error: ${message}`);
    res.status(500).json({ error: message });
  }
};