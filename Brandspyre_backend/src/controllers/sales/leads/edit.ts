import { Request, Response } from "express";

export const editLeads = async (_req: Request, res: Response): Promise<void> => {
    try {
         res.status(201).json({ message: "editLeads Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`editLeads Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}