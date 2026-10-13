import mongoose from 'mongoose';
import { Request, Response } from "express";
import { MarketingTemplate, MarketingProject, MarketingAsset } from "../../db/ModelSceham/marketingSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";
import { Sequence } from "../../db/ModelSceham/sequenceSchema";

interface AuthenticatedUser {
  userId: string;
  userRole: string;
  brcode: string;
}

const getNextId = async (name: string, session?: mongoose.ClientSession): Promise<number> => {
  const seqVal = await Sequence.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { upsert: true, new: true, session }
  );
  return seqVal.value;
};

export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Marketing Templates";
  
  try {
    const { tenant_id, template_type, category } = req.query;

    const filter: any = {
      $or: [
        { tenant_id: Number(tenant_id) },
        { is_public: true }
      ]
    };

    if (template_type) filter.template_type = template_type;
    if (category) filter.category = category;

    const templates = await MarketingTemplate.find(filter).sort({ created_at: -1 }).lean() as any[];

    const data = await Promise.all(templates.map(async (t: any) => {
      const creator = await UserInfo.findOne({ psn: t.created_by }).lean() as any;
      return {
        ...t,
        id: t.id,
        creator_name: creator?.firstname || ''
      };
    }));

    res.status(200).json({ 
      message: `${msgField} Success`,
      data
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Marketing Project";
  const session = await mongoose.startSession();
  
  try {
    const { userId } = req.user as any;
    const { 
      tenant_id,
      project_name,
      project_type,
      template_id,
      project_data
    } = req.body;

    session.startTransaction();

    const creatorUser = await UserInfo.findOne({ staff_id: userId }).session(session).lean() as any;
    const creatorPsn = creatorUser?.psn || 0;

    const projectId = await getNextId('marketing_project_id_seq', session);

    const [newProject] = await MarketingProject.create([{
      id: projectId,
      tenant_id: Number(tenant_id),
      project_name,
      project_type,
      template_id: template_id ? Number(template_id) : undefined,
      project_data: project_data || {},
      created_by: creatorPsn
    }], { session });

    await session.commitTransaction();

    const projectObj = newProject.toObject() as any;
    projectObj.id = projectId;

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: projectObj
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Marketing Projects";
  
  try {
    const { tenant_id, status } = req.query;

    const filter: any = { tenant_id: Number(tenant_id) };
    if (status) filter.status = status;

    const projects = await MarketingProject.find(filter).sort({ created_at: -1 }).lean() as any[];

    const data = await Promise.all(projects.map(async (p: any) => {
      const template = p.template_id ? await MarketingTemplate.findOne({ id: p.template_id }).lean() as any : null;
      const creator = await UserInfo.findOne({ psn: p.created_by }).lean() as any;
      return {
        ...p,
        id: p.id,
        template_name: template?.template_name || '',
        creator_name: creator?.firstname || ''
      };
    }));

    res.status(200).json({ 
      message: `${msgField} Success`,
      data
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Marketing Project";
  const session = await mongoose.startSession();
  
  try {
    const { project_id } = req.params;
    const pid = Number(project_id);
    const { 
      project_name,
      project_data,
      status,
      output_url,
      output_thumbnail,
      tenant_id
    } = req.body;

    session.startTransaction();

    const updateData: any = { updated_at: new Date() };
    if (project_name !== undefined) updateData.project_name = project_name;
    if (project_data !== undefined) updateData.project_data = project_data;
    if (status !== undefined) updateData.status = status;
    if (output_url !== undefined) updateData.output_url = output_url;
    if (output_thumbnail !== undefined) updateData.output_thumbnail = output_thumbnail;

    const updated = await MarketingProject.findOneAndUpdate(
      { id: pid, tenant_id: Number(tenant_id) },
      { $set: updateData },
      { new: true, session }
    ).lean() as any;

    if (!updated) {
      await session.abortTransaction();
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await session.commitTransaction();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: {
        ...updated,
        id: updated.id
      }
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Upload Marketing Asset";
  const session = await mongoose.startSession();
  
  try {
    const { userId } = req.user as any;
    const { tenant_id, asset_name, asset_type, asset_url, asset_size, mime_type, width, height, duration_seconds } = req.body;

    session.startTransaction();

    const creatorUser = await UserInfo.findOne({ staff_id: userId }).session(session).lean() as any;
    const creatorPsn = creatorUser?.psn || 0;

    const assetId = await getNextId('marketing_asset_id_seq', session);

    const [newAsset] = await MarketingAsset.create([{
      id: assetId,
      tenant_id: Number(tenant_id),
      asset_name,
      asset_type,
      asset_url,
      asset_size: asset_size ? Number(asset_size) : undefined,
      mime_type,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      duration_seconds: duration_seconds ? Number(duration_seconds) : undefined,
      created_by: creatorPsn
    }], { session });

    await session.commitTransaction();

    const assetObj = newAsset.toObject() as any;
    assetObj.id = assetId;

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: assetObj
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getAssets = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Marketing Assets";
  
  try {
    const { tenant_id, asset_type } = req.query;

    const filter: any = { tenant_id: Number(tenant_id) };
    if (asset_type) filter.asset_type = asset_type;

    const assets = await MarketingAsset.find(filter).sort({ created_at: -1 }).lean() as any[];

    const data = assets.map((a: any) => ({
      ...a,
      id: a.id
    }));

    res.status(200).json({ 
      message: `${msgField} Success`,
      data
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Delete Marketing Project";
  const session = await mongoose.startSession();
  
  try {
    const { project_id } = req.params;
    const pid = Number(project_id);
    const { tenant_id } = req.body;

    session.startTransaction();

    const deleted = await MarketingProject.findOneAndDelete({
      id: pid,
      tenant_id: Number(tenant_id)
    }).session(session).lean() as any;

    if (!deleted) {
      await session.abortTransaction();
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await session.commitTransaction();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: {
        ...deleted,
        id: deleted.id
      }
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${msgField} Causes Error Message: ${message}`);
    res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
  } finally {
    session.endSession();
  }
};
