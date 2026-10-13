import { ClientDocument } from "../../../db/ModelSceham/project/client";
import { Request, Response } from "express";

export const getClientDocuments = async (req: Request, res: Response): Promise<void> => {
  const { project_id } = req.params;

  try {
    const result = await (async () => {
      const rows = await ClientDocument.find(
        { project_id: project_id },
        "id on_date file_path file_name"
      ).lean() as any[];
      return {
        rows: rows.map(r => ({
          ...r,
          id: r._id.toString(),
        })),
        rowCount: rows.length
      };
    })();

    const documents = result.rows
      .filter(row => row.file_path || row.file_name)
      .map((row) => {
        // Extract only the base filename (handles absolute paths dynamically)
        const fileName = row.file_name || (row.file_path ? row.file_path.split(/[/\\]/).pop() : "") || "document.pdf";
        return {
          id: row.id,
          uri: `documents/${fileName}`,
          fileType: fileName.split(".").pop() || "pdf",
          fileName: fileName,
          uploadedAt: row.on_date,
        };
      });

    res.status(200).json({ documents });
  } catch (error) {
    console.error("Get Documents Error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};
