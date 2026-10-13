import { Request, Response } from 'express';
import { FinalDocument } from '../../../db/ModelSceham/project/client';

export const uploadFinalDocument = async (req: Request, res: Response): Promise<void> => {
  const msgField = 'Upload Final Document';
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { project_id, description } = req.body;
  const filePath = file.path;

  try {
    const created = await FinalDocument.create({
      project_id,
      description: description || file.filename,
      file_path: filePath,
      on_date: new Date()
    });

    const obj = created.toObject() as any;
    obj.id = obj._id.toString();

    res.status(200).json({ message: 'File uploaded successfully', data: obj });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${msgField} Error:`, message);
    res.status(500).json({ error: `${msgField} Error: ${message}` });
  }
};
