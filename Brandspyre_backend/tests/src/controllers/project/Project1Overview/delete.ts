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
    project_code?: string,
    status?:string,
    delete_type?:string,
    // ✅ Add this line:
    [key: string]: string | undefined;
  }

export const deleteProjectOverview = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Project Overview Info`;
    const { userId: idObj, userRole, brcode } = req.user as AuthenticatedUser;
    const { data: data } = req.body as { data: data };
    const loginId = String(idObj);
    
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!data.status) {
                data.status = 'drop';
            }

            const tenantId = (req.user as any)?.tenantId || (req as any).tenant?.id;
            const isPlatform = ['superadmin', 'platform_superadmin', 'master_super_admin'].includes((userRole || '').toLowerCase());

            const projectFilter: any = { project_code: data.project_code };
            if (!isPlatform) {
                if (!tenantId) {
                    throw new Error("Organization context required to delete project");
                }
                projectFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            }

            const existingProject = await Project.findOne(projectFilter).session(session);

            if (!existingProject) {
                throw new Error("Project not found");
            }

            const clientFilter: any = { client_code: existingProject.client_code };
            if (!isPlatform && tenantId) {
                clientFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
            }
            const existingClient = await Client.findOne(clientFilter).session(session);

            if (!existingClient) {
                throw new Error("Client not found");
            }

            let result;

            switch (data.delete_type) {
                case 'temp':
                    const updated_on = new Date();
                    const updatedby = loginId;
                    const updateFilter: any = { project_code: data.project_code, branchcode: data.branchcode };
                    if (!isPlatform && tenantId) updateFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
                    result = await Project.findOneAndUpdate(
                        updateFilter,
                        { status: data.status, updated_on: updated_on, updatedby: updatedby },
                        { new: true, session }
                    );
                    break;

                case 'permanent':
                    const count = (existingClient.project_count || 0) - 1;
                    await Client.findByIdAndUpdate(
                        existingClient._id,
                        { project_count: count },
                        { session }
                    );

                    const deleteFilter: any = { project_code: data.project_code, branchcode: data.branchcode };
                    if (!isPlatform && tenantId) deleteFilter.tenant_id = new mongoose.Types.ObjectId(tenantId);
                    result = await Project.findOneAndDelete(
                        deleteFilter,
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
                res.status(404).json({ message: 'Project not found or does not match the criteria.' });
                return;
            }

            await session.commitTransaction();

            res.status(201).json({ message:  `${msgField} Success `});
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${msgField} Error: ${message}`);
        res.status(500).json({ error: `${msgField} Error: ${message}` });
    }
};