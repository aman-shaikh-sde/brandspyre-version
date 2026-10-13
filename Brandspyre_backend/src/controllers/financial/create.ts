import { Request, Response } from "express";

export const createFinancial = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(201).json({ message: "createFinancial Success" }); 
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`createFinancial Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}