import { Request, Response } from "express";
import { Project, Client } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface data {
    branchcode: string,
    project_code?:string,
    title?: string;
    priority?: string;
    type?:string;
    loc?: string;
    start_date?: string;
    end_date?: string;
    handler_by?:string;
    createby?: string;
    notes?:string;
    status?:string;
    duration_days?: number;
    // ✅ Add this line:
    [key: string]: string | number | Date |undefined;
  }

export const editProjectOverview = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Edit Project Overview Info`;
    let {userId:idObj, userRole, brcode} = req.user as AuthenticatedUser
    let { data: userData } = req.body as {data: data}
    const loginId = String(idObj);
    
    try {
        const requiredFields = ['branchcode', 'project_code'];
        const missingFields = requiredFields.filter(
        field => !(userData as Record<string, string | undefined>)[field]
        );
        if (missingFields.length > 0) {
            res.status(400).json({ error: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
            return
        }

        const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
        const isPlatform = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((userRole || '').toLowerCase());

        const projectFilter: any = { project_code: userData.project_code };
        if (!isPlatform) {
            if (!tenantId) {
                res.status(403).json({ error: "Organization context required to edit project" });
                return;
            }
            projectFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }

        const existingProject = await Project.findOne(projectFilter);
        
        if (!existingProject) {
            res.status(404).json({ message: "Project not found with provided project_code" });
            return;
        }

        const clientFilter: any = { client_code: existingProject.client_code };
        if (!isPlatform && tenantId) {
            clientFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
        }
        const existingClient = await Client.findOne(clientFilter);

        if (!existingClient) {
            res.status(404).json({ message: "Client not found with provided Client_Code" });
            return;
        }

        const current = existingProject;
        
        const newStartDate = userData.start_date ? new Date(userData.start_date) : null;
        const newEndDate = userData.end_date ? new Date(userData.end_date) : null;
        
        const existingStartDate = current.start_date;
        const existingEndDate = current.end_date;
        
        const startDateChanged = newStartDate && existingStartDate && newStartDate.getTime() !== existingStartDate.getTime();
        const endDateChanged = newEndDate && existingEndDate && newEndDate.getTime() !== existingEndDate.getTime();
        
        if (startDateChanged || endDateChanged) {
            if (newStartDate && newEndDate) {
                if(newStartDate > newEndDate){
                    throw new Error("Start date cannot be after end date");
                }
                const durationInMs = newEndDate.getTime() - newStartDate.getTime();
                const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
                userData.duration_days = durationInDays;
            }
        }

        userData.updated_on = new Date();
        userData.updatedby = loginId;

        const updateData: any = {
            updated_on: userData.updated_on,
            updatedby: userData.updatedby
        };

        if (userData.title) updateData.title = userData.title;
        if (userData.priority) updateData.priority = userData.priority;
        if (userData.type) updateData.type = userData.type;
        if (userData.loc) updateData.loc = userData.loc;
        if (userData.start_date) updateData.start_date = new Date(userData.start_date);
        if (userData.end_date) updateData.end_date = new Date(userData.end_date);
        if (userData.handler_by) updateData.handler_by = userData.handler_by;
        if (userData.notes) updateData.notes = userData.notes;
        if (userData.status) updateData.status = userData.status;
        if (userData.duration_days) updateData.duration_days = userData.duration_days;
        if (userData.budget !== undefined) updateData.budget = Number(userData.budget);
        if (userData.overallcost !== undefined) updateData.overallcost = Number(userData.overallcost);
        if (userData.balance_amount !== undefined) updateData.balance_amount = Number(userData.balance_amount);

        const result = await Project.findOneAndUpdate(
            { project_code: userData.project_code, branchcode: userData.branchcode },
            updateData,
            { new: true }
        );

        if (!result) {
            res.status(404).json({ message: 'given row ids is not found' });
            return
        }

        res.status(201).json({ message: `${msgField} Success`, result: result });
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
    }
}