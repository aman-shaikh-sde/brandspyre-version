import { Request, Response } from "express";

export const createClients = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(201).json({ message: "createClients Success" }); 
    } catch (error) { 
        const message = error instanceof Error ? error.message : String(error);
        console.log(`createClients Causes Error Message: ${message}`);
        res.status(500).json({ error: message }); 
    }
}