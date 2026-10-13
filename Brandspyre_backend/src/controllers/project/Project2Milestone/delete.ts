import { Request, Response } from "express";
import { Milestone, Project } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface data {
    branchcode: string,
    project_code?: string,
    milestone_code?: string,
    status?:string,
    delete_type?:string,
    // ✅ Add this line:
    [key: string]: string | undefined;
  }
  
  export const deleteProjectMilestone = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Project Milestone Info`;
    const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
    const { data } = req.body as { data: data };
    const loginId = String(idObj);
  
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
        const isPlatform = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((userRole || '').toLowerCase());
        const targetCode = typeof data.milestone_code === 'string' ? data.milestone_code.trim() : '';

        const milestoneFilter: any = {
          $or: [
            { milestone_code: targetCode },
            { milestone_code: new RegExp(`^${targetCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
          ]
        };
        if (!isPlatform) {
          if (!tenantId) throw new Error("Organization context required to delete milestone");
          milestoneFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }

        const milestone = await Milestone.findOne(milestoneFilter).session(session);
        if (!milestone) throw new Error("Milestone not found with provided milestone_code");

        data.branchcode = milestone.branchcode;
        data.client_code = milestone.client_code;
        data.campaign_code = milestone.campaign_code || undefined;
        data.project_code = milestone.project_code;

        if (!data.status) data.status = 'drop';

        const targetProjCode = typeof data.project_code === 'string' ? data.project_code.trim() : '';
        const projectFilter: any = {
          $or: [
            { project_code: targetProjCode },
            { project_code: new RegExp(`^${targetProjCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
          ]
        };
        if (!isPlatform && tenantId) {
          projectFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }

        const project = await Project.findOne(projectFilter).session(session);
        if (!project) throw new Error("Project not found with provided project_code");

        const newRevisedCount = (project.revised_count || 0) - 1;
        const newAdditional = (project.additional || 0) - (milestone.total_amount || 0);

        await Project.findByIdAndUpdate(
          project._id,
          { revised_count: newRevisedCount, additional: newAdditional },
          { session }
        );

        let result;

        switch (data.delete_type) {
          case "temp":
            result = await Milestone.findOneAndUpdate(
              { _id: milestone._id },
              { status: data.status },
              { new: true, session }
            );
            break;

          case "permanent":
            result = await Milestone.findOneAndDelete(
              { _id: milestone._id },
              { session }
            );

            await Project.findByIdAndUpdate(
              project._id,
              { milestone_count: (project.milestone_count || 0) - 1 },
              { session }
            );
            break;

          default:
            await session.abortTransaction();
            res.status(400).json({ message: `Invalid delete_type. Must be 'temp' or 'permanent'.` });
            return;
        }

        if (!result) {
          await session.abortTransaction();
          res.status(404).json({ message: 'Milestone not found or does not match the criteria.' });
          return;
        }

        await session.commitTransaction();

        res.status(201).json({ message: `${msgField} Success` });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
  
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${msgField} Causes Error Message: ${message}`);
      res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` });
    }
  };
  