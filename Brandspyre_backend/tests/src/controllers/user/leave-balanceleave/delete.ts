import mongoose from "mongoose";
import { LeaveRequest } from "../../../db/ModelSceham/user/15_leaverequest";
import { Request, Response } from "express";
import { getTenantFilter } from "../../../utils/tenantScope";

export const deleteUserLeaveInfo = async (req: Request, res: Response): Promise<void> => {
    const msgField = `Delete Leave Request`;
    const { id } = req.params;

    try {
        const tenantFilter = getTenantFilter(req);
        const idMatch: any[] = [{ req_id: id }];
        if (mongoose.Types.ObjectId.isValid(id)) {
            idMatch.push({ _id: new mongoose.Types.ObjectId(id) });
        }
        const query = { $or: idMatch, ...tenantFilter };

        const rows = await LeaveRequest.find(query).lean() as any[];
        if (rows.length === 0) {
            res.status(404).json({ message: `Leave request not found` });
            return;
        }

        if (rows[0].status !== 'pending') {
            res.status(400).json({ message: `Only pending requests can be deleted.` });
            return;
        }

        await LeaveRequest.deleteMany(query);
        res.status(200).json({ message: `${msgField} successful` });
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`${msgField} Causes Error Message: ${message}`);
        res.status(500).json({ error:  `${msgField} Causes Error Message: ${message}` });
    }
};