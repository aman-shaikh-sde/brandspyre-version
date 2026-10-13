import mongoose from 'mongoose';
import { Request, Response } from "express";
import { Website, WebsitePage, WebsiteTemplate } from "../../db/ModelSceham/websiteSchema";
import { UserInfo } from "../../db/ModelSceham/userSchema";

export const createWebsite = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Website";
  const session = await mongoose.startSession();
  
  try {
    const { userId } = req.user as any;
    const { 
      tenant_id,
      site_name,
      site_domain,
      subdomain,
      site_description,
      site_type,
      template_id,
      site_config
    } = req.body;

    session.startTransaction();

    const [newWebsite] = await Website.create([{
      tenant_id,
      site_name,
      site_domain,
      subdomain,
      site_description,
      site_type: site_type || 'business',
      template_id,
      site_config: site_config || {},
      created_by: userId
    }], { session });

    await session.commitTransaction();

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: newWebsite
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getWebsites = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Websites";
  
  try {
    const { tenant_id, status } = req.query;

    let filter: any = {};
    if (tenant_id) filter.tenant_id = tenant_id;
    if (status) filter.status = status;

    const websites = await Website.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const formattedWebsites = await Promise.all(
      websites.map(async (w: any) => {
        const template = w.template_id ? await WebsiteTemplate.findOne({ id: w.template_id }).lean() as any : null;
        const user = w.created_by ? await UserInfo.findOne({ staff_id: w.created_by }).lean() as any : null;

        return {
          ...w,
          id: w._id,
          template_name: template?.template_name || '',
          creator_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '',
        };
      })
    );

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: formattedWebsites
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  }
};

export const updateWebsite = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Update Website";
  const session = await mongoose.startSession();
  
  try {
    const { website_id } = req.params;
    const { 
      tenant_id,
      site_name,
      site_description,
      site_config,
      custom_css,
      custom_js,
      status,
      is_published,
      published_url
    } = req.body;

    session.startTransaction();

    const updateData: any = {};
    if (site_name !== undefined) updateData.site_name = site_name;
    if (site_description !== undefined) updateData.site_description = site_description;
    if (site_config !== undefined) updateData.site_config = site_config;
    if (custom_css !== undefined) updateData.custom_css = custom_css;
    if (custom_js !== undefined) updateData.custom_js = custom_js;
    if (status !== undefined) updateData.status = status;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      if (is_published) updateData.published_at = new Date();
    }
    if (published_url !== undefined) updateData.published_url = published_url;
    updateData.updated_at = new Date();

    const filter: any = mongoose.Types.ObjectId.isValid(website_id) ? { _id: website_id } : { id: website_id };
    if (tenant_id) filter.tenant_id = tenant_id;

    const updated = await Website.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      res.status(404).json({ error: "Website not found" });
      return;
    }

    await session.commitTransaction();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: updated
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const deleteWebsite = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Delete Website";
  const session = await mongoose.startSession();
  
  try {
    const { website_id } = req.params;
    const { tenant_id } = req.body;

    session.startTransaction();

    const filter: any = mongoose.Types.ObjectId.isValid(website_id) ? { _id: website_id } : { id: website_id };
    if (tenant_id) filter.tenant_id = tenant_id;

    const deleted = await Website.findOneAndDelete(filter, { session });

    if (!deleted) {
      await session.abortTransaction();
      res.status(404).json({ error: "Website not found" });
      return;
    }

    await session.commitTransaction();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: deleted
    });

  } catch (error) { 
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  } finally {
    session.endSession();
  }
};

export const getWebsiteTemplates = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Website Templates";
  
  try {
    const { category } = req.query;

    let filter: any = { is_public: true };
    if (category) filter.template_category = category;

    const templates = await WebsiteTemplate.find(filter)
      .sort({ template_name: 1 })
      .lean();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: templates
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  }
};

export const createPage = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Create Website Page";
  
  try {
    const { 
      website_id,
      page_name,
      page_slug,
      page_title,
      page_description,
      page_content,
      page_type,
      is_homepage
    } = req.body;

    const page = await WebsitePage.create({
      website_id,
      page_name,
      page_slug,
      page_title,
      page_description,
      page_content: page_content || {},
      page_type: page_type || 'custom',
      is_homepage: is_homepage || false
    });

    res.status(201).json({ 
      message: `${msgField} Success`,
      data: page
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  }
};

export const getPages = async (req: Request, res: Response): Promise<void> => {
  const msgField = "Get Website Pages";
  
  try {
    const { website_id } = req.query;

    const pages = await WebsitePage.find({ website_id })
      .sort({ is_homepage: -1, display_order: 1, created_at: 1 })
      .lean();

    res.status(200).json({ 
      message: `${msgField} Success`,
      data: pages
    });

  } catch (error) { 
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${msgField} Error: ${message}`);
    res.status(500).json({ error: `${msgField} Error: ${message}` }); 
  }
};
