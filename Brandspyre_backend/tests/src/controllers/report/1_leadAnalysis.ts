import Express, {Request, Response, NextFunction } from "express";
import {totalLeads, totalClients} from './subReport/projectAnalysis'

export const leadAnalysis = async(req: Request, res:Response):Promise<void> => {
    try {
        const leads:any = await totalLeads()
        const clients:any = await totalClients()
        
        
        res.status(201).json({ message: "leadAnalysis Success" }); 
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`leadAnalysis Causes Error Message: ${message}`);
        res.status(500).json({ error: message });
    }
}