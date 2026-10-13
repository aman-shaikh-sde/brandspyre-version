import { Request, Response } from "express";

export const viewFinancial = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ message: "viewFinancial Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewFinancial Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}