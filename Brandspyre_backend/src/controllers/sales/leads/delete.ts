import { Request, Response } from "express";

export const deleteLeads = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(201).json({ message:  "deleteLeads Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`deleteLeads Causes Error Message: ${message}`);
        res.status(500).json({ error: message });
    }
}