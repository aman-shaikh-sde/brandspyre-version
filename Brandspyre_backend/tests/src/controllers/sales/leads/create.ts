import { Request, Response } from "express";

export const createLeads = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(201).json({ message: "createLeads Success" }); 
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`createLeads Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}