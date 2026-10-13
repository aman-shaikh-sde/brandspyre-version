import { Request, Response } from "express";
import { SoftwareMaster } from "../../../db/ModelSceham/adminSession/softwaremaster";

export const createMasterSoftwareInfo = async (req: Request, res: Response): Promise<void> => {
  const { name, branchcode } = req.body;

  try {
    if (!name) {
      res.status(400).json({ error: "Software name is required" });
      return;
    }

    const created = await SoftwareMaster.create({ name, branchcode });
    res.status(201).json({ message: "Software created successfully", data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`createMasterSoftware Error: ${message}`);
    res.status(500).json({ error: message });
  }
};