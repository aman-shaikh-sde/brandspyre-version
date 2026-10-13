import { Request, Response } from 'express';
import { ClientDocument } from '../../../db/ModelSceham/project/client';

interface AuthenticatedUser {
  userId: number;
  userRole: string;
  brcode: string;
}

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const msgField = 'Upload Client Document';
  const { userId, brcode } = req.user as AuthenticatedUser;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { project_id, description = '' } = req.body;
  const filename = file.filename;
  const filePath = file.path;

  try {
    if (!project_id) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }

    const created = await ClientDocument.create({
      project_id,
      user_id: userId,
      branchcode: brcode,
      description,
      file_path: filePath,
      file_name: filename,
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
