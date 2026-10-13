import { Request, Response } from "express";
import { SoftwareMaster } from "../../../db/ModelSceham/adminSession/softwaremaster";

export const editMasterSoftwareInfo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, branchcode } = req.body;

  try {
    const updated = await SoftwareMaster.findByIdAndUpdate(id, { $set: { name, branchcode } }, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Software not found" });
      return;
    }
    res.status(200).json({ message: "Software updated successfully", data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`editMasterSoftware Error: ${message}`);
    res.status(500).json({ error: message });
  }
};