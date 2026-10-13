import { DraftDocument } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

export const getDraftDocuments = async (req: Request, res: Response): Promise<void> => {
  const { project_id } = req.params;

  try {
    const rows = await DraftDocument.find(
      { project_id: project_id },
      "id on_date description"
    ).lean() as any[];

    const documents = rows.map((row) => {
      const fileNameExact = row.description || "";
      const baseFileName = fileNameExact.replace(/^https?:\/\/[^/]+[\\/]?/, "");
      const relativePath = baseFileName.split(/documents[\\/]/).pop() || "";
      const finalPath = `documents/${relativePath}`;
      const fullFileName = relativePath.split(/[/\\]/).pop() || "";
      const cleanedFileName = fullFileName.split("-").slice(2).join("-") || fullFileName;

      return {
        id: row._id.toString(),
        uri: finalPath,
        fileType: relativePath.split(".").pop() || "pdf",
        fileName: cleanedFileName,
        uploadedAt: row.on_date,
      };
    });

    res.status(200).json({ documents });
  } catch (error) {
    console.error("Get Draft Documents Error:", error);
    res.status(500).json({ error: "Failed to fetch draft documents" });
  }
};
