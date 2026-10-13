import { Request, Response } from "express";

export const viewClientsPayment = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ message: "viewClientsPayment Success"});
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`viewClientsPayment Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}