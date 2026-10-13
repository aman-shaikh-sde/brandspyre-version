import { Request, Response } from "express";
import { Milestone, Project } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import { calculateDurationDays, updateProjectRevision } from './helperFunction';

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface data {
    branchcode: string,
    client_code?: string,
    project_code?: string,
    milestone_code?: string,
    miles_title?: string,
    milestone_type?: string,
    start_date?: string,
    end_date?: string,
    base_amount?: number,
    additional_amount?: number,
    revision_reason?: string,
    handler_to?: string,
    approved_staff_id?: string,
    isrevised?: boolean | string;
    status?:string,
    [key: string]: string | number | boolean | undefined;
  }

export const editProjectMilestone = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Edit Project Milestone Info`;
    let {userId:idObj, userRole, brcode} = req.user as AuthenticatedUser
    let { data:userData } = req.body as {data:data}
    
    try {
        const loginId = String(idObj);

        const requiredFields = ['branchcode', 'milestone_code'];
        const missingFields = requiredFields.filter(field => !(userData as Record<string, any>)[field]);

        if (missingFields.length > 0) {
          res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
          return;
        }

        const existingMilestone = await Milestone.findOne({ milestone_code: userData.milestone_code });
        
        if (!existingMilestone) {
            throw new Error("Given Milestone not found in our database");
        }

        userData.branchcode = existingMilestone.branchcode;
        userData.client_code = existingMilestone.client_code;
        userData.campaign_code = existingMilestone.campaign_code || null;
        userData.project_code = existingMilestone.project_code;

        const milestoneCode = userData.milestone_code as string;
        const projectCode = userData.project_code as string;

        const project = await Project.findOne({ project_code: projectCode });
        if (!project) throw new Error("Project not found");

        if (userData.start_date && userData.end_date) {
          userData.duration_days = calculateDurationDays(userData.start_date, userData.end_date);
        }
        
        await updateProjectRevision(projectCode);

        const updates: any = {};
        const allowedFields = ['miles_title', 'milestone_type', 'start_date', 'end_date', 'base_amount', 'additional_amount', 'revision_reason', 'handler_by', 'approved_staff_id', 'isrevised', 'status'];
        
        for (const field of allowedFields) {
          if (userData[field] !== undefined) {
            updates[field] = userData[field];
          }
        }

        if (updates.start_date) updates.start_date = new Date(updates.start_date);
        if (updates.end_date) updates.end_date = new Date(updates.end_date);

        if (updates.base_amount !== undefined || updates.additional_amount !== undefined) {
          const base = updates.base_amount !== undefined ? updates.base_amount : existingMilestone.base_amount;
          const additional = updates.additional_amount !== undefined ? updates.additional_amount : existingMilestone.additional_amount;
          updates.total_amount = base + (base * (additional / 100));
        }

        updates.updated_on = new Date();

        const result = await Milestone.findOneAndUpdate(
          { milestone_code: milestoneCode, project_code: projectCode },
          updates,
          { new: true }
        );

        if (!result) throw new Error("Failed to update milestone");

        // TODO: Handle revised_milestones insertion when isrevised is true (table not yet migrated to MongoDB)
        // TODO: Handle project_payreq status update (table not yet migrated to MongoDB)
        // TODO: Handle project budget update (already done via updateProjectRevision)
        // TODO: Handle invoice and payment calculations (tables not yet migrated to MongoDB)

        res.status(200).json({ message: `${msgField} Success`, data: result });
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
    }
};
