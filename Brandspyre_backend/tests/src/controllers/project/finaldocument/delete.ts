import { Request, Response } from 'express';
import { FinalDocument } from '../../../db/ModelSceham/project/client';
import fs from 'fs';
import path from 'path';
import { getTenantFilter } from '../../../utils/tenantScope';

export const deleteFinalDocument = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const tenantFilter = getTenantFilter(req);
    const document = await FinalDocument.findOne({ _id: id, ...tenantFilter });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const filename = document.description ? document.description.split(/[/\\]/).pop() : "";
    if (filename) {
      const fullPath = path.join(__dirname, '../../../../uploads/documents', filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await FinalDocument.deleteOne({ _id: id, ...tenantFilter });

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Delete Final Document Error:', message);
    res.status(500).json({ error: `Failed to delete document: ${message}` });
  }
};
