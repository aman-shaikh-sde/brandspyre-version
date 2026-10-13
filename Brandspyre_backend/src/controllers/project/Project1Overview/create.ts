import { Request, Response } from "express";
import { Project, Client } from '../../../db/ModelSceham/project/client';
import mongoose from "mongoose";

interface AuthenticatedUser {
    userId: string | number | mongoose.Types.ObjectId;
    userRole: string;
    brcode:string;
    tenantId?: string;
  }
  interface teams{
    team_id?:string;
  }

  interface data {
    branchcode: string;
    client_code?: string;
    title?: string;
    priority?: string;
    type?:string;
    loc?: string;
    start_date?: string;
    end_date?: string;
    team_id?: string;
    handler_by?:string;
    createby?:string;
    notes?:string;
    status?:string;
    duration_days?: number;
    // ✅ Add this line:
    [key: string]: string | number |undefined;
  }
  
//   export const generateProjectUniqueId = async (client: any, prefix: string): Promise<string> => {
//     try {
//         if (!prefix) {
//             throw new Error("Prefix is required to generate UniqueId");
//         }

//         const latestQuery = `
//             SELECT project_code FROM project
//             WHERE project_code LIKE $1
//             ORDER BY created_on DESC 
//             LIMIT 1
//         `;
//         const likePattern = `${prefix}/PROJ/%`;
//         const latestResult = await client.query(latestQuery, [likePattern]);

//         let nextNumber = 1;
//         let padLength = 2; // Default pad length

//         if (latestResult.rows.length > 0) {
//             const lastTeamId = latestResult.rows[0].project_code;
//             // Expecting format: PREFIX/TEAM/NNN
//             const parts = lastTeamId.split("/");
//             const lastNumStr = parts[parts.length - 1];
//             const lastNum = parseInt(lastNumStr, 10);
//             if (!isNaN(lastNum)) {
//                 nextNumber = lastNum + 1;
//                 padLength = Math.max(2, lastNumStr.length, String(nextNumber).length);
//             }
//         }

//         // If nextNumber is 100 or more, padLength will be at least 3
//         if (nextNumber >= 100 && padLength < 3) padLength = 3;

//         const formattedTeamId = `${prefix}/PROJ/${String(nextNumber).padStart(padLength, "0")}`;
//         return formattedTeamId;
//     } catch (error) {
//         console.error("Error generating next ID:", error);
//         throw new Error("Failed to generate ID");
//     }
// };


  export const generateProjectUniqueId = async (
  prefix: string
): Promise<string> => {
  try {
    if (!prefix) {
      throw new Error("Prefix is required to generate UniqueId");
    }

    // Format date as ddmmyy
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const yymmdd = `${yy}${mm}`;

    // Pattern: PREFIX/yymmdd/PROJ/% 
    const likePattern = new RegExp(`^${prefix}/${yymmdd}/PROJ/`);

    const latestProject = await Project.findOne({
      project_code: { $regex: likePattern }
    }).sort({ created_on: -1 });

    let nextNumber = 1;
    let padLength = 2; // Default pad length

    if (latestProject && latestProject.project_code) {
      const lastProjectCode = latestProject.project_code;
      // Expecting format: PREFIX/yymmdd/PROJ/NNN
      const parts = lastProjectCode.split("/");
      const lastNumStr = parts[parts.length - 1];
      const lastNum = parseInt(lastNumStr, 10);

      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
        padLength = Math.max(2, lastNumStr.length, String(nextNumber).length);
      }
    }

    if (nextNumber >= 100 && padLength < 3) padLength = 3;

    const formattedProjectCode = `${prefix}/${yymmdd}/${String(
      nextNumber
    ).padStart(padLength, "0")}`;

    return formattedProjectCode;
  } catch (error) {
    console.error("Error generating next ID:", error);
    throw new Error("Failed to generate ID");
  }
};


export const createProjectOverview = async (req: Request, res: Response): Promise<void> => {
    const msgField = `create Project Overview Info`;
    let {userId:idObj, userRole, brcode, tenantId} = req.user as AuthenticatedUser
    let { data:userDatas } = req.body
    
    try {
        const loginId = idObj; 
        
        const requiredFields = ['branchcode', 'client_code', 'title' , 'priority', 'project_code',
           'type', 'loc','start_date','end_date','status','handler_by'
          ];
          const missingFields = requiredFields.filter(
          field => !(userDatas as Record<string, string | undefined>)[field]
          );
          if (missingFields.length > 0) {
              res.status(400).json({ error: `Missing required field ${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}` });
              return
            }
            
        // Check if client exists
        const existingClient = await Client.findOne({ client_code: userDatas.client_code });
        
        if (!existingClient) {
            res.status(404).json({ message: "Given Client Id not in our Client database" });
            return;
        }
        
        if(existingClient.status !=='active'){
            throw new Error('Client is not active, Please check the client status');
        }

        userDatas.budget = userDatas.budget || 0;

        // Format project code with date
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yymmdd = `${yy}${mm}`;
        const formattedProjectCode = `${existingClient.branchcode}/${yymmdd}/${userDatas.project_code}`;

        // Check if project code already exists
        const existingProject = await Project.findOne({ project_code: formattedProjectCode });

        if (existingProject) {
            res.status(400).json({ error: "Given Project CODE Already in our database", message: "Given Project CODE Already in our database" });
            return;
        }

        userDatas.project_code = formattedProjectCode;

        userDatas.campaign_code = existingClient.campaign_code || undefined;
        userDatas.lead_id = existingClient.lead_id || undefined;
        userDatas.createby = typeof loginId === 'string' ? loginId : loginId.toString();

        const startDate = new Date(userDatas.start_date as string);
        const endDate = new Date(userDatas.end_date as string);

        const durationInMilliseconds = endDate.getTime() - startDate.getTime();
        const durationInDays = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24));
        userDatas.duration_days = durationInDays;
        
        // Validate date range
        if (startDate > endDate) {
            throw new Error('End date must be after start date');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create project
            const projectData: any = {
                project_code: userDatas.project_code,
                branchcode: userDatas.branchcode,
                campaign_code: userDatas.campaign_code,
                lead_id: userDatas.lead_id,
                client_code: userDatas.client_code,
                title: userDatas.title,
                priority: userDatas.priority,
                type: userDatas.type,
                loc: userDatas.loc,
                notes: userDatas.notes,
                budget: userDatas.budget,
                start_date: startDate,
                end_date: endDate,
                duration_days: durationInDays,
                handler_by: userDatas.handler_by,
                createby: userDatas.createby,
                status: userDatas.status
            };

            // Add tenant_id for tenant admins
            if (tenantId && userRole !== 'superadmin' && userRole !== 'master_super_admin') {
                projectData.tenant_id = new mongoose.Types.ObjectId(tenantId);
            }

            const newProject = await Project.create([projectData], { session });

            // Update client project count and overall cost
            const count = (existingClient.project_count || 0) + 1;
            const totalCost = (existingClient.overallcost || 0) + userDatas.budget;
            
            await Client.findByIdAndUpdate(
                existingClient._id,
                { 
                    project_count: count,
                    overallcost: totalCost,
                    updated_on: new Date()
                },
                { session }
            );

            await session.commitTransaction();

            res.status(201).json({ message: `${msgField} Success`, data: newProject[0] });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error: `${msgField} Causes Error Message: ${message}` }); 
    }
};
