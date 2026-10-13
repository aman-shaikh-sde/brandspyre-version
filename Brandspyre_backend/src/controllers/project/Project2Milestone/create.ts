import { Request, Response } from "express";
import { Milestone, Project } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";
import { processMilestone } from './helperFunction';

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
  }

  interface data {
    branchcode: string,
    project_code?: string,
    milestone_code?: string,
    miles_title?: string,
    milestone_type?: string,
    start_date?: string,
    end_date?: string,
    revision_reason?: string,
    handler_by?: string,
    approved_staff_id?: string,
    isrevised?: boolean | string;
    status?:string,
    // ✅ Add this line:
    [key: string]: string | number | boolean | undefined;
  }

export const createProjectMilestone = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Create Project Milestone Info`;
    let {userId:idObj, userRole, brcode} = req.user as AuthenticatedUser
    let { data:userDatas } = req.body
    
    try {
            const loginId = String(idObj);

            if (!Array.isArray(userDatas) || userDatas.length === 0) {
               res.status(400).json({ error: "userDatas must be a non-empty array" });
               return
            }
        
            const created = [], failed = [];
        
            for (const userDataRaw of userDatas) {
              try {
                const milestone = await processMilestone({ ...userDataRaw }, loginId);
                created.push(milestone);
              } catch (error) {
                failed.push({ user: userDataRaw, error: error instanceof Error ? error.message : String(error) });
              }
            }
        
            const statusCode = created.length === 0 ? (failed.every(f => f.error.includes("not found")) ? 404 : 400) : 201;
            res.status(statusCode).json({
              message: `Bulk ${msgField} result`,
              data: {
                successCount: created.length,
                failedCount: failed.length,
                created,
                failed
              }
            });

    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
    }
}